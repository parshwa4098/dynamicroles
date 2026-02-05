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
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';

import { User } from './models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async create(dto: CreateUserDto) {
    const exists = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered');
    }
    const hash = await bcrypt.hash(dto.password, 10);

    return this.userModel.create({
      ...dto,
      password: hash,
    });
  }

  async findAll() {
    return this.userModel.findAll({
      attributes: { exclude: ['password'] },
    });
  }

  async findOne(id: number) {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) throw new NotFoundException('user not found ');
    return user;
  }

  async update(id: number, dto: UpdateUserDto, currentUser: any) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    const isOwnProfile = currentUser.id === id;
    const hasPersonalUpdates = dto.name || dto.email || dto.password;

    if (hasPersonalUpdates && !isOwnProfile && currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'You can only update your own personal information',
      );
    }

    if (dto.role_id) {
      if (currentUser.role !== 'admin') {
        throw new ForbiddenException('Only admin can update user roles');
      }
      if (currentUser.id === id) {
        throw new ForbiddenException('Admin cannot edit their own role');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    await user.update(dto);
    return { message: 'User updated successfully' };
  }

  async remove(id: number, currentUser: any) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    if (currentUser.role === 'admin' && currentUser.id === id) {
      throw new ForbiddenException('Admin cannot delete their own account');
    }

    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admin can delete users');
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}
