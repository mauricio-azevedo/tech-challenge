'use client';

import type { TransactionResponse } from '@challenge/contracts';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { NewTransactionForm } from './new-transaction-form';

/** Criacao em dialog (mockup), aberta pela URL /transactions/new; fechar navega de volta. */
export function NewTransactionDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (transaction: TransactionResponse) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-[512px]">
        <DialogHeader className="gap-1 px-6 pt-[22px] pb-1.5 text-left">
          <DialogTitle className="text-[16.5px] font-semibold tracking-tight">
            Nova transação
          </DialogTitle>
          <DialogDescription className="text-[13px] text-pretty">
            A transação entra como pendente e é liberada assim que a análise de segurança terminar.
          </DialogDescription>
        </DialogHeader>
        <NewTransactionForm onCancel={onClose} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}
