import { randomUUID } from 'node:crypto';

import type { Prisma } from '../../src/generated/prisma/client.js';

/** Dados validos de uma transacao para os testes; qualquer campo pode ser sobrescrito. */
export function buildTransaction(
  overrides: Partial<Prisma.TransactionUncheckedCreateInput> = {},
): Prisma.TransactionUncheckedCreateInput {
  return {
    id: randomUUID(),
    accountExternalIdDebit: randomUUID(),
    accountExternalIdCredit: randomUUID(),
    transactionTypeId: 1,
    status: 'PENDING',
    value: '100.00',
    ...overrides,
  };
}
