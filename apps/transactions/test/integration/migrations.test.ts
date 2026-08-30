import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './setup.js';

describe('migrations', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('semeiam o catalogo de tipos de transferencia', async () => {
    const types = await testApp.prisma.transactionType.findMany({ orderBy: { id: 'asc' } });

    expect(types).toEqual([
      { id: 1, name: 'TED' },
      { id: 2, name: 'PIX' },
      { id: 3, name: 'DOC' },
    ]);
  });
});
