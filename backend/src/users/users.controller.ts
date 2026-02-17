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
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req) {
    const user = await this.usersService.create(dto, req.user);
    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  @Get()
  async findAll(@Req() req) {
    const users = await this.usersService.findAll(req.user);
    return {
      success: true,
      data: users,
    };
  }

  @Get('permissions/:id')
  async findUsersPermissions(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getUserPermissions(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = await this.usersService.findOne(id, req.user);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    const result = await this.usersService.update(id, dto, req.user);
    return {
      success: true,
      data: result,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const result = await this.usersService.remove(id, req.user);
    return {
      success: true,
      data: result,
      message: 'User deleted successfully',
    };
  }
}
