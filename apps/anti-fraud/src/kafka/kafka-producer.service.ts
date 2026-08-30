import { ensureTopics, KafkaProducer, type Kafka } from '@challenge/messaging';
import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { KAFKA_CLIENT } from './kafka.tokens.js';
import { nestMessagingLogger } from './nest-messaging-logger.js';
import { topicSpecs } from './topic-specs.js';

/** Publica os vereditos e as mensagens de DLQ. Garante os topicos e conecta no boot. */
@Injectable()
export class KafkaProducerService
  extends KafkaProducer
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = nestMessagingLogger(KafkaProducerService.name);

  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafka: Kafka,
    private readonly config: ConfigService<Env, true>,
  ) {
    super(kafka);
  }

  async onModuleInit(): Promise<void> {
    await ensureTopics(
      this.kafka,
      topicSpecs(this.config.get('KAFKA_TOPIC_PARTITIONS', { infer: true })),
      this.logger,
    );
    await this.connect();
    this.logger.log('producer conectado');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.disconnect();
  }
}
