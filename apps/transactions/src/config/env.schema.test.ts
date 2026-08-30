import { describe, expect, it } from 'vitest';

import { envSchema } from './env.schema.js';

const validEnv = { DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/challenge' };

describe('envSchema', () => {
  it('aplica os padroes de porta, origem do dashboard e ambiente', () => {
    expect(envSchema.parse(validEnv)).toEqual({
      ...validEnv,
      NODE_ENV: 'development',
      TRANSACTIONS_PORT: 3001,
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('converte a porta, que chega como texto do ambiente', () => {
    expect(envSchema.parse({ ...validEnv, TRANSACTIONS_PORT: '4000' }).TRANSACTIONS_PORT).toBe(
      4000,
    );
  });

  it('recusa DATABASE_URL ausente ou que nao seja postgresql://', () => {
    expect(envSchema.safeParse({}).success).toBe(false);

    const result = envSchema.safeParse({ DATABASE_URL: 'mysql://localhost/challenge' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('DATABASE_URL deve ser uma URL postgresql://');
    }
  });
});
