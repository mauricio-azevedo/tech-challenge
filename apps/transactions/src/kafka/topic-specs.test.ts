import { describe, expect, it } from 'vitest';

import { topicSpecs } from './topic-specs.js';

describe('topicSpecs', () => {
  it('lista os topicos de negocio com as particoes pedidas e as DLQs com uma', () => {
    expect(topicSpecs(3)).toEqual([
      { name: 'transaction.created', numPartitions: 3 },
      { name: 'transaction.created.dlq', numPartitions: 1 },
      { name: 'transaction.status.updated', numPartitions: 3 },
      { name: 'transaction.status.updated.dlq', numPartitions: 1 },
    ]);
  });
});
