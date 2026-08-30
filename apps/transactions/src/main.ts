import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) });
  // Garante que conexoes (banco, e mais adiante Kafka) sejam encerradas em SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = config.get('TRANSACTIONS_PORT', { infer: true });
  await app.listen(port);
  new Logger('bootstrap').log(`transactions ouvindo em http://localhost:${String(port)}`);
}

await bootstrap();
