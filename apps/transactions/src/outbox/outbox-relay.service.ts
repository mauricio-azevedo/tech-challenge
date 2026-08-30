import { describeError, type MessagePublisher } from '@challenge/messaging';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { OutboxRepository, type ClaimedOutboxEvent } from './outbox.repository.js';

export interface RelayOptions {
  pollIntervalMs: number;
  batchSize: number;
  maxAttempts: number;
  claimTimeoutMs: number;
}

export interface RelayTickResult {
  published: number;
  failed: number;
}

/**
 * Publica os eventos do outbox no Kafka. Um `setTimeout` reagendado a cada ciclo (nunca dois
 * ciclos ao mesmo tempo); erro em um evento nao impede os outros, e erro de banco no ciclo e
 * logado e tentado de novo no proximo — o relay nunca derruba o processo.
 */
@Injectable()
export class OutboxRelay implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelay.name);
  private readonly options: RelayOptions;
  private timer: NodeJS.Timeout | undefined;
  private stopped = false;
  private inFlight: Promise<RelayTickResult> | undefined;

  constructor(
    private readonly outbox: OutboxRepository,
    private readonly publisher: KafkaProducerService,
    config: ConfigService<Env, true>,
  ) {
    this.options = {
      pollIntervalMs: config.get('OUTBOX_POLL_INTERVAL_MS', { infer: true }),
      batchSize: config.get('OUTBOX_BATCH_SIZE', { infer: true }),
      maxAttempts: config.get('OUTBOX_MAX_ATTEMPTS', { infer: true }),
      claimTimeoutMs: config.get('OUTBOX_CLAIM_TIMEOUT_MS', { infer: true }),
    };
  }

  onModuleInit(): void {
    this.schedule();
  }

  onModuleDestroy(): Promise<void> {
    return this.stop();
  }

  /**
   * Para o ciclo em segundo plano e espera o que estiver em voo. Alem do shutdown, e usado pelos
   * testes de integracao, que disparam `flush()` na mao e nao podem disputar eventos com o timer.
   */
  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer !== undefined) clearTimeout(this.timer);
    await this.inFlight;
  }

  /** Um ciclo completo, exposto para os testes e para quem quiser forcar a publicacao. */
  flush(): Promise<RelayTickResult> {
    return relayOnce(this.outbox, this.publisher, this.options, this.logger);
  }

  private schedule(): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      this.inFlight = this.flush();
      void this.inFlight.finally(() => {
        this.inFlight = undefined;
        this.schedule();
      });
    }, this.options.pollIntervalMs);
    // Nao segura o processo vivo so por causa do timer.
    this.timer.unref();
  }
}

/** O ciclo em si, sem estado: reivindica, publica, marca. Testavel com fakes. */
export async function relayOnce(
  outbox: Pick<OutboxRepository, 'claimBatch' | 'markPublished' | 'markFailed'>,
  publisher: MessagePublisher,
  options: Pick<RelayOptions, 'batchSize' | 'maxAttempts' | 'claimTimeoutMs'>,
  logger: Pick<Logger, 'warn' | 'error'>,
): Promise<RelayTickResult> {
  let batch: ClaimedOutboxEvent[];
  try {
    batch = await outbox.claimBatch(options.batchSize, options.claimTimeoutMs);
  } catch (error) {
    logger.error(`falha ao reivindicar eventos do outbox: ${describeError(error)}`);
    return { published: 0, failed: 0 };
  }

  const result: RelayTickResult = { published: 0, failed: 0 };
  for (const event of batch) {
    try {
      await publisher.publish({
        topic: event.topic,
        key: event.key,
        value: event.payload,
        headers: { 'x-event-id': event.id },
      });
      await outbox.markPublished(event.id);
      result.published += 1;
    } catch (error) {
      result.failed += 1;
      const description = describeError(error);
      logger.warn(
        `evento ${event.id} (${event.topic}) nao publicado, tentativa ${String(event.attempts + 1)}: ${description}`,
      );
      try {
        await outbox.markFailed(event.id, description, options.maxAttempts);
      } catch (markError) {
        logger.error(`falha ao registrar erro do evento ${event.id}: ${describeError(markError)}`);
      }
    }
  }
  return result;
}
