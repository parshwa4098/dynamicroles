/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Permission } from './models/permission.model';
import { CreatePermissionDto } from './dto/permissions.dto';
import { RolePermission } from 'src/roles/models/role-permission.model';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission)
    private permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionModel.findOne({
      where: { name: createPermissionDto.name },
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    return this.permissionModel.create({
      name: createPermissionDto.name,
    });
  }

  async findById(id: number): Promise<Permission | null> {
    return this.permissionModel.findByPk(id);
  }
  async Delete(id: number) {
    try {
      const permission = await this.permissionModel.findByPk(id);

      if (!permission) {
        throw new NotFoundException(
          'Permission you are trying to delete does not exist',
        );
      }

      const rolesWithPermission = await this.rolePermissionModel.count({
        where: { permission_id: id },
      });

      if (rolesWithPermission > 0) {
        throw new ForbiddenException(
          `Cannot delete permission. It is assigned to ${rolesWithPermission} role(s). Remove it from those roles first.`,
        );
      }

      await permission.destroy();

      return { message: 'Permission deleted successfully' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(error.message || 'Permission deletion failed');
    }
  }
}
