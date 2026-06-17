import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { FootballDataClient } from './football-data.client';
import { MatchResponse } from './interfaces/football-data.interfaces';
import { Game } from '../common/types/entities';

export interface SyncResult {
  mapped: number;
  unmapped: number;
  errors: string[];
}

/**
 * Serviço responsável por vincular jogos internos com IDs da API externa.
 * Busca partidas da competição na football-data.org e mapeia com registros locais
 * usando matching por home_team + away_team (case-insensitive) + match_date (±24h).
 */
@Injectable()
export class CompetitionSyncService {
  private readonly logger = new Logger(CompetitionSyncService.name);
  private readonly competitionCode: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly footballDataClient: FootballDataClient,
  ) {
    this.competitionCode =
      this.configService.get<string>('FOOTBALL_DATA_COMPETITION') || 'WC';
  }

  /**
   * Busca partidas da competição na API e vincula com jogos locais.
   * O matching usa comparação exata de nomes (case-insensitive) e tolerância de ±24h na data.
   * O external_match_id só é preenchido quando nulo (nunca sobrescrito), garantindo idempotência.
   * Em caso de erro da API, aborta sem alterar dados existentes.
   */
  async syncMatches(): Promise<SyncResult> {
    const result: SyncResult = { mapped: 0, unmapped: 0, errors: [] };

    // Buscar partidas da competição na API externa
    let apiMatches: MatchResponse[];
    try {
      const response =
        await this.footballDataClient.getCompetitionMatches(this.competitionCode);
      apiMatches = response.matches;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `❌ Erro ao buscar partidas da competição ${this.competitionCode} | erro=${errorMessage}`,
      );
      result.errors.push(errorMessage);
      return result;
    }

    // Buscar todos os jogos locais que ainda não possuem external_match_id
    const adminClient = this.supabaseService.getAdminClient();
    const { data: localGames, error: dbError } = await adminClient
      .from('games')
      .select('*')
      .is('external_match_id', null);

    if (dbError) {
      this.logger.error(
        `❌ Erro ao buscar jogos locais | erro=${dbError.message}`,
      );
      result.errors.push(dbError.message);
      return result;
    }

    const games = (localGames || []) as Game[];

    // Log para diagnóstico de matching
    if (apiMatches.length > 0 && games.length > 0) {
      const sampleApi = apiMatches.filter(m => m.homeTeam?.name).slice(0, 3);
      const sampleLocal = games.slice(0, 3);
      this.logger.log(
        `🔍 Amostra API: ${sampleApi.map(m => `${m.homeTeam.name} vs ${m.awayTeam.name} (${m.utcDate})`).join(' | ')}`,
      );
      this.logger.log(
        `🔍 Amostra Local: ${sampleLocal.map(g => `${g.home_team} vs ${g.away_team} (${g.match_date})`).join(' | ')}`,
      );
    }

    // Mapear partidas da API com registros locais
    for (const apiMatch of apiMatches) {
      const apiHomeTeam = apiMatch.homeTeam?.name;
      const apiAwayTeam = apiMatch.awayTeam?.name;

      if (!apiHomeTeam || !apiAwayTeam) {
        result.unmapped++;
        continue;
      }

      const matchedGame = this.findMatchingGame(apiMatch, games);

      if (matchedGame) {
        // Atualizar external_match_id (só quando nulo — já filtrado na query)
        const { error: updateError } = await adminClient
          .from('games')
          .update({ external_match_id: apiMatch.id })
          .eq('id', matchedGame.id);

        if (updateError) {
          const errMsg = `Erro ao atualizar game ${matchedGame.id}: ${updateError.message}`;
          this.logger.error(`❌ ${errMsg}`);
          result.errors.push(errMsg);
        } else {
          result.mapped++;
          // Remove da lista para não mapear o mesmo jogo novamente
          const idx = games.indexOf(matchedGame);
          if (idx !== -1) {
            games.splice(idx, 1);
          }
        }
      } else {
        result.unmapped++;
      }
    }

    this.logger.log(
      `🔄 Sincronização concluída | competição=${this.competitionCode} mapeados=${result.mapped} não-mapeados=${result.unmapped} erros=${result.errors.length}`,
    );

    return result;
  }

  /**
   * Mapa de aliases para normalização de nomes de times.
   * Mapeia nomes conhecidos da API para nomes comuns no banco local.
   */
  private readonly teamAliases: Record<string, string[]> = {
    'south korea': ['korea republic', 'korea', 'coreia do sul'],
    'korea republic': ['south korea', 'korea', 'coreia do sul'],
    'united states': ['usa', 'eua', 'estados unidos'],
    'usa': ['united states', 'eua', 'estados unidos'],
    'bosnia-herzegovina': ['bosnia and herzegovina', 'bosnia', 'bósnia'],
    'bosnia and herzegovina': ['bosnia-herzegovina', 'bosnia', 'bósnia'],
    'bosnia-h.': ['bosnia and herzegovina', 'bosnia-herzegovina', 'bosnia'],
    'turkey': ['türkiye', 'turkiye', 'turquia'],
    'türkiye': ['turkey', 'turkiye', 'turquia'],
    'ivory coast': ["côte d'ivoire", 'cote divoire', 'costa do marfim'],
    "côte d'ivoire": ['ivory coast', 'cote divoire', 'costa do marfim'],
    'cape verde islands': ['cabo verde', 'cape verde'],
    'cape verde': ['cabo verde', 'cape verde islands'],
    'cabo verde': ['cape verde', 'cape verde islands'],
    'iran': ['ir iran', 'irã'],
    'ir iran': ['iran', 'irã'],
    'congo dr': ['dr congo', 'rd congo', 'congo'],
  };

  /**
   * Encontra um jogo local que corresponde a uma partida da API.
   * Usa: shortName > name da API, compara com aliases e matching fuzzy.
   * Aceita home/away invertidos entre API e banco.
   * Filtra por data ±24h.
   */
  private findMatchingGame(
    apiMatch: MatchResponse,
    localGames: Game[],
  ): Game | undefined {
    // Prefer shortName (closer to common names), fallback to name
    const apiHomeTeam = (apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name)?.toLowerCase();
    const apiAwayTeam = (apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name)?.toLowerCase();
    const apiDateStr = apiMatch.utcDate;

    if (!apiHomeTeam || !apiAwayTeam || !apiDateStr) {
      return undefined;
    }

    const apiDate = new Date(apiDateStr);
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    return localGames.find((game) => {
      if (!game.home_team || !game.away_team || !game.match_date) {
        return false;
      }

      const localDate = new Date(game.match_date);
      const timeDiffMs = Math.abs(apiDate.getTime() - localDate.getTime());

      if (timeDiffMs > twentyFourHoursMs) {
        return false;
      }

      const localHomeTeam = game.home_team.toLowerCase();
      const localAwayTeam = game.away_team.toLowerCase();

      // Try normal order
      const normalMatch =
        this.teamNameMatches(apiHomeTeam, localHomeTeam) &&
        this.teamNameMatches(apiAwayTeam, localAwayTeam);

      // Try inverted order
      const invertedMatch =
        this.teamNameMatches(apiHomeTeam, localAwayTeam) &&
        this.teamNameMatches(apiAwayTeam, localHomeTeam);

      return normalMatch || invertedMatch;
    });
  }

  /**
   * Verifica se dois nomes de times correspondem usando:
   * 1. Igualdade exata
   * 2. Substring (um contém o outro)
   * 3. Mapa de aliases
   * 4. Palavras significativas em comum
   */
  private teamNameMatches(apiName: string, localName: string): boolean {
    if (apiName === localName) return true;
    if (apiName.includes(localName) || localName.includes(apiName)) return true;

    // Check aliases
    const apiAliases = this.teamAliases[apiName] || [];
    if (apiAliases.includes(localName)) return true;

    const localAliases = this.teamAliases[localName] || [];
    if (localAliases.includes(apiName)) return true;

    // Check significant word overlap
    const apiWords = this.getSignificantWords(apiName);
    const localWords = this.getSignificantWords(localName);
    const matchingWords = apiWords.filter((w) => localWords.includes(w));
    if (matchingWords.length > 0) return true;

    return false;
  }

  /**
   * Extrai palavras significativas (>2 caracteres) de um nome de time,
   * removendo stop words.
   */
  private getSignificantWords(name: string): string[] {
    const stopWords = ['republic', 'of', 'the', 'and', 'de', 'da', 'do', 'islands'];
    return name
      .split(/[\s-]+/)
      .filter((w) => w.length > 2 && !stopWords.includes(w));
  }
}
