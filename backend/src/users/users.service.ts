/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';

import { User } from './models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'src/roles/models/role.model';
import { Permission } from 'src/permissions/models/permission.model';

export interface PermissionData {
  id: number;
  name: string;
  resource: string;
  action: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
  ) {}

  private isAdmin(user: any): boolean {
    return (
      user.role?.toLowerCase() === 'admin' ||
      user.role_name?.toLowerCase() === 'admin'
    );
  }

  private async getUserPermissionsList(
    userId: number,
  ): Promise<PermissionData[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions;
  }

  private hasPermissionByName(
    permissions: PermissionData[],
    permissionName: string,
  ): boolean {
    return permissions.some(
      (permission) =>
        permission.name.toLowerCase() === permissionName.toLowerCase(),
    );
  }

  private hasPermission(
    permissions: PermissionData[],
    resource: string,
    action: string,
  ): boolean {
    return permissions.some(
      (permission) =>
        permission.resource.toLowerCase() === resource.toLowerCase() &&
        permission.action.toLowerCase() === action.toLowerCase(),
    );
  }

  private async canPerformActionOnUser(
    currentUser: any,
    targetUser: User,
    action: string,
  ): Promise<boolean> {
    if (this.isAdmin(currentUser)) return true;

    const permissions = await this.getUserPermissionsList(currentUser.id);

    const targetRole = await this.roleModel.findByPk(targetUser.role_id);
    const targetRoleName = targetRole?.name.toLowerCase() || '';

    const specificPermission = `${action}${targetRole?.name || ''}`;
    if (this.hasPermissionByName(permissions, specificPermission)) {
      return true;
    }

    if (
      this.hasPermission(permissions, 'users', action) ||
      this.hasPermission(permissions, 'user', action)
    ) {
      return true;
    }

    return this.hasPermission(permissions, targetRoleName, action);
  }

  private async getManageableRoles(
    currentUser: any,
    action: string,
  ): Promise<Role[]> {
    if (this.isAdmin(currentUser)) {
      return this.roleModel.findAll();
    }

    const permissions = await this.getUserPermissionsList(currentUser.id);
    const allRoles = await this.roleModel.findAll();

    return allRoles.filter((role) => {
      const roleName = role.name.toLowerCase();
      const specificPermission = `${action}${role.name}`;

      return (
        this.hasPermissionByName(permissions, specificPermission) ||
        this.hasPermission(permissions, roleName, action) ||
        this.hasPermission(permissions, 'users', action) ||
        this.hasPermission(permissions, 'user', action)
      );
    });
  }

  async create(dto: CreateUserDto, currentUser: any) {
    const targetRole = await this.roleModel.findByPk(dto.role_id);
    if (!targetRole) {
      throw new BadRequestException('Invalid role specified');
    }

    const canCreate = await this.canPerformActionOnUser(
      currentUser,
      { role_id: dto.role_id } as User,
      'create',
    );

    if (!canCreate) {
      throw new ForbiddenException(
        `You do not have permission to create ${targetRole.name} users`,
      );
    }

    const exists = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      ...dto,
      password: hash,
      role_id: dto.role_id || 40,
    });

    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async findAll(currentUser: any) {
    const allUsers = await this.userModel.findAll({
      attributes: { exclude: ['password'] },
    });

    if (this.isAdmin(currentUser)) {
      return allUsers;
    }

    const visibleUsers: User[] = [];
    for (const user of allUsers) {
      const canView = await this.canPerformActionOnUser(
        currentUser,
        user,
        'read',
      );
      if (canView) {
        visibleUsers.push(user);
      }
    }

    return visibleUsers;
  }

  async findOne(id: number, currentUser: any) {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) throw new NotFoundException('User not found');

    const canView = await this.canPerformActionOnUser(
      currentUser,
      user,
      'read',
    );
    if (!canView) {
      throw new ForbiddenException(
        'You do not have permission to view this user',
      );
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto, currentUser: any) {
    try {
      const user = await this.userModel.findByPk(id);
      if (!user) throw new NotFoundException('User not found');

      const isOwnProfile = currentUser.id === id;
      const hasPersonalUpdates = dto.name || dto.email || dto.password;

      const canUpdate = await this.canPerformActionOnUser(
        currentUser,
        user,
        'update',
      );

      if (!canUpdate && !isOwnProfile) {
        const userRole = await this.roleModel.findByPk(user.role_id);
        throw new ForbiddenException(
          `You do not have permission to update ${userRole?.name || 'this'} users`,
        );
      }

      if (hasPersonalUpdates && !isOwnProfile && !this.isAdmin(currentUser)) {
        throw new ForbiddenException(
          'You can only update your own personal information',
        );
      }

      if (dto.role_id) {
        if (!this.isAdmin(currentUser)) {
          throw new ForbiddenException('Only admin can update user roles');
        }

        if (currentUser.id === id && !this.isAdmin(currentUser)) {
          throw new ForbiddenException('You cannot edit your own role');
        }

        const newRole = await this.roleModel.findByPk(dto.role_id);
        if (!newRole) {
          throw new BadRequestException('Invalid role specified');
        }

        const canAssignRole = await this.canPerformActionOnUser(
          currentUser,
          { role_id: dto.role_id } as User,
          'update',
        );

        if (!canAssignRole) {
          throw new ForbiddenException(
            `You do not have permission to assign ${newRole.name} role`,
          );
        }
      }

      if (dto.email && dto.email !== user.email) {
        const existingUser = await this.userModel.findOne({
          where: { email: dto.email },
        });
        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      if (dto.password) {
        dto.password = await bcrypt.hash(dto.password, 10);
      }

      await user.update(dto);

      const updatedUser = await this.userModel.findByPk(id, {
        attributes: { exclude: ['password'] },
      });

      return updatedUser;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error.name === 'SequelizeValidationError') {
        throw new BadRequestException('Invalid data provided');
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Data already exists');
      }

      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: number, currentUser: any) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    const userRole = await this.roleModel.findByPk(user.role_id);
    const roleName = userRole?.name || 'User';

    const canDelete = await this.canPerformActionOnUser(
      currentUser,
      user,
      'delete',
    );

    if (!canDelete) {
      throw new ForbiddenException(
        `You do not have permission to delete ${roleName} users`,
      );
    }

    if (this.isAdmin(currentUser) && currentUser.id === id) {
      throw new ForbiddenException('Admin cannot delete their own account');
    }

    await user.destroy();
    return { message: `${roleName} deleted successfully` };
  }

  async getUserPermissions(userId: number): Promise<PermissionData[]> {
    try {
      const user = await this.userModel.findByPk(userId);

      if (!user?.role_id) {
        console.log('User not found or has no role_id:', userId);
        return [];
      }

      console.log('Found user with role_id:', user.role_id);

      const role = await this.roleModel.findByPk(user.role_id, {
        include: [
          {
            model: Permission,
            through: { attributes: [] },
          },
        ],
      });

      console.log('Role found:', role?.name);
      console.log('Permissions count:', role?.permissions?.length || 0);

      if (!role?.permissions) {
        return [];
      }

      console.log('permissions', role.permissions);
      console.log(
        'permission id',
        role.permissions.map((p) => p.id),
      );

      return role.permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
      }));
    } catch (error) {
      console.error('Permission fetch error:', error);
      return [];
    }
  }
}
