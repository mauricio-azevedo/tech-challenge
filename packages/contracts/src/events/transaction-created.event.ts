import { z } from 'zod';

import { transactionValueSchema } from '../transactions/transaction-value.js';
import { eventEnvelopeSchema } from './envelope.js';
import { TOPICS } from './topics.js';

/** Publicado pelo servico de transacoes assim que uma transacao e gravada como PENDING. */
export const transactionCreatedDataSchema = z.object({
  transactionExternalId: z.uuid(),
  accountExternalIdDebit: z.uuid(),
  accountExternalIdCredit: z.uuid(),
  transferTypeId: z.int().positive(),
  value: transactionValueSchema,
  createdAt: z.iso.datetime(),
});

export type TransactionCreatedData = z.infer<typeof transactionCreatedDataSchema>;

export const transactionCreatedEventSchema = eventEnvelopeSchema(
  TOPICS.TRANSACTION_CREATED,
  transactionCreatedDataSchema,
);

export type TransactionCreatedEvent = z.infer<typeof transactionCreatedEventSchema>;
