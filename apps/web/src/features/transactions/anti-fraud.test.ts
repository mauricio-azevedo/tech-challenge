import { describe, expect, it } from 'vitest';

import { formatValue } from '@/lib/transaction-labels';

import { isAboveLimit, ruleHint, verdictReason } from './anti-fraud';

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

describe('ruleHint', () => {
  it('sem valor valido, apresenta a regra em termos gerais', () => {
    expect(ruleHint(undefined).aboveLimit).toBe(false);
    expect(ruleHint(Number.NaN).text).toContain('são recusadas');
    expect(ruleHint(0).text).toContain('são recusadas');
  });

  it('avisa quando o valor digitado passa do limite', () => {
    expect(ruleHint(1000).aboveLimit).toBe(false);
    expect(ruleHint(1000).text).toContain('está dentro do limite');
    expect(ruleHint(1000.01).aboveLimit).toBe(true);
    expect(ruleHint(1000.01).text).toContain('deve ser recusada');
  });
});
