'use client';

import { Dices } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Sufixo discreto dos campos de conta: preenche o campo com um UUID valido, para quem esta
 * experimentando o dashboard nao precisar inventar um identificador a mao.
 */
export function GenerateUuidButton({
  label,
  onGenerate,
}: {
  label: string;
  onGenerate: (uuid: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      onClick={() => {
        onGenerate(crypto.randomUUID());
      }}
    >
      <Dices aria-hidden="true" className="size-[15px]" />
    </Button>
  );
}
