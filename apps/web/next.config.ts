import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import type { NextConfig } from 'next';

/** O `.env` do projeto fica na raiz do monorepo; o Next so olha para o diretorio do app. */
function findRootEnvFile(start: string): string | undefined {
  let current = start;
  let parent = dirname(current);
  while (parent !== current) {
    if (existsSync(resolve(current, 'pnpm-workspace.yaml'))) return resolve(current, '.env');
    current = parent;
    parent = dirname(current);
  }
  return undefined;
}

const rootEnvFile = findRootEnvFile(process.cwd());
if (rootEnvFile !== undefined) loadEnv({ path: rootEnvFile, quiet: true });

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
