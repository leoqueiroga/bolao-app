import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBetDto {
  @IsString()
  @IsNotEmpty()
  game_id: string;

  @IsString()
  @IsNotEmpty()
  bet_type_id: string;

  @IsNotEmpty()
  prediction: any;
}

export class UpdateBetDto {
  @IsOptional()
  prediction?: any;
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

  @IsNotEmpty()
  prediction: any;
}
