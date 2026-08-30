import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { inject } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { KafkaProducerService } from '../../src/kafka/kafka-producer.service.js';
import { OutboxRelay } from '../../src/outbox/outbox-relay.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { TransactionStatusUpdatedConsumer } from '../../src/transactions/transaction-status-updated.consumer.js';
import { FakePublisher } from './fake-publisher.js';

export interface TestApp {
  app: INestApplication<Server>;
  prisma: PrismaService;
  publisher: FakePublisher;
  close: () => Promise<void>;
}

/** Sobe a aplicacao inteira contra o schema de teste preparado pelo global-setup, sem Kafka. */
export async function createTestApp(): Promise<TestApp> {
  // Guarda contra o erro que ja aconteceu: a app conectar no banco de desenvolvimento por o env
  // de teste ter sido definido tarde demais (ver setup-env.ts).
  if (process.env.DATABASE_URL !== inject('databaseUrl')) {
    throw new Error(
      'DATABASE_URL de teste nao esta ativa; verifique setupFiles em vitest.config.ts',
    );
  }

  const publisher = new FakePublisher();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(KafkaProducerService)
    .useValue(publisher)
    // O consumer real assinaria o Kafka no boot; aqui o veredito e aplicado chamando o servico.
    .overrideProvider(TransactionStatusUpdatedConsumer)
    .useValue({ isRunning: true })
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<Server>>();
  await app.init();
  // O relay publicaria em segundo plano e disputaria os eventos com os `flush()` dos testes.
  await app.get(OutboxRelay).stop();

  return { app, prisma: app.get(PrismaService), publisher, close: () => app.close() };
}

/** Limpa os dados criados pelos testes; o catalogo de tipos (semeado por migration) permanece. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "transactions", "outbox_events" CASCADE');
}
