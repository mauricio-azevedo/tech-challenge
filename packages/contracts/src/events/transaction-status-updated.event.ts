import { z } from 'zod';

import { finalTransactionStatusSchema } from '../transactions/transaction-status.js';
import { eventEnvelopeSchema } from './envelope.js';
import { TOPICS } from './topics.js';

export const REJECTION_REASONS = ['VALUE_ABOVE_LIMIT'] as const;

export const rejectionReasonSchema = z.enum(REJECTION_REASONS);

export type RejectionReason = z.infer<typeof rejectionReasonSchema>;

/** Publicado pelo antifraude com o veredito; `reason` so acompanha rejeicoes. */
export const transactionStatusUpdatedDataSchema = z.object({
  transactionExternalId: z.uuid(),
  status: finalTransactionStatusSchema,
  reason: rejectionReasonSchema.optional(),
  evaluatedAt: z.iso.datetime(),
});

export type TransactionStatusUpdatedData = z.infer<typeof transactionStatusUpdatedDataSchema>;

export const transactionStatusUpdatedEventSchema = eventEnvelopeSchema(
  TOPICS.TRANSACTION_STATUS_UPDATED,
  transactionStatusUpdatedDataSchema,
);

export type TransactionStatusUpdatedEvent = z.infer<typeof transactionStatusUpdatedEventSchema>;
