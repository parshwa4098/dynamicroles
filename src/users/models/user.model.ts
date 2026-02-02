/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Role } from '../../roles/models/role.model';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface UserCreationAttributes extends Optional<
  UserAttributes,
  'id'
> {}

@Table({ tableName: 'users' })
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column({ type: DataType.STRING, unique: true })
  declare email: string;

  @Column(DataType.STRING)
  declare password: string;

  @ForeignKey(() => Role)
  @Column(DataType.INTEGER)
  declare role_id: number;
  @BelongsTo(() => Role)
  role?: Role;
}
