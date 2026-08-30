import { z } from 'zod';

/** Versao do envelope. Muda quando a forma do envelope (nao do payload) muda de modo incompativel. */
export const EVENT_VERSION = 1;

/**
 * Todo evento viaja num envelope com identidade (`eventId`), tipo, versao, instante e rastreio:
 * `correlationId` liga tudo que aconteceu por causa de uma mesma requisicao; `causationId` aponta
 * o evento que provocou este. O payload de negocio fica em `data`.
 */
export function eventEnvelopeSchema<TType extends string, TData extends z.ZodType>(
  eventType: TType,
  data: TData,
) {
  return z.object({
    eventId: z.uuid(),
    eventType: z.literal(eventType),
    version: z.literal(EVENT_VERSION),
    occurredAt: z.iso.datetime(),
    correlationId: z.string().min(1),
    causationId: z.uuid().optional(),
    data,
  });
}

export interface EventEnvelope<TType extends string, TData> {
  eventId: string;
  eventType: TType;
  version: typeof EVENT_VERSION;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  data: TData;
}

export interface EventMetadata {
  correlationId: string;
  causationId?: string;
}

/** Monta um envelope valido; `clock` existe para os testes controlarem `occurredAt`. */
export function createEvent<TType extends string, TData>(
  eventType: TType,
  data: TData,
  metadata: EventMetadata,
  clock: () => Date = () => new Date(),
): EventEnvelope<TType, TData> {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    version: EVENT_VERSION,
    occurredAt: clock().toISOString(),
    correlationId: metadata.correlationId,
    ...(metadata.causationId === undefined ? {} : { causationId: metadata.causationId }),
    data,
  };
}
