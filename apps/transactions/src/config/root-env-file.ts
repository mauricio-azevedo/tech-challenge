import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

/**
 * Localiza o `.env` da raiz do monorepo subindo a partir deste arquivo ate achar o
 * `pnpm-workspace.yaml`. Funciona tanto rodando de `src/` (testes) quanto de `dist/` (build).
 */
export function findRootEnvFile(startDir: string = import.meta.dirname): string | undefined {
  let current = startDir;
  let parent = dirname(current);
  while (parent !== current) {
    if (existsSync(resolve(current, WORKSPACE_MARKER))) {
      return resolve(current, '.env');
    }
    current = parent;
    parent = dirname(current);
  }
  return undefined;
}
