import type {
  EventEnvelope,
  FinalTransactionStatus,
  ListTransactionsQuery,
} from '@challenge/contracts';
import { Injectable } from '@nestjs/common';

import type { Prisma } from '../generated/prisma/client.js';
import { OutboxRepository } from '../outbox/outbox.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toCreatedAtRange } from './period.js';
import type { TransactionWithType } from './transaction.mapper.js';

export interface TransactionPage {
  items: TransactionWithType[];
  total: number;
}

export interface NewTransaction {
  accountExternalIdDebit: string;
  accountExternalIdCredit: string;
  transactionTypeId: number;
  value: number;
}

export interface OutboundEvent {
  topic: string;
  /** Monta o evento a partir da linha recem-gravada (que traz id e createdAt definidos pelo banco). */
  build: (transaction: TransactionWithType) => EventEnvelope<string, unknown>;
}

const withType = { include: { transactionType: true } } as const;

export type StatusUpdateOutcome = 'applied' | 'already-final' | 'not-found';

@Injectable()
export class TransactionsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxRepository,
  ) {}

  findById(id: string): Promise<TransactionWithType | null> {
    return this.prisma.transaction.findUnique({ where: { id }, ...withType });
  }

  typeExists(transactionTypeId: number): Promise<boolean> {
    return this.prisma.transactionType
      .findUnique({ where: { id: transactionTypeId }, select: { id: true } })
      .then((type) => type !== null);
  }

  /**
   * Grava a transacao e o evento de saida na mesma transacao de banco: se o outbox falhar, a
   * transacao nao existe; se a transacao falhar, nenhum evento fica para ser publicado.
   */
  createWithOutbox(data: NewTransaction, event: OutboundEvent): Promise<TransactionWithType> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({ data, ...withType });
      await this.outbox.enqueue(tx, {
        topic: event.topic,
        key: created.id,
        event: event.build(created),
      });
      return created;
    });
  }

  /**
   * Aplica o veredito **so se a transacao ainda esta pendente**: um unico UPDATE condicional, sem
   * ler antes. E o que torna o consumo idempotente — a mesma mensagem entregue duas vezes muda
   * o status uma vez. Quem ja e final, ou nao existe, e reportado para que o chamador decida.
   */
  async applyFinalStatus(id: string, status: FinalTransactionStatus): Promise<StatusUpdateOutcome> {
    const { count } = await this.prisma.transaction.updateMany({
      where: { id, status: 'PENDING' },
      data: { status },
    });
    if (count === 1) return 'applied';
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
      select: { id: true },
    });
    return existing === null ? 'not-found' : 'already-final';
  }

  async findPage(query: ListTransactionsQuery): Promise<TransactionPage> {
    const where = toWhere(query);
    // Itens e total na mesma transacao: a contagem reflete a mesma foto dos dados que a pagina.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        ...withType,
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
