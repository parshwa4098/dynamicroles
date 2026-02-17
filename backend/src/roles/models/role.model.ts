import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  HasMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Permission } from '../../permissions/models/permission.model';
import { RolePermission } from './role-permission.model';
import { User } from '../../users/models/user.model';

export interface RoleAttributes {
  id: number;
  name: string;
}

export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

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

  @HasMany(() => User, { foreignKey: 'role_id' })
  declare users?: User[];
}
