import { z } from 'zod';

import { transactionValueSchema } from './transaction-value.js';

const accountIdSchema = z.uuid({ error: 'deve ser um identificador (UUID) valido' });

/**
 * Corpo de `POST /transactions`. E o mesmo schema que valida o formulario no dashboard, entao as
 * mensagens sao pensadas para a tela.
 */
export const createTransactionSchema = z
  .object({
    accountExternalIdDebit: accountIdSchema,
    accountExternalIdCredit: accountIdSchema,
    transferTypeId: z
      .int({ error: 'tipo de transferencia deve ser um inteiro' })
      .positive({ error: 'tipo de transferencia e obrigatorio' }),
    value: transactionValueSchema,
  })
  // Transferir de uma conta para ela mesma nao move dinheiro nenhum: e erro de digitacao, e a
  // mensagem aponta o destino, que e o campo que o usuario corrige.
  .refine((input) => input.accountExternalIdDebit !== input.accountExternalIdCredit, {
    path: ['accountExternalIdCredit'],
    error: 'conta de destino deve ser diferente da conta de origem',
  });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
