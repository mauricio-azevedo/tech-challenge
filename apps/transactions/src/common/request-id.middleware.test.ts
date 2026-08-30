import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { RequestIdMiddleware } from './request-id.middleware.js';

function run(incomingHeader: string | undefined) {
  const request = { header: () => incomingHeader } as unknown as Request;
  const setHeader = vi.fn();
  const response = { setHeader } as unknown as Response;
  const next = vi.fn();

  new RequestIdMiddleware().use(request, response, next);

  return { request, setHeader, next };
}

describe('RequestIdMiddleware', () => {
  it('reaproveita o x-request-id enviado pelo cliente', () => {
    const { request, setHeader, next } = run('cliente-123');

    expect(request.requestId).toBe('cliente-123');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'cliente-123');
    expect(next).toHaveBeenCalledOnce();
  });

  it('gera um identificador quando o cliente nao manda (ou manda vazio)', () => {
    const { request, setHeader } = run('   ');

    expect(request.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', request.requestId);
  });
});
