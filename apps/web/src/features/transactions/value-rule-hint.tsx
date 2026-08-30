import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';

import { ruleHint } from './anti-fraud';

/** Caixa de regra do mockup: reage ao valor digitado e avisa quando ele passa do limite. */
export function ValueRuleHint({ value }: { value: number | undefined }) {
  const hint = ruleHint(value);
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3.5 py-3',
        hint.aboveLimit
          ? 'border-status-rejected-border bg-status-rejected-bg text-status-rejected-fg'
          : 'bg-surface text-muted-foreground',
      )}
    >
      <Info aria-hidden="true" className="mt-px size-[15px] shrink-0" />
      <span className="text-[12.5px] text-pretty">{hint.text}</span>
    </div>
  );
}
