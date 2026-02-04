import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissionIds: number[]) =>
  SetMetadata(PERMISSIONS_KEY, permissionIds);
