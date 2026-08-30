'use client';

import { transactionExternalIdSchema } from '@challenge/contracts';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/api-client';
import { formatDateTime, formatValue } from '@/lib/transaction-labels';

import { useTransaction } from './hooks';

const backLink = (
  <Link
    href="/transactions"
    className="inline-block rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
  >
    Voltar para a listagem
  </Link>
);

function NotFound() {
  return (
    <EmptyState
      title="Transação não encontrada"
      description="Confira o identificador ou volte para a listagem."
      action={backLink}
    />
  );
}

export function TransactionDetail({ transactionExternalId }: { transactionExternalId: string }) {
  const validId = transactionExternalIdSchema.safeParse(transactionExternalId).success;
  const transaction = useTransaction(transactionExternalId, undefined, validId);

  if (!validId) return <NotFound />;
  if (transaction.isPending) return <LoadingState label="Carregando transação" rows={6} />;
  if (transaction.isError) {
    if (transaction.error instanceof ApiError && transaction.error.status === 404)
      return <NotFound />;
    return (
      <ErrorState
        message={transaction.error.message}
        onRetry={() => {
          void transaction.refetch();
        }}
      />
    );
  }

  const t = transaction.data;
  const pending = t.transactionStatus.name === 'PENDING';

  return (
    <article className="space-y-6" aria-busy={transaction.isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Transação</h1>
        {backLink}
      </div>

      {pending && (
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Aguardando a avaliação antifraude. Esta página atualiza sozinha.
        </p>
      )}

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <Field label="Identificador">
          <Code>{t.transactionExternalId}</Code>
        </Field>
        <Field label="Status">
          <StatusBadge status={t.transactionStatus.name} />
        </Field>
        <Field label="Valor">{formatValue(t.value)}</Field>
        <Field label="Tipo">{t.transactionType.name}</Field>
        <Field label="Conta de débito">
          <Code>{t.accountExternalIdDebit}</Code>
        </Field>
        <Field label="Conta de crédito">
          <Code>{t.accountExternalIdCredit}</Code>
        </Field>
        <Field label="Criada em">{formatDateTime(t.createdAt)}</Field>
        <Field label="Atualizada em">{formatDateTime(t.updatedAt)}</Field>
      </dl>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-xs">{children}</code>;
}
