/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/common/guards/permission.guard';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
  @UseGuards(PermissionGuard)
  @Post()
  @RequirePermissions(5)
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @RequirePermissions(6)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(6)
  findOne(@Param('id') id: number) {
    return this.rolesService.findOne(id);
  }
  @UseGuards(PermissionGuard)
  @Patch(':id')
  @RequirePermissions(7)
  update(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }
  @UseGuards(PermissionGuard)
  @Delete(':id')
  @RequirePermissions(8)
  remove(@Param('id') id: number) {
    return this.rolesService.remove(id);
  }
}
