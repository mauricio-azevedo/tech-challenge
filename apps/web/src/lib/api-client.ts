import { apiErrorResponseSchema, type ApiErrorResponse } from '@challenge/contracts';

import { env } from './env';

export type FieldErrors = Record<string, string>;

/**
 * Erro de uma chamada a API, ja interpretado: `status` para decidir o que fazer, `fieldErrors`
 * para o formulario apontar o campo, `retryable` para a tela oferecer "tentar de novo".
 */
export class ApiError extends Error {
  readonly status: number | undefined;
  readonly fieldErrors: FieldErrors;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { status?: number; fieldErrors?: FieldErrors; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
    this.retryable = options.status === undefined || options.status >= 500;
  }
}

const messagesByStatus: Record<number, string> = {
  404: 'Transação não encontrada.',
  422: 'Não foi possível criar a transação.',
  503: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
};

function toApiError(status: number, body: unknown): ApiError {
  const parsed = apiErrorResponseSchema.safeParse(body);
  const payload: ApiErrorResponse | undefined = parsed.success ? parsed.data : undefined;
  const fieldErrors = Object.fromEntries(
    (payload?.errors ?? []).map((error) => [error.path, error.message]),
  );
  const message =
    status === 400 && payload?.errors !== undefined
      ? 'Revise os campos destacados.'
      : (messagesByStatus[status] ?? payload?.message ?? `Erro ${String(status)} ao chamar a API.`);
  return new ApiError(message, { status, fieldErrors });
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

/** `fetch` tipado contra a API de transacoes: URL base do ambiente, JSON dos dois lados. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, env.apiUrl);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError('Não foi possível falar com a API. Verifique sua conexão.', {
      cause: error,
    });
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw toApiError(response.status, body);
  return body as T;
}
