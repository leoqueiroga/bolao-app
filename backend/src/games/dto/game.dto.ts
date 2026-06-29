import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGameDto {
  @IsString()
  competition_id: string;

  @IsString()
  home_team: string;

  @IsString()
  @IsOptional()
  home_logo_url?: string;

  @IsString()
  away_team: string;

  @IsString()
  @IsOptional()
  away_logo_url?: string;

  @IsDateString()
  match_date: string;

  @IsString()
  @IsOptional()
  stadium?: string;

  @IsBoolean()
  @IsOptional()
  is_knockout?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  score_multiplier?: number;
}

export class UpdateGameDto {
  @IsString()
  @IsOptional()
  competition_id?: string;

  @IsString()
  @IsOptional()
  home_team?: string;

  @IsString()
  @IsOptional()
  home_logo_url?: string;

  @IsString()
  @IsOptional()
  away_team?: string;

  @IsString()
  @IsOptional()
  away_logo_url?: string;

  @IsDateString()
  @IsOptional()
  match_date?: string;

  @IsString()
  @IsOptional()
  stadium?: string;

  @IsBoolean()
  @IsOptional()
  is_knockout?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  score_multiplier?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  home_score?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  away_score?: number;

  @IsEnum(['scheduled', 'in_progress', 'finished', 'postponed', 'cancelled'])
  @IsOptional()
  status?: 'scheduled' | 'in_progress' | 'finished' | 'postponed' | 'cancelled';

  @IsBoolean()
  @IsOptional()
  bets_locked?: boolean;

  @IsDateString()
  @IsOptional()
  bets_unlock_until?: string | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  penalty_home_score?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  penalty_away_score?: number;
}
