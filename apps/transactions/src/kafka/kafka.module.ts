import { createKafka, type Kafka } from '@challenge/messaging';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { KAFKA_CLIENT } from './kafka.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: KAFKA_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Kafka =>
        createKafka({
          brokers: config.get('KAFKA_BROKERS', { infer: true }),
          clientId: config.get('KAFKA_CLIENT_ID_TRANSACTIONS', { infer: true }),
        }),
    },
    KafkaProducerService,
  ],
  exports: [KAFKA_CLIENT, KafkaProducerService],
})
export class KafkaModule {}
