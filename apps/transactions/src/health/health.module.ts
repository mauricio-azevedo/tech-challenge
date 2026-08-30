import { Module } from '@nestjs/common';

import { TransactionsModule } from '../transactions/transactions.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  imports: [TransactionsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
