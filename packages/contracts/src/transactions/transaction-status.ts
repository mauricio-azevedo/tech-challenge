import { z } from 'zod';

/**
 * Status de uma transacao ao longo do ciclo antifraude. Toda transacao nasce PENDING e termina
 * em APPROVED ou REJECTED; nenhuma outra transicao existe.
 */
export const TRANSACTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const transactionStatusSchema = z.enum(TRANSACTION_STATUSES);

export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

/** Resultados possiveis da avaliacao antifraude — os status finais. */
export const FINAL_TRANSACTION_STATUSES = ['APPROVED', 'REJECTED'] as const;

export const finalTransactionStatusSchema = z.enum(FINAL_TRANSACTION_STATUSES);

export type FinalTransactionStatus = z.infer<typeof finalTransactionStatusSchema>;

export function isFinalStatus(status: TransactionStatus): status is FinalTransactionStatus {
  return status !== 'PENDING';
}
