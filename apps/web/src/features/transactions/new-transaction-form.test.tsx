import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTransaction, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { NewTransactionForm } from './new-transaction-form';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const debit = '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b';
const credit = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Conta de débito'), debit);
  await user.type(screen.getByLabelText('Conta de crédito'), credit);
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Tipo de transferência' }),
    'PIX',
  );
  await user.type(screen.getByLabelText('Valor (R$)'), '120.5');
  return user;
}

describe('NewTransactionForm', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(api.get('/transaction-types', () => api.json(transactionTypes)));
  });

  it('valida no cliente com as mesmas regras da API, apontando cada campo', async () => {
    const user = userEvent.setup();
    renderWithQuery(<NewTransactionForm />);

    await user.type(screen.getByLabelText('Conta de débito'), 'nao-e-uuid');
    await user.type(screen.getByLabelText('Valor (R$)'), '0');
    await user.click(screen.getByRole('button', { name: 'Criar transação' }));

    const debitField = screen.getByLabelText('Conta de débito');
    expect(debitField).toBeInvalid();
    expect(debitField).toHaveAccessibleDescription('deve ser um identificador (UUID) valido');
    expect(screen.getByLabelText('Valor (R$)')).toHaveAccessibleDescription(
      'valor deve ser maior que zero',
    );
    expect(screen.getByLabelText('Tipo de transferência')).toBeInvalid();
    expect(push).not.toHaveBeenCalled();
  });

  it('cria a transacao e leva para o detalhe', async () => {
    let received: unknown;
    server.use(
      api.post('/transactions', async ({ request }) => {
        received = await request.json();
        return api.json(
          buildTransaction({ transactionExternalId: '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f' }),
          201,
        );
      }),
    );
    renderWithQuery(<NewTransactionForm />);

    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Criar transação' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/transactions/0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f');
    });
    expect(received).toEqual({
      accountExternalIdDebit: debit,
      accountExternalIdCredit: credit,
      transferTypeId: 2,
      value: 120.5,
    });
  });

  it('leva um 400 da API de volta para o campo certo', async () => {
    server.use(
      api.post('/transactions', () =>
        api.error(400, 'dados invalidos', [
          { path: 'value', message: 'valor excede o limite suportado' },
        ]),
      ),
    );
    renderWithQuery(<NewTransactionForm />);

    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Criar transação' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Valor (R$)')).toHaveAccessibleDescription(
        'valor excede o limite suportado',
      ),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('mostra erros sem campo (422, indisponibilidade) num alerta e mantem o formulario', async () => {
    server.use(api.post('/transactions', () => api.error(503, 'banco indisponivel')));
    renderWithQuery(<NewTransactionForm />);

    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Criar transação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('temporariamente indisponível');
    expect(screen.getByLabelText('Conta de débito')).toHaveValue(debit);
    expect(screen.getByRole('button', { name: 'Criar transação' })).toBeEnabled();
  });
});
