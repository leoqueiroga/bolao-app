import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'Role é obrigatório' })
  @IsEnum(['user', 'admin'], { message: 'Role deve ser "user" ou "admin"' })
  role: string;
}
