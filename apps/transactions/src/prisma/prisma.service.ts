import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import type { Env } from '../config/env.schema.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { splitDatabaseUrl } from './database-url.js';

function createAdapter(databaseUrl: string): PrismaPg {
  const { connectionString, schema } = splitDatabaseUrl(databaseUrl);
  return new PrismaPg({ connectionString }, schema === undefined ? {} : { schema });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({ adapter: createAdapter(config.get('DATABASE_URL', { infer: true })) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
