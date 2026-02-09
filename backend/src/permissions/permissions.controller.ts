/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CreatePermissionDto } from './dto/permissions.dto';
import { ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getAllPermissions() {
    try {
      const permissions = await this.permissionsService.findAll();
      return {
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve permissions',
      };
    }
  }
  @Get(':id')
  async getpermissionsById(@Param('id') id: number) {
    try {
      const permissions = await this.permissionsService.findById(id);
      return {
        success: true,
        data: permissions,
        message: 'Permission retrieved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'failed to retrieve permissions ',
      };
    }
  }
  @UseGuards(JwtGuard, PermissionGuard)
  @RequirePermissions(34, 36)
  @Post()
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    try {
      const permission =
        await this.permissionsService.create(createPermissionDto);
      return {
        success: true,
        data: permission,
        message: 'Permission created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create permission',
      };
    }
  }
  @UseGuards(JwtGuard, PermissionGuard)
  @RequirePermissions(37)
  @Delete(':id')
  async Delete(@Param('id') id: number) {
    return this.permissionsService.Delete(id);
  }
}
