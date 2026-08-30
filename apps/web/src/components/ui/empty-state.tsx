import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {description !== undefined && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  );
}
