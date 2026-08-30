import { describe, expect, it } from 'vitest';

import { evaluateTransaction } from './fraud-policy.js';

const options = { valueLimit: 1000 };

describe('evaluateTransaction', () => {
  it.each([0.01, 120, 999.99, 1000])('aprova valor %s (ate o limite, inclusive)', (value) => {
    expect(evaluateTransaction({ value }, options)).toEqual({ status: 'APPROVED' });
  });

  it.each([1000.01, 1500, 9_999_999_999_999.99])('rejeita valor %s (acima do limite)', (value) => {
    expect(evaluateTransaction({ value }, options)).toEqual({
      status: 'REJECTED',
      reason: 'VALUE_ABOVE_LIMIT',
    });
  });

  it('respeita um limite configurado diferente do padrao', () => {
    expect(evaluateTransaction({ value: 600 }, { valueLimit: 500 }).status).toBe('REJECTED');
    expect(evaluateTransaction({ value: 1500 }, { valueLimit: 2000 }).status).toBe('APPROVED');
  });
});
