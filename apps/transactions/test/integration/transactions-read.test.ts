import type {
  ApiErrorResponse,
  PaginatedTransactionsResponse,
  TransactionResponse,
  TransactionTypeResponse,
} from '@challenge/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTransaction } from './factories.js';
import { createTestApp, resetDatabase, type TestApp } from './setup.js';

describe('leitura de transacoes', () => {
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
  const pageOf = (response: request.Response) => response.body as PaginatedTransactionsResponse;
  const errorOf = (response: request.Response) => response.body as ApiErrorResponse;
  const createdAtsOf = (response: request.Response) =>
    pageOf(response).data.map((t) => t.createdAt);

  describe('GET /transactions/:transactionExternalId', () => {
    it('devolve a transacao no contrato do desafio', async () => {
      const created = await testApp.prisma.transaction.create({
        data: buildTransaction({ transactionTypeId: 2, value: '120.00' }),
      });

      const response = await api().get(`/transactions/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body as TransactionResponse).toMatchObject({
        transactionExternalId: created.id,
        transactionType: { id: 2, name: 'PIX' },
        transactionStatus: { name: 'PENDING' },
        value: 120,
        createdAt: created.createdAt.toISOString(),
      });
    });

    it('responde 404 para identificador desconhecido', async () => {
      const response = await api().get('/transactions/0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f');

      expect(response.status).toBe(404);
      expect(errorOf(response)).toEqual({
        statusCode: 404,
        message: 'transacao 0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f nao encontrada',
      });
    });

    it('responde 400 quando o identificador nao e um UUID', async () => {
      const response = await api().get('/transactions/abc');

      expect(response.status).toBe(400);
      expect(errorOf(response).errors).toEqual([
        { path: '', message: 'identificador deve ser um UUID valido' },
      ]);
    });
  });

  describe('GET /transactions', () => {
    beforeEach(async () => {
      await testApp.prisma.transaction.createMany({
        data: [
          buildTransaction({
            status: 'APPROVED',
            transactionTypeId: 1,
            createdAt: '2026-08-01T10:00:00.000Z',
          }),
          buildTransaction({
            status: 'REJECTED',
            transactionTypeId: 2,
            createdAt: '2026-08-15T10:00:00.000Z',
          }),
          buildTransaction({
            status: 'PENDING',
            transactionTypeId: 2,
            createdAt: '2026-08-31T23:59:59.000Z',
          }),
          buildTransaction({
            status: 'APPROVED',
            transactionTypeId: 3,
            createdAt: '2026-09-01T00:00:00.000Z',
          }),
        ],
      });
    });

    it('lista da mais recente para a mais antiga, com os metadados da pagina', async () => {
      const response = await api().get('/transactions');

      expect(response.status).toBe(200);
      expect(pageOf(response)).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 4,
      });
      expect(createdAtsOf(response)).toEqual([
        '2026-09-01T00:00:00.000Z',
        '2026-08-31T23:59:59.000Z',
        '2026-08-15T10:00:00.000Z',
        '2026-08-01T10:00:00.000Z',
      ]);
    });

    it('filtra por status', async () => {
      const response = await api().get('/transactions').query({ status: 'APPROVED' });

      const body = pageOf(response);
      expect(body.total).toBe(2);
      expect(
        body.data.every(
          (t: { transactionStatus: { name: string } }) => t.transactionStatus.name === 'APPROVED',
        ),
      ).toBe(true);
    });

    it('filtra por tipo', async () => {
      const response = await api().get('/transactions').query({ transferTypeId: 2 });

      expect(pageOf(response).total).toBe(2);
    });

    it('filtra por periodo inclusivo nas duas pontas', async () => {
      const response = await api()
        .get('/transactions')
        .query({ from: '2026-08-15', to: '2026-08-31' });

      expect(createdAtsOf(response)).toEqual([
        '2026-08-31T23:59:59.000Z',
        '2026-08-15T10:00:00.000Z',
      ]);
    });

    it('combina filtros', async () => {
      const response = await api()
        .get('/transactions')
        .query({ status: 'APPROVED', transferTypeId: 1, from: '2026-08-01' });

      expect(pageOf(response).total).toBe(1);
    });

    it('pagina: a pagina alem do fim vem vazia mas mantem o total', async () => {
      const first = await api().get('/transactions').query({ page: 1, pageSize: 3 });
      const second = await api().get('/transactions').query({ page: 2, pageSize: 3 });
      const beyond = await api().get('/transactions').query({ page: 9, pageSize: 3 });

      expect(pageOf(first).data).toHaveLength(3);
      expect(pageOf(second).data).toHaveLength(1);
      expect(pageOf(beyond)).toMatchObject({
        data: [],
        page: 9,
        total: 4,
      });
    });

    it('rejeita pagina maior que 100 e periodo invertido, apontando o campo', async () => {
      const tooBig = await api().get('/transactions').query({ pageSize: 101 });
      const inverted = await api()
        .get('/transactions')
        .query({ from: '2026-09-01', to: '2026-08-01' });

      expect(tooBig.status).toBe(400);
      expect(errorOf(tooBig).errors?.[0]?.path).toBe('pageSize');
      expect(inverted.status).toBe(400);
      expect(errorOf(inverted).errors).toEqual([
        { path: 'from', message: 'data inicial nao pode ser posterior a data final' },
      ]);
    });
  });

  describe('GET /transaction-types', () => {
    it('devolve o catalogo semeado', async () => {
      const response = await api().get('/transaction-types');

      expect(response.status).toBe(200);
      expect(response.body as TransactionTypeResponse[]).toEqual([
        { id: 1, name: 'TED' },
        { id: 2, name: 'PIX' },
        { id: 3, name: 'DOC' },
      ]);
    });
  });
});
