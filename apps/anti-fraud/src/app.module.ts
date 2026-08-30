import { Module } from '@nestjs/common';

import { AntiFraudModule } from './anti-fraud/anti-fraud.module.js';
import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [ConfigModule, AntiFraudModule, HealthModule],
})
export class AppModule {}
