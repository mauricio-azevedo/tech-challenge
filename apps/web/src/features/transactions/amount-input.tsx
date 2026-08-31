'use client';

import { Input } from '@/components/ui/input';

import { digitsToValue, formatAmount } from './amount-mask';

/**
 * Campo de valor como em app de banco: o "R$" fica fixo na borda, so digitos entram e o numero se
 * forma da direita para a esquerda. O formulario continua guardando um `number` — a mascara e so a
 * vista, e por isso o campo e controlado pelo proprio valor do formulario.
 */
export function AmountInput({
  id,
  value,
  onChange,
  describedBy,
  invalid,
}: {
  id: string;
  value: number | undefined;
  onChange: (value: number) => void;
  describedBy: string | undefined;
  invalid: boolean;
}) {
  const text = value === undefined || Number.isNaN(value) ? '' : formatAmount(value);
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-muted-foreground"
      >
        R$
      </span>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="0,00"
        autoComplete="off"
        className="h-9 pl-9 text-right font-mono text-[13px]"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={text}
        onChange={(event) => {
          onChange(digitsToValue(event.target.value) ?? Number.NaN);
        }}
      />
    </div>
  );
}
