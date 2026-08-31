import type { TransactionResponse } from '@challenge/contracts';

export interface RecentAccount {
  id: string;
  lastUsedAt: string;
}

/** Quantas sugestoes cabem sem virar uma lista para rolar. */
const LIMIT = 8;

/**
 * Contas que ja aparecem nas ultimas transacoes, da mais recente para a mais antiga e sem repetir.
 * Quem cria uma transacao quase sempre repete uma conta que ja usou — e essa e a unica "agenda" que
 * o sistema tem, porque nao existe cadastro de contas nem de favorecidos.
 */
export function recentAccounts(
  transactions: TransactionResponse[],
  side: 'debit' | 'credit',
): RecentAccount[] {
  const lastUsed = new Map<string, string>();
  // A listagem ja vem da mais recente para a mais antiga; a ordenacao aqui e so para nao depender
  // disso caso a origem dos dados mude.
  for (const transaction of [...transactions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )) {
    const id =
      side === 'debit' ? transaction.accountExternalIdDebit : transaction.accountExternalIdCredit;
    if (!lastUsed.has(id)) lastUsed.set(id, transaction.createdAt);
  }
  return [...lastUsed].slice(0, LIMIT).map(([id, lastUsedAt]) => ({ id, lastUsedAt }));
}
