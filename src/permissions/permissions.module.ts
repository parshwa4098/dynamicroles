/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Permission } from './permission.model';

@Module({
  imports: [SequelizeModule.forFeature([Permission])],
  exports: [SequelizeModule],
})
export class PermissionsModule {}
