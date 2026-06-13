/** Estado interno de um Polling Job */
export interface PollingJob {
  gameId: string;
  externalMatchId: number;
  matchDate: string;
  scheduledAt: Date;
  consecutiveErrors: number;
  timeoutRef: NodeJS.Timeout | null;
  lastPolledAt: Date | null;
}
