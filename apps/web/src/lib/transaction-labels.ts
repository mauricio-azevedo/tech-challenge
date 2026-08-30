import type { TransactionStatus } from '@challenge/contracts';

/** A API fala em enum; a tela fala portugues, com os rotulos capitalizados do design. */
export const statusLabels: Record<TransactionStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'UTC',
});

// dd/MM e HH:mm separados: o pt-BR poe virgula entre data e hora, e o mockup nao ("30/08 12:00").
const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});
const shortTime = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function formatValue(value: number): string {
  return currency.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** Data curta das linhas da tabela, como no mockup. */
export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  return `${shortDate.format(date)} ${shortTime.format(date)}`;
}

/** Prefixo do UUID para toasts e resumos ("ID 0191c2f0"). */
export function shortId(transactionExternalId: string): string {
  return transactionExternalId.slice(0, 8);
}
