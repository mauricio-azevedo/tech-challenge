import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TransactionsPage } from '@/features/transactions/transactions-page';
import { TransactionsPageFallback } from '@/features/transactions/transactions-page-fallback';

export const metadata: Metadata = { title: 'Nova transação' };

/** Deep link da criacao: a listagem renderiza por baixo com o dialog aberto. */
export default function Page() {
  return (
    <Suspense fallback={<TransactionsPageFallback />}>
      <TransactionsPage createOpen />
    </Suspense>
  );
}
