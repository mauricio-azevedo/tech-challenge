import { apiErrorResponseSchema, type ApiErrorResponse } from '@challenge/contracts';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { isDatabaseUnavailableError } from '../prisma/database-errors.js';

/**
 * Toda resposta de erro sai no mesmo formato (`ApiErrorResponse`). Erros esperados (404, 400)
 * passam como estao; banco fora do ar vira 503; qualquer outra coisa vira 500 sem vazar detalhes —
 * e e logada com stack, porque 500 e bug.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = this.toBody(exception);
    if (isServerError(body.statusCode)) {
      this.logger.error(
        `${request.method} ${request.url} -> ${String(body.statusCode)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorResponse {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const parsed = apiErrorResponseSchema.safeParse(payload);
      if (parsed.success) return parsed.data;
      return { statusCode: exception.getStatus(), message: messageOf(payload, exception.message) };
    }
    if (isDatabaseUnavailableError(exception)) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'banco de dados indisponivel, tente novamente em instantes',
      };
    }
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'erro interno' };
  }
}

function isServerError(statusCode: number): boolean {
  return statusCode >= 500;
}

function messageOf(payload: unknown, fallback: string): string {
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = payload.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join('; ');
  }
  return fallback;
}
