'use client';

import {
  createTransactionSchema,
  type CreateTransactionInput,
  type TransactionResponse,
} from '@challenge/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useId } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { shortId } from '@/lib/transaction-labels';

import { GenerateUuidButton } from './generate-uuid-button';
import { useTransactionTypes } from './hooks';
import { TransferTypePicker } from './transfer-type-picker';
import { useCreateTransaction } from './use-create-transaction';

const FIELDS: FieldPath<CreateTransactionInput>[] = [
  'accountExternalIdDebit',
  'accountExternalIdCredit',
  'transferTypeId',
  'value',
];

const UUID_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/**
 * O formulario valida com o **mesmo schema** que a API (`createTransactionSchema`): o que a tela
 * aceita, o backend aceita. Um 400 da API (que nao deveria acontecer) ainda assim volta para o
 * campo certo via `fieldErrors`. A unica dica de um campo e a mensagem de erro: quando nao ha
 * erro, nao ha no de dica nem `aria-describedby`.
 */
export function NewTransactionForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (transaction: TransactionResponse) => void;
}) {
  const types = useTransactionTypes();
  const formId = useId();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: { accountExternalIdDebit: '', accountExternalIdCredit: '' },
  });

  const create = useCreateTransaction((transaction) => {
    toast('Transação criada', {
      description: `Pendente de análise · ID ${shortId(transaction.transactionExternalId)}`,
      icon: <span aria-hidden="true" className="size-2 rounded-full bg-status-pending" />,
    });
    onCreated(transaction);
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

  const hintId = (field: FieldPath<CreateTransactionInput>) => `${formId}-${field}-hint`;

  const errorHint = (field: FieldPath<CreateTransactionInput>) => {
    const message = errors[field]?.message;
    if (message === undefined) return undefined;
    return (
      <p id={hintId(field)} className="text-[11.5px] text-status-rejected-fg">
        {message}
      </p>
    );
  };

  const describedBy = (field: FieldPath<CreateTransactionInput>) =>
    errors[field] === undefined ? undefined : hintId(field);

  const fillWithUuid = (
    field: 'accountExternalIdDebit' | 'accountExternalIdCredit',
    uuid: string,
  ) => {
    setValue(field, uuid, { shouldValidate: true });
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
    >
      <div className="flex flex-col gap-[15px] px-6 pt-4 pb-[22px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-debit`} className="text-[12.5px]">
            Conta de origem
          </Label>
          <div className="relative">
            <Input
              id={`${formId}-debit`}
              placeholder={UUID_PLACEHOLDER}
              autoComplete="off"
              className="h-9 pr-9 font-mono text-[13px]"
              aria-invalid={errors.accountExternalIdDebit !== undefined}
              aria-describedby={describedBy('accountExternalIdDebit')}
              {...register('accountExternalIdDebit')}
            />
            <GenerateUuidButton
              label="Gerar UUID da conta de origem"
              onGenerate={(uuid) => {
                fillWithUuid('accountExternalIdDebit', uuid);
              }}
            />
          </div>
          {errorHint('accountExternalIdDebit')}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-credit`} className="text-[12.5px]">
            Conta de destino
          </Label>
          <div className="relative">
            <Input
              id={`${formId}-credit`}
              placeholder={UUID_PLACEHOLDER}
              autoComplete="off"
              className="h-9 pr-9 font-mono text-[13px]"
              aria-invalid={errors.accountExternalIdCredit !== undefined}
              aria-describedby={describedBy('accountExternalIdCredit')}
              {...register('accountExternalIdCredit')}
            />
            <GenerateUuidButton
              label="Gerar UUID da conta de destino"
              onGenerate={(uuid) => {
                fillWithUuid('accountExternalIdCredit', uuid);
              }}
            />
          </div>
          {errorHint('accountExternalIdCredit')}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-value`} className="text-[12.5px]">
            Valor (R$)
          </Label>
          <Input
            id={`${formId}-value`}
            type="text"
            inputMode="decimal"
            placeholder="120,00"
            autoComplete="off"
            className="h-9 font-mono text-[13px]"
            aria-invalid={errors.value !== undefined}
            aria-describedby={describedBy('value')}
            {...register('value', {
              // O campo aceita virgula como no mockup; vazio vira NaN, o mesmo que valueAsNumber
              // faria, para o schema apontar o campo.
              setValueAs: (raw: unknown) =>
                typeof raw === 'string'
                  ? raw.trim() === ''
                    ? Number.NaN
                    : Number(raw.replace(',', '.'))
                  : raw,
            })}
          />
          {errorHint('value')}
        </div>

        <div className="flex flex-col gap-1.5">
          <span id={`${formId}-type-label`} className="text-[12.5px] font-medium">
            Tipo de transferência
          </span>
          <Controller
            control={control}
            name="transferTypeId"
            render={({ field }) => (
              <TransferTypePicker
                types={types.data ?? []}
                value={field.value}
                onChange={field.onChange}
                labelId={`${formId}-type-label`}
                hintId={describedBy('transferTypeId')}
                invalid={errors.transferTypeId !== undefined}
              />
            )}
          />
          {errorHint('transferTypeId')}
        </div>

        {generalError !== undefined && (
          <p
            role="alert"
            className="rounded-md border border-status-rejected-border bg-status-rejected-bg px-3.5 py-3 text-[13px] text-status-rejected-fg"
          >
            {generalError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-6 py-3.5">
        <Button
          type="button"
          variant="outline"
          className="h-9 px-3.5 text-[13.5px]"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending} className="h-9 gap-2 px-4 text-[13.5px]">
          {create.isPending && <Loader2 aria-hidden="true" className="size-[13px] animate-spin" />}
          {create.isPending ? 'Enviando…' : 'Criar transação'}
        </Button>
      </div>
    </form>
  );
}
