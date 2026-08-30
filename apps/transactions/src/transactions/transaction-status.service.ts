import type { TransactionStatusUpdatedEvent } from '@challenge/contracts';
import { Injectable, Logger } from '@nestjs/common';

import { TransactionsRepository, type StatusUpdateOutcome } from './transactions.repository.js';

/**
 * Consome o veredito do antifraude. Tres desfechos, nenhum deles erro de processamento:
 * aplicado; ja era final (entrega repetida ou veredito duplicado — no-op); desconhecido (com o
 * outbox isso nao deveria acontecer, porque a transacao e gravada antes de o evento sair —
 * fica em log de alerta e a mensagem e confirmada, porque repetir nao a faria existir).
 * Erro de infraestrutura (banco fora) propaga: o consumer repete com backoff e, por fim, DLQ.
 */
@Injectable()
export class TransactionStatusService {
  private readonly logger = new Logger(TransactionStatusService.name);

  constructor(private readonly repository: TransactionsRepository) {}

  async apply(event: TransactionStatusUpdatedEvent): Promise<StatusUpdateOutcome> {
    const { transactionExternalId, status, reason } = event.data;
    const outcome = await this.repository.applyFinalStatus(transactionExternalId, status);

    const context = `transacao ${transactionExternalId} (correlationId ${event.correlationId}, eventId ${event.eventId})`;
    switch (outcome) {
      case 'applied':
        this.logger.log(`${context}: ${status}${reason === undefined ? '' : ` (${reason})`}`);
        break;
      case 'already-final':
        this.logger.log(`${context}: veredito ignorado, status ja era final`);
        break;
      case 'not-found':
        this.logger.warn(`${context}: veredito para transacao desconhecida, ignorado`);
        break;
    }
    return outcome;
  }
}
