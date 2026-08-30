import {
  createEvent,
  TOPICS,
  type TransactionCreatedData,
  type TransactionCreatedEvent,
} from '@challenge/contracts';

import type { TransactionWithType } from './transaction.mapper.js';

export function toTransactionCreatedData(transaction: TransactionWithType): TransactionCreatedData {
  return {
    transactionExternalId: transaction.id,
    accountExternalIdDebit: transaction.accountExternalIdDebit,
    accountExternalIdCredit: transaction.accountExternalIdCredit,
    transferTypeId: transaction.transactionTypeId,
    value: transaction.value.toNumber(),
    createdAt: transaction.createdAt.toISOString(),
  };
}

/** O evento que avisa o antifraude: carrega tudo que a avaliacao precisa, sem consulta de volta. */
export function buildTransactionCreatedEvent(
  transaction: TransactionWithType,
  correlationId: string,
): TransactionCreatedEvent {
  return createEvent(TOPICS.TRANSACTION_CREATED, toTransactionCreatedData(transaction), {
    correlationId,
  });
}
