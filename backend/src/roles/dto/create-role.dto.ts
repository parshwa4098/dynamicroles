/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'name of the role',
    example: 'student',
  })
  @IsNotEmpty()
  @MinLength(3, { message: 'Role name must be at least 3 characters' })
  @MaxLength(20, { message: 'Role name must be at most 20 characters' })
  @IsString()
  @ApiProperty({
    description: 'permissions ids were passed',
    example: [1, 2, 3],
  })
  name: string;
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  permissions: number[];
}
