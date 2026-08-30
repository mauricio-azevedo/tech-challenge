'use client';

import type { CreateTransactionInput, TransactionResponse } from '@challenge/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTransaction, transactionKeys } from './api';

/** Cria a transacao e invalida a listagem, para que a nova apareca ao voltar. */
export function useCreateTransaction(onCreated: (transaction: TransactionResponse) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: async (transaction) => {
      queryClient.setQueryData(
        transactionKeys.detail(transaction.transactionExternalId),
        transaction,
      );
      await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      onCreated(transaction);
    },
  });
}
