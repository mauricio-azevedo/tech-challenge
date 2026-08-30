import type { ReactNode } from 'react';

/** Header fixo da coluna de conteudo (mockup): trilha a esquerda, acao a direita. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/85 px-6 backdrop-blur-[6px]">
      <span className="min-w-0 truncate text-[13.5px] font-medium">{title}</span>
      <div className="flex-1" />
      {action}
    </header>
  );
}
