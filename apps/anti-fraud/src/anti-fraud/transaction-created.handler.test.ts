import {
  createEvent,
  TOPICS,
  transactionStatusUpdatedEventSchema,
  type TransactionCreatedEvent,
} from '@challenge/contracts';
import type { IncomingMessage, MessagePublisher, OutgoingMessage } from '@challenge/messaging';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import type { Env } from '../config/env.schema.js';
import { TransactionCreatedHandler } from './transaction-created.handler.js';

const transactionExternalId = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';
const fixedNow = () => new Date('2026-08-30T12:00:05.000Z');

function createdMessage(value: number): IncomingMessage<TransactionCreatedEvent> {
  const event = createEvent(
    TOPICS.TRANSACTION_CREATED,
    {
      transactionExternalId,
      accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
      accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      transferTypeId: 1,
      value,
      createdAt: '2026-08-30T12:00:00.000Z',
    },
    { correlationId: 'req-7' },
  );
  return {
    topic: TOPICS.TRANSACTION_CREATED,
    partition: 0,
    offset: '3',
    key: transactionExternalId,
    headers: {},
    payload: event,
  };
}

function handlerWith(limit = 1000) {
  const published: OutgoingMessage[] = [];
  const publisher: MessagePublisher = {
    publish: (message) => {
      published.push(message);
      return Promise.resolve();
    },
    publishRaw: () => Promise.resolve(),
  };
  const config = { get: () => limit } as unknown as ConfigService<Env, true>;
  return { handler: new TransactionCreatedHandler(publisher, config), published };
}

describe('TransactionCreatedHandler', () => {
  it('publica o veredito com a chave da transacao, encadeado ao evento de criacao', async () => {
    const { handler, published } = handlerWith();
    const message = createdMessage(120);

    const verdict = await handler.handle(message, fixedNow);

    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      topic: TOPICS.TRANSACTION_STATUS_UPDATED,
      key: transactionExternalId,
      value: verdict,
      headers: { 'x-event-id': verdict.eventId, 'x-correlation-id': 'req-7' },
    });
    expect(verdict).toMatchObject({
      eventType: TOPICS.TRANSACTION_STATUS_UPDATED,
      correlationId: 'req-7',
      causationId: message.payload.eventId,
      data: { transactionExternalId, status: 'APPROVED', evaluatedAt: '2026-08-30T12:00:05.000Z' },
    });
    expect(verdict.data).not.toHaveProperty('reason');
  });

  it('rejeita acima do limite informando o motivo', async () => {
    const { handler } = handlerWith();

    const verdict = await handler.handle(createdMessage(1500), fixedNow);

    expect(verdict.data).toMatchObject({ status: 'REJECTED', reason: 'VALUE_ABOVE_LIMIT' });
  });

  it('produz um evento que o servico de transacoes aceita (contrato publisher <-> consumer)', async () => {
    const { handler } = handlerWith();

    const verdict = await handler.handle(createdMessage(1500), fixedNow);

    // O que vai pelo fio e JSON: validamos a forma serializada, nao o objeto em memoria.
    const wire: unknown = JSON.parse(JSON.stringify(verdict));
    expect(transactionStatusUpdatedEventSchema.safeParse(wire).success).toBe(true);
  });

  it('usa o limite configurado no ambiente', async () => {
    const { handler } = handlerWith(100);

    const verdict = await handler.handle(createdMessage(120), fixedNow);

    expect(verdict.data.status).toBe('REJECTED');
  });
});
