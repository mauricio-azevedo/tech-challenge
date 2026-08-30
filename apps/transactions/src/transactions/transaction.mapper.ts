import type {
  TransactionResponse,
  TransactionStatsResponse,
  TransactionStatus,
} from '@challenge/contracts';

import type { Prisma } from '../generated/prisma/client.js';

export type TransactionWithType = Prisma.TransactionGetPayload<{
  include: { transactionType: true };
}>;

/** Uma linha do GROUP BY por status, ja sem o vocabulario do Prisma (`_count`/`_sum`). */
export interface StatusTotals {
  status: TransactionStatus;
  count: number;
  sum: Prisma.Decimal | null;
}

/**
 * Agregado do banco -> contrato. Parte dos tres status zerados: a resposta e completa mesmo com a
 * tabela vazia ou sem linhas de algum status, e o dashboard nao precisa tratar chave ausente.
 */
export function toTransactionStatsResponse(rows: StatusTotals[]): TransactionStatsResponse {
  const byStatus: Record<TransactionStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  let approvedVolume = 0;
  for (const row of rows) {
    byStatus[row.status] = row.count;
    if (row.status === 'APPROVED') approvedVolume = row.sum?.toNumber() ?? 0;
  }
  return {
    total: byStatus.PENDING + byStatus.APPROVED + byStatus.REJECTED,
    byStatus,
    approvedVolume,
  };
}

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
