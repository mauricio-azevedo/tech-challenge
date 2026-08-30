import { Suspense } from 'react';

import { PageHeader } from '@/components/app-shell/page-header';
import { LoadingRegion } from '@/components/ui/loading-region';
import { TransactionsPage } from '@/features/transactions/transactions-page';
import { TransactionsTableSkeleton } from '@/features/transactions/transactions-table-skeleton';

/** Casca de servidor: `useSearchParams` exige um limite de Suspense no App Router. */
export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <TransactionsPage />
    </Suspense>
  );
}

/** Mesmo esqueleto de header e titulo da pagina real, para nada pular quando ela hidrata. */
function Fallback() {
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
