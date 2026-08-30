'use client';

import { useTransactionStats } from '@/features/transactions/hooks';

/** Contador de transacoes do item de navegacao; discreto: um traco enquanto nao ha numero. */
export function SidebarCountBadge() {
  const stats = useTransactionStats();
  return (
    <span className="rounded-[5px] border bg-background px-1.5 py-px font-mono text-[11px] text-muted-foreground">
      {stats.data?.total ?? '—'}
    </span>
  );
}
