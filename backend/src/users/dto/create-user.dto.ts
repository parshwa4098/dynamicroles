import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'name of user',
    example: 'parshwa',
  })
  @IsString()
  name: string;
  @ApiProperty({
    description: 'email',
    example: 'parshwa@gmail.com',
  })
  @IsEmail()
  email: string;
  @ApiProperty({
    description: 'password',
    example: 'parshwa123',
  })
  @MinLength(6)
  password: string;
  @ApiProperty({
    description: 'by default normal user role id given',
    example: '3',
  })
  @IsInt()
  role_id: number;
}
