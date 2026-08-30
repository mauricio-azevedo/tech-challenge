/** "1–20 de 45 transações" (traco medio, como no mockup); zero e singular tem forma propria. */
export function formatRange(page: number, pageSize: number, total: number): string {
  if (total === 0) return '0 transações';
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const noun = total === 1 ? 'transação' : 'transações';
  const range = first === last ? String(first) : `${String(first)}–${String(last)}`;
  return `${range} de ${total.toLocaleString('pt-BR')} ${noun}`;
}

/** Janela de ate `size` paginas centrada na atual e presa as bordas (1 e totalPages). */
export function pageWindow(page: number, totalPages: number, size = 5): number[] {
  const count = Math.min(totalPages, size);
  const start = Math.min(Math.max(1, page - Math.floor(size / 2)), totalPages - count + 1);
  return Array.from({ length: count }, (_, index) => start + index);
}
