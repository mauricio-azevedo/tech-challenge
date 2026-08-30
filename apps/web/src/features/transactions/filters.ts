import {
  DEFAULT_PAGE_SIZE,
  listTransactionsQuerySchema,
  type ListTransactionsQuery,
} from '@challenge/contracts';

import type { ListTransactionsParams } from './api';

/** Filtros da listagem como aparecem na URL: a URL e a fonte de verdade (compartilhavel, voltar funciona). */
export type TransactionFilters = Pick<
  ListTransactionsQuery,
  'status' | 'transferTypeId' | 'from' | 'to'
>;

export interface ListState extends TransactionFilters {
  page: number;
  pageSize: number;
}

const FILTER_KEYS = ['status', 'transferTypeId', 'from', 'to'] as const;

/**
 * Le a URL com o mesmo schema que a API usa. Valor invalido na URL (alguem editou a mao) e
 * simplesmente ignorado, em vez de quebrar a tela.
 */
export function parseListState(params: URLSearchParams): ListState {
  const raw = Object.fromEntries(params.entries());
  const parsed = listTransactionsQuerySchema.safeParse(raw);
  if (parsed.success) return toListState(parsed.data);

  // Tenta campo a campo, descartando so o que e invalido.
  const clean: Record<string, string> = {};
  for (const key of [...FILTER_KEYS, 'page', 'pageSize'] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (listTransactionsQuerySchema.safeParse({ ...clean, [key]: value }).success)
      clean[key] = value;
  }
  return toListState(listTransactionsQuerySchema.parse(clean));
}

function toListState(query: ListTransactionsQuery): ListState {
  return {
    ...(query.status === undefined ? {} : { status: query.status }),
    ...(query.transferTypeId === undefined ? {} : { transferTypeId: query.transferTypeId }),
    ...(query.from === undefined ? {} : { from: query.from }),
    ...(query.to === undefined ? {} : { to: query.to }),
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Escreve a URL omitindo o que e padrao, para que `/transactions` limpo continue limpo. */
export function serializeListState(state: ListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status !== undefined) params.set('status', state.status);
  if (state.transferTypeId !== undefined)
    params.set('transferTypeId', String(state.transferTypeId));
  if (state.from !== undefined) params.set('from', state.from);
  if (state.to !== undefined) params.set('to', state.to);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(state.pageSize));
  return params;
}

export function toQueryInput(state: ListState): ListTransactionsParams {
  return {
    ...(state.status === undefined ? {} : { status: state.status }),
    ...(state.transferTypeId === undefined ? {} : { transferTypeId: state.transferTypeId }),
    ...(state.from === undefined ? {} : { from: state.from }),
    ...(state.to === undefined ? {} : { to: state.to }),
    page: state.page,
    pageSize: state.pageSize,
  };
}

export function hasActiveFilters(state: ListState): boolean {
  return FILTER_KEYS.some((key) => state[key] !== undefined);
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
