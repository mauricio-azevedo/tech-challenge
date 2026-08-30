import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module.js';
import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';

@Module({
  imports: [ConfigModule, CommonModule, PrismaModule, HealthModule, TransactionsModule],
})
export class AppModule {}
