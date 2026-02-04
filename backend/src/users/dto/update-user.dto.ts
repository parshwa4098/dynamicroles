/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  role_id?: number;
}
