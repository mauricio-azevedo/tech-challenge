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
      // Centrado por `top-1` (campo h-9, botao size-7) e nao por -translate-y-1/2: o `translate-y-px`
      // do estado :active do Button sobrescreveria a translacao e o botao pularia meia altura para
      // baixo no clique — bizarro de ver e, pior, o ponteiro saia de cima dele e o clique nem contava.
      className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
      onClick={() => {
        onGenerate(crypto.randomUUID());
      }}
    >
      <Dices aria-hidden="true" className="size-[15px]" />
    </Button>
  );
}
