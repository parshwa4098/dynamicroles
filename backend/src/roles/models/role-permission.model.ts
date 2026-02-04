/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Role } from './role.model';
import { Permission } from '../../permissions/permission.model';

export interface RolePermissionAttributes {
  role_id: number;
  permission_id: number;
}

export interface RolePermissionCreationAttributes extends Optional<
  RolePermissionAttributes,
  never
> {}

@Table({ tableName: 'role_permissions', timestamps: false })
export class RolePermission extends Model<
  RolePermissionAttributes,
  RolePermissionCreationAttributes
> {
  @ForeignKey(() => Role)
  @Column(DataType.INTEGER)
  declare role_id: number;

  @ForeignKey(() => Permission)
  @Column(DataType.INTEGER)
  declare permission_id: number;
}
