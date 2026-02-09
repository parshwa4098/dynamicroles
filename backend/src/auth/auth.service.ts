/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';

import { User } from '../users/models/user.model';
import { Role } from '../roles/models/role.model';
import { Permission } from '../permissions/models/permission.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    private jwtService: JwtService,
  ) {}

  async register(dto: { name: string; email: string; password: string }) {
    const exists = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hash,
      role_id: 3,
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userModel.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials ');
    }

    const role = await this.roleModel.findByPk(user.role_id, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new UnauthorizedException(
        'Invalid credentials or role not assigned',
      );
    }
    if (!role.permissions || role.permissions.length === 0) {
      throw new UnauthorizedException(
        'Invalid credentials or role not assigned',
      );
    }
    const permissionIds = role.permissions
      ? role.permissions.map((p) => p.id)
      : [];

    console.log('Fetched permissions:', permissionIds);

    const payload = {
      id: user.id,
      role: role.name,
      permissions: permissionIds,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
        role_id: user.role_id,
      },
    };
  }
}
