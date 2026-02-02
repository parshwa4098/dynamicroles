/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(1)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @RequirePermissions(2)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions(2)
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(3)
  update(@Param('id') id: number, @Body() dto: UpdateUserDto, @Req() req) {
    return this.usersService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(4)
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
