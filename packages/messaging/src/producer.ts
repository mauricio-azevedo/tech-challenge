import { CompressionTypes, Partitioners, type Kafka, type Producer } from 'kafkajs';

import { encodeHeaders } from './headers.js';

export interface OutgoingMessage {
  topic: string;
  /** Chave de particionamento: mensagens com a mesma chave preservam ordem entre si. */
  key: string;
  /** Serializado como JSON. */
  value: unknown;
  headers?: Record<string, string>;
}

export interface RawOutgoingMessage {
  topic: string;
  key: string | null;
  /** Bytes exatamente como recebidos: e o que uma DLQ precisa preservar. */
  value: Buffer | null;
  headers?: Record<string, string>;
}

/** O que o resto do sistema precisa de um producer; permite fakes nos testes. */
export interface MessagePublisher {
  publish: (message: OutgoingMessage) => Promise<void>;
  publishRaw: (message: RawOutgoingMessage) => Promise<void>;
}

/**
 * Producer com `acks=-1` (todas as replicas em sincronia confirmam) e o particionador padrao do
 * Kafka Java — explicito para silenciar o aviso do kafkajs 2 e para que a mesma chave caia na
 * mesma particao que outros clientes usariam.
 */
export class KafkaProducer implements MessagePublisher {
  private readonly producer: Producer;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: false,
    });
  }

  connect(): Promise<void> {
    return this.producer.connect();
  }

  disconnect(): Promise<void> {
    return this.producer.disconnect();
  }

  publish(message: OutgoingMessage): Promise<void> {
    return this.publishRaw({
      topic: message.topic,
      key: message.key,
      value: Buffer.from(JSON.stringify(message.value)),
      ...(message.headers === undefined ? {} : { headers: message.headers }),
    });
  }

  async publishRaw(message: RawOutgoingMessage): Promise<void> {
    await this.producer.send({
      topic: message.topic,
      acks: -1,
      compression: CompressionTypes.None,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: encodeHeaders(message.headers ?? {}),
        },
      ],
    });
  }
}
