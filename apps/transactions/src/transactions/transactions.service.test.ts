import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { Prisma } from '../generated/prisma/client.js';
import type { TransactionWithType } from './transaction.mapper.js';
import type { TransactionPage, TransactionsRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

const stored: TransactionWithType = {
  id: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f',
  accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
  accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  transactionTypeId: 1,
  transactionType: { id: 1, name: 'TED' },
  status: 'APPROVED',
  value: new Prisma.Decimal('99.99'),
  createdAt: new Date('2026-08-30T12:00:00.000Z'),
  updatedAt: new Date('2026-08-30T12:00:05.000Z'),
};

function serviceWith(repository: Partial<TransactionsRepository>): TransactionsService {
  return new TransactionsService(repository as TransactionsRepository);
}

describe('TransactionsService', () => {
  it('devolve a transacao no formato do contrato', async () => {
    const service = serviceWith({ findById: () => Promise.resolve(stored) });

    const response = await service.findByExternalId(stored.id);

    expect(response.transactionStatus).toEqual({ name: 'APPROVED' });
    expect(response.value).toBe(99.99);
  });

  it('responde 404 quando a transacao nao existe', async () => {
    const service = serviceWith({ findById: () => Promise.resolve(null) });

    await expect(service.findByExternalId(stored.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lista com os metadados da pagina pedida', async () => {
    const page: TransactionPage = { items: [stored], total: 41 };
    const service = serviceWith({ findPage: () => Promise.resolve(page) });

    const response = await service.list({ page: 3, pageSize: 20 });

    expect(response).toMatchObject({ page: 3, pageSize: 20, total: 41 });
    expect(response.data).toHaveLength(1);
  });
});
