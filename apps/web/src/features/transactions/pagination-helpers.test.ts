import { describe, expect, it } from 'vitest';

import { formatRange, pageWindow } from './pagination-helpers';

describe('formatRange', () => {
  it('descreve o intervalo visivel da pagina', () => {
    expect(formatRange(1, 20, 45)).toBe('1–20 de 45 transações');
    expect(formatRange(3, 20, 45)).toBe('41–45 de 45 transações');
  });

  it('trata o vazio e o singular', () => {
    expect(formatRange(1, 20, 0)).toBe('0 transações');
    expect(formatRange(1, 20, 1)).toBe('1 de 1 transação');
  });
});

describe('pageWindow', () => {
  it('mostra todas as paginas quando cabem na janela', () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('centra na pagina atual e prende nas bordas', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
    expect(pageWindow(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });
});
