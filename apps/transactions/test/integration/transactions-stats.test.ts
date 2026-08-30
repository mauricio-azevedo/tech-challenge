import type { TransactionStatsResponse } from '@challenge/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTransaction } from './factories.js';
import { createTestApp, resetDatabase, type TestApp } from './setup.js';

describe('GET /transactions/stats', () => {
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
  const statsOf = (response: request.Response) => response.body as TransactionStatsResponse;

  it('responde tudo zerado para um banco vazio', async () => {
    const response = await api().get('/transactions/stats');

    expect(response.status).toBe(200);
    expect(statsOf(response)).toEqual({
      total: 0,
      byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0 },
      approvedVolume: 0,
    });
  });

  it('conta por status e soma apenas o volume aprovado', async () => {
    await testApp.prisma.transaction.createMany({
      data: [
        buildTransaction({ status: 'APPROVED', value: '120.00' }),
        buildTransaction({ status: 'APPROVED', value: '880.50' }),
        buildTransaction({ status: 'REJECTED', value: '1500.00' }),
        buildTransaction({ status: 'PENDING', value: '35.00' }),
      ],
    });

    const response = await api().get('/transactions/stats');

    expect(response.status).toBe(200);
    expect(statsOf(response)).toEqual({
      total: 4,
      byStatus: { PENDING: 1, APPROVED: 2, REJECTED: 1 },
      approvedVolume: 1000.5,
    });
  });

  it('reflete um veredito aplicado depois da criacao', async () => {
    const created = await testApp.prisma.transaction.create({
      data: buildTransaction({ value: '200.00' }),
    });

    await testApp.prisma.transaction.update({
      where: { id: created.id },
      data: { status: 'APPROVED' },
    });

    const response = await api().get('/transactions/stats');

    expect(statsOf(response)).toEqual({
      total: 1,
      byStatus: { PENDING: 0, APPROVED: 1, REJECTED: 0 },
      approvedVolume: 200,
    });
  });
});
