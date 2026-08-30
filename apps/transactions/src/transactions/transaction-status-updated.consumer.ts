import { TOPICS, transactionStatusUpdatedEventSchema } from '@challenge/contracts';
import { runConsumer, subscription, type Kafka, type RunningConsumer } from '@challenge/messaging';
import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { KAFKA_CLIENT } from '../kafka/kafka.tokens.js';
import { nestMessagingLogger } from '../kafka/nest-messaging-logger.js';
import { TransactionStatusService } from './transaction-status.service.js';

/**
 * Assina `transaction.status.updated` com a politica do pacote de mensageria. Depende do
 * producer para que topicos e DLQ existam antes da primeira mensagem.
 */
@Injectable()
export class TransactionStatusUpdatedConsumer implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = nestMessagingLogger(TransactionStatusUpdatedConsumer.name);
  private running: RunningConsumer | undefined;

  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafka: Kafka,
    private readonly producer: KafkaProducerService,
    private readonly statusService: TransactionStatusService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get isRunning(): boolean {
    return this.running !== undefined;
  }

  async onModuleInit(): Promise<void> {
    this.running = await runConsumer(this.kafka, {
      groupId: this.config.get('KAFKA_GROUP_ID_TRANSACTIONS', { infer: true }),
      deadLetter: this.producer,
      logger: this.logger,
      subscriptions: [
        subscription(
          TOPICS.TRANSACTION_STATUS_UPDATED,
          transactionStatusUpdatedEventSchema,
          async (message) => {
            await this.statusService.apply(message.payload);
          },
        ),
      ],
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.running?.stop();
    this.running = undefined;
  }
}
