'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/app-shell/page-header';
import { Button } from '@/components/ui/button';

import { parseListState, type ListState } from './filters';
import { detailHref, listHref, newTransactionHref } from './navigation';
import { StatsCards } from './stats-cards';
import { TransactionsList } from './transactions-list';

/** Liga a listagem a URL: le os filtros de `?status=...` e escreve de volta a cada mudanca. */
export function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = parseListState(new URLSearchParams(searchParams.toString()));

  const setState = (next: ListState) => {
    router.replace(listHref(next), { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Transações"
        action={
          <Button
            asChild
            className="h-[34px] gap-1.5 px-3 text-[13.5px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          >
            <Link href={newTransactionHref(state)}>
              <Plus className="size-[15px]" />
              Nova transação
            </Link>
          </Button>
        }
      />
      <main className="flex w-full max-w-[1360px] flex-1 flex-col gap-5 px-6 pt-[26px] pb-10">
        <h1 className="text-[23px] font-semibold tracking-tight">Transações</h1>
        <StatsCards />
        <TransactionsList
          state={state}
          onStateChange={setState}
          navigation={{
            detailHref: (id) => detailHref(id, state),
            newTransactionHref: newTransactionHref(state),
            openTransaction: (id) => {
              router.push(detailHref(id, state), { scroll: false });
            },
          }}
        />
      </main>
    </>
  );
}
