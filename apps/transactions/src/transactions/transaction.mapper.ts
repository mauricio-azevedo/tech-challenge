import type { TransactionResponse } from '@challenge/contracts';

import type { Prisma } from '../generated/prisma/client.js';

export type TransactionWithType = Prisma.TransactionGetPayload<{
  include: { transactionType: true };
}>;

/** Linha do banco -> contrato da API. `value` vira numero aqui, e so aqui: no banco e decimal exato. */
export function toTransactionResponse(transaction: TransactionWithType): TransactionResponse {
  return {
    transactionExternalId: transaction.id,
    accountExternalIdDebit: transaction.accountExternalIdDebit,
    accountExternalIdCredit: transaction.accountExternalIdCredit,
    transactionType: { id: transaction.transactionType.id, name: transaction.transactionType.name },
    transactionStatus: { name: transaction.status },
    value: transaction.value.toNumber(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
