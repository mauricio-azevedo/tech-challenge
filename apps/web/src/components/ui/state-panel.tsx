import { CircleAlert, CreditCard } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Painel de estado do mockup (erro e vazio): tile de icone, titulo, descricao e acoes.
 * O tom `danger` vira `role="alert"`, que e como os testes e os leitores de tela o encontram.
 */
export function StatePanel({
  tone = 'neutral',
  title,
  description,
  actions,
}: {
  tone?: 'neutral' | 'danger';
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className="flex flex-col items-center gap-3 px-6 py-14 text-center"
    >
      <div
        aria-hidden="true"
        className={cn(
          'grid size-10 place-items-center rounded-[9px] border',
          tone === 'danger'
            ? 'border-status-rejected-border bg-status-rejected-bg text-status-rejected-fg'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {tone === 'danger' ? <CircleAlert className="size-5" /> : <CreditCard className="size-5" />}
      </div>
      <div className="flex max-w-[44ch] flex-col gap-1.5">
        <span className="text-[15px] font-semibold">{title}</span>
        {description !== undefined && (
          <span className="text-[13px] text-pretty text-muted-foreground">{description}</span>
        )}
      </div>
      {actions !== undefined && <div className="mt-1 flex gap-2">{actions}</div>}
    </div>
  );
}
