import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// O Prisma 7 nao carrega .env sozinho; o do projeto fica na raiz do monorepo.
loadEnv({ path: resolve(import.meta.dirname, '../../.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
