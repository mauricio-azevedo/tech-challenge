import { createEvent, TOPICS, type TransactionStatusUpdatedEvent } from '@challenge/contracts';
import { describe, expect, it, vi } from 'vitest';

import { TransactionStatusService } from './transaction-status.service.js';
import type { StatusUpdateOutcome, TransactionsRepository } from './transactions.repository.js';

const transactionExternalId = '0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f';

function verdict(status: 'APPROVED' | 'REJECTED'): TransactionStatusUpdatedEvent {
  return createEvent(
    TOPICS.TRANSACTION_STATUS_UPDATED,
    {
      transactionExternalId,
      status,
      ...(status === 'REJECTED' ? { reason: 'VALUE_ABOVE_LIMIT' as const } : {}),
      evaluatedAt: '2026-08-30T12:00:05.000Z',
    },
    { correlationId: 'req-1', causationId: '0191c2f0-3a4b-7c5d-8e6f-000000000001' },
  );
}

function serviceWith(outcome: StatusUpdateOutcome | Error) {
  const applyFinalStatus = vi.fn<TransactionsRepository['applyFinalStatus']>(() =>
    outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome),
  );
  const repository = { applyFinalStatus } as unknown as TransactionsRepository;
  return { service: new TransactionStatusService(repository), applyFinalStatus };
}

describe('TransactionStatusService', () => {
  it('aplica o veredito na transacao certa', async () => {
    const { service, applyFinalStatus } = serviceWith('applied');

    await expect(service.apply(verdict('REJECTED'))).resolves.toBe('applied');
    expect(applyFinalStatus).toHaveBeenCalledWith(transactionExternalId, 'REJECTED');
  });

  it.each(['already-final', 'not-found'] as const)(
    'confirma a mensagem sem erro quando o desfecho e %s: repetir nao mudaria nada',
    async (outcome) => {
      const { service } = serviceWith(outcome);

      await expect(service.apply(verdict('APPROVED'))).resolves.toBe(outcome);
    },
  );

  it('propaga erro de infraestrutura para o consumer repetir', async () => {
    const { service } = serviceWith(new Error('banco fora'));

    await expect(service.apply(verdict('APPROVED'))).rejects.toThrow('banco fora');
  });
});
