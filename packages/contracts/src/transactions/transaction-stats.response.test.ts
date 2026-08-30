import { describe, expect, it } from 'vitest';

import { transactionStatsResponseSchema } from './transaction-stats.response.js';

describe('transactionStatsResponseSchema', () => {
  it('aceita a resposta zerada de um banco vazio', () => {
    const stats = {
      total: 0,
      byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0 },
      approvedVolume: 0,
    };

    expect(transactionStatsResponseSchema.parse(stats)).toEqual(stats);
  });

  it('exige os tres status na contagem', () => {
    const result = transactionStatsResponseSchema.safeParse({
      total: 1,
      byStatus: { PENDING: 1, APPROVED: 0 },
      approvedVolume: 0,
    });

    expect(result.success).toBe(false);
  });

  it('rejeita contagens negativas ou fracionarias', () => {
    const base = { total: 1, byStatus: { PENDING: 1, APPROVED: 0, REJECTED: 0 } };

    expect(transactionStatsResponseSchema.safeParse({ ...base, approvedVolume: -1 }).success).toBe(
      false,
    );
    expect(
      transactionStatsResponseSchema.safeParse({
        ...base,
        byStatus: { ...base.byStatus, PENDING: 1.5 },
        approvedVolume: 0,
      }).success,
    ).toBe(false);
  });
});
