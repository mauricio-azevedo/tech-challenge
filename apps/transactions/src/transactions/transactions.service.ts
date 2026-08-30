import {
  TOPICS,
  type CreateTransactionInput,
  type ListTransactionsQuery,
  type PaginatedTransactionsResponse,
  type TransactionResponse,
  type TransactionStatsResponse,
} from '@challenge/contracts';
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { buildTransactionCreatedEvent } from './transaction-created.event.js';
import { toTransactionResponse, toTransactionStatsResponse } from './transaction.mapper.js';
import { TransactionsRepository } from './transactions.repository.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}

  /**
   * A transacao nasce PENDING; o veredito chega depois, pelo evento de resposta do antifraude.
   * O evento `transaction.created` sai pelo outbox, gravado junto com a transacao.
   */
  async create(input: CreateTransactionInput, correlationId: string): Promise<TransactionResponse> {
    if (!(await this.repository.typeExists(input.transferTypeId))) {
      throw new UnprocessableEntityException(
        `tipo de transferencia ${String(input.transferTypeId)} nao existe`,
      );
    }

    const created = await this.repository.createWithOutbox(
      {
        accountExternalIdDebit: input.accountExternalIdDebit,
        accountExternalIdCredit: input.accountExternalIdCredit,
        transactionTypeId: input.transferTypeId,
        value: input.value,
      },
      {
        topic: TOPICS.TRANSACTION_CREATED,
        build: (transaction) => buildTransactionCreatedEvent(transaction, correlationId),
      },
    );

    return toTransactionResponse(created);
  }

  async findByExternalId(transactionExternalId: string): Promise<TransactionResponse> {
    const transaction = await this.repository.findById(transactionExternalId);
    if (transaction === null) {
      throw new NotFoundException(`transacao ${transactionExternalId} nao encontrada`);
    }
    return toTransactionResponse(transaction);
  }

  async stats(): Promise<TransactionStatsResponse> {
    return toTransactionStatsResponse(await this.repository.countByStatus());
  }

  async list(query: ListTransactionsQuery): Promise<PaginatedTransactionsResponse> {
    const { items, total } = await this.repository.findPage(query);
    return {
      data: items.map(toTransactionResponse),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
}
