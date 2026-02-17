/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { AuthModule } from 'src/auth/auth.module';
import { Permission } from 'src/permissions/models/permission.model';
import { Role } from 'src/roles/models/role.model';

@Module({
  imports: [SequelizeModule.forFeature([User, Permission, Role]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
