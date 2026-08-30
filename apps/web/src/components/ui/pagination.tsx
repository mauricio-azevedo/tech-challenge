'use client';

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const buttonClass =
    'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between text-sm text-slate-600"
    >
      <p>
        {total === 1 ? '1 transação' : `${total.toLocaleString('pt-BR')} transações`} · página{' '}
        {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          Anterior
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
