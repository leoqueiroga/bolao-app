/** Status possíveis de uma partida na Football Data API */
export type FootballDataStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'HALFTIME'
  | 'EXTRA_TIME'
  | 'PENALTY_SHOOTOUT'
  | 'FINISHED'
  | 'SUSPENDED'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'AWARDED';

/** Resposta do endpoint GET /v4/matches/{id} */
export interface MatchResponse {
  id: number;
  status: FootballDataStatus;
  matchday: number;
  stage: string;
  utcDate: string;
  homeTeam: { id: number; name: string; shortName: string };
  awayTeam: { id: number; name: string; shortName: string };
  score: {
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | null;
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
    regularTime: { home: number | null; away: number | null } | null;
    extraTime: { home: number | null; away: number | null } | null;
    penalties: { home: number | null; away: number | null } | null;
  };
}

/** Resposta do endpoint GET /v4/competitions/{code}/matches */
export interface CompetitionMatchesResponse {
  count: number;
  competition: { id: number; name: string; code: string };
  matches: MatchResponse[];
}
