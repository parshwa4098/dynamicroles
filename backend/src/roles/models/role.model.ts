/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Permission } from '../../permissions/models/permission.model';
import { RolePermission } from './role-permission.model';

export interface RoleAttributes {
  id: number;
  name: string;
}

export interface RoleCreationAttributes extends Optional<
  RoleAttributes,
  'id'
> {}

@Table({ tableName: 'roles' })
export class Role extends Model<RoleAttributes, RoleCreationAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions?: Permission[];
}
