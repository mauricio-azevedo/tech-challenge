import type { TransactionResponse } from '@challenge/contracts';
import Link from 'next/link';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, formatValue } from '@/lib/transaction-labels';

export function TransactionsTable({ transactions }: { transactions: TransactionResponse[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Transações</caption>
        <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-600 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              Identificador
            </th>
            <th scope="col" className="px-4 py-3">
              Tipo
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Valor
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3">
              Criada em
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((transaction) => (
            <tr key={transaction.transactionExternalId} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs">
                <Link
                  href={`/transactions/${transaction.transactionExternalId}`}
                  className="text-slate-900 underline-offset-2 hover:underline"
                >
                  {transaction.transactionExternalId}
                </Link>
              </td>
              <td className="px-4 py-3">{transaction.transactionType.name}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatValue(transaction.value)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={transaction.transactionStatus.name} />
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(transaction.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
