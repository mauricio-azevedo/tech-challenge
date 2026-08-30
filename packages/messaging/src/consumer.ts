import type { Consumer, EachMessagePayload, Kafka } from 'kafkajs';

import { decodeHeaders } from './headers.js';
import { describeError, silentLogger, type MessagingLogger } from './logger.js';
import type { MessagePublisher } from './producer.js';

/** Compativel com `zod.safeParse`; o pacote nao depende do zod para isso. */
export interface MessageSchema<T> {
  safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: Error };
}

export interface IncomingMessage<T> {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  headers: Record<string, string>;
  payload: T;
}

export type MessageHandler<T> = (message: IncomingMessage<T>) => Promise<void>;

export interface Subscription {
  topic: string;
  schema: MessageSchema<unknown>;
  handler: MessageHandler<never>;
}

/** Amarra o tipo do schema ao do handler; a lista de assinaturas em si e heterogenea. */
export function subscription<T>(
  topic: string,
  schema: MessageSchema<T>,
  handler: MessageHandler<T>,
): Subscription {
  return { topic, schema, handler };
}

export interface RetryPolicy {
  /** Tentativas do handler, contando a primeira. */
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

/** ~1,75s de espera total no pior caso: bem abaixo do sessionTimeout de 30s do grupo. */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialBackoffMs: 250,
  maxBackoffMs: 2_000,
};

export type FailureReason = 'INVALID_JSON' | 'SCHEMA_VALIDATION' | 'HANDLER_FAILED';

export interface RawMessage {
  topic: string;
  partition: number;
  offset: string;
  key: Buffer | null;
  value: Buffer | null;
  headers: Record<string, string>;
}

export interface ProcessingDependencies {
  deadLetter: MessagePublisher;
  deadLetterTopic: (topic: string) => string;
  retry: RetryPolicy;
  logger: MessagingLogger;
  sleep: (ms: number) => Promise<void>;
  heartbeat: () => Promise<void>;
  now: () => Date;
}

export type ProcessingOutcome =
  | { outcome: 'processed'; attempts: number }
  | { outcome: 'dead-lettered'; reason: FailureReason; attempts: number };

function backoffFor(attempt: number, retry: RetryPolicy): number {
  return Math.min(retry.initialBackoffMs * 2 ** (attempt - 1), retry.maxBackoffMs);
}

/**
 * Politica unica de consumo, isolada do kafkajs para ser testavel:
 * 1. JSON invalido ou payload fora do schema vai direto para a DLQ — repetir nao muda o resultado.
 * 2. Handler que lanca e repetido com backoff exponencial, **sem sair da particao** (a ordem por
 *    chave se mantem), chamando `heartbeat` para o grupo nao considerar o consumer morto.
 * 3. Esgotadas as tentativas, a mensagem original vai para a DLQ com o motivo nos headers e o
 *    offset avanca: uma mensagem venenosa nunca trava a fila.
 */
export async function processMessage(
  subscription: Subscription,
  raw: RawMessage,
  deps: ProcessingDependencies,
): Promise<ProcessingOutcome> {
  const text = raw.value?.toString('utf8') ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    await sendToDeadLetter(raw, deps, { reason: 'INVALID_JSON', error, attempts: 0 });
    return { outcome: 'dead-lettered', reason: 'INVALID_JSON', attempts: 0 };
  }

  const validation = subscription.schema.safeParse(parsed);
  if (!validation.success) {
    await sendToDeadLetter(raw, deps, {
      reason: 'SCHEMA_VALIDATION',
      error: validation.error,
      attempts: 0,
    });
    return { outcome: 'dead-lettered', reason: 'SCHEMA_VALIDATION', attempts: 0 };
  }

  const message: IncomingMessage<never> = {
    topic: raw.topic,
    partition: raw.partition,
    offset: raw.offset,
    key: raw.key?.toString('utf8') ?? null,
    headers: raw.headers,
    payload: validation.data as never,
  };

  for (let attempt = 1; ; attempt += 1) {
    try {
      await subscription.handler(message);
      return { outcome: 'processed', attempts: attempt };
    } catch (error) {
      if (attempt >= deps.retry.maxAttempts) {
        await sendToDeadLetter(raw, deps, { reason: 'HANDLER_FAILED', error, attempts: attempt });
        return { outcome: 'dead-lettered', reason: 'HANDLER_FAILED', attempts: attempt };
      }
      const backoff = backoffFor(attempt, deps.retry);
      deps.logger.warn(
        `${raw.topic}[${String(raw.partition)}]@${raw.offset}: tentativa ${String(attempt)} falhou (${describeError(error)}); nova tentativa em ${String(backoff)}ms`,
      );
      await deps.heartbeat();
      await deps.sleep(backoff);
    }
  }
}

interface FailureDetails {
  reason: FailureReason;
  error: unknown;
  attempts: number;
}

async function sendToDeadLetter(
  raw: RawMessage,
  deps: ProcessingDependencies,
  failure: FailureDetails,
): Promise<void> {
  const target = deps.deadLetterTopic(raw.topic);
  deps.logger.error(
    `${raw.topic}[${String(raw.partition)}]@${raw.offset} -> ${target}: ${failure.reason} (${describeError(failure.error)})`,
  );
  await deps.deadLetter.publishRaw({
    topic: target,
    key: raw.key?.toString('utf8') ?? null,
    value: raw.value,
    headers: {
      ...raw.headers,
      'x-original-topic': raw.topic,
      'x-original-partition': String(raw.partition),
      'x-original-offset': raw.offset,
      'x-failure-reason': failure.reason,
      'x-error': describeError(failure.error),
      'x-attempts': String(failure.attempts),
      'x-failed-at': deps.now().toISOString(),
    },
  });
}

export interface ConsumerOptions {
  groupId: string;
  subscriptions: Subscription[];
  deadLetter: MessagePublisher;
  deadLetterTopic?: (topic: string) => string;
  retry?: Partial<RetryPolicy>;
  logger?: MessagingLogger;
}

export interface RunningConsumer {
  stop: () => Promise<void>;
}

const defaultDeadLetterTopic = (topic: string): string => `${topic}.dlq`;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function toRawMessage(payload: EachMessagePayload): RawMessage {
  return {
    topic: payload.topic,
    partition: payload.partition,
    offset: payload.message.offset,
    key: payload.message.key,
    value: payload.message.value,
    headers: decodeHeaders(payload.message.headers),
  };
}

/**
 * Assina os topicos e processa mensagem a mensagem com a politica acima. `fromBeginning: true`:
 * um grupo novo comeca do inicio do topico, entao eventos publicados antes de o servico subir
 * pela primeira vez nao se perdem.
 */
export async function runConsumer(
  kafka: Pick<Kafka, 'consumer'>,
  options: ConsumerOptions,
): Promise<RunningConsumer> {
  const logger = options.logger ?? silentLogger;
  const byTopic = new Map(options.subscriptions.map((sub) => [sub.topic, sub]));
  const deps: Omit<ProcessingDependencies, 'heartbeat'> = {
    deadLetter: options.deadLetter,
    deadLetterTopic: options.deadLetterTopic ?? defaultDeadLetterTopic,
    retry: { ...DEFAULT_RETRY_POLICY, ...options.retry },
    logger,
    sleep,
    now: () => new Date(),
  };

  const consumer: Consumer = kafka.consumer({ groupId: options.groupId });
  await consumer.connect();
  for (const topic of byTopic.keys()) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }
  await consumer.run({
    eachMessage: async (payload) => {
      const sub = byTopic.get(payload.topic);
      if (sub === undefined) return;
      await processMessage(sub, toRawMessage(payload), {
        ...deps,
        heartbeat: () => payload.heartbeat(),
      });
    },
  });
  logger.log(`consumindo ${[...byTopic.keys()].join(', ')} como ${options.groupId}`);

  return { stop: () => consumer.disconnect() };
}
