/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
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

    if (currentUser.role === 'admin' && (dto.name || dto.email)) {
      throw new ForbiddenException('Admin cannot update personal information');
    }

    if (currentUser.role === 'user' && currentUser.sub !== id) {
      throw new ForbiddenException('User can update only own profile');
    }

    if (dto.role_id && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admin can update role');
    }

    await user.update(dto);

    return { message: 'User updated successfully' };
  }
  async remove(id: number) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}
