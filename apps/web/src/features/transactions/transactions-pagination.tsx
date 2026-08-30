'use client';

import { Button } from '@/components/ui/button';

import { formatRange, pageWindow } from './pagination-helpers';

/** Rodape do mockup: intervalo visivel, paginas numeradas e Anterior/Próxima. */
export function TransactionsPagination({
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center gap-3 border-t px-4 py-3">
      <span className="text-[12.5px] text-muted-foreground tabular-nums">
        {formatRange(page, pageSize, total)}
      </span>
      <div className="flex-1" />
      <Button
        type="button"
        variant="outline"
        disabled={page <= 1}
        className="h-[31px] px-3 text-[13px] disabled:opacity-45"
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        Anterior
      </Button>
      <div className="flex gap-1">
        {pageWindow(page, totalPages).map((n) => (
          <Button
            key={n}
            type="button"
            variant={n === page ? 'default' : 'outline'}
            aria-current={n === page ? 'page' : undefined}
            className="h-[31px] min-w-[31px] px-2 text-[13px] tabular-nums"
            onClick={() => {
              onPageChange(n);
            }}
          >
            {n}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={page >= totalPages}
        className="h-[31px] px-3 text-[13px] disabled:opacity-45"
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        Próxima
      </Button>
    </nav>
  );
}
