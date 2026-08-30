import type { TransactionTypeResponse } from '@challenge/contracts';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TransactionTypesService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<TransactionTypeResponse[]> {
    return this.prisma.transactionType.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  }
}
