import { z } from 'zod';

import { transactionValueSchema } from './transaction-value.js';

const accountIdSchema = z.uuid({ error: 'deve ser um identificador (UUID) valido' });

/**
 * Corpo de `POST /transactions`. E o mesmo schema que valida o formulario no dashboard, entao as
 * mensagens sao pensadas para a tela.
 */
export const createTransactionSchema = z.object({
  accountExternalIdDebit: accountIdSchema,
  accountExternalIdCredit: accountIdSchema,
  transferTypeId: z
    .int({ error: 'tipo de transferencia deve ser um inteiro' })
    .positive({ error: 'tipo de transferencia e obrigatorio' }),
  value: transactionValueSchema,
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
