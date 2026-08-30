import type { TransactionStatus } from '@challenge/contracts';

import { statusLabels } from '@/lib/transaction-labels';
import { cn } from '@/lib/utils';

const tones: Record<TransactionStatus, { pill: string; dot: string }> = {
  PENDING: {
    pill: 'border-status-pending-border bg-status-pending-bg text-status-pending-fg',
    dot: 'bg-status-pending',
  },
  APPROVED: {
    pill: 'border-status-approved-border bg-status-approved-bg text-status-approved-fg',
    dot: 'bg-status-approved',
  },
  REJECTED: {
    pill: 'border-status-rejected-border bg-status-rejected-bg text-status-rejected-fg',
    dot: 'bg-status-rejected',
  },
};

/** Pill de status do mockup; o ponto pulsa enquanto a analise nao termina. */
export function StatusBadge({ status }: { status: TransactionStatus }) {
  const tone = tones[status];
  return (
    <span
      className={cn(
        'inline-flex h-[22px] w-fit items-center gap-1.5 rounded-full border px-2 text-xs font-medium',
        tone.pill,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', tone.dot, status === 'PENDING' && 'animate-pulse')}
      />
      {statusLabels[status]}
    </span>
  );
}
