export interface Competition {
  id: string;
  name: string;
  slug: string;
  year: number;
  score_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  competition_id: string;
  home_team: string;
  home_logo_url: string | null;
  away_team: string;
  away_logo_url: string | null;
  match_date: string;
  stadium: string | null;
  is_knockout: boolean;
  score_multiplier: number;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  status: 'scheduled' | 'in_progress' | 'finished' | 'postponed' | 'cancelled';
  bets_locked: boolean;
  bets_unlock_until: string | null;
  points_calculated: boolean;
  external_match_id: number | null;
  is_monitoring: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  competition?: Competition;
}

export interface BetType {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: 'exact_score' | 'result' | 'first_goal' | 'player_goal' | 'penalty_winner';
  default_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  game_id: string;
  bet_type_id: string;
  prediction: any;
  points_earned: number;
  status: 'pending' | 'correct' | 'incorrect' | 'void';
  created_at: string;
  updated_at: string;
  game?: Game;
  bet_type?: BetType;
}

export interface ScoringRule {
  id: string;
  bet_type_id: string;
  competition_id: string | null;
  game_id: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  total_points: number;
  level: number;
  experience_points: number;
  current_streak: number;
  best_streak: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Champion {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RankingSnapshot {
  id: string;
  user_id: string;
  position: number;
  total_points: number;
  total_bets: number;
  correct_bets: number;
  accuracy: number;
  year: number;
  snapshot_date: string;
  created_at: string;
  updated_at: string;
}
