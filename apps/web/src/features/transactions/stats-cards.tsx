'use client';

import { Button } from '@/components/ui/button';
import { LoadingRegion } from '@/components/ui/loading-region';
import { Skeleton } from '@/components/ui/skeleton';
import { formatValue } from '@/lib/transaction-labels';
import { cn } from '@/lib/utils';

import { useTransactionStats } from './hooks';

const gridClass = 'grid grid-cols-2 gap-3.5 xl:grid-cols-4';

/** Os quatro cards do mockup, alimentados por GET /transactions/stats. */
export function StatsCards() {
  const stats = useTransactionStats();

  if (stats.isPending) {
    return (
      <LoadingRegion label="Carregando resumo">
        <div className={gridClass}>
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-[104px] rounded-[9px]" />
          ))}
        </div>
      </LoadingRegion>
    );
  }

  if (stats.isError) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-[9px] border border-status-rejected-border bg-status-rejected-bg px-4 py-3 text-[13px] text-status-rejected-fg"
      >
        <span className="flex-1">Não foi possível carregar o resumo. {stats.error.message}</span>
        <Button
          type="button"
          variant="outline"
          className="h-8 bg-card px-2.5 text-[12.5px]"
          onClick={() => {
            void stats.refetch();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { total, byStatus, approvedVolume } = stats.data;
  const cards = [
    { label: 'Total', value: total, sub: 'todo o período', dot: 'bg-zinc-400' },
    {
      label: 'Aprovadas',
      value: byStatus.APPROVED,
      sub: `${formatValue(approvedVolume)} liberados`,
      dot: 'bg-status-approved',
    },
    {
      label: 'Rejeitadas',
      value: byStatus.REJECTED,
      sub: 'acima do limite permitido',
      dot: 'bg-status-rejected',
    },
    {
      label: 'Pendentes',
      value: byStatus.PENDING,
      sub: 'em análise de segurança',
      dot: 'bg-status-pending',
    },
  ];

  return (
    <div className={gridClass}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-1.5 rounded-[9px] border bg-card px-4 py-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-[7px]">
            <span aria-hidden="true" className={cn('size-[7px] rounded-[2px]', card.dot)} />
            <span className="text-[12.5px] font-medium text-muted-foreground">{card.label}</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {card.value.toLocaleString('pt-BR')}
          </span>
          <span className="font-mono text-[11.5px] text-zinc-400">{card.sub}</span>
        </div>
      ))}
    </div>
  );
}
