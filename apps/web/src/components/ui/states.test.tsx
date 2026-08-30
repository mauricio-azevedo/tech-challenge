import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';
import { StatusBadge } from './status-badge';

describe('estados de tela', () => {
  it('carregando e anunciado como status ocupado', () => {
    render(<LoadingState label="Carregando transações" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Carregando transações');
  });

  it('erro e um alerta com a mensagem e um botao para tentar de novo', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="A API não respondeu." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('A API não respondeu.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('vazio mostra titulo, descricao e acao', () => {
    render(
      <EmptyState
        title="Nenhuma transação"
        description="Crie a primeira."
        action={<a href="/x">Criar</a>}
      />,
    );

    expect(screen.getByText('Nenhuma transação')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar' })).toBeInTheDocument();
  });

  it('status aparece em portugues', () => {
    render(
      <>
        <StatusBadge status="PENDING" />
        <StatusBadge status="APPROVED" />
        <StatusBadge status="REJECTED" />
      </>,
    );

    expect(screen.getByText('pendente')).toBeInTheDocument();
    expect(screen.getByText('aprovada')).toBeInTheDocument();
    expect(screen.getByText('rejeitada')).toBeInTheDocument();
  });
});
