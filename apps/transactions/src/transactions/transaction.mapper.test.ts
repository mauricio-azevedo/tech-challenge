import { transactionResponseSchema, transactionStatsResponseSchema } from '@challenge/contracts';
import { describe, expect, it } from 'vitest';

import { Prisma } from '../generated/prisma/client.js';
import { toTransactionResponse, toTransactionStatsResponse } from './transaction.mapper.js';

describe('toTransactionResponse', () => {
  it('produz o contrato da API, com o valor como numero e datas em ISO', () => {
    const response = toTransactionResponse({
      id: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f',
      accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
      accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      transactionTypeId: 2,
      transactionType: { id: 2, name: 'PIX' },
      status: 'PENDING',
      value: new Prisma.Decimal('120.50'),
      createdAt: new Date('2026-08-30T12:00:00.000Z'),
      updatedAt: new Date('2026-08-30T12:00:00.000Z'),
    });

    expect(response).toEqual({
      transactionExternalId: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f',
      accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
      accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      transactionType: { id: 2, name: 'PIX' },
      transactionStatus: { name: 'PENDING' },
      value: 120.5,
      createdAt: '2026-08-30T12:00:00.000Z',
      updatedAt: '2026-08-30T12:00:00.000Z',
    });
    expect(transactionResponseSchema.safeParse(response).success).toBe(true);
  });
});

describe('toTransactionStatsResponse', () => {
  it('zera os status ausentes e converte o volume aprovado para numero', () => {
    const response = toTransactionStatsResponse([
      { status: 'APPROVED', count: 2, sum: new Prisma.Decimal('1000.50') },
      { status: 'PENDING', count: 1, sum: new Prisma.Decimal('35.00') },
    ]);

    expect(response).toEqual({
      total: 3,
      byStatus: { PENDING: 1, APPROVED: 2, REJECTED: 0 },
      approvedVolume: 1000.5,
    });
    expect(transactionStatsResponseSchema.safeParse(response).success).toBe(true);
  });

  it('responde tudo zerado para um banco vazio', () => {
    expect(toTransactionStatsResponse([])).toEqual({
      total: 0,
      byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0 },
      approvedVolume: 0,
    });
  });
});
