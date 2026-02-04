/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissionIds = this.reflector.getAllAndOverride<number[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissionIds || requiredPermissionIds.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);

    if (!user || !Array.isArray(user.permissions)) {
      throw new ForbiddenException('Permissions not found, You are forbidden');
    }

    const hasAllPermissions = requiredPermissionIds.every((id) =>
      user.permissions.includes(id),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
