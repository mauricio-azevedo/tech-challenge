import type { EventEnvelope } from '@challenge/contracts';
import { Injectable } from '@nestjs/common';

import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Cliente Prisma dentro de uma transacao interativa (`prisma.$transaction(async (tx) => ...)`). */
export type TransactionClient = Prisma.TransactionClient;

export interface OutboxMessage {
  topic: string;
  key: string;
  event: EventEnvelope<string, unknown>;
}

/** Linha reivindicada pelo relay: o que basta para publicar. */
export interface ClaimedOutboxEvent {
  id: string;
  topic: string;
  key: string;
  payload: unknown;
  attempts: number;
}

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Reivindica um lote de eventos pendentes para publicacao. `FOR UPDATE SKIP LOCKED` faz dois
   * relays concorrentes pegarem lotes disjuntos; o `claimed_at` expira para que um relay que
   * morreu no meio do caminho nao deixe eventos presos.
   */
  claimBatch(limit: number, claimTimeoutMs: number): Promise<ClaimedOutboxEvent[]> {
    return this.prisma.$queryRaw<ClaimedOutboxEvent[]>`
      UPDATE "outbox_events"
      SET "claimed_at" = now()
      WHERE "id" IN (
        SELECT "id" FROM "outbox_events"
        WHERE "published_at" IS NULL
          AND "failed_at" IS NULL
          AND ("claimed_at" IS NULL OR "claimed_at" < now() - (${claimTimeoutMs} * interval '1 millisecond'))
        ORDER BY "created_at" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "topic", "key", "payload", "attempts"
    `;
  }

  async markPublished(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { publishedAt: new Date(), lastError: null },
    });
  }

  /** Registra a falha; ao atingir `maxAttempts` o evento e retirado da fila (`failed_at`). */
  async markFailed(id: string, error: string, maxAttempts: number): Promise<void> {
    const updated = await this.prisma.outboxEvent.update({
      where: { id },
      data: { attempts: { increment: 1 }, lastError: error },
      select: { attempts: true },
    });
    if (updated.attempts >= maxAttempts) {
      await this.prisma.outboxEvent.update({ where: { id }, data: { failedAt: new Date() } });
    }
  }
}

/**
 * O que vai ao Kafka e JSON; gravar no outbox o mesmo JSON (e nao o objeto em memoria) garante
 * que o publicado e o persistido sao identicos — datas viram string aqui, nao no relay.
 */
function toJsonPayload(event: EventEnvelope<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue;
}
