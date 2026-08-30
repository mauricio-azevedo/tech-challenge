import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  // Consumer e producer saem do grupo/broker de forma limpa em SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = config.get('ANTI_FRAUD_PORT', { infer: true });
  await app.listen(port);
  new Logger('bootstrap').log(`anti-fraud ouvindo em http://localhost:${String(port)}`);
}

await bootstrap();
