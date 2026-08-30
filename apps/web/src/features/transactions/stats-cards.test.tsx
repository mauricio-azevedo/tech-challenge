import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildStats } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { StatsCards } from './stats-cards';

describe('StatsCards', () => {
  it('anuncia o carregamento e depois mostra os totais e o volume aprovado', async () => {
    server.use(
      api.get('/transactions/stats', () =>
        api.json(
          buildStats({
            total: 45,
            byStatus: { PENDING: 3, APPROVED: 40, REJECTED: 2 },
            approvedVolume: 12345,
          }),
        ),
      ),
    );

    renderWithQuery(<StatsCards />);

    expect(screen.getByRole('status', { name: 'Carregando resumo' })).toBeInTheDocument();
    expect(await screen.findByText('Aprovadas')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('R$ 12.345,00 liberados')).toBeInTheDocument();
  });

  it('erro vira alerta com tentar novamente, sem derrubar o resto da pagina', async () => {
    let calls = 0;
    server.use(
      api.get('/transactions/stats', () => {
        calls += 1;
        return calls === 1 ? api.error(503, 'indisponivel') : api.json(buildStats({ total: 1 }));
      }),
    );

    renderWithQuery(<StatsCards />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('temporariamente indisponível');
    await userEvent.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Total')).toBeInTheDocument();
  });
});
