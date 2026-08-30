import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import type { ListState } from './filters';
import { TransactionsList, type ListNavigation } from './transactions-list';

const defaultState: ListState = { page: 1, pageSize: 20 };

function mockTypes() {
  server.use(api.get('/transaction-types', () => api.json(transactionTypes)));
}

function buildNavigation(): ListNavigation {
  return {
    detailHref: (id) => `/transactions/${id}`,
    newTransactionHref: '/transactions/new',
    openTransaction: vi.fn(),
  };
}

// Os selects (Radix) abrem num portal que herda pointer-events: none do body; a checagem do
// user-event recusaria o clique mesmo com o menu funcional.
const user = () => userEvent.setup({ pointerEventsCheck: 0 });

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

    renderWithQuery(
      <TransactionsList
        state={defaultState}
        onStateChange={vi.fn()}
        navigation={buildNavigation()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Carregando transações');
    const table = await screen.findByRole('table', { name: 'Transações' });
    const [, first, second] = within(table).getAllByRole('row');
    if (first === undefined || second === undefined) throw new Error('esperava duas linhas');
    expect(within(first).getByText('Aprovada')).toBeInTheDocument();
    expect(within(second).getByText('Pendente')).toBeInTheDocument();
    expect(within(second).getByText('R$ 1.500,50')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent(
      '1–2 de 2 transações',
    );
  });

  it('abre o detalhe ao clicar na linha', async () => {
    mockTypes();
    const transaction = buildTransaction();
    server.use(api.get('/transactions', () => api.json(page([transaction]))));
    const navigation = buildNavigation();

    renderWithQuery(
      <TransactionsList state={defaultState} onStateChange={vi.fn()} navigation={navigation} />,
    );

    const table = await screen.findByRole('table', { name: 'Transações' });
    const [, row] = within(table).getAllByRole('row');
    if (row === undefined) throw new Error('esperava uma linha');
    await user().click(row);
    expect(navigation.openTransaction).toHaveBeenCalledWith(transaction.transactionExternalId);
  });

  it('busca por UUID completo abre o detalhe; texto parcial ganha uma dica', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([buildTransaction()]))));
    const navigation = buildNavigation();

    renderWithQuery(
      <TransactionsList state={defaultState} onStateChange={vi.fn()} navigation={navigation} />,
    );

    const search = await screen.findByRole('textbox', { name: 'Buscar por ID da transação' });
    await user().type(search, '0191c2f0');
    expect(
      screen.getByText('Cole o ID completo (UUID) para abrir a transação'),
    ).toBeInTheDocument();
    expect(navigation.openTransaction).not.toHaveBeenCalled();

    await user().clear(search);
    await user().click(search);
    await user().paste('0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f');
    expect(navigation.openTransaction).toHaveBeenCalledWith('0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f');
    expect(search).toHaveValue('');
  });

  it('mostra o estado vazio com um convite a criar quando nao ha transacoes', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([]))));

    renderWithQuery(
      <TransactionsList
        state={defaultState}
        onStateChange={vi.fn()}
        navigation={buildNavigation()}
      />,
    );

    expect(await screen.findByText('Nenhuma transação encontrada')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma transação foi criada até agora.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar transação' })).toHaveAttribute(
      'href',
      '/transactions/new',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('explica o vazio pelos filtros e oferece limpa-los quando ha filtro ativo', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([]))));
    const onStateChange = vi.fn();

    renderWithQuery(
      <TransactionsList
        state={{ ...defaultState, status: 'REJECTED' }}
        onStateChange={onStateChange}
        navigation={buildNavigation()}
      />,
    );

    expect(
      await screen.findByText(
        'Nenhuma transação corresponde aos filtros atuais. Ajuste o período ou o status.',
      ),
    ).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 });
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

    renderWithQuery(
      <TransactionsList
        state={defaultState}
        onStateChange={vi.fn()}
        navigation={buildNavigation()}
      />,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('temporariamente indisponível');
    await user().click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

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
        navigation={buildNavigation()}
      />,
    );

    await screen.findByRole('table', { name: 'Transações' });
    expect(seen[0]).toBe('?status=APPROVED&page=3&pageSize=20');

    await user().click(screen.getByRole('combobox', { name: 'Tipo' }));
    await user().click(await screen.findByRole('option', { name: 'PIX' }));
    expect(onStateChange).toHaveBeenLastCalledWith({
      status: 'APPROVED',
      transferTypeId: 2,
      page: 1,
      pageSize: 20,
    });

    await user().click(screen.getByRole('button', { name: 'Limpar' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 });
  });

  it('pagina pelos botoes e pelos numeros, sem perder os filtros', async () => {
    mockTypes();
    server.use(api.get('/transactions', () => api.json(page([buildTransaction()], 45, 2))));
    const onStateChange = vi.fn();

    renderWithQuery(
      <TransactionsList
        state={{ from: '2026-08-01', page: 2, pageSize: 20 }}
        onStateChange={onStateChange}
        navigation={buildNavigation()}
      />,
    );

    const nav = await screen.findByRole('navigation', { name: 'Paginação' });
    expect(nav).toHaveTextContent('21–40 de 45 transações');
    expect(within(nav).getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');

    await user().click(within(nav).getByRole('button', { name: 'Próxima' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ from: '2026-08-01', page: 3, pageSize: 20 });

    await user().click(within(nav).getByRole('button', { name: '1' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ from: '2026-08-01', page: 1, pageSize: 20 });
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

    renderWithQuery(
      <TransactionsList
        state={defaultState}
        onStateChange={vi.fn()}
        navigation={buildNavigation()}
      />,
    );

    // Dentro da tabela: o filtro de status tambem lista "Pendente"/"Aprovada" como opcoes.
    const table = await screen.findByRole('table', { name: 'Transações' });
    expect(within(table).getByText('Pendente')).toBeInTheDocument();
    await waitFor(() => expect(within(table).getByText('Aprovada')).toBeInTheDocument(), {
      timeout: 3000,
    });
    const callsWhenFinal = calls;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(calls).toBe(callsWhenFinal);
  });
});
