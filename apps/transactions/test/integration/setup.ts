import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { inject } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestApp {
  app: INestApplication<Server>;
  prisma: PrismaService;
  close: () => Promise<void>;
}

/** Sobe a aplicacao inteira contra o schema de teste preparado pelo global-setup. */
export async function createTestApp(): Promise<TestApp> {
  process.env.DATABASE_URL = inject('databaseUrl');
  process.env.NODE_ENV = 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<Server>>();
  await app.init();

  return { app, prisma: app.get(PrismaService), close: () => app.close() };
}

/** Limpa os dados criados pelos testes; o catalogo de tipos (semeado por migration) permanece. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "transactions" CASCADE');
}
