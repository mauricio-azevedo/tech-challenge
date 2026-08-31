import { serializeListState, type ListState } from './filters';

/** Os deep links carregam o estado da listagem, para voltar exatamente para onde se estava. */
function withQuery(path: string, state: ListState): string {
  const query = serializeListState(state).toString();
  return query === '' ? path : `${path}?${query}`;
}

export function listHref(state: ListState): string {
  return withQuery('/transactions', state);
}

/** Detalhe sem estado de listagem: para quem chega de fora da lista, como a acao de um toast. */
export function transactionHref(transactionExternalId: string): string {
  return `/transactions/${encodeURIComponent(transactionExternalId)}`;
}

export function detailHref(transactionExternalId: string, state: ListState): string {
  return withQuery(transactionHref(transactionExternalId), state);
}

export function newTransactionHref(state: ListState): string {
  return withQuery('/transactions/new', state);
}
