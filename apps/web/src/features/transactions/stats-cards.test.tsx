import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { buildStats } from '../../../test/fixtures';
import { api } from '../../../test/msw/api';
import { server } from '../../../test/msw/server';
import { renderWithQuery } from '../../../test/render';
import { transactionKeys } from './api';
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

describe('StatsCards na hidratacao', () => {
  /**
   * O resumo tambem alimenta o contador da sidebar, que hidrata antes (fica fora do `<Suspense>`
   * da pagina) e ja deixa o cache quente. Se os cards lessem esse cache no render de hidratacao,
   * o cliente montaria os cards onde o servidor mandou o esqueleto — a divergencia que o React
   * acusa no console.
   */
  it('hidrata com o esqueleto do servidor mesmo com o cache ja quente', async () => {
    server.use(api.get('/transactions/stats', () => api.json(buildStats({ total: 45 }))));
    const options = { defaultOptions: { queries: { retry: false } } };
    const html = renderToString(
      <QueryClientProvider client={new QueryClient(options)}>
        <StatsCards />
      </QueryClientProvider>,
    );
    expect(html).toContain('Carregando resumo');

    // Cliente: o cache ja tem o resumo antes de a hidratacao comecar.
    const client = new QueryClient(options);
    client.setQueryData(transactionKeys.stats, buildStats({ total: 45 }));
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // Divergencia de hidratacao chega aqui (e nao como excecao): o React recupera renderando o
    // trecho de novo no cliente, e avisa por `onRecoverableError`.
    const recovered: string[] = [];
    await act(async () => {
      hydrateRoot(
        container,
        <QueryClientProvider client={client}>
          <StatsCards />
        </QueryClientProvider>,
        {
          onRecoverableError: (error) => {
            recovered.push(error instanceof Error ? error.message : String(error));
          },
        },
      );
      await Promise.resolve();
    });

    expect(recovered).toEqual([]);
    expect(await within(container).findByText('45')).toBeInTheDocument();
  });
});
