import {
  createEvent,
  TOPICS,
  transactionCreatedEventSchema,
  type ApiErrorResponse,
  type TransactionResponse,
} from '@challenge/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TransactionsRepository } from '../../src/transactions/transactions.repository.js';
import { createTestApp, resetDatabase, type TestApp } from './setup.js';

const validBody = {
  accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
  accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  transferTypeId: 2,
  value: 120,
};

describe('POST /transactions', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(testApp.prisma);
  });

  afterAll(async () => {
    await testApp.close();
  });

  const api = () => request(testApp.app.getHttpServer());

  it('cria a transacao como pendente e responde no contrato do desafio', async () => {
    const response = await api().post('/transactions').send(validBody);

    expect(response.status).toBe(201);
    const body = response.body as TransactionResponse;
    expect(body).toMatchObject({
      accountExternalIdDebit: validBody.accountExternalIdDebit,
      accountExternalIdCredit: validBody.accountExternalIdCredit,
      transactionType: { id: 2, name: 'PIX' },
      transactionStatus: { name: 'PENDING' },
      value: 120,
    });
    expect(body.transactionExternalId).toMatch(/^[0-9a-f-]{36}$/);

    const stored = await testApp.prisma.transaction.findUniqueOrThrow({
      where: { id: body.transactionExternalId },
    });
    expect(stored.status).toBe('PENDING');
    expect(stored.value.toString()).toBe('120');
  });

  it('enfileira o evento transaction.created no outbox, na mesma gravacao', async () => {
    const response = await api()
      .post('/transactions')
      .set('x-request-id', 'req-abc')
      .send(validBody);
    const { transactionExternalId } = response.body as TransactionResponse;

    const outbox = await testApp.prisma.outboxEvent.findMany();

    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({
      topic: TOPICS.TRANSACTION_CREATED,
      key: transactionExternalId,
      publishedAt: null,
      attempts: 0,
    });
    const event = transactionCreatedEventSchema.parse(outbox[0]?.payload);
    expect(event.eventId).toBe(outbox[0]?.id);
    expect(event.correlationId).toBe('req-abc');
    expect(event.data).toMatchObject({ transactionExternalId, transferTypeId: 2, value: 120 });
    expect(response.headers['x-request-id']).toBe('req-abc');
  });

  it('nao grava a transacao se o evento nao puder ser enfileirado', async () => {
    const repository = testApp.app.get(TransactionsRepository);
    const duplicatedEventId = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';
    await testApp.prisma.outboxEvent.create({
      data: { id: duplicatedEventId, topic: 't', key: 'k', payload: {} },
    });

    const attempt = repository.createWithOutbox(
      { ...validBody, transactionTypeId: 2 },
      {
        topic: TOPICS.TRANSACTION_CREATED,
        // Forca a falha do outbox: o eventId ja existe.
        build: () => ({
          ...createEvent(TOPICS.TRANSACTION_CREATED, {}, { correlationId: 'x' }),
          eventId: duplicatedEventId,
        }),
      },
    );

    await expect(attempt).rejects.toThrow();
    expect(await testApp.prisma.transaction.count()).toBe(0);
  });

  it('responde 400 listando cada campo invalido', async () => {
    const response = await api().post('/transactions').send({ value: -1 });

    expect(response.status).toBe(400);
    const body = response.body as ApiErrorResponse;
    expect(body.message).toBe('dados invalidos');
    expect(body.errors?.map((error) => error.path).sort()).toEqual([
      'accountExternalIdCredit',
      'accountExternalIdDebit',
      'transferTypeId',
      'value',
    ]);
    expect(await testApp.prisma.transaction.count()).toBe(0);
  });

  it('responde 400 para transferencia entre a mesma conta, sem gravar nada', async () => {
    const response = await api()
      .post('/transactions')
      .send({ ...validBody, accountExternalIdCredit: validBody.accountExternalIdDebit });

    expect(response.status).toBe(400);
    expect((response.body as ApiErrorResponse).errors).toEqual([
      {
        path: 'accountExternalIdCredit',
        message: 'conta de destino deve ser diferente da conta de origem',
      },
    ]);
    expect(await testApp.prisma.transaction.count()).toBe(0);
  });

  it('responde 422 para tipo de transferencia inexistente', async () => {
    const response = await api()
      .post('/transactions')
      .send({ ...validBody, transferTypeId: 99 });

    expect(response.status).toBe(422);
    expect((response.body as ApiErrorResponse).message).toBe('tipo de transferencia 99 nao existe');
  });
});
