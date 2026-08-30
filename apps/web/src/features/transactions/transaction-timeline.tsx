import type { TransactionResponse } from '@challenge/contracts';

import { formatDateTime } from '@/lib/transaction-labels';
import { cn } from '@/lib/utils';

interface Step {
  topic: string;
  actor: string;
  ts: string;
  done: boolean;
}

/**
 * O "Histórico" do mockup, derivado apenas do que o backend registra: criacao e enfileiramento
 * compartilham o createdAt (o outbox entra na mesma transacao de banco); conclusao e aplicacao
 * do veredito compartilham o updatedAt. Nada de timestamp inventado.
 */
export function TransactionTimeline({ transaction }: { transaction: TransactionResponse }) {
  const status = transaction.transactionStatus.name;
  const pending = status === 'PENDING';
  const created = formatDateTime(transaction.createdAt);
  const resolved = pending ? '—' : formatDateTime(transaction.updatedAt);

  const steps: Step[] = [
    { topic: 'Transação criada', actor: 'Registrada como pendente', ts: created, done: true },
    {
      topic: 'Enviada para análise',
      actor: 'Verificação de segurança iniciada',
      ts: created,
      done: true,
    },
    {
      topic: 'Análise concluída',
      actor: pending
        ? 'Aguardando resultado'
        : status === 'APPROVED'
          ? 'Transação liberada'
          : 'Transação recusada',
      ts: resolved,
      done: !pending,
    },
    {
      topic: 'Status atualizado',
      actor: pending ? 'Aguardando' : 'Resultado aplicado à transação',
      ts: resolved,
      done: !pending,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13.5px] font-semibold">Histórico</span>
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const next = steps[index + 1];
          return (
            <li key={step.topic} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3">
              <div aria-hidden="true" className="flex flex-col items-center">
                <span
                  className={cn(
                    'mt-1 size-[11px] rounded-full border-2',
                    step.done ? 'border-primary bg-primary' : 'border-border bg-background',
                  )}
                />
                {next !== undefined && (
                  <span
                    className={cn(
                      'min-h-[18px] w-[1.5px] flex-1',
                      next.done ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}
              </div>
              <div className="flex flex-col gap-0.5 pb-4">
                <span
                  className={cn(
                    'text-[13px] font-medium',
                    step.done ? 'text-foreground' : 'text-zinc-400',
                  )}
                >
                  {step.topic}
                </span>
                <span className="text-[12.5px] text-muted-foreground">{step.actor}</span>
                <span className="text-[11.5px] text-zinc-400 tabular-nums">{step.ts}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
