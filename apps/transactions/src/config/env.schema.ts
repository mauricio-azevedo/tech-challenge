import { z } from 'zod';

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
});

export type Env = z.infer<typeof envSchema>;
