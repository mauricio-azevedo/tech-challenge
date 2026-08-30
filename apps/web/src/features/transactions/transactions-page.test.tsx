import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildStats, buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { TransactionsPage } from './transactions-page';

const replace = vi.fn();
const push = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  usePathname: () => '/transactions',
  useSearchParams: () => new URLSearchParams(search),
}));

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('TransactionsPage (URL como fonte de verdade)', () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    server.use(
      api.get('/transaction-types', () => api.json(transactionTypes)),
      api.get('/transactions/stats', () => api.json(buildStats({ total: 30 }))),
    );
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
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Rejeitada');
  });

  it('escreve na URL quando um filtro muda, sem o que e padrao', async () => {
    search = '';
    server.use(api.get('/transactions', () => api.json(page([buildTransaction()]))));

    renderWithQuery(<TransactionsPage />);

    await screen.findByRole('table', { name: 'Transações' });
    await user().click(screen.getByRole('combobox', { name: 'Status' }));
    await user().click(await screen.findByRole('option', { name: 'Aprovada' }));

    expect(replace).toHaveBeenCalledWith('/transactions?status=APPROVED', { scroll: false });
  });

  it('clicar numa linha navega para o detalhe carregando o estado da listagem', async () => {
    search = 'status=REJECTED&page=2';
    const transaction = buildTransaction();
    server.use(api.get('/transactions', () => api.json(page([transaction], 30, 2))));

    renderWithQuery(<TransactionsPage />);

    const table = await screen.findByRole('table', { name: 'Transações' });
    const row = screen.getByText(transaction.transactionExternalId).closest('[role="row"]');
    if (!(row instanceof HTMLElement)) throw new Error('esperava a linha da transacao');
    await user().click(row);

    expect(push).toHaveBeenCalledWith(
      `/transactions/${transaction.transactionExternalId}?status=REJECTED&page=2`,
      { scroll: false },
    );
    expect(table).toBeInTheDocument();
  });

  it('mostra os cards de resumo alimentados pelo endpoint de estatisticas', async () => {
    search = '';
    server.use(api.get('/transactions', () => api.json(page([buildTransaction()]))));

    renderWithQuery(<TransactionsPage />);

    expect(await screen.findByText('todo o período')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('abre o sheet de detalhe quando a rota traz um id', async () => {
    search = '';
    const transaction = buildTransaction();
    server.use(
      api.get('/transactions', () => api.json(page([transaction]))),
      api.get(`/transactions/${transaction.transactionExternalId}`, () => api.json(transaction)),
    );

    renderWithQuery(<TransactionsPage detailId={transaction.transactionExternalId} />);

    expect(await screen.findByRole('dialog', { name: 'Transação' })).toBeInTheDocument();
  });

  it('abre o dialog de criacao quando a rota e /transactions/new', async () => {
    search = '';
    server.use(api.get('/transactions', () => api.json(page([]))));

    renderWithQuery(<TransactionsPage createOpen />);

    expect(await screen.findByRole('dialog', { name: 'Nova transação' })).toBeInTheDocument();
  });
});
