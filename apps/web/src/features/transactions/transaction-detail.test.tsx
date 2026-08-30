import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildTransaction } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { TransactionDetail } from './transaction-detail';

const id = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';

describe('TransactionDetail', () => {
  it('mostra o carregamento e depois os dados da transacao', async () => {
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

    renderWithQuery(<TransactionDetail transactionExternalId={id} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando transação');
    expect(await screen.findByRole('heading', { name: 'Transação' })).toBeInTheDocument();
    expect(screen.getByText('Rejeitada')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    expect(screen.getByText('TED')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a listagem' })).toHaveAttribute(
      'href',
      '/transactions',
    );
  });

  it('avisa que esta aguardando o antifraude e atualiza sozinha quando o veredito chega', async () => {
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

    renderWithQuery(<TransactionDetail transactionExternalId={id} />);

    expect(await screen.findByText(/Aguardando a avaliação antifraude/)).toHaveAttribute(
      'role',
      'status',
    );
    await waitFor(() => expect(screen.getByText('Aprovada')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.queryByText(/Aguardando a avaliação antifraude/)).not.toBeInTheDocument();

    const callsWhenFinal = calls;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(calls).toBe(callsWhenFinal);
  });

  it('mostra "nao encontrada" para 404 e para identificador que nem e UUID', async () => {
    server.use(api.get(`/transactions/${id}`, () => api.error(404, 'nao encontrada')));

    const { unmount } = renderWithQuery(<TransactionDetail transactionExternalId={id} />);
    expect(await screen.findByText('Transação não encontrada')).toBeInTheDocument();
    unmount();

    renderWithQuery(<TransactionDetail transactionExternalId="abc" />);
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

    renderWithQuery(<TransactionDetail transactionExternalId={id} />);

    const alert = await screen.findByRole('alert');
    await userEvent.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Transação' })).toBeInTheDocument();
  });
});
