import { Module } from '@nestjs/common';

import { TransactionTypesController } from './transaction-types.controller.js';
import { TransactionTypesService } from './transaction-types.service.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  controllers: [TransactionsController, TransactionTypesController],
  providers: [TransactionsService, TransactionsRepository, TransactionTypesService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
