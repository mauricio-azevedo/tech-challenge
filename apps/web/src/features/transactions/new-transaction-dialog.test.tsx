import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTransaction, page, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { NewTransactionDialog } from './new-transaction-dialog';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/transactions/new',
  useSearchParams: () => new URLSearchParams(),
}));

const debit = '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b';
const credit = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

async function fillValidForm(u: ReturnType<typeof user>) {
  await u.type(screen.getByLabelText('Conta de origem'), debit);
  await u.type(screen.getByLabelText('Conta de destino'), credit);
  await u.click(await screen.findByRole('radio', { name: 'PIX' }));
  await u.type(screen.getByLabelText('Valor'), '120,50');
}

const dialog = () => screen.getByRole('dialog', { name: 'Nova transação' });

describe('NewTransactionDialog', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      api.get('/transaction-types', () => api.json(transactionTypes)),
      // O formulario sugere as contas das ultimas transacoes; por padrao, nao ha nenhuma.
      api.get('/transactions', () => api.json(page([]))),
    );
  });

  /** Valores oferecidos pelo `datalist` ligado ao campo. */
  const suggestionsOf = (field: HTMLElement) => {
    const list = document.getElementById(field.getAttribute('list') ?? '');
    return [...(list?.querySelectorAll('option') ?? [])].map((option) => option.value);
  };

  it('valida no cliente com as mesmas regras da API, apontando cada campo', async () => {
    const onCreated = vi.fn();
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={onCreated} />);

    // Campo sem erro nao tem legenda nem descricao: o unico no de dica e a mensagem de erro.
    expect(screen.getByLabelText('Conta de destino')).toHaveAccessibleDescription('');

    await u.type(screen.getByLabelText('Conta de origem'), 'nao-e-uuid');
    await u.type(screen.getByLabelText('Valor'), '0');
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    const debitField = screen.getByLabelText('Conta de origem');
    expect(debitField).toBeInvalid();
    expect(debitField).toHaveAccessibleDescription('deve ser um identificador (UUID) valido');
    expect(screen.getByLabelText('Valor')).toHaveAccessibleDescription(
      'valor deve ser maior que zero',
    );
    expect(screen.getByLabelText('Tipo de transferência')).toBeInvalid();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('gera um UUID em cada campo de conta e revalida o campo', async () => {
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    await u.type(screen.getByLabelText('Conta de origem'), 'nao-e-uuid');
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Conta de origem')).toBeInvalid();
    });

    await u.click(screen.getByRole('button', { name: 'Gerar UUID da conta de origem' }));
    await u.click(screen.getByRole('button', { name: 'Gerar UUID da conta de destino' }));

    const origem = screen.getByLabelText<HTMLInputElement>('Conta de origem');
    const destino = screen.getByLabelText<HTMLInputElement>('Conta de destino');
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    await waitFor(() => {
      expect(origem.value).toMatch(uuid);
    });
    expect(destino.value).toMatch(uuid);
    expect(origem.value).not.toBe(destino.value);
    expect(origem).toBeValid();
  });

  it('cria a transacao, toasta e avisa quem abriu o dialog', async () => {
    let received: unknown;
    const created = buildTransaction({
      transactionExternalId: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f',
    });
    server.use(
      api.post('/transactions', async ({ request }) => {
        received = await request.json();
        return api.json(created, 201);
      }),
    );
    const onCreated = vi.fn();
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={onCreated} />, {
      toasts: true,
    });

    await fillValidForm(u);
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(created);
    });
    expect(received).toEqual({
      accountExternalIdDebit: debit,
      accountExternalIdCredit: credit,
      transferTypeId: 2,
      value: 120.5,
    });
    expect(await screen.findByText('Transação criada')).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Ver transação' }));
    expect(push).toHaveBeenCalledWith(`/transactions/${created.transactionExternalId}`, {
      scroll: false,
    });
  });

  it('digita o valor com mascara de moeda, dos centavos para a esquerda', async () => {
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    const valor = screen.getByLabelText<HTMLInputElement>('Valor');
    await u.type(valor, '1');
    expect(valor).toHaveValue('0,01');
    await u.type(valor, '2050');
    expect(valor).toHaveValue('120,50');
    await u.type(valor, '{backspace}');
    expect(valor).toHaveValue('12,05');
  });

  it('aceita conta colada com espaco e maiuscula, normalizando o que fica na tela', async () => {
    let received: unknown;
    server.use(
      api.post('/transactions', async ({ request }) => {
        received = await request.json();
        return api.json(buildTransaction(), 201);
      }),
    );
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    const origem = screen.getByLabelText<HTMLInputElement>('Conta de origem');
    await u.click(origem);
    await u.paste(` ${debit.toUpperCase()}\n`);
    await u.tab();
    expect(origem).toHaveValue(debit);

    await u.type(screen.getByLabelText('Conta de destino'), credit);
    await u.click(await screen.findByRole('radio', { name: 'PIX' }));
    await u.type(screen.getByLabelText('Valor'), '12050');
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    await waitFor(() => {
      expect(received).toEqual({
        accountExternalIdDebit: debit,
        accountExternalIdCredit: credit,
        transferTypeId: 2,
        value: 120.5,
      });
    });
  });

  it('impede transferencia para a mesma conta sem chamar a API', async () => {
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    await u.type(screen.getByLabelText('Conta de origem'), debit);
    await u.type(screen.getByLabelText('Conta de destino'), debit);
    await u.click(await screen.findByRole('radio', { name: 'PIX' }));
    await u.type(screen.getByLabelText('Valor'), '12050');
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    // Sem handler de POST no MSW: se o formulario tivesse enviado, o teste falharia na requisicao.
    await waitFor(() => {
      expect(screen.getByLabelText('Conta de destino')).toHaveAccessibleDescription(
        'conta de destino deve ser diferente da conta de origem',
      );
    });
  });

  it('sugere as contas ja usadas, cada lado com as suas', async () => {
    server.use(
      api.get('/transactions', () =>
        api.json(
          page([
            buildTransaction({
              accountExternalIdDebit: debit,
              accountExternalIdCredit: credit,
            }),
          ]),
        ),
      ),
    );
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    await waitFor(() => {
      expect(suggestionsOf(screen.getByLabelText('Conta de origem'))).toEqual([debit]);
    });
    expect(suggestionsOf(screen.getByLabelText('Conta de destino'))).toEqual([credit]);
  });

  it('leva um 400 da API de volta para o campo certo', async () => {
    server.use(
      api.post('/transactions', () =>
        api.error(400, 'dados invalidos', [
          { path: 'value', message: 'valor excede o limite suportado' },
        ]),
      ),
    );
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillValidForm(u);
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Valor')).toHaveAccessibleDescription(
        'valor excede o limite suportado',
      ),
    );
    expect(within(dialog()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra erros sem campo (indisponibilidade) num alerta e mantem o formulario', async () => {
    server.use(api.post('/transactions', () => api.error(503, 'banco indisponivel')));
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillValidForm(u);
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    expect(await within(dialog()).findByRole('alert')).toHaveTextContent(
      'temporariamente indisponível',
    );
    expect(screen.getByLabelText('Conta de origem')).toHaveValue(debit);
    expect(screen.getByRole('button', { name: 'Criar transação' })).toBeEnabled();
  });

  it('cancelar fecha o dialog sem criar nada', async () => {
    const onClose = vi.fn();
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={onClose} onCreated={vi.fn()} />);

    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
