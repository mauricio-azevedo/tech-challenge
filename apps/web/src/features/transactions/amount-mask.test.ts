import { describe, expect, it } from 'vitest';

import { digitsToValue, formatAmount } from './amount-mask';

describe('digitsToValue', () => {
  it('forma o numero da direita para a esquerda, digito a digito', () => {
    expect(digitsToValue('')).toBeUndefined();
    expect(digitsToValue('1')).toBe(0.01);
    expect(digitsToValue('12')).toBe(0.12);
    expect(digitsToValue('120')).toBe(1.2);
    expect(digitsToValue('12050')).toBe(120.5);
  });

  it('ignora o que nao e digito, entao o proprio texto ja formatado volta ao mesmo valor', () => {
    expect(digitsToValue('1.200,50')).toBe(1200.5);
    expect(digitsToValue('R$ 1.200,5')).toBe(120.05);
  });

  it('mantem o zero para o schema acusar "maior que zero" e nao trava em zeros a esquerda', () => {
    expect(digitsToValue('0')).toBe(0);
    expect(digitsToValue('000120')).toBe(1.2);
  });

  it('nao passa da precisao de numeric(15,2)', () => {
    expect(digitsToValue('9'.repeat(20))).toBe(9_999_999_999_999.99);
  });
});

describe('formatAmount', () => {
  it('escreve em pt-BR com duas casas, sem o prefixo do campo', () => {
    expect(formatAmount(1200.5)).toBe('1.200,50');
    expect(formatAmount(0.07)).toBe('0,07');
  });
});
