import type { Kafka } from 'kafkajs';
import { describe, expect, it, vi } from 'vitest';

import { ensureTopics } from './topics.js';

function fakeKafka(existing: string[], createTopics = vi.fn(() => Promise.resolve(true))) {
  const admin = {
    connect: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(() => Promise.resolve()),
    listTopics: vi.fn(() => Promise.resolve(existing)),
    createTopics,
  };
  return { kafka: { admin: () => admin } as unknown as Kafka, admin };
}

describe('ensureTopics', () => {
  it('cria somente os topicos que faltam, esperando a eleicao de lider', async () => {
    const { kafka, admin } = fakeKafka(['orders']);

    const created = await ensureTopics(kafka, [
      { name: 'orders', numPartitions: 3 },
      { name: 'orders.dlq', numPartitions: 1 },
    ]);

    expect(created).toEqual(['orders.dlq']);
    expect(admin.createTopics).toHaveBeenCalledWith({
      waitForLeaders: true,
      topics: [{ topic: 'orders.dlq', numPartitions: 1 }],
    });
    expect(admin.disconnect).toHaveBeenCalledOnce();
  });

  it('nao chama createTopics quando tudo ja existe', async () => {
    const { kafka, admin } = fakeKafka(['orders', 'orders.dlq']);

    await ensureTopics(kafka, [
      { name: 'orders', numPartitions: 3 },
      { name: 'orders.dlq', numPartitions: 1 },
    ]);

    expect(admin.createTopics).not.toHaveBeenCalled();
  });

  it('desconecta o admin mesmo quando a criacao falha', async () => {
    const { kafka, admin } = fakeKafka(
      [],
      vi.fn(() => Promise.reject(new Error('broker fora'))),
    );

    await expect(ensureTopics(kafka, [{ name: 'orders', numPartitions: 1 }])).rejects.toThrow(
      'broker fora',
    );
    expect(admin.disconnect).toHaveBeenCalledOnce();
  });
});
