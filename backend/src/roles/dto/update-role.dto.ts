/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'name of the role',
    example: 'superadmin',
  })
  @IsOptional()
  @IsString()
  name?: string;
  @ApiProperty({
    description: 'permission ids',
    example: '[1,2,3]',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissions?: number[];
}
