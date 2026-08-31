import { formatShortDateTime } from '@/lib/transaction-labels';

import type { RecentAccount } from './recent-accounts';

/**
 * Sugestoes do campo de conta como `datalist`: o proprio navegador filtra enquanto se digita e o
 * campo continua aceitando qualquer UUID. Sem dependencia nova e sem tirar a digitacao livre, que e
 * o que um combobox custom faria por mais codigo.
 */
export function AccountSuggestions({ id, accounts }: { id: string; accounts: RecentAccount[] }) {
  return (
    <datalist id={id}>
      {accounts.map((account) => (
        <option
          key={account.id}
          value={account.id}
          label={`usada em ${formatShortDateTime(account.lastUsedAt)}`}
        />
      ))}
    </datalist>
  );
}
