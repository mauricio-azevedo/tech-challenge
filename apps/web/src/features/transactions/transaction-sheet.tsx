'use client';

import { transactionExternalIdSchema } from '@challenge/contracts';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoadingRegion } from '@/components/ui/loading-region';
import { Skeleton } from '@/components/ui/skeleton';
import { StatePanel } from '@/components/ui/state-panel';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ApiError } from '@/lib/api-client';
import { formatDateTime, formatValue } from '@/lib/transaction-labels';
import { cn } from '@/lib/utils';

import { verdictReason } from './anti-fraud';
import { useTransaction } from './hooks';
import { TransactionTimeline } from './transaction-timeline';

/**
 * Detalhe em sheet lateral (mockup), aberto por cima da listagem. A URL continua a fonte de
 * verdade: quem monta/desmonta e a pagina, a partir de /transactions/:id; fechar navega de volta.
 */
export function TransactionSheet({
  transactionExternalId,
  onClose,
}: {
  transactionExternalId: string;
  onClose: () => void;
}) {
  const validId = transactionExternalIdSchema.safeParse(transactionExternalId).success;
  const transaction = useTransaction(transactionExternalId, undefined, validId);
  const notFound =
    !validId ||
    (transaction.isError &&
      transaction.error instanceof ApiError &&
      transaction.error.status === 404);

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0">
        {notFound && (
          <>
            <SheetTitle className="sr-only">Transação</SheetTitle>
            <SheetDescription className="sr-only">
              O identificador não corresponde a uma transação
            </SheetDescription>
            <StatePanel
              title="Transação não encontrada"
              description="Confira o identificador ou volte para a listagem."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  className="h-[34px] px-3 text-[13.5px]"
                  onClick={onClose}
                >
                  Fechar
                </Button>
              }
            />
          </>
        )}

        {!notFound && transaction.isPending && (
          <>
            <SheetTitle className="sr-only">Transação</SheetTitle>
            <SheetDescription className="sr-only">Carregando transação</SheetDescription>
            <LoadingRegion label="Carregando transação">
              <div className="grid grid-cols-2 gap-3.5 p-[22px]">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Skeleton key={index} className="h-16 rounded-lg" />
                ))}
              </div>
            </LoadingRegion>
          </>
        )}

        {!notFound && transaction.isError && (
          <>
            <SheetTitle className="sr-only">Transação</SheetTitle>
            <SheetDescription className="sr-only">Erro ao carregar a transação</SheetDescription>
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
          </>
        )}

        {!notFound && transaction.isSuccess && (
          <SheetBody
            transaction={transaction.data}
            fetching={transaction.isFetching}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  transaction,
  fetching,
  onClose,
}: {
  transaction: NonNullable<ReturnType<typeof useTransaction>['data']>;
  fetching: boolean;
  onClose: () => void;
}) {
  const status = transaction.transactionStatus.name;
  const pending = status === 'PENDING';

  const fields = [
    { label: 'Tipo', value: transaction.transactionType.name, mono: false },
    { label: 'Valor', value: formatValue(transaction.value), mono: false },
    { label: 'Conta de origem', value: transaction.accountExternalIdDebit, mono: true },
    { label: 'Conta de destino', value: transaction.accountExternalIdCredit, mono: true },
    { label: 'Criada em', value: formatDateTime(transaction.createdAt), mono: true },
    {
      label: 'Atualizada em',
      value: pending ? '—' : formatDateTime(transaction.updatedAt),
      mono: true,
    },
  ];

  return (
    <article aria-busy={fetching} className="flex h-full min-h-0 flex-col">
      <SheetHeader className="gap-2.5 border-b p-[22px] pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-col gap-1 text-left">
            <SheetTitle className="sr-only">Transação</SheetTitle>
            <span className="text-[11.5px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
              ID da transação
            </span>
            <SheetDescription className="font-mono text-[13.5px] font-medium break-all text-foreground">
              {transaction.transactionExternalId}
            </SheetDescription>
          </div>
          <div className="flex-1" />
          <SheetClose asChild>
            <Button type="button" variant="outline" size="icon-sm" aria-label="Fechar detalhe">
              <X aria-hidden="true" className="size-[15px]" />
            </Button>
          </SheetClose>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusBadge status={status} />
          <span className="text-[13px] text-muted-foreground">{verdictReason(status)}</span>
        </div>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto p-[22px] pb-7">
        <dl className="grid grid-cols-2 gap-3.5">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex flex-col gap-1 rounded-lg border bg-surface px-3 py-2.5"
            >
              <dt className="text-[11.5px] font-medium text-muted-foreground">{field.label}</dt>
              <dd className={cn('text-[13px] font-medium break-all', field.mono && 'font-mono')}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
        <TransactionTimeline transaction={transaction} />
      </div>

      <SheetFooter className="flex-row items-center gap-2 border-t px-[22px] py-3.5">
        {pending && (
          <p role="status" className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-[13px] animate-spin text-status-pending" />
            Análise em andamento · o status atualiza sozinho
          </p>
        )}
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          className="h-[34px] px-3 text-[13.5px]"
          onClick={onClose}
        >
          Fechar
        </Button>
      </SheetFooter>
    </article>
  );
}
