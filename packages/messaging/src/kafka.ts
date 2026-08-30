import { Kafka, logLevel, type KafkaConfig } from 'kafkajs';

export interface KafkaConnectionOptions {
  brokers: string[];
  clientId: string;
}

/**
 * Cliente kafkajs com os padroes do projeto. O log interno do kafkajs fica em WARN: os logs de
 * negocio (mensagem processada, enviada para DLQ) sao nossos, nao do driver.
 */
export function createKafka(
  options: KafkaConnectionOptions,
  overrides: Partial<KafkaConfig> = {},
): Kafka {
  return new Kafka({
    brokers: options.brokers,
    clientId: options.clientId,
    logLevel: logLevel.WARN,
    ...overrides,
  });
}
