import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'name of user',
    example: 'parshwa',
  })
  @IsString()
  declare name: string;
  @ApiProperty({
    description: 'email',
    example: 'parshwa@gmail.com',
  })
  @IsEmail()
  declare email: string;
  @ApiProperty({
    description: 'password',
    example: 'parshwa123',
  })
  @MinLength(6)
  declare password: string;
  @ApiProperty({
    description: 'by default normal user role id given',
    example: '40',
  })
  @IsOptional()
  @IsInt()
  declare role_id: number;
}
