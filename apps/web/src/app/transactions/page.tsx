import { Suspense } from 'react';

import { TransactionsPage } from '@/features/transactions/transactions-page';
import { TransactionsPageFallback } from '@/features/transactions/transactions-page-fallback';

/** Casca de servidor: `useSearchParams` exige um limite de Suspense no App Router. */
export default function Page() {
  return (
    <Suspense fallback={<TransactionsPageFallback />}>
      <TransactionsPage />
    </Suspense>
  );
}
