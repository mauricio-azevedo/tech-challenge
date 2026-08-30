'use client';

import type { TransactionResponse } from '@challenge/contracts';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatShortDateTime, formatValue } from '@/lib/transaction-labels';
import { cn } from '@/lib/utils';

import { isAboveLimit } from './anti-fraud';
import { useStatusFlash } from './use-status-flash';

/** Colunas do mockup; compartilhado com o skeleton para as linhas-fantasma alinharem. */
export const TABLE_GRID =
  'grid grid-cols-[minmax(180px,1.5fr)_88px_128px_112px_132px_36px] items-center gap-3 px-4';

export interface TableNavigation {
  detailHref: (transactionExternalId: string) => string;
  openTransaction: (transactionExternalId: string) => void;
}

/**
 * Tabela em grade de divs com papeis ARIA explicitos: o mockup e um CSS grid, e um <table>
 * re-estilizado com display:grid perde os papeis implicitos nos navegadores — os papeis teriam
 * de ser declarados de qualquer jeito. A linha inteira abre o detalhe; o link no id e o caminho
 * de teclado.
 */
export function TransactionsTable({
  transactions,
  navigation,
}: {
  transactions: TransactionResponse[];
  navigation: TableNavigation;
}) {
  const flashing = useStatusFlash(transactions);

  return (
    <div role="table" aria-label="Transações" className="min-w-[820px] text-sm">
      <div role="rowgroup">
        <div
          role="row"
          className={cn(
            TABLE_GRID,
            'h-10 border-b bg-surface text-xs font-medium text-muted-foreground',
          )}
        >
          <span role="columnheader">ID da transação</span>
          <span role="columnheader">Tipo</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className="text-right">
            Valor
          </span>
          <span role="columnheader">Criada em</span>
          <span role="columnheader" className="sr-only">
            Abrir
          </span>
        </div>
      </div>
      <div role="rowgroup">
        {transactions.map((transaction) => {
          const id = transaction.transactionExternalId;
          return (
            <div
              key={id}
              role="row"
              onClick={() => {
                navigation.openTransaction(id);
              }}
              className={cn(
                TABLE_GRID,
                'h-[52px] cursor-pointer border-b border-muted transition-colors hover:bg-surface',
                flashing.has(id) && 'animate-row-flash',
              )}
            >
              <span role="cell" className="truncate font-mono text-[12.5px]">
                <Link
                  href={navigation.detailHref(id)}
                  className="hover:underline"
                  onClick={(event) => {
                    // O clique da linha ja navega; sem isso o push aconteceria duas vezes.
                    event.stopPropagation();
                    navigation.openTransaction(id);
                    event.preventDefault();
                  }}
                >
                  {id}
                </Link>
              </span>
              <span role="cell" className="text-[13px] text-zinc-600">
                {transaction.transactionType.name}
              </span>
              <span role="cell">
                <StatusBadge status={transaction.transactionStatus.name} />
              </span>
              <span
                role="cell"
                className={cn(
                  'text-right text-[13px] font-medium tabular-nums',
                  isAboveLimit(transaction.value) && 'text-status-rejected-fg',
                )}
              >
                {formatValue(transaction.value)}
              </span>
              <span role="cell" className="text-[12.5px] text-muted-foreground tabular-nums">
                {formatShortDateTime(transaction.createdAt)}
              </span>
              <span role="cell" className="grid place-items-center text-zinc-400">
                <ChevronRight aria-hidden="true" className="size-[15px]" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
