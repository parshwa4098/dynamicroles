/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: `email of the user`,
    example: `admin@gmail.com`,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @ApiProperty({
    description: `password of the user`,
    example: `admin123`,
  })
  @IsNotEmpty()
  @MinLength(3, { message: `Password must be atleast 3 characters` })
  @MaxLength(20, { message: `Password must be atmost 20 characters` })
  @IsString()
  password: string;
}
