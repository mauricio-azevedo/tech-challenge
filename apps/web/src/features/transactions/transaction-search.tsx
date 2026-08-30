'use client';

import { transactionExternalIdSchema } from '@challenge/contracts';
import { Search } from 'lucide-react';
import { useId, useState } from 'react';

import { Input } from '@/components/ui/input';

/**
 * Busca do mockup, sem filtro correspondente na API: um UUID completo abre o detalhe direto
 * (GET /transactions/:id); qualquer outro texto ganha uma dica de como usar. Um id inexistente
 * cai no "nao encontrada" do detalhe.
 */
export function TransactionSearch({
  onOpenTransaction,
}: {
  onOpenTransaction: (transactionExternalId: string) => void;
}) {
  const [value, setValue] = useState('');
  const hintId = useId();
  const showHint = value !== '' && !transactionExternalIdSchema.safeParse(value.trim()).success;

  const submit = (raw: string) => {
    const candidate = raw.trim();
    if (transactionExternalIdSchema.safeParse(candidate).success) {
      setValue('');
      onOpenTransaction(candidate);
    }
  };

  return (
    <div className="relative w-72 max-w-full">
      <Search
        aria-hidden="true"
        className="absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2 text-zinc-400"
      />
      <Input
        aria-label="Buscar por ID da transação"
        aria-describedby={showHint ? hintId : undefined}
        placeholder="Buscar por ID da transação"
        autoComplete="off"
        className="h-[34px] bg-card pl-[31px] font-mono text-[13px]"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          submit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit(value);
        }}
      />
      {showHint && (
        <p
          id={hintId}
          className="absolute top-full left-0 z-10 mt-1 rounded-sm border bg-popover px-2 py-1 text-[11.5px] whitespace-nowrap text-muted-foreground shadow-sm"
        >
          Cole o ID completo (UUID) para abrir a transação
        </p>
      )}
    </div>
  );
}
