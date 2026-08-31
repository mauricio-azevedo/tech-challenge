import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import type { ListState } from './filters';
import { TransactionSheet } from './transaction-sheet';
import { TransactionsList, type ListNavigation } from './transactions-list';

const push = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/transactions',
  useSearchParams: () => new URLSearchParams(search),
}));

const id = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';
const state: ListState = { page: 1, pageSize: 20 };

function buildNavigation(): ListNavigation {
  return {
    detailHref: (transactionId) => `/transactions/${transactionId}`,
    newTransactionHref: '/transactions/new',
    openTransaction: vi.fn(),
  };
}

describe('VerdictToasts', () => {
  beforeEach(() => {
    push.mockClear();
    search = '';
    window.history.replaceState(null, '', '/transactions');
  });

  it('toasta uma unica vez quando o veredito chega, mesmo com lista e detalhe abertos', async () => {
    let listCalls = 0;
    let detailCalls = 0;
    server.use(
      api.get('/transaction-types', () => api.json(transactionTypes)),
      api.get('/transactions', () => {
        listCalls += 1;
        return api.json(
          page([
            buildTransaction({
              transactionExternalId: id,
              transactionStatus: { name: listCalls === 1 ? 'PENDING' : 'APPROVED' },
            }),
          ]),
        );
      }),
      api.get(`/transactions/${id}`, () => {
        detailCalls += 1;
        return api.json(
          buildTransaction({
            transactionExternalId: id,
            transactionStatus: { name: detailCalls === 1 ? 'PENDING' : 'APPROVED' },
          }),
        );
      }),
    );

    renderWithQuery(
      <>
        <TransactionsList state={state} onStateChange={vi.fn()} navigation={buildNavigation()} />
        <TransactionSheet transactionExternalId={id} onClose={vi.fn()} />
      </>,
      { toasts: true },
    );

    expect(
      await screen.findByText('Transação aprovada', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    // Duas queries observaram a mesma transicao; o rastreador toasta uma vez so.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.getAllByText('Transação aprovada')).toHaveLength(1);
  });

  it('o toast leva para a transacao, preservando os filtros da tela', async () => {
    window.history.replaceState(null, '', '/transactions?status=PENDING&page=2');
    let calls = 0;
    server.use(
      api.get('/transaction-types', () => api.json(transactionTypes)),
      api.get('/transactions', () => {
        calls += 1;
        return api.json(
          page([
            buildTransaction({
              transactionExternalId: id,
              transactionStatus: { name: calls === 1 ? 'PENDING' : 'REJECTED' },
            }),
          ]),
        );
      }),
    );

    renderWithQuery(
      <TransactionsList state={state} onStateChange={vi.fn()} navigation={buildNavigation()} />,
      { toasts: true },
    );

    await screen.findByText('Transação rejeitada', {}, { timeout: 3000 });
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('button', { name: 'Ver transação' }));

    expect(push).toHaveBeenCalledWith(`/transactions/${id}?status=PENDING&page=2`, {
      scroll: false,
    });
  });

  it('transacao que ja chega final nunca toasta', async () => {
    server.use(
      api.get('/transaction-types', () => api.json(transactionTypes)),
      api.get('/transactions', () =>
        api.json(page([buildTransaction({ transactionStatus: { name: 'APPROVED' } })])),
      ),
    );

    renderWithQuery(
      <TransactionsList state={state} onStateChange={vi.fn()} navigation={buildNavigation()} />,
      { toasts: true },
    );

    await screen.findByRole('table', { name: 'Transações' });
    expect(screen.queryByText('Transação aprovada')).not.toBeInTheDocument();
  });
});
