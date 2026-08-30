import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { ApiExceptionFilter } from './api-exception.filter.js';
import { createValidationPipe } from './validation.js';

/** Validacao de entrada e formato de erro, iguais para todos os endpoints. */
@Module({
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class CommonModule {}
