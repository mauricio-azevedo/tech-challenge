'use client';

/** Campo de data com o rotulo dentro do controle, no mesmo desenho dos selects do mockup. */
export function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string | undefined;
  max?: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-[34px] items-center gap-2 rounded-md border bg-card px-2.5 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="bg-transparent font-medium outline-none"
      />
    </label>
  );
}
