import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildTransaction } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { TransactionSheet } from './transaction-sheet';

const id = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';
const user = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('TransactionSheet', () => {
  it('mostra o carregamento e depois os dados, o motivo e o historico', async () => {
    server.use(
      api.get(`/transactions/${id}`, () =>
        api.json(
          buildTransaction({
            transactionExternalId: id,
            transactionStatus: { name: 'REJECTED' },
            value: 1500,
            transactionType: { id: 1, name: 'TED' },
          }),
        ),
      ),
    );
    const onClose = vi.fn();

    renderWithQuery(<TransactionSheet transactionExternalId={id} onClose={onClose} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando transação');
    expect(await screen.findByRole('dialog', { name: 'Transação' })).toBeInTheDocument();
    expect(await screen.findByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Rejeitada')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    expect(screen.getByText('TED')).toBeInTheDocument();
    expect(screen.getByText('Valor acima do limite de R$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByText('Transação recusada')).toBeInTheDocument();

    await user().click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('avisa que a analise esta em andamento e atualiza sozinho quando o veredito chega', async () => {
    let calls = 0;
    server.use(
      api.get(`/transactions/${id}`, () => {
        calls += 1;
        return api.json(
          buildTransaction({
            transactionExternalId: id,
            transactionStatus: { name: calls === 1 ? 'PENDING' : 'APPROVED' },
          }),
        );
      }),
    );

    renderWithQuery(<TransactionSheet transactionExternalId={id} onClose={vi.fn()} />);

    expect(await screen.findByText(/Análise em andamento/)).toHaveAttribute('role', 'status');
    await waitFor(() => expect(screen.getByText('Aprovada')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.queryByText(/Análise em andamento/)).not.toBeInTheDocument();

    const callsWhenFinal = calls;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(calls).toBe(callsWhenFinal);
  });

  it('mostra "nao encontrada" para 404 e para identificador que nem e UUID', async () => {
    server.use(api.get(`/transactions/${id}`, () => api.error(404, 'nao encontrada')));

    const { unmount } = renderWithQuery(
      <TransactionSheet transactionExternalId={id} onClose={vi.fn()} />,
    );
    expect(await screen.findByText('Transação não encontrada')).toBeInTheDocument();
    unmount();

    renderWithQuery(<TransactionSheet transactionExternalId="abc" onClose={vi.fn()} />);
    expect(screen.getByText('Transação não encontrada')).toBeInTheDocument();
  });

  it('mostra o erro com "tentar novamente" quando a API falha', async () => {
    let calls = 0;
    server.use(
      api.get(`/transactions/${id}`, () => {
        calls += 1;
        return calls === 1
          ? api.error(503, 'indisponivel')
          : api.json(buildTransaction({ transactionExternalId: id }));
      }),
    );

    renderWithQuery(<TransactionSheet transactionExternalId={id} onClose={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    await user().click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Histórico')).toBeInTheDocument();
  });
});
