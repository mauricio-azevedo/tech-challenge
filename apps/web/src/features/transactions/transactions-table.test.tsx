import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildTransaction } from '../../../test/fixtures';
import { TransactionsTable, type TableNavigation } from './transactions-table';

function buildNavigation(): TableNavigation {
  return { detailHref: (id) => `/transactions/${id}`, openTransaction: vi.fn() };
}

describe('TransactionsTable', () => {
  it('destaca em vermelho apenas o valor acima do limite antifraude', () => {
    render(
      <TransactionsTable
        transactions={[buildTransaction({ value: 1000 }), buildTransaction({ value: 1000.01 })]}
        navigation={buildNavigation()}
      />,
    );

    expect(screen.getByText('R$ 1.000,01')).toHaveClass('text-status-rejected-fg');
    expect(screen.getByText('R$ 1.000,00')).not.toHaveClass('text-status-rejected-fg');
  });

  it('pisca a linha quando o status muda entre respostas do polling', async () => {
    const transaction = buildTransaction({ transactionStatus: { name: 'PENDING' } });
    const navigation = buildNavigation();
    const { rerender } = render(
      <TransactionsTable transactions={[transaction]} navigation={navigation} />,
    );

    const rowOf = () => {
      const [, row] = within(screen.getByRole('table')).getAllByRole('row');
      if (row === undefined) throw new Error('esperava uma linha');
      return row;
    };
    expect(rowOf()).not.toHaveClass('animate-row-flash');

    rerender(
      <TransactionsTable
        transactions={[{ ...transaction, transactionStatus: { name: 'APPROVED' } }]}
        navigation={navigation}
      />,
    );
    expect(rowOf()).toHaveClass('animate-row-flash');
    await waitFor(() => expect(rowOf()).not.toHaveClass('animate-row-flash'), { timeout: 3000 });
  });

  it('o link do id navega sem disparar o clique da linha duas vezes', async () => {
    const transaction = buildTransaction();
    const navigation = buildNavigation();
    render(<TransactionsTable transactions={[transaction]} navigation={navigation} />);

    await userEvent.click(screen.getByRole('link', { name: transaction.transactionExternalId }));
    expect(navigation.openTransaction).toHaveBeenCalledTimes(1);
  });
});
