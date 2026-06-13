import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimiterService } from './rate-limiter.service';
import {
  MatchResponse,
  CompetitionMatchesResponse,
} from './interfaces/football-data.interfaces';

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Cliente HTTP para a API football-data.org.
 * Encapsula autenticação, rate limiting e tratamento de erros.
 */
@Injectable()
export class FootballDataClient {
  private readonly logger = new Logger(FootballDataClient.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiterService: RateLimiterService,
  ) {
    this.apiKey = this.configService.get<string>('FOOTBALL_DATA_API_KEY')!;
  }

  /**
   * Busca dados de uma partida específica pelo ID externo.
   * @param externalMatchId - ID da partida na football-data.org
   */
  async getMatch(externalMatchId: number): Promise<MatchResponse> {
    const url = `${FOOTBALL_DATA_BASE_URL}/matches/${externalMatchId}`;
    return this.rateLimiterService.execute(() => this.fetchWithAuth<MatchResponse>(url));
  }

  /**
   * Busca todas as partidas de uma competição.
   * @param competitionCode - Código da competição (ex: 'WC', 'PL')
   */
  async getCompetitionMatches(
    competitionCode: string,
  ): Promise<CompetitionMatchesResponse> {
    const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/matches`;
    return this.rateLimiterService.execute(
      () => this.fetchWithAuth<CompetitionMatchesResponse>(url),
    );
  }

  /**
   * Executa requisição HTTP autenticada com timeout e tratamento de erros.
   */
  private async fetchWithAuth<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': this.apiKey,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logger.error(
          `Falha de autenticação na Football Data API | status=${response.status} url=${url}`,
        );
      }

      throw new FootballDataApiError(
        `Football Data API retornou status ${response.status}`,
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }
}

/**
 * Erro específico para respostas de erro da Football Data API.
 */
export class FootballDataApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'FootballDataApiError';
  }
}
