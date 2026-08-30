'use client';

import type { PaginatedTransactionsResponse, TransactionResponse } from '@challenge/contracts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { env } from '@/lib/env';

import {
  getTransaction,
  getTransactionStats,
  listTransactionTypes,
  listTransactions,
  transactionKeys,
} from './api';
import { toQueryInput, type ListState } from './filters';

export function hasPendingTransaction(
  data: PaginatedTransactionsResponse | TransactionResponse | undefined,
): boolean {
  if (data === undefined) return false;
  if ('data' in data) return data.data.some((t) => t.transactionStatus.name === 'PENDING');
  return data.transactionStatus.name === 'PENDING';
}

/**
 * Lista com polling condicional: enquanto houver transacao pendente na pagina, refaz a busca a
 * cada `pollIntervalMs`; quando tudo e final, para. E assim que o dashboard reflete o veredito do
 * antifraude sem recarregar a pagina.
 */
export function useTransactions(state: ListState, pollIntervalMs: number = env.pollIntervalMs) {
  const query = toQueryInput(state);
  return useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => listTransactions(query),
    // Mantem a pagina anterior na tela enquanto a proxima carrega: sem "piscar" ao paginar.
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (hasPendingTransaction(q.state.data) ? pollIntervalMs : false),
  });
}

export function useTransaction(
  id: string,
  pollIntervalMs: number = env.pollIntervalMs,
  enabled = true,
) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => getTransaction(id),
    enabled,
    refetchInterval: (q) => (hasPendingTransaction(q.state.data) ? pollIntervalMs : false),
  });
}

/**
 * Totais para os cards e o contador da sidebar. Mesmo polling condicional da listagem, com um
 * criterio proprio: enquanto o proprio resumo acusa pendencia (em qualquer pagina, nao so na
 * visivel), refaz a busca; zero pendente, para.
 */
export function useTransactionStats(pollIntervalMs: number = env.pollIntervalMs) {
  return useQuery({
    queryKey: transactionKeys.stats,
    queryFn: getTransactionStats,
    refetchInterval: (q) => ((q.state.data?.byStatus.PENDING ?? 0) > 0 ? pollIntervalMs : false),
  });
}

export function useTransactionTypes() {
  return useQuery({
    queryKey: transactionKeys.types,
    queryFn: listTransactionTypes,
    // Catalogo estavel: nao precisa ser rebuscado a cada montagem.
    staleTime: 5 * 60 * 1000,
  });
}
