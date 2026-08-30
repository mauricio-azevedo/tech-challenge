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
    },
  },
});
