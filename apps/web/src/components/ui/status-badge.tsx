import type { TransactionStatus } from '@challenge/contracts';

import { statusLabels, statusTone } from '@/lib/transaction-labels';

const toneClasses = {
  neutral: 'bg-amber-50 text-amber-800 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  danger: 'bg-rose-50 text-rose-800 ring-rose-200',
} as const;

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[statusTone[status]]}`}
    >
      {status === 'PENDING' && (
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
      {statusLabels[status]}
    </span>
  );
}
