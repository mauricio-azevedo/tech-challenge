import { transactionCreatedEventSchema } from '@challenge/contracts';
import { describe, expect, it } from 'vitest';

import { Prisma } from '../generated/prisma/client.js';
import { buildTransactionCreatedEvent } from './transaction-created.event.js';

describe('buildTransactionCreatedEvent', () => {
  it('monta um evento valido com tudo que o antifraude precisa e o rastreio da requisicao', () => {
    const event = buildTransactionCreatedEvent(
      {
        id: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f',
        accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
        accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
        transactionTypeId: 2,
        transactionType: { id: 2, name: 'PIX' },
        status: 'PENDING',
        value: new Prisma.Decimal('1500.00'),
        createdAt: new Date('2026-08-30T12:00:00.000Z'),
        updatedAt: new Date('2026-08-30T12:00:00.000Z'),
      },
      'req-42',
    );

    expect(transactionCreatedEventSchema.parse(event)).toEqual(event);
    expect(event).toMatchObject({
      eventType: 'transaction.created',
      correlationId: 'req-42',
      data: {
        transactionExternalId: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f',
        transferTypeId: 2,
        value: 1500,
        createdAt: '2026-08-30T12:00:00.000Z',
      },
    });
  });
});
