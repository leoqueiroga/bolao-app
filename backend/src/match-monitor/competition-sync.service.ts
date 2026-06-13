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

    // Mapear partidas da API com registros locais
    for (const apiMatch of apiMatches) {
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
   * Encontra um jogo local que corresponde a uma partida da API.
   * Matching: home_team + away_team (case-insensitive) + match_date (±24h).
   */
  private findMatchingGame(
    apiMatch: MatchResponse,
    localGames: Game[],
  ): Game | undefined {
    const apiHomeTeam = apiMatch.homeTeam.name.toLowerCase();
    const apiAwayTeam = apiMatch.awayTeam.name.toLowerCase();
    const apiDate = new Date(apiMatch.utcDate);

    return localGames.find((game) => {
      const localHomeTeam = game.home_team.toLowerCase();
      const localAwayTeam = game.away_team.toLowerCase();
      const localDate = new Date(game.match_date);

      const teamsMatch =
        localHomeTeam === apiHomeTeam && localAwayTeam === apiAwayTeam;

      if (!teamsMatch) {
        return false;
      }

      const timeDiffMs = Math.abs(apiDate.getTime() - localDate.getTime());
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      return timeDiffMs <= twentyFourHoursMs;
    });
  }
}
