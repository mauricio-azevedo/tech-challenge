import { Module } from '@nestjs/common';

import { KafkaModule } from '../kafka/kafka.module.js';
import { TransactionCreatedConsumer } from './transaction-created.consumer.js';
import { TransactionCreatedHandler } from './transaction-created.handler.js';

@Module({
  imports: [KafkaModule],
  providers: [TransactionCreatedHandler, TransactionCreatedConsumer],
  exports: [TransactionCreatedConsumer],
})
export class AntiFraudModule {}
