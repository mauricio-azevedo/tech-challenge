import {
  createEvent,
  TOPICS,
  type TransactionCreatedEvent,
  type TransactionStatusUpdatedEvent,
} from '@challenge/contracts';
import type { IncomingMessage, MessagePublisher } from '@challenge/messaging';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { MESSAGE_PUBLISHER } from '../kafka/kafka.tokens.js';
import { evaluateTransaction } from './fraud-policy.js';

/**
 * Avalia cada transacao criada e publica o veredito. E stateless: reavaliar a mesma transacao
 * (redelivery) produz o mesmo veredito, e quem consome o veredito e idempotente.
 */
@Injectable()
export class TransactionCreatedHandler {
  private readonly logger = new Logger(TransactionCreatedHandler.name);
  private readonly valueLimit: number;

  constructor(
    @Inject(MESSAGE_PUBLISHER) private readonly publisher: MessagePublisher,
    config: ConfigService<Env, true>,
  ) {
    this.valueLimit = config.get('ANTI_FRAUD_VALUE_LIMIT', { infer: true });
  }

  async handle(
    message: IncomingMessage<TransactionCreatedEvent>,
    now: () => Date = () => new Date(),
  ): Promise<TransactionStatusUpdatedEvent> {
    const created = message.payload;
    const verdict = evaluateTransaction(created.data, { valueLimit: this.valueLimit });

    const updated = createEvent(
      TOPICS.TRANSACTION_STATUS_UPDATED,
      {
        transactionExternalId: created.data.transactionExternalId,
        status: verdict.status,
        ...(verdict.reason === undefined ? {} : { reason: verdict.reason }),
        evaluatedAt: now().toISOString(),
      },
      // O veredito e causado pelo evento de criacao e pertence a mesma requisicao.
      { correlationId: created.correlationId, causationId: created.eventId },
      now,
    );

    await this.publisher.publish({
      topic: TOPICS.TRANSACTION_STATUS_UPDATED,
      key: created.data.transactionExternalId,
      value: updated,
      headers: { 'x-event-id': updated.eventId, 'x-correlation-id': updated.correlationId },
    });

    this.logger.log(
      `transacao ${created.data.transactionExternalId} ${verdict.status} (valor ${String(created.data.value)}, correlationId ${created.correlationId})`,
    );
    return updated;
  }
}
