import { describe, expect, it } from 'vitest';

import { listTransactionsQuerySchema } from './list-transactions-query.schema.js';

describe('listTransactionsQuerySchema', () => {
  it('aplica os padroes de paginacao quando nada e informado', () => {
    expect(listTransactionsQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('converte os valores da query string, que chegam como texto', () => {
    const query = listTransactionsQuerySchema.parse({
      status: 'APPROVED',
      transferTypeId: '2',
      from: '2026-08-01',
      to: '2026-08-31',
      page: '3',
      pageSize: '50',
    });

    expect(query).toEqual({
      status: 'APPROVED',
      transferTypeId: 2,
      from: '2026-08-01',
      to: '2026-08-31',
      page: 3,
      pageSize: 50,
    });
  });

  it('limita o tamanho da pagina a 100', () => {
    expect(listTransactionsQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(listTransactionsQuerySchema.safeParse({ pageSize: '0' }).success).toBe(false);
  });

  it('rejeita periodo com data inicial depois da final, apontando o campo', () => {
    const result = listTransactionsQuerySchema.safeParse({ from: '2026-08-31', to: '2026-08-01' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0]?.path).toEqual(['from']);
    }
  });

  it('aceita periodo de um unico dia', () => {
    expect(
      listTransactionsQuerySchema.safeParse({ from: '2026-08-15', to: '2026-08-15' }).success,
    ).toBe(true);
  });

  it('rejeita data fora do formato AAAA-MM-DD e status desconhecido', () => {
    expect(listTransactionsQuerySchema.safeParse({ from: '15/08/2026' }).success).toBe(false);
    expect(listTransactionsQuerySchema.safeParse({ status: 'CANCELLED' }).success).toBe(false);
  });
});
