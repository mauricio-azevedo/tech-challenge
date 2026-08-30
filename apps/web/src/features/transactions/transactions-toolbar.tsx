'use client';

import { TRANSACTION_STATUSES, type TransactionTypeResponse } from '@challenge/contracts';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { statusLabels } from '@/lib/transaction-labels';

import { DateField } from './date-field';
import { FilterSelect } from './filter-select';
import type { TransactionFilters as Filters } from './filters';
import { TransactionSearch } from './transaction-search';

export function TransactionsToolbar({
  filters,
  types,
  hasFilters,
  onChange,
  onClear,
  onOpenTransaction,
}: {
  filters: Filters;
  types: TransactionTypeResponse[];
  hasFilters: boolean;
  onChange: (filters: Filters) => void;
  onClear: () => void;
  onOpenTransaction: (transactionExternalId: string) => void;
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
      className="flex flex-wrap items-center gap-2.5 border-b p-3.5"
    >
      <TransactionSearch onOpenTransaction={onOpenTransaction} />
      <FilterSelect
        label="Status"
        value={filters.status ?? 'ALL'}
        options={[
          { value: 'ALL', label: 'Todos' },
          ...TRANSACTION_STATUSES.map((status) => ({ value: status, label: statusLabels[status] })),
        ]}
        onChange={(value) => {
          update({ status: value === 'ALL' ? undefined : (value as Filters['status']) });
        }}
      />
      <FilterSelect
        label="Tipo"
        value={filters.transferTypeId === undefined ? 'ALL' : String(filters.transferTypeId)}
        options={[
          { value: 'ALL', label: 'Todos' },
          ...types.map((type) => ({ value: String(type.id), label: type.name })),
        ]}
        onChange={(value) => {
          update({ transferTypeId: value === 'ALL' ? undefined : Number(value) });
        }}
      />
      <DateField
        label="De"
        value={filters.from ?? ''}
        max={filters.to}
        onChange={(value) => {
          update({ from: value === '' ? undefined : value });
        }}
      />
      <DateField
        label="Até"
        value={filters.to ?? ''}
        min={filters.from}
        onChange={(value) => {
          update({ to: value === '' ? undefined : value });
        }}
      />
      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="h-[34px] gap-1.5 border-dashed px-2.5 text-[13px] font-normal text-muted-foreground hover:text-foreground"
        >
          <X className="size-[13px]" />
          Limpar
        </Button>
      )}
    </form>
  );
}
