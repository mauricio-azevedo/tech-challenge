import { z } from 'zod';

/** `host:porta,host:porta` -> lista; e assim que o kafkajs e o .env.example falam de brokers. */
const brokerListSchema = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean),
  );

/**
 * Tudo que o servico le do ambiente, validado no boot: variavel faltando ou invalida derruba o
 * processo com uma mensagem clara em vez de falhar mais tarde, no meio de uma requisicao.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TRANSACTIONS_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'DATABASE_URL deve ser uma URL postgresql://',
  }),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  KAFKA_BROKERS: brokerListSchema,
  KAFKA_CLIENT_ID_TRANSACTIONS: z.string().min(1).default('transactions'),
  KAFKA_TOPIC_PARTITIONS: z.coerce.number().int().positive().default(3),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(500),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().max(500).default(50),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  /** Um claim mais velho que isso e considerado abandonado (relay morreu) e pode ser refeito. */
  OUTBOX_CLAIM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type Env = z.infer<typeof envSchema>;
