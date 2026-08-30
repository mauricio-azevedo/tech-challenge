import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { ApiExceptionFilter } from './api-exception.filter.js';
import { RequestIdMiddleware } from './request-id.middleware.js';
import { createValidationPipe } from './validation.js';

/** Validacao de entrada, formato de erro e identificador de requisicao, iguais para todos os endpoints. */
@Module({
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
