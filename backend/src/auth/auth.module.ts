/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/models/user.model';
import { Role } from '../roles/models/role.model';
import { Permission } from '../permissions/permission.model';
import { RolePermission } from '../roles/models/role-permission.model';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([User, Role, Permission, RolePermission]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresIn = config.get<string>('JWT_EXPIRES_IN')! as
          | `${number}s`
          | `${number}m`
          | `${number}h`
          | `${number}d`;

        if (!secret || !expiresIn) {
          throw new Error(
            'JWT_SECRET and JWT_EXPIRES_IN must be defined in .env',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
