import { TOPICS, transactionCreatedEventSchema } from '@challenge/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { OutboxRelay } from '../../src/outbox/outbox-relay.service.js';
import { OutboxRepository } from '../../src/outbox/outbox.repository.js';
import { createTestApp, resetDatabase, type TestApp } from './setup.js';

const body = {
  accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
  accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  transferTypeId: 1,
  value: 50,
};

describe('relay do outbox', () => {
  let testApp: TestApp;
  let relay: OutboxRelay;

  beforeAll(async () => {
    testApp = await createTestApp();
    relay = testApp.app.get(OutboxRelay);
  });

  beforeEach(async () => {
    await resetDatabase(testApp.prisma);
    testApp.publisher.reset();
  });

  afterAll(async () => {
    await testApp.close();
  });

  const createTransaction = () =>
    request(testApp.app.getHttpServer()).post('/transactions').send(body);

  it('publica o evento gravado pela criacao e marca a linha como publicada; nao republica', async () => {
    await createTransaction();

    const first = await relay.flush();
    const second = await relay.flush();

    expect(first).toEqual({ published: 1, failed: 0 });
    expect(second).toEqual({ published: 0, failed: 0 });
    expect(testApp.publisher.published).toHaveLength(1);
    const message = testApp.publisher.published[0];
    const event = transactionCreatedEventSchema.parse(message?.value);
    expect(message?.topic).toBe(TOPICS.TRANSACTION_CREATED);
    expect(message?.key).toBe(event.data.transactionExternalId);
    expect(message?.headers).toEqual({ 'x-event-id': event.eventId });

    const rows = await testApp.prisma.outboxEvent.findMany();
    expect(rows[0]?.publishedAt).toBeInstanceOf(Date);
  });

  it('com o broker fora, mantem o evento na fila contando tentativas; retira apos o limite', async () => {
    await createTransaction();
    testApp.publisher.failWith = new Error('broker fora');
    const outbox = testApp.app.get(OutboxRepository);
    const maxAttempts = 10;

    const result = await relay.flush();
    expect(result).toEqual({ published: 0, failed: 1 });
    let row = await testApp.prisma.outboxEvent.findFirstOrThrow();
    expect(row).toMatchObject({
      attempts: 1,
      lastError: 'Error: broker fora',
      publishedAt: null,
      failedAt: null,
    });

    // Simula as tentativas restantes ate o limite (o claim expira por tempo; aqui forcamos).
    for (let attempt = 2; attempt <= maxAttempts; attempt += 1) {
      await outbox.markFailed(row.id, 'Error: broker fora', maxAttempts);
    }
    row = await testApp.prisma.outboxEvent.findFirstOrThrow();
    expect(row.attempts).toBe(maxAttempts);
    expect(row.failedAt).toBeInstanceOf(Date);

    // Um evento com failed_at nao volta a ser reivindicado.
    testApp.publisher.failWith = undefined;
    await testApp.prisma.outboxEvent.update({ where: { id: row.id }, data: { claimedAt: null } });
    expect(await relay.flush()).toEqual({ published: 0, failed: 0 });
  });

  it('um evento reivindicado por um relay nao e publicado por outro ao mesmo tempo', async () => {
    await Promise.all([createTransaction(), createTransaction(), createTransaction()]);

    const results = await Promise.all([relay.flush(), relay.flush(), relay.flush()]);

    const published = results.reduce((sum, r) => sum + r.published, 0);
    expect(published).toBe(3);
    expect(testApp.publisher.published).toHaveLength(3);
  });

  it('um claim antigo (relay que morreu) expira e o evento volta a ser elegivel', async () => {
    await createTransaction();
    const outbox = testApp.app.get(OutboxRepository);
    const stale = new Date(Date.now() - 60_000);
    await testApp.prisma.outboxEvent.updateMany({ data: { claimedAt: stale } });

    const claimed = await outbox.claimBatch(10, 30_000);

    expect(claimed).toHaveLength(1);
  });
});
