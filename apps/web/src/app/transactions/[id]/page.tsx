import type { Metadata } from 'next';

import { TransactionDetail } from '@/features/transactions/transaction-detail';

export const metadata: Metadata = { title: 'Detalhe da transação' };

/** No Next 16 `params` e uma Promise: a casca de servidor resolve o id e entrega ao componente cliente. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransactionDetail transactionExternalId={id} />;
}
