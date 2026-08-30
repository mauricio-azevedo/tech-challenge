import { describe, expect, it } from 'vitest';

import { hasActiveFilters, parseListState, serializeListState, totalPages } from './filters';

describe('filtros na URL', () => {
  it('le os filtros e a paginacao da query string, com os padroes da API', () => {
    expect(parseListState(new URLSearchParams('status=APPROVED&transferTypeId=2&page=3'))).toEqual({
      status: 'APPROVED',
      transferTypeId: 2,
      page: 3,
      pageSize: 20,
    });
  });

  it('ignora um valor invalido sem descartar os outros', () => {
    expect(parseListState(new URLSearchParams('status=QUALQUER&from=2026-08-01&page=abc'))).toEqual(
      {
        from: '2026-08-01',
        page: 1,
        pageSize: 20,
      },
    );
  });

  it('escreve so o que nao e padrao, para manter a URL limpa', () => {
    expect(serializeListState({ page: 1, pageSize: 20 }).toString()).toBe('');
    expect(
      serializeListState({
        status: 'REJECTED',
        from: '2026-08-01',
        page: 2,
        pageSize: 20,
      }).toString(),
    ).toBe('status=REJECTED&from=2026-08-01&page=2');
  });

  it('sabe se ha filtro ativo e quantas paginas existem', () => {
    expect(hasActiveFilters({ page: 3, pageSize: 20 })).toBe(false);
    expect(hasActiveFilters({ to: '2026-08-31', page: 1, pageSize: 20 })).toBe(true);
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(41, 20)).toBe(3);
  });
});
