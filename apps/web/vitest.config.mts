import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    // Tailwind nao interessa aos testes de comportamento.
    css: false,
    env: {
      NEXT_PUBLIC_API_URL: 'http://api.test',
      // Polling curto para os testes de atualizacao de status nao demorarem.
      NEXT_PUBLIC_POLL_INTERVAL_MS: '200',
      NEXT_PUBLIC_ANTI_FRAUD_VALUE_LIMIT: '1000',
    },
  },
});
