'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { LoadingRegion } from '@/components/ui/loading-region';
import { StatePanel } from '@/components/ui/state-panel';

import {
  hasActiveFilters,
  totalPages,
  type ListState,
  type TransactionFilters as Filters,
} from './filters';
import { useTransactionTypes, useTransactions } from './hooks';
import { TransactionsPagination } from './transactions-pagination';
import { TransactionsTable, type TableNavigation } from './transactions-table';
import { TransactionsTableSkeleton } from './transactions-table-skeleton';
import { TransactionsToolbar } from './transactions-toolbar';

export interface ListNavigation extends TableNavigation {
  newTransactionHref: string;
}

/**
 * O cartao-secao do mockup: toolbar, um dos quatro estados (carregando, erro, vazio, tabela) e o
 * rodape de paginacao. Dirigido por `state` (que vem da URL) e agnostico de roteador — quem sabe
 * navegar e o `navigation` recebido de fora.
 */
export function TransactionsList({
  state,
  onStateChange,
  navigation,
}: {
  state: ListState;
  onStateChange: (state: ListState) => void;
  navigation: ListNavigation;
}) {
  const transactions = useTransactions(state);
  const types = useTransactionTypes();
  const filtersDirty = hasActiveFilters(state);

  const setFilters = (filters: Filters) => {
    // Mudar filtro volta para a primeira pagina: a pagina N do filtro antigo nao significa nada no novo.
    onStateChange({ ...filters, page: 1, pageSize: state.pageSize });
  };

  return (
    <section className="overflow-hidden rounded-[10px] border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <TransactionsToolbar
        filters={state}
        types={types.data ?? []}
        hasFilters={filtersDirty}
        onChange={setFilters}
        onClear={() => {
          setFilters({});
        }}
        onOpenTransaction={navigation.openTransaction}
      />

      {transactions.isPending && (
        <div className="overflow-x-auto">
          <LoadingRegion label="Carregando transações">
            <TransactionsTableSkeleton />
          </LoadingRegion>
        </div>
      )}

      {transactions.isError && (
        <StatePanel
          tone="danger"
          title="Não foi possível carregar as transações"
          description={transactions.error.message}
          actions={
            <Button
              type="button"
              className="h-[34px] px-3 text-[13.5px]"
              onClick={() => {
                void transactions.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      )}

      {transactions.isSuccess && transactions.data.total === 0 && (
        <StatePanel
          title="Nenhuma transação encontrada"
          description={
            filtersDirty
              ? 'Nenhuma transação corresponde aos filtros atuais. Ajuste o período ou o status.'
              : 'Nenhuma transação foi criada até agora.'
          }
          actions={
            <>
              {filtersDirty && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-[34px] px-3 text-[13.5px]"
                  onClick={() => {
                    setFilters({});
                  }}
                >
                  Limpar filtros
                </Button>
              )}
              <Button asChild className="h-[34px] px-3 text-[13.5px]">
                <Link href={navigation.newTransactionHref}>Criar transação</Link>
              </Button>
            </>
          }
        />
      )}

      {transactions.isSuccess && transactions.data.total > 0 && (
        <div aria-busy={transactions.isFetching}>
          <div className="overflow-x-auto">
            <TransactionsTable transactions={transactions.data.data} navigation={navigation} />
          </div>
          <TransactionsPagination
            page={state.page}
            pageSize={state.pageSize}
            totalPages={totalPages(transactions.data.total, state.pageSize)}
            total={transactions.data.total}
            onPageChange={(page) => {
              onStateChange({ ...state, page });
            }}
          />
        </div>
      )}
    </section>
  );
}
