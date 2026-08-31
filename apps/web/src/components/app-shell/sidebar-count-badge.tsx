'use client';

import { useTransactionStats } from '@/features/transactions/hooks';
import { useHydrated } from '@/lib/use-hydrated';

/** Contador de transacoes do item de navegacao; discreto: um traco enquanto nao ha numero. */
export function SidebarCountBadge() {
  const stats = useTransactionStats();
  // Mesma query dos cards do resumo, que podem hidratar antes: o numero so entra depois da
  // hidratacao, senao o cliente divergiria do traco que veio do servidor.
  const hydrated = useHydrated();
  return (
    <span className="rounded-[5px] border bg-background px-1.5 py-px font-mono text-[11px] text-muted-foreground">
      {hydrated ? (stats.data?.total ?? '—') : '—'}
    </span>
  );
}
