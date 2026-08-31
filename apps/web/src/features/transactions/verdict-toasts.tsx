'use client';

import type { PaginatedTransactionsResponse, TransactionResponse } from '@challenge/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { formatValue, shortId } from '@/lib/transaction-labels';

import { parseListState } from './filters';
import { detailHref } from './navigation';

function transactionsIn(data: unknown): TransactionResponse[] {
  if (data === null || typeof data !== 'object') return [];
  if ('transactionExternalId' in data && 'transactionStatus' in data)
    return [data as TransactionResponse];
  if ('data' in data && Array.isArray((data as PaginatedTransactionsResponse).data))
    return (data as PaginatedTransactionsResponse).data;
  return [];
}

/**
 * Toast de veredito, montado uma unica vez em Providers (sobrevive a troca de rota): assina o
 * cache do TanStack Query e observa cada transacao que passar por qualquer query 'transactions'.
 * Um id PENDING entra no conjunto; a primeira vez que reaparece final, sai do conjunto e toasta —
 * exatamente uma vez, mesmo com listagem e detalhe abertos ao mesmo tempo. Quem ja chega final
 * nunca toasta.
 */
export function VerdictToasts() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const pendingIds = new Set<string>();
    const consider = (transaction: TransactionResponse) => {
      const status = transaction.transactionStatus.name;
      if (status === 'PENDING') {
        pendingIds.add(transaction.transactionExternalId);
        return;
      }
      if (!pendingIds.delete(transaction.transactionExternalId)) return;
      const approved = status === 'APPROVED';
      toast(approved ? 'Transação aprovada' : 'Transação rejeitada', {
        description: `${formatValue(transaction.value)} · ID ${shortId(transaction.transactionExternalId)}`,
        icon: (
          <span
            aria-hidden="true"
            className={
              approved
                ? 'size-2 rounded-full bg-status-approved'
                : 'size-2 rounded-full bg-status-rejected'
            }
          />
        ),
        action: {
          label: 'Ver transação',
          onClick: () => {
            // Le a URL na hora do clique, e nao no render: o toast e global e sobrevive a troca de
            // rota, entao os filtros que valem sao os que estao na tela agora.
            const state = parseListState(new URLSearchParams(window.location.search));
            router.push(detailHref(transaction.transactionExternalId, state), { scroll: false });
          },
        },
      });
    };

    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated') return;
      if (event.action.type !== 'success') return;
      const [scope] = event.query.queryKey as unknown[];
      if (scope !== 'transactions') return;
      for (const transaction of transactionsIn(event.query.state.data)) consider(transaction);
    });
  }, [queryClient, router]);

  return null;
}
