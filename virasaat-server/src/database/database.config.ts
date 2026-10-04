import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: config.getOrThrow<string>('DB_HOST'),
  port: config.getOrThrow<number>('DB_PORT'),

  username: config.getOrThrow<string>('DB_USERNAME'),
  password: config.getOrThrow<string>('DB_PASSWORD'),
  database: config.getOrThrow<string>('DB_DATABASE'),

  autoLoadEntities: true,

  synchronize:
    config.get<string>('DB_SYNCHRONIZE') === 'true' ||
    (config.get<string>('NODE_ENV') !== 'production' &&
      config.get<string>('DB_SYNCHRONIZE') !== 'false'),
});
