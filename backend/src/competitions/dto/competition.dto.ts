import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCompetitionDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsNumber()
  year: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  score_multiplier?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateCompetitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  score_multiplier?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
