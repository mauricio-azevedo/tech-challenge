import { z } from 'zod';

/**
 * Totais da listagem para o dashboard: contagem por status e volume aprovado. Sem filtros por
 * enquanto — os numeros falam do periodo inteiro; `?from&to` e a extensao natural se precisar.
 */
export const transactionStatsResponseSchema = z.object({
  total: z.int().nonnegative(),
  byStatus: z.object({
    PENDING: z.int().nonnegative(),
    APPROVED: z.int().nonnegative(),
    REJECTED: z.int().nonnegative(),
  }),
  approvedVolume: z.number().nonnegative(),
});

export type TransactionStatsResponse = z.infer<typeof transactionStatsResponseSchema>;
