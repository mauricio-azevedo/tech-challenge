import { describe, expect, it } from 'vitest';

import { envSchema } from './env.schema.js';

describe('envSchema (anti-fraud)', () => {
  it('aplica os padroes: porta 3002, limite 1000, grupo e client id do servico', () => {
    expect(envSchema.parse({ KAFKA_BROKERS: 'localhost:9092' })).toEqual({
      ANTI_FRAUD_PORT: 3002,
      ANTI_FRAUD_VALUE_LIMIT: 1000,
      KAFKA_BROKERS: ['localhost:9092'],
      KAFKA_CLIENT_ID_ANTI_FRAUD: 'anti-fraud',
      KAFKA_GROUP_ID_ANTI_FRAUD: 'anti-fraud-consumer',
      KAFKA_TOPIC_PARTITIONS: 3,
      NODE_ENV: 'development',
    });
  });

  it('exige brokers e recusa limite nao positivo', () => {
    expect(envSchema.safeParse({}).success).toBe(false);
    expect(
      envSchema.safeParse({ KAFKA_BROKERS: 'localhost:9092', ANTI_FRAUD_VALUE_LIMIT: '0' }).success,
    ).toBe(false);
  });
});
