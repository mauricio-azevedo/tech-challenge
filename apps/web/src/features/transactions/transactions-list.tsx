'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Pagination } from '@/components/ui/pagination';

import {
  hasActiveFilters,
  totalPages,
  type ListState,
  type TransactionFilters as Filters,
} from './filters';
import { useTransactionTypes, useTransactions } from './hooks';
import { TransactionFilters } from './transaction-filters';
import { TransactionsTable } from './transactions-table';

/**
 * A listagem em si, dirigida por `state` (que vem da URL) e avisando mudancas via callbacks —
 * sem conhecer o roteador. Estados de carregamento, erro e vazio sao explicitos.
 */
export function TransactionsList({
  state,
  onStateChange,
}: {
  state: ListState;
  onStateChange: (state: ListState) => void;
}) {
  const transactions = useTransactions(state);
  const types = useTransactionTypes();

  const setFilters = (filters: Filters) => {
    // Mudar filtro volta para a primeira pagina: a pagina N do filtro antigo nao significa nada no novo.
    onStateChange({ ...filters, page: 1, pageSize: state.pageSize });
  };

  return (
    <div className="space-y-4">
      <TransactionFilters
        filters={state}
        types={types.data ?? []}
        onChange={setFilters}
        onClear={() => {
          setFilters({});
        }}
      />

      {transactions.isPending && <LoadingState label="Carregando transações" />}

      {transactions.isError && (
        <ErrorState
          message={transactions.error.message}
          onRetry={() => {
            void transactions.refetch();
          }}
        />
      )}

      {transactions.isSuccess && transactions.data.total === 0 && (
        <EmptyState
          title={
            hasActiveFilters(state)
              ? 'Nenhuma transação com esses filtros'
              : 'Nenhuma transação ainda'
          }
          description={
            hasActiveFilters(state)
              ? 'Ajuste os filtros ou limpe-os para ver tudo.'
              : 'Crie a primeira transação para acompanhar a avaliação antifraude.'
          }
          action={
            <Link
              href="/transactions/new"
              className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Nova transação
            </Link>
          }
        />
      )}

      {transactions.isSuccess && transactions.data.total > 0 && (
        <div aria-busy={transactions.isFetching} className="space-y-3">
          <TransactionsTable transactions={transactions.data.data} />
          <Pagination
            page={state.page}
            totalPages={totalPages(transactions.data.total, state.pageSize)}
            total={transactions.data.total}
            onPageChange={(page) => {
              onStateChange({ ...state, page });
            }}
          />
        </div>
      )}
    </div>
  );
}
