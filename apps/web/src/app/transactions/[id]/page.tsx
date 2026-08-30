import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TransactionsPage } from '@/features/transactions/transactions-page';
import { TransactionsPageFallback } from '@/features/transactions/transactions-page-fallback';

export const metadata: Metadata = { title: 'Detalhe da transação' };

/** Deep link do detalhe: a listagem renderiza por baixo com o sheet aberto para o id da URL. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<TransactionsPageFallback />}>
      <TransactionsPage detailId={id} />
    </Suspense>
  );
}
