import { describe, expect, it } from 'vitest';

import { formatValue } from '@/lib/transaction-labels';

import { isAboveLimit, verdictReason } from './anti-fraud';

describe('isAboveLimit', () => {
  it('aprova exatamente no limite e recusa um centavo acima (mesma borda do servico)', () => {
    expect(isAboveLimit(1000)).toBe(false);
    expect(isAboveLimit(1000.01)).toBe(true);
  });
});

describe('verdictReason', () => {
  it('explica cada status em funcao do limite', () => {
    expect(verdictReason('PENDING')).toBe('Análise de segurança em andamento');
    expect(verdictReason('APPROVED')).toBe(`Valor dentro do limite de ${formatValue(1000)}`);
    expect(verdictReason('REJECTED')).toBe(`Valor acima do limite de ${formatValue(1000)}`);
  });
});
