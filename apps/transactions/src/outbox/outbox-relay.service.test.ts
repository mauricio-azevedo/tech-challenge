import type { MessagePublisher, OutgoingMessage } from '@challenge/messaging';
import { describe, expect, it, vi } from 'vitest';

import { relayOnce } from './outbox-relay.service.js';
import type { ClaimedOutboxEvent } from './outbox.repository.js';

const options = { batchSize: 10, maxAttempts: 3, claimTimeoutMs: 30_000 };
const logger = { warn: vi.fn(), error: vi.fn() };

function event(id: string): ClaimedOutboxEvent {
  return {
    id,
    topic: 'transaction.created',
    key: `tx-${id}`,
    payload: { eventId: id },
    attempts: 0,
  };
}

function outboxWith(batch: ClaimedOutboxEvent[] | Error) {
  return {
    claimBatch: vi.fn(() =>
      batch instanceof Error ? Promise.reject(batch) : Promise.resolve(batch),
    ),
    markPublished: vi.fn(() => Promise.resolve()),
    markFailed: vi.fn(() => Promise.resolve()),
  };
}

function publisherThatFailsOn(failingId: string): MessagePublisher & { sent: OutgoingMessage[] } {
  const sent: OutgoingMessage[] = [];
  return {
    sent,
    publishRaw: () => Promise.resolve(),
    publish: (message) => {
      if (message.headers?.['x-event-id'] === failingId)
        return Promise.reject(new Error('broker fora'));
      sent.push(message);
      return Promise.resolve();
    },
  };
}

describe('relayOnce', () => {
  it('publica cada evento reivindicado com topico, chave e payload, e o marca como publicado', async () => {
    const outbox = outboxWith([event('a'), event('b')]);
    const publisher = publisherThatFailsOn('nenhum');

    const result = await relayOnce(outbox, publisher, options, logger);

    expect(result).toEqual({ published: 2, failed: 0 });
    expect(outbox.claimBatch).toHaveBeenCalledWith(10, 30_000);
    expect(publisher.sent.map((m) => [m.topic, m.key, m.value])).toEqual([
      ['transaction.created', 'tx-a', { eventId: 'a' }],
      ['transaction.created', 'tx-b', { eventId: 'b' }],
    ]);
    expect(outbox.markPublished).toHaveBeenCalledTimes(2);
  });

  it('a falha de um evento nao impede os demais e fica registrada nele', async () => {
    const outbox = outboxWith([event('a'), event('b'), event('c')]);
    const publisher = publisherThatFailsOn('b');

    const result = await relayOnce(outbox, publisher, options, logger);

    expect(result).toEqual({ published: 2, failed: 1 });
    expect(outbox.markFailed).toHaveBeenCalledWith('b', 'Error: broker fora', 3);
    expect(outbox.markPublished).not.toHaveBeenCalledWith('b');
  });

  it('sobrevive a erro de banco ao reivindicar: loga e segue para o proximo ciclo', async () => {
    const outbox = outboxWith(new Error('banco fora'));

    const result = await relayOnce(outbox, publisherThatFailsOn('nenhum'), options, logger);

    expect(result).toEqual({ published: 0, failed: 0 });
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('banco fora'));
  });
});
