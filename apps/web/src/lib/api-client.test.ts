import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { api } from '../../test/msw/api';
import { server } from '../../test/msw/server';
import { ApiError, apiRequest } from './api-client';

describe('apiRequest', () => {
  it('monta a URL com a query e devolve o JSON', async () => {
    server.use(
      api.get('/transactions', ({ request }) =>
        api.json({ query: new URL(request.url).searchParams.get('status') }),
      ),
    );

    await expect(
      apiRequest<{ query: string }>('/transactions', {
        query: { status: 'APPROVED', page: undefined },
      }),
    ).resolves.toEqual({ query: 'APPROVED' });
  });

  it('traduz 400 em erros por campo, para o formulario', async () => {
    server.use(
      api.post('/transactions', () =>
        api.error(400, 'dados invalidos', [
          { path: 'value', message: 'valor deve ser maior que zero' },
        ]),
      ),
    );

    const error = await apiRequest('/transactions', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) return;
    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({ value: 'valor deve ser maior que zero' });
    expect(error.retryable).toBe(false);
  });

  it('marca 503 e falha de rede como "vale tentar de novo"', async () => {
    server.use(api.get('/transactions', () => api.error(503, 'banco indisponivel')));
    const unavailable = await apiRequest('/transactions').catch((e: unknown) => e);
    expect(unavailable).toBeInstanceOf(ApiError);
    if (unavailable instanceof ApiError) {
      expect(unavailable.retryable).toBe(true);
      expect(unavailable.message).toMatch(/temporariamente indisponível/);
    }

    server.use(api.get('/transactions', () => HttpResponse.error()));
    const offline = await apiRequest('/transactions').catch((e: unknown) => e);
    expect(offline).toBeInstanceOf(ApiError);
    if (offline instanceof ApiError) expect(offline.retryable).toBe(true);
  });
});
