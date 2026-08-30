import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Os testes de integracao compartilham um unico schema no Postgres: arquivos em paralelo
    // enxergariam os dados uns dos outros. A opcao vale na raiz e chega aos projetos via `extends`.
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // Roda contra o Postgres do docker compose, num schema isolado; ver test/integration/.
        extends: true,
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          globalSetup: ['test/integration/global-setup.ts'],
          setupFiles: ['test/integration/setup-env.ts'],
        },
      },
    ],
  },
});
