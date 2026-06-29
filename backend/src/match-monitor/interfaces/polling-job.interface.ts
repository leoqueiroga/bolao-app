import { FootballDataStatus } from './football-data.interfaces';

/** Estado interno de um Polling Job */
export interface PollingJob {
  gameId: string;
  externalMatchId: number;
  matchDate: string;
  scheduledAt: Date;
  consecutiveErrors: number;
  timeoutRef: NodeJS.Timeout | null;
  lastPolledAt: Date | null;
  /** Último status retornado pela API para detectar transições (ex: entrada em PENALTY_SHOOTOUT) */
  lastApiStatus: FootballDataStatus | null;
  /** Contador de retries quando FINISHED com duration=PENALTY_SHOOTOUT mas penalties nulos */
  penaltyRetryCount: number;
}
