/**
 * `NEXT_PUBLIC_*` e embutido no build pelo Next; o acesso precisa ser literal
 * (`process.env.NEXT_PUBLIC_API_URL`), nao dinamico, para a substituicao acontecer.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  pollIntervalMs: Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 3000),
  // Copia de ANTI_FRAUD_VALUE_LIMIT so para a tela (valor destacado, aviso no formulario,
  // motivo no detalhe); a regra de negocio continua exclusivamente no servico anti-fraud.
  antiFraudValueLimit: Number(process.env.NEXT_PUBLIC_ANTI_FRAUD_VALUE_LIMIT ?? 1000),
} as const;
