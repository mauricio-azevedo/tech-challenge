import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import type { ListState } from './filters';
import { TransactionsList } from './transactions-list';

const defaultState: ListState = { page: 1, pageSize: 20 };

function mockTypes() {
  server.use(api.get('/transaction-types', () => api.json(transactionTypes)));
}

describe('TransactionsList', () => {
  it('mostra o carregamento e depois a tabela com as transacoes', async () => {
    mockTypes();
    server.use(
      api.get('/transactions', () =>
        api.json(
          page([
            buildTransaction({ transactionStatus: { name: 'APPROVED' }, value: 120 }),
            buildTransaction({ transactionStatus: { name: 'PENDING' }, value: 1500.5 }),
          ]),
        ),
      ),
    );

    renderWithQuery(<TransactionsList state={defaultState} onStateChange={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando transações');
    const table = await screen.findByRole('table', { name: 'Transações' });
    const [, first, second] = within(table).getAllByRole('row');
    if (first === undefined || second === undefined) throw new Error('esperava duas linhas');
    expect(within(first).getByText('aprovada')).toBeInTheDocument();
    expect(within(second).getByText('pendente')).toBeInTheDocument();
    expect(within(second).getByText('R$ 1.500,50')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent(
      '2 transações · página 1 de 1',
    );
  });

  it('mostra o estado vazio com um convite a criar quando nao ha transacoes', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([]))));

    renderWithQuery(<TransactionsList state={defaultState} onStateChange={vi.fn()} />);

    expect(await screen.findByText('Nenhuma transação ainda')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova transação' })).toHaveAttribute(
      'href',
      '/transactions/new',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('explica o vazio pelos filtros quando ha filtro ativo', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([]))));

    renderWithQuery(
      <TransactionsList state={{ ...defaultState, status: 'REJECTED' }} onStateChange={vi.fn()} />,
    );

    expect(await screen.findByText('Nenhuma transação com esses filtros')).toBeInTheDocument();
  });

  it('mostra o erro e refaz a busca ao clicar em tentar novamente', async () => {
    mockTypes();
    let calls = 0;
    server.use(
      api.get('/transactions', () => {
        calls += 1;
        return calls === 1
          ? api.error(503, 'banco indisponivel')
          : api.json(page([buildTransaction()]));
      }),
    );

    renderWithQuery(<TransactionsList state={defaultState} onStateChange={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('temporariamente indisponível');
    await userEvent.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('table', { name: 'Transações' })).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('envia os filtros na requisicao e volta para a primeira pagina ao mudar um filtro', async () => {
    mockTypes();
    const seen: string[] = [];
    server.use(
      api.get('/transactions', ({ request }) => {
        seen.push(new URL(request.url).search);
        return api.json(page([buildTransaction()], 45, 3));
      }),
    );
    const onStateChange = vi.fn();

    renderWithQuery(
      <TransactionsList
        state={{ status: 'APPROVED', page: 3, pageSize: 20 }}
        onStateChange={onStateChange}
      />,
    );

    await screen.findByRole('table', { name: 'Transações' });
    expect(seen[0]).toBe('?status=APPROVED&page=3&pageSize=20');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'PIX');
    expect(onStateChange).toHaveBeenLastCalledWith({
      status: 'APPROVED',
      transferTypeId: 2,
      page: 1,
      pageSize: 20,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 });
  });

  it('pagina com os botoes de navegacao, sem perder os filtros', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([buildTransaction()], 45, 2))));
    const onStateChange = vi.fn();

    renderWithQuery(
      <TransactionsList
        state={{ from: '2026-08-01', page: 2, pageSize: 20 }}
        onStateChange={onStateChange}
      />,
    );

    const nav = await screen.findByRole('navigation', { name: 'Paginação' });
    expect(nav).toHaveTextContent('45 transações · página 2 de 3');
    await userEvent.click(within(nav).getByRole('button', { name: 'Próxima' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ from: '2026-08-01', page: 3, pageSize: 20 });
  });

  it('continua consultando enquanto houver transacao pendente e para quando tudo e final', async () => {
    mockTypes();
    let calls = 0;
    server.use(
      api.get('/transactions', () => {
        calls += 1;
        const status = calls === 1 ? 'PENDING' : 'APPROVED';
        return api.json(page([buildTransaction({ transactionStatus: { name: status } })]));
      }),
    );

    renderWithQuery(<TransactionsList state={defaultState} onStateChange={vi.fn()} />);

    // Dentro da tabela: o filtro de status tambem lista "pendente"/"aprovada" como opcoes.
    const table = await screen.findByRole('table', { name: 'Transações' });
    expect(within(table).getByText('pendente')).toBeInTheDocument();
    await waitFor(() => expect(within(table).getByText('aprovada')).toBeInTheDocument(), {
      timeout: 3000,
    });
    const callsWhenFinal = calls;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(calls).toBe(callsWhenFinal);
  });
});
