import { Suspense } from 'react';

import { LoadingState } from '@/components/ui/loading-state';
import { TransactionsPage } from '@/features/transactions/transactions-page';

/** Casca de servidor: `useSearchParams` exige um limite de Suspense no App Router. */
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Carregando transações" />}>
      <TransactionsPage />
    </Suspense>
  );
}
