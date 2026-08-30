import { PageHeader } from '@/components/app-shell/page-header';
import { LoadingRegion } from '@/components/ui/loading-region';

import { TransactionsTableSkeleton } from './transactions-table-skeleton';

/** Mesmo header e titulo da pagina real, para nada pular enquanto o Suspense resolve. */
export function TransactionsPageFallback() {
  return (
    <>
      <PageHeader title="Transações" />
      <main className="flex w-full max-w-[1360px] flex-1 flex-col gap-5 px-6 pt-[26px] pb-10">
        <h1 className="text-[23px] font-semibold tracking-tight">Transações</h1>
        <LoadingRegion label="Carregando transações">
          <div className="overflow-hidden rounded-[10px] border bg-card">
            <TransactionsTableSkeleton />
          </div>
        </LoadingRegion>
      </main>
    </>
  );
}
