import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import type { Env } from '../config/env.schema.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { splitDatabaseUrl } from './database-url.js';

/**
 * O `schema` passado ao adapter so vale para as queries que o Prisma compila; SQL cru
 * (`$queryRaw`, `$executeRaw`) segue o `search_path` da conexao. Definimos os dois para que
 * tabela "transactions" signifique a mesma coisa nos dois caminhos — e nos testes, que usam um
 * schema isolado, isso e a diferenca entre limpar a tabela certa e a errada.
 */
function createAdapter(databaseUrl: string): PrismaPg {
  const { connectionString, schema } = splitDatabaseUrl(databaseUrl);
  if (schema === undefined) {
    return new PrismaPg({ connectionString });
  }
  return new PrismaPg({ connectionString, options: `-c search_path=${schema}` }, { schema });
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
