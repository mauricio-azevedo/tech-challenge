import type { Metadata } from 'next';

import { NewTransactionForm } from '@/features/transactions/new-transaction-form';

export const metadata: Metadata = { title: 'Nova transação' };

export default function Page() {
  return (
    <main className="w-full max-w-2xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-[23px] font-semibold tracking-tight">Nova transação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A transação é criada como pendente e avaliada pelo antifraude em seguida.
        </p>
      </div>
      <NewTransactionForm />
    </main>
  );
}
