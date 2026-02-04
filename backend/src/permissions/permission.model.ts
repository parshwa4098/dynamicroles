/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from '../roles/models/role.model';
import { RolePermission } from '../roles/models/role-permission.model';

@Table({ tableName: 'permissions', timestamps: false })
export class Permission extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @BelongsToMany(() => Role, () => RolePermission)
  roles!: Role[];
}
