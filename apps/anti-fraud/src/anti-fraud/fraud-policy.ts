import type { FinalTransactionStatus, RejectionReason } from '@challenge/contracts';

export interface FraudVerdict {
  status: FinalTransactionStatus;
  reason?: RejectionReason;
}

export interface FraudPolicyOptions {
  /** Valor maximo aprovado; acima dele a transacao e rejeitada. */
  valueLimit: number;
}

/**
 * A regra do desafio, como funcao pura: valor **acima** do limite e rejeitado, o restante
 * aprovado. Exatamente no limite aprova ("acima de 1000", nao "a partir de").
 */
export function evaluateTransaction(
  transaction: { value: number },
  options: FraudPolicyOptions,
): FraudVerdict {
  if (transaction.value > options.valueLimit) {
    return { status: 'REJECTED', reason: 'VALUE_ABOVE_LIMIT' };
  }
  return { status: 'APPROVED' };
}
