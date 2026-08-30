import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import type { TestProject } from 'vitest/node';

const appRoot = resolve(import.meta.dirname, '../..');
const rootEnvFile = resolve(appRoot, '../../.env');

/** Nome do schema Postgres usado pelos testes: isola os dados de teste dos dados de desenvolvimento. */
const TEST_SCHEMA = 'test';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/**
 * Roda uma vez antes da suite de integracao: aponta para o schema de teste no mesmo Postgres do
 * docker compose e aplica as migrations nele. Falha cedo, com instrucao, se o banco nao responde.
 */
export default function setup(project: TestProject): void {
  loadEnv({ path: rootEnvFile, quiet: true });

  const baseUrl = process.env.DATABASE_URL;
  if (baseUrl === undefined) {
    throw new Error(
      'DATABASE_URL nao definida. Copie .env.example para .env na raiz do repositorio.',
    );
  }

  const url = new URL(baseUrl);
  url.searchParams.set('schema', TEST_SCHEMA);
  const databaseUrl = url.toString();

  try {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      cwd: appRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
  } catch (error) {
    const detail =
      error instanceof Error && 'stderr' in error ? String(error.stderr) : String(error);
    throw new Error(
      `Nao foi possivel preparar o banco de testes em ${url.host}. O Postgres do docker compose esta de pe? (docker compose up -d)\n${detail}`,
      { cause: error },
    );
  }

  project.provide('databaseUrl', databaseUrl);
}
