import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Readiness: 200 so quando as dependencias respondem; 503 caso contrario. */
  @Get()
  async check(@Res({ passthrough: true }) response: Response) {
    const report = await this.health.check();
    response.status(report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return report;
  }
}
