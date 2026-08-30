import { describe, expect, it } from 'vitest';

import { detailHref, listHref, newTransactionHref } from './navigation';

describe('navegacao com o estado da listagem', () => {
  it('mantem a URL limpa quando tudo e padrao', () => {
    expect(listHref({ page: 1, pageSize: 20 })).toBe('/transactions');
    expect(newTransactionHref({ page: 1, pageSize: 20 })).toBe('/transactions/new');
  });

  it('carrega filtros e pagina nos deep links', () => {
    const state = { status: 'REJECTED', page: 2, pageSize: 20 } as const;
    expect(listHref(state)).toBe('/transactions?status=REJECTED&page=2');
    expect(detailHref('abc-123', state)).toBe('/transactions/abc-123?status=REJECTED&page=2');
  });
});
