import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { TransactionStatusUpdatedConsumer } from '../transactions/transaction-status-updated.consumer.js';

export type CheckStatus = 'up' | 'down';

export interface HealthReport {
  status: 'ok' | 'degraded';
  checks: Record<string, CheckStatus>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consumer: TransactionStatusUpdatedConsumer,
  ) {}

  async check(): Promise<HealthReport> {
    const checks = {
      database: await this.checkDatabase(),
      kafka: this.consumer.isRunning ? ('up' as const) : ('down' as const),
    };
    const status = Object.values(checks).every((check) => check === 'up') ? 'ok' : 'degraded';
    return { status, checks };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch (error) {
      this.logger.warn(
        `banco indisponivel: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 'down';
    }
  }
}
