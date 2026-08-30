import { serializeListState, type ListState } from './filters';

/** Os deep links carregam o estado da listagem, para voltar exatamente para onde se estava. */
function withQuery(path: string, state: ListState): string {
  const query = serializeListState(state).toString();
  return query === '' ? path : `${path}?${query}`;
}

export function listHref(state: ListState): string {
  return withQuery('/transactions', state);
}

export function detailHref(transactionExternalId: string, state: ListState): string {
  return withQuery(`/transactions/${transactionExternalId}`, state);
}

export function newTransactionHref(state: ListState): string {
  return withQuery('/transactions/new', state);
}
