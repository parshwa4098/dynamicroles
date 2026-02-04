/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SequelizeModuleOptions } from '@nestjs/sequelize';

import { ConfigService } from '@nestjs/config';

export const databaseConfig = async (
  configService: ConfigService,
): Promise<SequelizeModuleOptions> => ({
  dialect: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<number>('DB_PORT')),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  autoLoadModels: true,
  synchronize: true,
  logging: false,
});
