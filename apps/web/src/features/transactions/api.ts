import type {
  CreateTransactionInput,
  PaginatedTransactionsResponse,
  TransactionResponse,
  TransactionStatus,
  TransactionTypeResponse,
} from '@challenge/contracts';

import { apiRequest } from '@/lib/api-client';

/** Parametros de `GET /transactions` ja tipados (a API faz a coercao de string no lado dela). */
export interface ListTransactionsParams {
  status?: TransactionStatus;
  transferTypeId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function listTransactions(
  params: ListTransactionsParams,
): Promise<PaginatedTransactionsResponse> {
  return apiRequest('/transactions', { query: { ...params } });
}

export function getTransaction(transactionExternalId: string): Promise<TransactionResponse> {
  return apiRequest(`/transactions/${encodeURIComponent(transactionExternalId)}`);
}

export function listTransactionTypes(): Promise<TransactionTypeResponse[]> {
  return apiRequest('/transaction-types');
}

export function createTransaction(input: CreateTransactionInput): Promise<TransactionResponse> {
  return apiRequest('/transactions', { method: 'POST', body: input });
}

/** Chaves de cache do TanStack Query, centralizadas para invalidacao consistente. */
export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: ListTransactionsParams) => ['transactions', 'list', params] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
  types: ['transaction-types'] as const,
};
