'use client';

import type { TransactionTypeResponse } from '@challenge/contracts';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

/**
 * Tipo de transferencia como controle segmentado (mockup), com semantica de radio group: grupo
 * nomeado pelo rotulo visivel, setas navegam entre as opcoes, aria-checked no selecionado.
 */
export function TransferTypePicker({
  types,
  value,
  onChange,
  labelId,
  hintId,
  invalid,
}: {
  types: TransactionTypeResponse[];
  value: number | undefined;
  onChange: (value: number) => void;
  labelId: string;
  hintId: string | undefined;
  invalid: boolean;
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value === undefined ? '' : String(value)}
      onValueChange={(next) => {
        onChange(Number(next));
      }}
      aria-labelledby={labelId}
      aria-describedby={hintId}
      aria-invalid={invalid}
      className="flex w-full gap-1.5"
    >
      {types.map((type) => (
        <RadioGroupPrimitive.Item
          key={type.id}
          value={String(type.id)}
          className="h-9 flex-1 rounded-md border bg-card text-[13px] font-medium transition-colors outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        >
          {type.name}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
