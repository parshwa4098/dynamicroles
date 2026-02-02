/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissions?: number[];
}
