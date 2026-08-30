'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Select de filtro do mockup: rotulo apagado + valor em negrito no proprio gatilho. O nome
 * acessivel vem do aria-label, porque o texto visivel muda com a selecao. "Todos" usa a
 * sentinela 'ALL' — o Radix nao aceita item com value vazio.
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="h-[34px] min-w-[158px] gap-2 rounded-md bg-card text-[13px]"
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="flex-1 text-left font-medium">{current?.label}</span>
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[13px]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
