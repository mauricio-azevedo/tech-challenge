import { TOPICS, transactionCreatedEventSchema } from '@challenge/contracts';
import { runConsumer, subscription, type Kafka, type RunningConsumer } from '@challenge/messaging';
import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { KAFKA_CLIENT } from '../kafka/kafka.tokens.js';
import { nestMessagingLogger } from '../kafka/nest-messaging-logger.js';
import { TransactionCreatedHandler } from './transaction-created.handler.js';

/**
 * Assina `transaction.created` com a politica do pacote de mensageria (validacao, retry, DLQ).
 * Depende do producer para que o Nest o inicialize antes: os topicos precisam existir e a DLQ
 * precisa de um producer conectado antes da primeira mensagem chegar.
 */
@Injectable()
export class TransactionCreatedConsumer implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = nestMessagingLogger(TransactionCreatedConsumer.name);
  private running: RunningConsumer | undefined;

  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafka: Kafka,
    private readonly producer: KafkaProducerService,
    private readonly handler: TransactionCreatedHandler,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get isRunning(): boolean {
    return this.running !== undefined;
  }

  async onModuleInit(): Promise<void> {
    this.running = await runConsumer(this.kafka, {
      groupId: this.config.get('KAFKA_GROUP_ID_ANTI_FRAUD', { infer: true }),
      deadLetter: this.producer,
      logger: this.logger,
      subscriptions: [
        subscription(TOPICS.TRANSACTION_CREATED, transactionCreatedEventSchema, async (message) => {
          await this.handler.handle(message);
        }),
      ],
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.running?.stop();
    this.running = undefined;
  }
}
