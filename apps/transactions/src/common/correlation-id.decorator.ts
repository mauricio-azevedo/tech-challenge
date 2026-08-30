import { randomUUID } from 'node:crypto';

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** O identificador da requisicao (ver RequestIdMiddleware), pronto para virar `correlationId`. */
export const CorrelationId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>();
  return request.requestId ?? randomUUID();
});
