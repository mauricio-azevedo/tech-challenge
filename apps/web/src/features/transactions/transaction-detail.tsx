'use client';

import { transactionExternalIdSchema } from '@challenge/contracts';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { LoadingRegion } from '@/components/ui/loading-region';
import { Skeleton } from '@/components/ui/skeleton';
import { StatePanel } from '@/components/ui/state-panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/api-client';
import { formatDateTime, formatValue } from '@/lib/transaction-labels';

import { useTransaction } from './hooks';

const backLink = (
  <Button asChild variant="outline" className="h-[34px] px-3 text-[13.5px]">
    <Link href="/transactions">Voltar para a listagem</Link>
  </Button>
);

function NotFound() {
  return (
    <StatePanel
      title="Transação não encontrada"
      description="Confira o identificador ou volte para a listagem."
      actions={backLink}
    />
  );
}

export function TransactionDetail({ transactionExternalId }: { transactionExternalId: string }) {
  const validId = transactionExternalIdSchema.safeParse(transactionExternalId).success;
  const transaction = useTransaction(transactionExternalId, undefined, validId);

  if (!validId) return <NotFound />;
  if (transaction.isPending)
    return (
      <LoadingRegion label="Carregando transação">
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      </LoadingRegion>
    );
  if (transaction.isError) {
    if (transaction.error instanceof ApiError && transaction.error.status === 404)
      return <NotFound />;
    return (
      <StatePanel
        tone="danger"
        title="Não foi possível carregar a transação"
        description={transaction.error.message}
        actions={
          <Button
            type="button"
            className="h-[34px] px-3 text-[13.5px]"
            onClick={() => {
              void transaction.refetch();
            }}
          >
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const t = transaction.data;
  const pending = t.transactionStatus.name === 'PENDING';

  return (
    <article className="space-y-6" aria-busy={transaction.isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[23px] font-semibold tracking-tight">Transação</h1>
        {backLink}
      </div>

      {pending && (
        <p
          role="status"
          className="rounded-md border border-status-pending-border bg-status-pending-bg px-4 py-3 text-sm text-status-pending-fg"
        >
          Aguardando a avaliação antifraude. Esta página atualiza sozinha.
        </p>
      )}

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-[10px] border bg-card p-6 sm:grid-cols-2">
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
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-xs">{children}</code>;
}
