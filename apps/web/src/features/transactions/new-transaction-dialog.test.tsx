import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTransaction, transactionTypes } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { NewTransactionDialog } from './new-transaction-dialog';

const debit = '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b';
const credit = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

async function fillValidForm(u: ReturnType<typeof user>) {
  await u.type(screen.getByLabelText('Conta de origem'), debit);
  await u.type(screen.getByLabelText('Conta de destino'), credit);
  await u.click(await screen.findByRole('radio', { name: 'PIX' }));
  await u.type(screen.getByLabelText('Valor (R$)'), '120,50');
}

const dialog = () => screen.getByRole('dialog', { name: 'Nova transação' });

describe('NewTransactionDialog', () => {
  beforeEach(() => {
    server.use(api.get('/transaction-types', () => api.json(transactionTypes)));
  });

  it('valida no cliente com as mesmas regras da API, apontando cada campo', async () => {
    const onCreated = vi.fn();
    const u = user();
    renderWithQuery(<NewTransactionDialog open onClose={vi.fn()} onCreated={onCreated} />);

    await u.type(screen.getByLabelText('Conta de origem'), 'nao-e-uuid');
    await u.type(screen.getByLabelText('Valor (R$)'), '0');
    await u.click(screen.getByRole('button', { name: 'Criar transação' }));

    const debitField = screen.getByLabelText('Conta de origem');
    expect(debitField).toBeInvalid();
    expect(debitField).toHaveAccessibleDescription('deve ser um identificador (UUID) valido');
    expect(screen.getByLabelText('Valor (R$)')).toHaveAccessibleDescription(
      'valor deve ser maior que zero',
    );
    expect(screen.getByLabelText('Tipo de transferência')).toBeInvalid();
    expect(onCreated).not.toHaveBeenCalled();
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
      expect(screen.getByLabelText('Valor (R$)')).toHaveAccessibleDescription(
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
