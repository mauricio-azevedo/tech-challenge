import { createEvent, TOPICS, type TransactionStatusUpdatedEvent } from '@challenge/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TransactionStatusService } from '../../src/transactions/transaction-status.service.js';
import { buildTransaction } from './factories.js';
import { createTestApp, resetDatabase, type TestApp } from './setup.js';

function verdictFor(
  transactionExternalId: string,
  status: 'APPROVED' | 'REJECTED',
): TransactionStatusUpdatedEvent {
  return createEvent(
    TOPICS.TRANSACTION_STATUS_UPDATED,
    {
      transactionExternalId,
      status,
      ...(status === 'REJECTED' ? { reason: 'VALUE_ABOVE_LIMIT' as const } : {}),
      evaluatedAt: new Date().toISOString(),
    },
    { correlationId: 'req-1' },
  );
}

describe('aplicacao do veredito do antifraude', () => {
  let testApp: TestApp;
  let service: TransactionStatusService;

  beforeAll(async () => {
    testApp = await createTestApp();
    service = testApp.app.get(TransactionStatusService);
  });

  beforeEach(async () => {
    await resetDatabase(testApp.prisma);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it.each(['APPROVED', 'REJECTED'] as const)('leva a transacao de PENDING a %s', async (status) => {
    const created = await testApp.prisma.transaction.create({ data: buildTransaction() });

    const outcome = await service.apply(verdictFor(created.id, status));

    const stored = await testApp.prisma.transaction.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(outcome).toBe('applied');
    expect(stored.status).toBe(status);
    expect(stored.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
  });

  it('e idempotente: o mesmo veredito entregue duas vezes nao muda nada na segunda', async () => {
    const created = await testApp.prisma.transaction.create({ data: buildTransaction() });
    const event = verdictFor(created.id, 'APPROVED');

    await service.apply(event);
    const second = await service.apply(event);

    expect(second).toBe('already-final');
    const stored = await testApp.prisma.transaction.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored.status).toBe('APPROVED');
  });

  it('nao sobrescreve um status final com outro veredito', async () => {
    const created = await testApp.prisma.transaction.create({
      data: buildTransaction({ status: 'REJECTED' }),
    });

    const outcome = await service.apply(verdictFor(created.id, 'APPROVED'));

    expect(outcome).toBe('already-final');
    const stored = await testApp.prisma.transaction.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored.status).toBe('REJECTED');
  });

  it('confirma veredito de transacao desconhecida sem gravar nada', async () => {
    const outcome = await service.apply(
      verdictFor('0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f', 'APPROVED'),
    );

    expect(outcome).toBe('not-found');
    expect(await testApp.prisma.transaction.count()).toBe(0);
  });
});
