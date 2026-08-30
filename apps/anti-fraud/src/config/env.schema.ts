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
 * Tudo que o servico le do ambiente, validado no boot. O limite da regra vem do ambiente com o
 * padrao do desafio (1000): a regra e de negocio, o numero e configuracao.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ANTI_FRAUD_PORT: z.coerce.number().int().positive().default(3002),
  KAFKA_BROKERS: brokerListSchema,
  KAFKA_CLIENT_ID_ANTI_FRAUD: z.string().min(1).default('anti-fraud'),
  KAFKA_GROUP_ID_ANTI_FRAUD: z.string().min(1).default('anti-fraud-consumer'),
  KAFKA_TOPIC_PARTITIONS: z.coerce.number().int().positive().default(3),
  ANTI_FRAUD_VALUE_LIMIT: z.coerce.number().positive().default(1000),
});

export type Env = z.infer<typeof envSchema>;
