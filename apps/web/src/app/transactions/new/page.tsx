import type { Metadata } from 'next';

import { NewTransactionForm } from '@/features/transactions/new-transaction-form';

export const metadata: Metadata = { title: 'Nova transação' };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova transação</h1>
        <p className="mt-1 text-sm text-slate-600">
          A transação é criada como pendente e avaliada pelo antifraude em seguida.
        </p>
      </div>
      <NewTransactionForm />
    </div>
  );
}
