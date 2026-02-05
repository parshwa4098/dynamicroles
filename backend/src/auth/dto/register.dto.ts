import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: `Name of the user`,
    example: `admin`,
  })
  @IsString()
  name: string;
  @ApiProperty({
    description: `Email of the user`,
    example: `admin@gmail.com`,
  })
  @IsEmail()
  email: string;
  @ApiProperty({
    description: `Password of the user`,
    example: `admin123`,
  })
  @MinLength(3, { message: 'Password must be at least 3 characters' })
  @MaxLength(20, { message: 'Password must be at most 20 characters' })
  password: string;
  @ApiProperty({
    description: `role of the user`,
    example: `by default user role for a new registry user`,
  })
  @IsOptional()
  role_id?: number;
}
