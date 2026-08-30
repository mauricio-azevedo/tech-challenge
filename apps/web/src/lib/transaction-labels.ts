import type { TransactionStatus } from '@challenge/contracts';

/** A API fala em enum; a tela fala portugues. */
export const statusLabels: Record<TransactionStatus, string> = {
  PENDING: 'pendente',
  APPROVED: 'aprovada',
  REJECTED: 'rejeitada',
};

export const statusTone: Record<TransactionStatus, 'neutral' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'UTC',
});

export function formatValue(value: number): string {
  return currency.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
