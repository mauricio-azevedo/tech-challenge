import type { IHeaders, Kafka } from 'kafkajs';
import { describe, expect, it, vi } from 'vitest';

import { decodeHeaders } from './headers.js';
import { KafkaProducer } from './producer.js';

function fakeKafka() {
  const send = vi.fn(() => Promise.resolve([]));
  const kafka = {
    producer: () => ({ connect: vi.fn(), disconnect: vi.fn(), send }),
  } as unknown as Kafka;
  return { kafka, send };
}

describe('KafkaProducer', () => {
  it('publica o valor como JSON, com chave, headers e confirmacao de todas as replicas', async () => {
    const { kafka, send } = fakeKafka();

    await new KafkaProducer(kafka).publish({
      topic: 'orders',
      key: 'order-1',
      value: { id: 'order-1', amount: 10 },
      headers: { 'x-request-id': 'req-1' },
    });

    const [record] = send.mock.calls[0] as unknown as [
      {
        topic: string;
        acks: number;
        messages: { key: string; value: Buffer; headers: IHeaders }[];
      },
    ];
    expect(record.topic).toBe('orders');
    expect(record.acks).toBe(-1);
    expect(record.messages[0]?.key).toBe('order-1');
    expect(JSON.parse(record.messages[0]?.value.toString() ?? '')).toEqual({
      id: 'order-1',
      amount: 10,
    });
    expect(decodeHeaders(record.messages[0]?.headers)).toEqual({ 'x-request-id': 'req-1' });
  });
});
