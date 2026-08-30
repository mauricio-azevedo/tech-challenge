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

describe('schema de teste', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('e usado tanto pelas queries do Prisma quanto por SQL cru', async () => {
    const rows = await testApp.prisma.$queryRaw<{ search_path: string }[]>`SHOW search_path`;

    expect(rows[0]?.search_path).toBe('test');
    // Se o SQL cru olhasse para outro schema, esta tabela nao existiria para ele.
    await expect(testApp.prisma.$executeRawUnsafe('SELECT 1 FROM "transactions"')).resolves.toEqual(
      expect.any(Number),
    );
  });
});
