/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @MinLength(3, { message: `Password must be atleast 3 characters` })
  @MaxLength(20, { message: `Password must be atmost 20 characters` })
  @IsString()
  password: string;
}
