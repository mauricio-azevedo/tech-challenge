import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';

import {
  processMessage,
  runConsumer,
  subscription,
  type ProcessingDependencies,
  type RawMessage,
} from './consumer.js';
import type { MessagePublisher, RawOutgoingMessage } from './producer.js';

const schema = z.object({ id: z.string(), value: z.number() });

function fakePublisher() {
  const sent: RawOutgoingMessage[] = [];
  const publisher: MessagePublisher = {
    publish: () => Promise.resolve(),
    publishRaw: (message) => {
      sent.push(message);
      return Promise.resolve();
    },
  };
  return { publisher, sent };
}

function rawMessage(value: string, overrides: Partial<RawMessage> = {}): RawMessage {
  return {
    topic: 'orders',
    partition: 2,
    offset: '17',
    key: Buffer.from('order-1'),
    value: Buffer.from(value),
    headers: { 'x-request-id': 'req-1' },
    ...overrides,
  };
}

function depsWith(publisher: MessagePublisher): ProcessingDependencies & {
  sleep: Mock<(ms: number) => Promise<void>>;
  heartbeat: Mock<() => Promise<void>>;
} {
  return {
    deadLetter: publisher,
    deadLetterTopic: (topic) => `${topic}.dlq`,
    retry: { maxAttempts: 3, initialBackoffMs: 100, maxBackoffMs: 1_000 },
    logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    sleep: vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve()),
    heartbeat: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    now: () => new Date('2026-08-30T12:00:00.000Z'),
  };
}

describe('processMessage', () => {
  it('entrega ao handler o payload validado e os metadados da mensagem', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const { publisher, sent } = fakePublisher();

    const result = await processMessage(
      subscription('orders', schema, handler),
      rawMessage('{"id":"a","value":10}'),
      depsWith(publisher),
    );

    expect(result).toEqual({ outcome: 'processed', attempts: 1 });
    expect(handler).toHaveBeenCalledWith({
      topic: 'orders',
      partition: 2,
      offset: '17',
      key: 'order-1',
      headers: { 'x-request-id': 'req-1' },
      payload: { id: 'a', value: 10 },
    });
    expect(sent).toHaveLength(0);
  });

  it('manda JSON invalido direto para a DLQ, preservando os bytes originais', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const { publisher, sent } = fakePublisher();

    const result = await processMessage(
      subscription('orders', schema, handler),
      rawMessage('{nao e json'),
      depsWith(publisher),
    );

    expect(result).toEqual({ outcome: 'dead-lettered', reason: 'INVALID_JSON', attempts: 0 });
    expect(handler).not.toHaveBeenCalled();
    expect(sent[0]).toMatchObject({
      topic: 'orders.dlq',
      key: 'order-1',
      headers: {
        'x-request-id': 'req-1',
        'x-original-topic': 'orders',
        'x-original-partition': '2',
        'x-original-offset': '17',
        'x-failure-reason': 'INVALID_JSON',
        'x-attempts': '0',
        'x-failed-at': '2026-08-30T12:00:00.000Z',
      },
    });
    expect(sent[0]?.value?.toString()).toBe('{nao e json');
  });

  it('manda payload fora do schema para a DLQ sem chamar o handler', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const { publisher, sent } = fakePublisher();

    const result = await processMessage(
      subscription('orders', schema, handler),
      rawMessage('{"id":"a","value":"dez"}'),
      depsWith(publisher),
    );

    expect(result).toMatchObject({ outcome: 'dead-lettered', reason: 'SCHEMA_VALIDATION' });
    expect(handler).not.toHaveBeenCalled();
    expect(sent[0]?.headers?.['x-failure-reason']).toBe('SCHEMA_VALIDATION');
  });

  it('repete o handler com backoff exponencial e heartbeat, e desiste na terceira falha', async () => {
    const handler = vi.fn(() => Promise.reject(new Error('banco fora')));
    const { publisher, sent } = fakePublisher();
    const deps = depsWith(publisher);

    const result = await processMessage(
      subscription('orders', schema, handler),
      rawMessage('{"id":"a","value":10}'),
      deps,
    );

    expect(result).toEqual({ outcome: 'dead-lettered', reason: 'HANDLER_FAILED', attempts: 3 });
    expect(handler).toHaveBeenCalledTimes(3);
    expect(deps.sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
    expect(deps.heartbeat).toHaveBeenCalledTimes(2);
    expect(sent[0]?.headers).toMatchObject({
      'x-failure-reason': 'HANDLER_FAILED',
      'x-attempts': '3',
      'x-error': 'Error: banco fora',
    });
  });

  it('considera processada a mensagem que passa numa nova tentativa', async () => {
    const handler = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('instabilidade'))
      .mockResolvedValue(undefined);
    const { publisher, sent } = fakePublisher();

    const result = await processMessage(
      subscription('orders', schema, handler),
      rawMessage('{"id":"a","value":10}'),
      depsWith(publisher),
    );

    expect(result).toEqual({ outcome: 'processed', attempts: 2 });
    expect(sent).toHaveLength(0);
  });

  it('limita o backoff ao maximo configurado', async () => {
    const handler = vi.fn(() => Promise.reject(new Error('x')));
    const { publisher } = fakePublisher();
    const deps = depsWith(publisher);
    deps.retry = { maxAttempts: 5, initialBackoffMs: 100, maxBackoffMs: 250 };

    await processMessage(
      subscription('orders', schema, handler),
      rawMessage('{"id":"a","value":10}'),
      deps,
    );

    expect(deps.sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200, 250, 250]);
  });

  it('propaga a falha se nem a DLQ aceitar a mensagem: e o ultimo recurso', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const deadLetter: MessagePublisher = {
      publish: () => Promise.resolve(),
      publishRaw: () => Promise.reject(new Error('broker fora')),
    };

    await expect(
      processMessage(
        subscription('orders', schema, handler),
        rawMessage('nope'),
        depsWith(deadLetter),
      ),
    ).rejects.toThrow('broker fora');
  });
});

describe('runConsumer', () => {
  function fakeKafka() {
    let eachMessage: ((payload: unknown) => Promise<void>) | undefined;
    const consumer = {
      connect: vi.fn(() => Promise.resolve()),
      disconnect: vi.fn(() => Promise.resolve()),
      subscribe: vi.fn(() => Promise.resolve()),
      run: vi.fn((config: { eachMessage: (payload: unknown) => Promise<void> }) => {
        eachMessage = config.eachMessage;
        return Promise.resolve();
      }),
    };
    const kafka = { consumer: () => consumer };
    return {
      kafka: kafka as unknown as Parameters<typeof runConsumer>[0],
      consumer,
      deliver: (p: unknown) => eachMessage?.(p),
    };
  }

  it('assina cada topico desde o inicio e roteia mensagens para a assinatura certa', async () => {
    const { kafka, consumer, deliver } = fakeKafka();
    const ordersHandler = vi.fn(() => Promise.resolve());
    const paymentsHandler = vi.fn(() => Promise.resolve());
    const { publisher } = fakePublisher();

    const running = await runConsumer(kafka, {
      groupId: 'g1',
      deadLetter: publisher,
      subscriptions: [
        subscription('orders', schema, ordersHandler),
        subscription('payments', schema, paymentsHandler),
      ],
    });

    expect(consumer.subscribe).toHaveBeenCalledWith({ topic: 'orders', fromBeginning: true });
    expect(consumer.subscribe).toHaveBeenCalledWith({ topic: 'payments', fromBeginning: true });

    await deliver({
      topic: 'payments',
      partition: 0,
      message: { offset: '1', key: null, value: Buffer.from('{"id":"p","value":1}'), headers: {} },
      heartbeat: () => Promise.resolve(),
    });

    expect(paymentsHandler).toHaveBeenCalledOnce();
    expect(ordersHandler).not.toHaveBeenCalled();

    await running.stop();
    expect(consumer.disconnect).toHaveBeenCalledOnce();
  });
});
