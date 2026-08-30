import {
  listTransactionsQuerySchema,
  transactionExternalIdSchema,
  type ListTransactionsQuery,
} from '@challenge/contracts';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { TransactionsService } from './transactions.service.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@Query({ schema: listTransactionsQuerySchema }) query: ListTransactionsQuery) {
    return this.transactions.list(query);
  }

  @Get(':transactionExternalId')
  findOne(
    @Param('transactionExternalId', { schema: transactionExternalIdSchema })
    transactionExternalId: string,
  ) {
    return this.transactions.findByExternalId(transactionExternalId);
  }
}
