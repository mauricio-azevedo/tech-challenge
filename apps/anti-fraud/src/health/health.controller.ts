import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

import { TransactionCreatedConsumer } from '../anti-fraud/transaction-created.consumer.js';

@Controller('health')
export class HealthController {
  constructor(private readonly consumer: TransactionCreatedConsumer) {}

  /** Readiness: o servico so esta pronto quando esta de fato consumindo. */
  @Get()
  check(@Res({ passthrough: true }) response: Response) {
    const consuming = this.consumer.isRunning;
    response.status(consuming ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return { status: consuming ? 'ok' : 'degraded', checks: { kafka: consuming ? 'up' : 'down' } };
  }
}
