import { z } from 'zod';

import { transactionStatusSchema } from './transaction-status.js';

/** Identificador externo de uma transacao (o `id` UUID do registro). */
export const transactionExternalIdSchema = z.uuid({
  error: 'identificador deve ser um UUID valido',
});

export const transactionTypeResponseSchema = z.object({
  id: z.int().positive(),
  name: z.string().min(1),
});

export type TransactionTypeResponse = z.infer<typeof transactionTypeResponseSchema>;

/**
 * Representacao de uma transacao na API. Cobre o contrato do desafio (`transactionExternalId`,
 * `transactionType.name`, `transactionStatus.name`, `value`, `createdAt`) e acrescenta as contas e
 * `updatedAt`, que o detalhe no dashboard precisa mostrar.
 */
export const transactionResponseSchema = z.object({
  transactionExternalId: transactionExternalIdSchema,
  accountExternalIdDebit: z.uuid(),
  accountExternalIdCredit: z.uuid(),
  transactionType: transactionTypeResponseSchema,
  transactionStatus: z.object({ name: transactionStatusSchema }),
  value: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;

export const paginatedTransactionsResponseSchema = z.object({
  data: z.array(transactionResponseSchema),
  page: z.int().positive(),
  pageSize: z.int().positive(),
  total: z.int().nonnegative(),
});

export type PaginatedTransactionsResponse = z.infer<typeof paginatedTransactionsResponseSchema>;

/** Formato unico de erro da API; `errors` so aparece em falhas de validacao. */
export const apiErrorResponseSchema = z.object({
  statusCode: z.int(),
  message: z.string(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
