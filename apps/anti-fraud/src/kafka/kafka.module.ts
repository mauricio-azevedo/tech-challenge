import { createKafka, type Kafka } from '@challenge/messaging';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { KAFKA_CLIENT, MESSAGE_PUBLISHER } from './kafka.tokens.js';

/** Infraestrutura Kafka do servico: cliente e producer. Quem consome vive no modulo de dominio. */
@Module({
  providers: [
    {
      provide: KAFKA_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Kafka =>
        createKafka({
          brokers: config.get('KAFKA_BROKERS', { infer: true }),
          clientId: config.get('KAFKA_CLIENT_ID_ANTI_FRAUD', { infer: true }),
        }),
    },
    KafkaProducerService,
    { provide: MESSAGE_PUBLISHER, useExisting: KafkaProducerService },
  ],
  exports: [KAFKA_CLIENT, KafkaProducerService, MESSAGE_PUBLISHER],
})
export class KafkaModule {}
