import { describe, expect, it } from 'vitest';

import { envSchema } from './env.schema.js';

const validEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/challenge',
  KAFKA_BROKERS: 'localhost:9092',
};

describe('envSchema', () => {
  it('aplica os padroes de porta, origem do dashboard e ambiente', () => {
    expect(envSchema.parse(validEnv)).toEqual({
      DATABASE_URL: validEnv.DATABASE_URL,
      KAFKA_BROKERS: ['localhost:9092'],
      KAFKA_CLIENT_ID_TRANSACTIONS: 'transactions',
      KAFKA_GROUP_ID_TRANSACTIONS: 'transactions-consumer',
      KAFKA_TOPIC_PARTITIONS: 3,
      NODE_ENV: 'development',
      OUTBOX_BATCH_SIZE: 50,
      OUTBOX_CLAIM_TIMEOUT_MS: 30_000,
      OUTBOX_MAX_ATTEMPTS: 10,
      OUTBOX_POLL_INTERVAL_MS: 500,
      TRANSACTIONS_PORT: 3001,
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('converte a porta, que chega como texto do ambiente', () => {
    expect(envSchema.parse({ ...validEnv, TRANSACTIONS_PORT: '4000' }).TRANSACTIONS_PORT).toBe(
      4000,
    );
  });

  it('aceita varios brokers separados por virgula', () => {
    expect(envSchema.parse({ ...validEnv, KAFKA_BROKERS: 'a:9092, b:9092' }).KAFKA_BROKERS).toEqual(
      ['a:9092', 'b:9092'],
    );
  });

  it('recusa DATABASE_URL ausente ou que nao seja postgresql://', () => {
    expect(envSchema.safeParse({ KAFKA_BROKERS: 'localhost:9092' }).success).toBe(false);

    const result = envSchema.safeParse({ DATABASE_URL: 'mysql://localhost/challenge' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('DATABASE_URL deve ser uma URL postgresql://');
    }
  });
});
