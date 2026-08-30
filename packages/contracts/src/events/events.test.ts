import { describe, expect, it } from 'vitest';

import { createEvent, EVENT_VERSION } from './envelope.js';
import { dlqTopicFor, isDlqTopic, TOPICS } from './topics.js';
import { transactionCreatedEventSchema } from './transaction-created.event.js';
import { transactionStatusUpdatedEventSchema } from './transaction-status-updated.event.js';

const transactionExternalId = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';

const createdData = {
  transactionExternalId,
  accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
  accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  transferTypeId: 1,
  value: 120,
  createdAt: '2026-08-30T12:00:00.000Z',
};

describe('createEvent', () => {
  it('monta um envelope que passa pelo schema do proprio evento', () => {
    const fixedClock = () => new Date('2026-08-30T12:00:01.000Z');

    const event = createEvent(
      TOPICS.TRANSACTION_CREATED,
      createdData,
      { correlationId: 'req-1' },
      fixedClock,
    );

    expect(transactionCreatedEventSchema.parse(event)).toEqual(event);
    expect(event.version).toBe(EVENT_VERSION);
    expect(event.occurredAt).toBe('2026-08-30T12:00:01.000Z');
    expect(event).not.toHaveProperty('causationId');
  });

  it('gera um eventId diferente a cada evento', () => {
    const first = createEvent(TOPICS.TRANSACTION_CREATED, createdData, { correlationId: 'req-1' });
    const second = createEvent(TOPICS.TRANSACTION_CREATED, createdData, { correlationId: 'req-1' });

    expect(first.eventId).not.toBe(second.eventId);
  });

  it('encadeia causationId e propaga correlationId no evento de resposta', () => {
    const created = createEvent(TOPICS.TRANSACTION_CREATED, createdData, {
      correlationId: 'req-1',
    });

    const updated = createEvent(
      TOPICS.TRANSACTION_STATUS_UPDATED,
      {
        transactionExternalId,
        status: 'REJECTED',
        reason: 'VALUE_ABOVE_LIMIT',
        evaluatedAt: '2026-08-30T12:00:02.000Z',
      },
      { correlationId: created.correlationId, causationId: created.eventId },
    );

    expect(transactionStatusUpdatedEventSchema.parse(updated)).toEqual(updated);
    expect(updated.causationId).toBe(created.eventId);
    expect(updated.correlationId).toBe('req-1');
  });
});

describe('schemas dos eventos', () => {
  it('rejeita envelope com tipo de evento trocado', () => {
    const event = createEvent(TOPICS.TRANSACTION_STATUS_UPDATED, createdData, {
      correlationId: 'req-1',
    });

    expect(transactionCreatedEventSchema.safeParse(event).success).toBe(false);
  });

  it('rejeita versao de envelope desconhecida', () => {
    const event = {
      ...createEvent(TOPICS.TRANSACTION_CREATED, createdData, { correlationId: 'r' }),
      version: 2,
    };

    expect(transactionCreatedEventSchema.safeParse(event).success).toBe(false);
  });

  it('rejeita veredito com status PENDING: o antifraude so publica status finais', () => {
    const event = createEvent(
      TOPICS.TRANSACTION_STATUS_UPDATED,
      { transactionExternalId, status: 'PENDING', evaluatedAt: '2026-08-30T12:00:02.000Z' },
      { correlationId: 'req-1' },
    );

    expect(transactionStatusUpdatedEventSchema.safeParse(event).success).toBe(false);
  });
});

describe('topicos', () => {
  it('deriva o topico de dead letter e o reconhece', () => {
    expect(dlqTopicFor(TOPICS.TRANSACTION_CREATED)).toBe('transaction.created.dlq');
    expect(isDlqTopic('transaction.created.dlq')).toBe(true);
    expect(isDlqTopic(TOPICS.TRANSACTION_CREATED)).toBe(false);
  });
});
