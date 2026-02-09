import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'create permission',
    example: 'createusers',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
