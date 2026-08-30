import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { TransactionsPage } from './transactions-page';

const replace = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/transactions',
  useSearchParams: () => new URLSearchParams(search),
}));

describe('TransactionsPage (URL como fonte de verdade)', () => {
  beforeEach(() => {
    replace.mockClear();
    server.use(api.get('/transaction-types', () => api.json(transactionTypes)));
  });

  it('le os filtros da URL e os manda para a API', async () => {
    search = 'status=REJECTED&page=2';
    let seen = '';
    server.use(
      api.get('/transactions', ({ request }) => {
        seen = new URL(request.url).search;
        return api.json(page([buildTransaction()], 30, 2));
      }),
    );

    renderWithQuery(<TransactionsPage />);

    await screen.findByRole('table', { name: 'Transações' });
    expect(seen).toBe('?status=REJECTED&page=2&pageSize=20');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('REJECTED');
  });

  it('escreve na URL quando um filtro muda, sem o que e padrao', async () => {
    search = '';
    server.use(api.get('/transactions', () => api.json(page([buildTransaction()]))));

    renderWithQuery(<TransactionsPage />);

    await screen.findByRole('table', { name: 'Transações' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'aprovada');

    expect(replace).toHaveBeenCalledWith('/transactions?status=APPROVED', { scroll: false });
  });
});
