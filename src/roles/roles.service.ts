/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Role } from './models/role.model';
import { RolePermission } from './models/role-permission.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permission } from 'src/permissions/permission.model';
@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
  ) {}

  async create(dto: CreateRoleDto) {
    const exists = await this.roleModel.findOne({
      where: { name: dto.name },
    });

    if (exists) {
      throw new ConflictException('Role already exists');
    }

    const role = await this.roleModel.create({ name: dto.name });

    const mappings = dto.permissions.map((permission_id) => ({
      role_id: role.id,
      permission_id,
    }));
    console.log(mappings);

    await this.rolePermissionModel.bulkCreate(mappings);

    return role;
  }

  async findAll() {
    return this.roleModel.findAll({ include: ['permissions'] });
  }

  async findOne(id: number) {
    const role = await this.roleModel.findByPk(id, {
      include: ['permissions'],
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');

    if (dto.name) {
      role.name = dto.name;
      await role.save();
    }

    if (dto.permissions) {
      await this.rolePermissionModel.destroy({ where: { role_id: id } });

      const mappings = dto.permissions.map((permission_id) => ({
        role_id: id,
        permission_id,
      }));

      await this.rolePermissionModel.bulkCreate(mappings);
    }

    return { message: 'Role updated successfully' };
  }

  async remove(id: number) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');

    await this.rolePermissionModel.destroy({ where: { role_id: id } });
    await role.destroy();

    return { message: 'Role deleted successfully' };
  }
}
