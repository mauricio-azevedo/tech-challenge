import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { TABLE_GRID } from './transactions-table';

const widths = ['88%', '76%', '92%', '70%', '84%', '78%', '90%', '74%'];

/** Oito linhas-fantasma no grid da tabela, com o shimmer defasado como no mockup. */
export function TransactionsTableSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-[820px]">
      {widths.map((width, index) => (
        <div key={width} className={cn(TABLE_GRID, 'h-[52px] border-b border-muted')}>
          <Skeleton
            className="h-[11px]"
            style={{ width, animationDelay: `${String(index * 100)}ms` }}
          />
          <Skeleton className="h-[11px] w-12" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-[11px] w-[70px] justify-self-end" />
          <Skeleton className="h-[11px] w-[120px]" />
          <span />
        </div>
      ))}
    </div>
  );
}
