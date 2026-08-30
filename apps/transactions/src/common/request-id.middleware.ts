import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Cada requisicao recebe um identificador: o que o cliente mandou em `x-request-id` ou um novo.
 * Ele volta no header da resposta e vira o `correlationId` dos eventos que a requisicao gerar —
 * e assim se segue uma transacao da API ate o veredito do antifraude nos logs dos dois servicos.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header(REQUEST_ID_HEADER)?.trim();
    const requestId = incoming !== undefined && incoming.length > 0 ? incoming : randomUUID();
    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
