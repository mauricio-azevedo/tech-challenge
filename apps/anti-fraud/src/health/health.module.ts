import { Module } from '@nestjs/common';

import { AntiFraudModule } from '../anti-fraud/anti-fraud.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [AntiFraudModule],
  controllers: [HealthController],
})
export class HealthModule {}
