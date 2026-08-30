import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import type { ListState } from './filters';
import { TransactionSheet } from './transaction-sheet';
import { TransactionsList, type ListNavigation } from './transactions-list';

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
