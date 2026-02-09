/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './models/role.model';
import { RolePermission } from './models/role-permission.model';
import { Permission } from 'src/permissions/models/permission.model';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Role, RolePermission, Permission, User]),
    AuthModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
