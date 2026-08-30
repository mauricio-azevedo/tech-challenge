'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { parseListState, serializeListState, type ListState } from './filters';
import { TransactionsList } from './transactions-list';

/** Liga a listagem a URL: le os filtros de `?status=...` e escreve de volta a cada mudanca. */
export function TransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = parseListState(new URLSearchParams(searchParams.toString()));

  const setState = (next: ListState) => {
    const query = serializeListState(next).toString();
    router.replace(query === '' ? pathname : `${pathname}?${query}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nova transação
        </Link>
      </div>
      <TransactionsList state={state} onStateChange={setState} />
    </div>
  );
}
