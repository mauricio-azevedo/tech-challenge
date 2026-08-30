import type { ListTransactionsQuery } from '@challenge/contracts';
import { Injectable } from '@nestjs/common';

import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toCreatedAtRange } from './period.js';
import type { TransactionWithType } from './transaction.mapper.js';

export interface TransactionPage {
  items: TransactionWithType[];
  total: number;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<TransactionWithType | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { transactionType: true },
    });
  }

  async findPage(query: ListTransactionsQuery): Promise<TransactionPage> {
    const where = toWhere(query);
    // Itens e total na mesma transacao: a contagem reflete a mesma foto dos dados que a pagina.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { transactionType: true },
        // `id` (UUID v7, ordenavel) desempata timestamps iguais e mantem a paginacao estavel.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total };
  }
}

function toWhere(query: ListTransactionsQuery): Prisma.TransactionWhereInput {
  const createdAt = toCreatedAtRange(query.from, query.to);
  return {
    ...(query.status === undefined ? {} : { status: query.status }),
    ...(query.transferTypeId === undefined ? {} : { transactionTypeId: query.transferTypeId }),
    ...(createdAt === undefined ? {} : { createdAt }),
  };
}
