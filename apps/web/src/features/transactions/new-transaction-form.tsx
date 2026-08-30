'use client';

import { createTransactionSchema, type CreateTransactionInput } from '@challenge/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useId } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';

import { ApiError } from '@/lib/api-client';

import { useTransactionTypes } from './hooks';
import { useCreateTransaction } from './use-create-transaction';

const inputClass =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500 border-slate-300 focus:border-slate-500 focus:ring-slate-500';

const FIELDS: FieldPath<CreateTransactionInput>[] = [
  'accountExternalIdDebit',
  'accountExternalIdCredit',
  'transferTypeId',
  'value',
];

/**
 * O formulario valida com o **mesmo schema** que a API (`createTransactionSchema`): o que a tela
 * aceita, o backend aceita. Um 400 da API (que nao deveria acontecer) ainda assim volta para o
 * campo certo via `fieldErrors`.
 */
export function NewTransactionForm() {
  const router = useRouter();
  const types = useTransactionTypes();
  const formId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: { accountExternalIdDebit: '', accountExternalIdCredit: '' },
  });

  const create = useCreateTransaction((transaction) => {
    router.push(`/transactions/${transaction.transactionExternalId}`);
  });

  const onSubmit = handleSubmit(async (input) => {
    try {
      await create.mutateAsync(input);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of FIELDS) {
          const message = error.fieldErrors[field];
          if (message !== undefined) setError(field, { type: 'server', message });
        }
      }
      // Erros sem campo (422, 503, rede) aparecem no alerta abaixo, via `create.error`.
    }
  });

  const describedBy = (field: FieldPath<CreateTransactionInput>) =>
    errors[field] === undefined ? undefined : `${formId}-${field}-error`;

  const fieldError = (field: FieldPath<CreateTransactionInput>) => {
    const error = errors[field];
    if (error?.message === undefined) return null;
    return (
      <p id={`${formId}-${field}-error`} className="text-sm text-rose-700">
        {error.message}
      </p>
    );
  };

  const generalError =
    create.isError &&
    Object.keys(create.error instanceof ApiError ? create.error.fieldErrors : {}).length === 0
      ? create.error.message
      : undefined;

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      noValidate
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="space-y-1">
        <label htmlFor={`${formId}-debit`} className="text-sm font-medium text-slate-700">
          Conta de débito
        </label>
        <input
          id={`${formId}-debit`}
          className={inputClass}
          placeholder="UUID da conta de origem"
          autoComplete="off"
          aria-invalid={errors.accountExternalIdDebit !== undefined}
          aria-describedby={describedBy('accountExternalIdDebit')}
          {...register('accountExternalIdDebit')}
        />
        {fieldError('accountExternalIdDebit')}
      </div>

      <div className="space-y-1">
        <label htmlFor={`${formId}-credit`} className="text-sm font-medium text-slate-700">
          Conta de crédito
        </label>
        <input
          id={`${formId}-credit`}
          className={inputClass}
          placeholder="UUID da conta de destino"
          autoComplete="off"
          aria-invalid={errors.accountExternalIdCredit !== undefined}
          aria-describedby={describedBy('accountExternalIdCredit')}
          {...register('accountExternalIdCredit')}
        />
        {fieldError('accountExternalIdCredit')}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${formId}-type`} className="text-sm font-medium text-slate-700">
            Tipo de transferência
          </label>
          <select
            id={`${formId}-type`}
            className={inputClass}
            aria-invalid={errors.transferTypeId !== undefined}
            aria-describedby={describedBy('transferTypeId')}
            {...register('transferTypeId', {
              // <select> entrega string; o schema espera o id numerico.
              setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
            })}
          >
            <option value="">Selecione</option>
            {(types.data ?? []).map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {fieldError('transferTypeId')}
        </div>

        <div className="space-y-1">
          <label htmlFor={`${formId}-value`} className="text-sm font-medium text-slate-700">
            Valor (R$)
          </label>
          <input
            id={`${formId}-value`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            className={inputClass}
            aria-invalid={errors.value !== undefined}
            aria-describedby={describedBy('value')}
            {...register('value', { valueAsNumber: true })}
          />
          {fieldError('value')}
        </div>
      </div>

      {generalError !== undefined && (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
        >
          {generalError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting || create.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {create.isPending ? 'Criando…' : 'Criar transação'}
        </button>
      </div>
    </form>
  );
}
