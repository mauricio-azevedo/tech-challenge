import type { TransactionStatus } from '@challenge/contracts';

import { env } from '@/lib/env';
import { formatValue } from '@/lib/transaction-labels';

/** Mesma borda da regra do servico: **acima** do limite e recusado; exatamente no limite passa. */
export function isAboveLimit(value: number, limit: number = env.antiFraudValueLimit): boolean {
  return value > limit;
}

/** Frase de motivo do detalhe, derivada do status (a unica regra e o limite de valor). */
export function verdictReason(
  status: TransactionStatus,
  limit: number = env.antiFraudValueLimit,
): string {
  if (status === 'PENDING') return 'Análise de segurança em andamento';
  return status === 'APPROVED'
    ? `Valor dentro do limite de ${formatValue(limit)}`
    : `Valor acima do limite de ${formatValue(limit)}`;
}
