'use client';

import { TRANSACTION_STATUSES, type TransactionTypeResponse } from '@challenge/contracts';

import { statusLabels } from '@/lib/transaction-labels';

import type { TransactionFilters as Filters } from './filters';

const fieldClass =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export function TransactionFilters({
  filters,
  types,
  onChange,
  onClear,
}: {
  filters: Filters;
  types: TransactionTypeResponse[];
  onChange: (filters: Filters) => void;
  onClear: () => void;
}) {
  const update = (patch: Partial<Filters>) => {
    // Campo limpo (undefined no patch) sai do filtro e, portanto, da URL.
    const merged: Record<string, string | number | undefined> = { ...filters, ...patch };
    const next = Object.fromEntries(
      Object.entries(merged).filter(([, value]) => value !== undefined),
    ) as Filters;
    onChange(next);
  };

  return (
    <form
      aria-label="Filtros"
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Status</span>
        <select
          className={fieldClass}
          value={filters.status ?? ''}
          onChange={(event) => {
            update({ status: (event.target.value || undefined) as Filters['status'] });
          }}
        >
          <option value="">Todos</option>
          {TRANSACTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Tipo</span>
        <select
          className={fieldClass}
          value={filters.transferTypeId ?? ''}
          onChange={(event) => {
            update({
              transferTypeId: event.target.value === '' ? undefined : Number(event.target.value),
            });
          }}
        >
          <option value="">Todos</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">De</span>
        <input
          type="date"
          className={fieldClass}
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(event) => {
            update({ from: event.target.value || undefined });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Até</span>
        <input
          type="date"
          className={fieldClass}
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(event) => {
            update({ to: event.target.value || undefined });
          }}
        />
      </label>
      <div className="flex items-end">
        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Limpar filtros
        </button>
      </div>
    </form>
  );
}
