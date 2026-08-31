import { describe, expect, it } from 'vitest';

import { buildTransaction } from '../../../test/fixtures';

import { recentAccounts } from './recent-accounts';

const older = buildTransaction({
  accountExternalIdDebit: '11111111-1111-4111-8111-111111111111',
  accountExternalIdCredit: '22222222-2222-4222-8222-222222222222',
  createdAt: '2026-08-29T10:00:00.000Z',
});
const newer = buildTransaction({
  accountExternalIdDebit: '33333333-3333-4333-8333-333333333333',
  accountExternalIdCredit: '22222222-2222-4222-8222-222222222222',
  createdAt: '2026-08-30T10:00:00.000Z',
});

describe('recentAccounts', () => {
  it('separa origem de destino e nao mistura os lados', () => {
    expect(recentAccounts([newer, older], 'debit').map((a) => a.id)).toEqual([
      newer.accountExternalIdDebit,
      older.accountExternalIdDebit,
    ]);
    expect(recentAccounts([newer, older], 'credit').map((a) => a.id)).toEqual([
      older.accountExternalIdCredit,
    ]);
  });

  it('nao repete conta e guarda o uso mais recente dela', () => {
    expect(recentAccounts([older, newer], 'credit')).toEqual([
      { id: older.accountExternalIdCredit, lastUsedAt: newer.createdAt },
    ]);
  });

  it('ordena da mais recente para a mais antiga, qualquer que seja a ordem recebida', () => {
    expect(recentAccounts([older, newer], 'debit').map((a) => a.id)).toEqual([
      newer.accountExternalIdDebit,
      older.accountExternalIdDebit,
    ]);
  });

  it('nao passa de oito sugestoes', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      buildTransaction({
        accountExternalIdDebit: `${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`,
        createdAt: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
      }),
    );

    expect(recentAccounts(many, 'debit')).toHaveLength(8);
  });

  it('sem transacoes, nao sugere nada', () => {
    expect(recentAccounts([], 'debit')).toEqual([]);
  });
});
