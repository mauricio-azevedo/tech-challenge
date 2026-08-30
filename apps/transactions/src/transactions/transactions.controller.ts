import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionExternalIdSchema,
  type CreateTransactionInput,
  type ListTransactionsQuery,
} from '@challenge/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { CorrelationId } from '../common/correlation-id.decorator.js';
import { TransactionsService } from './transactions.service.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body({ schema: createTransactionSchema }) input: CreateTransactionInput,
    @CorrelationId() correlationId: string,
  ) {
    return this.transactions.create(input, correlationId);
  }

  @Get()
  list(@Query({ schema: listTransactionsQuerySchema }) query: ListTransactionsQuery) {
    return this.transactions.list(query);
  }

  // Declarada antes de ':transactionExternalId': o Express casa rotas na ordem de declaracao, e
  // sem isso "stats" seria tratado como identificador (400 de UUID invalido).
  @Get('stats')
  stats() {
    return this.transactions.stats();
  }

  @Get(':transactionExternalId')
  findOne(
    @Param('transactionExternalId', { schema: transactionExternalIdSchema })
    transactionExternalId: string,
  ) {
    return this.transactions.findByExternalId(transactionExternalId);
  }
}
