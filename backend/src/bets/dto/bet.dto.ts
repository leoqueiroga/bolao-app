import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExactScorePrediction {
  @IsInt()
  @Min(0)
  @Max(99)
  home_score: number;

  @IsInt()
  @Min(0)
  @Max(99)
  away_score: number;
}

export class ResultPrediction {
  @IsEnum(['home_win', 'draw', 'away_win'])
  result: string;
}

export class PredictionDto {
  // exact_score fields
  @ValidateIf((o) => o.home_score !== undefined || o.away_score !== undefined)
  @IsInt()
  @Min(0)
  @Max(99)
  home_score?: number;

  @ValidateIf((o) => o.home_score !== undefined || o.away_score !== undefined)
  @IsInt()
  @Min(0)
  @Max(99)
  away_score?: number;

  // result field
  @ValidateIf((o) => o.result !== undefined)
  @IsEnum(['home_win', 'draw', 'away_win'])
  result?: string;
}

export class CreateBetDto {
  @IsNotEmpty()
  game_id: string;

  @IsUUID()
  @IsNotEmpty()
  bet_type_id: string;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PredictionDto)
  prediction: PredictionDto;
}

export class UpdateBetDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PredictionDto)
  prediction?: PredictionDto;
}

export class AdminCreateBetDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  game_id: string;

  @IsUUID()
  @IsNotEmpty()
  bet_type_id: string;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PredictionDto)
  prediction: PredictionDto;
}
