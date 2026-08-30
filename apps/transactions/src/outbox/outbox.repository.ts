import type { EventEnvelope } from '@challenge/contracts';
import { Injectable } from '@nestjs/common';

import type { Prisma } from '../generated/prisma/client.js';

/** Cliente Prisma dentro de uma transacao interativa (`prisma.$transaction(async (tx) => ...)`). */
export type TransactionClient = Prisma.TransactionClient;

export interface OutboxMessage {
  topic: string;
  key: string;
  event: EventEnvelope<string, unknown>;
}

@Injectable()
export class OutboxRepository {
  /**
   * Enfileira um evento **na transacao de quem chama**: ou a transacao e o evento sao gravados
   * juntos, ou nenhum dos dois. E o que torna o outbox transacional.
   */
  async enqueue(tx: TransactionClient, message: OutboxMessage): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        id: message.event.eventId,
        topic: message.topic,
        key: message.key,
        payload: toJsonPayload(message.event),
      },
    });
  }
}

/**
 * O que vai ao Kafka e JSON; gravar no outbox o mesmo JSON (e nao o objeto em memoria) garante
 * que o publicado e o persistido sao identicos — datas viram string aqui, nao no relay.
 */
function toJsonPayload(event: EventEnvelope<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue;
}
