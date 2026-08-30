import type {
  ListTransactionsQuery,
  PaginatedTransactionsResponse,
  TransactionResponse,
} from '@challenge/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';

import { toTransactionResponse } from './transaction.mapper.js';
import { TransactionsRepository } from './transactions.repository.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}

  async findByExternalId(transactionExternalId: string): Promise<TransactionResponse> {
    const transaction = await this.repository.findById(transactionExternalId);
    if (transaction === null) {
      throw new NotFoundException(`transacao ${transactionExternalId} nao encontrada`);
    }
    return toTransactionResponse(transaction);
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
