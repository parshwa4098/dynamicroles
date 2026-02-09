/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Permission } from './models/permission.model';
import { Role } from 'src/roles/models/role.model';
import { RolePermission } from 'src/roles/models/role-permission.model';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Permission, Role, RolePermission]),
    AuthModule,
  ],
  exports: [SequelizeModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
