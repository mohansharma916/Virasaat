import type { ConfigService } from '@nestjs/config';
import { databaseConfig } from './database.config';

describe('production schema protection', () => {
  const config = (environment: string, synchronize?: string) => {
    const values: Record<string, unknown> = {
      NODE_ENV: environment,
      DB_SYNCHRONIZE: synchronize,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USERNAME: 'test',
      DB_PASSWORD: 'test',
      DB_DATABASE: 'test',
    };
    return {
      get: (key: string) => values[key],
      getOrThrow: (key: string) => values[key],
    } as ConfigService;
  };

  it('prevents automatic schema changes in production even with an old true flag', () => {
    expect(databaseConfig(config('production', 'true')).synchronize).toBe(
      false,
    );
    expect(databaseConfig(config('production')).synchronize).toBe(false);
  });

  it('allows local synchronization only outside production unless disabled', () => {
    expect(databaseConfig(config('development')).synchronize).toBe(true);
    expect(databaseConfig(config('development', 'false')).synchronize).toBe(
      false,
    );
  });
});
