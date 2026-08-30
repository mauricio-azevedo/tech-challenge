import { z } from 'zod';

import { transactionStatusSchema } from './transaction-status.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const isoDateSchema = z.iso.date({ error: 'data deve estar no formato AAAA-MM-DD' });

/**
 * Query string de `GET /transactions`. Query params chegam como string, por isso a coercao.
 * O periodo (`from`/`to`) e em dias, inclusivo nas duas pontas e interpretado em UTC.
 */
export const listTransactionsQuerySchema = z
  .object({
    status: transactionStatusSchema.optional(),
    transferTypeId: z.coerce.number().int().positive().optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    error: 'data inicial nao pode ser posterior a data final',
    path: ['from'],
  });

/** Entrada crua (antes de defaults e coercao), util para montar a query string no cliente. */
export type ListTransactionsQueryInput = z.input<typeof listTransactionsQuerySchema>;

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
