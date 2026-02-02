/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Permission } from './permission.model';
import { Role } from 'src/roles/models/role.model';
import { RolePermission } from 'src/roles/models/role-permission.model';

@Module({
  imports: [SequelizeModule.forFeature([Permission, Role, RolePermission])],
  exports: [SequelizeModule],
})
export class PermissionsModule {}
