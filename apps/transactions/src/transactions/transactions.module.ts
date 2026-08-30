import { Module } from '@nestjs/common';

import { OutboxModule } from '../outbox/outbox.module.js';
import { TransactionStatusUpdatedConsumer } from './transaction-status-updated.consumer.js';
import { TransactionStatusService } from './transaction-status.service.js';
import { TransactionTypesController } from './transaction-types.controller.js';
import { TransactionTypesService } from './transaction-types.service.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [OutboxModule],
  controllers: [TransactionsController, TransactionTypesController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    TransactionTypesService,
    TransactionStatusService,
    TransactionStatusUpdatedConsumer,
  ],
  exports: [TransactionsService, TransactionStatusUpdatedConsumer],
})
export class TransactionsModule {}
