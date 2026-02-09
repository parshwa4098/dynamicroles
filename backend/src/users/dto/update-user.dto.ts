/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'name of user',
    example: 'name:arjav',
  })
  @IsOptional()
  @IsString({ message: 'Name must be a valid string' })
  name?: string;

  @ApiProperty({
    description: 'email of user',
    example: 'email: arjav@gmail.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'password of user',
    example: 'password of user',
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({
    description: 'role should be updated by admin only',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Role ID must be a valid number' })
  role_id?: number;
}
