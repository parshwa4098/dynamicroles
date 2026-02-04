/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsArray,
  IsInt,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @MinLength(3, { message: 'Role name must be at least 3 characters' })
  @MaxLength(20, { message: 'Role name must be at most 20 characters' })
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  permissions: number[];
}
