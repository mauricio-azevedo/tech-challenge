import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoadingRegion } from './loading-region';
import { StatePanel } from './state-panel';
import { StatusBadge } from './status-badge';

describe('estados de tela', () => {
  it('carregando e anunciado como status ocupado', () => {
    render(<LoadingRegion label="Carregando transações" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Carregando transações');
  });

  it('o painel em tom de erro e um alerta com a mensagem e a acao', async () => {
    const onRetry = vi.fn();
    render(
      <StatePanel
        tone="danger"
        title="Algo deu errado"
        description="A API não respondeu."
        actions={
          <button type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        }
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('A API não respondeu.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('o painel neutro mostra titulo, descricao e acao, sem virar alerta', () => {
    render(
      <StatePanel
        title="Nenhuma transação"
        description="Crie a primeira."
        actions={<a href="/x">Criar</a>}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma transação')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar' })).toBeInTheDocument();
  });

  it('status aparece com os rotulos do design', () => {
    render(
      <>
        <StatusBadge status="PENDING" />
        <StatusBadge status="APPROVED" />
        <StatusBadge status="REJECTED" />
      </>,
    );

    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Aprovada')).toBeInTheDocument();
    expect(screen.getByText('Rejeitada')).toBeInTheDocument();
  });
});
