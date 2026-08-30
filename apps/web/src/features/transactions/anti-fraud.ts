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

export interface RuleHint {
  text: string;
  aboveLimit: boolean;
}

/** Aviso da caixa de regra do formulario, reagindo ao valor digitado. */
export function ruleHint(
  value: number | undefined,
  limit: number = env.antiFraudValueLimit,
): RuleHint {
  if (value === undefined || Number.isNaN(value) || value <= 0) {
    return {
      text: `Transações acima de ${formatValue(limit)} são recusadas na análise de segurança.`,
      aboveLimit: false,
    };
  }
  if (value > limit) {
    return {
      text: `${formatValue(value)} passa do limite de ${formatValue(limit)} e deve ser recusada na análise.`,
      aboveLimit: true,
    };
  }
  return {
    text: `${formatValue(value)} está dentro do limite de ${formatValue(limit)}.`,
    aboveLimit: false,
  };
}
