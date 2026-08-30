import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/.next/',
    '**/coverage/',
    '**/.turbo/',
    '**/src/generated/',
    'pnpm-lock.yaml',
  ]),
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    rules: {
      // "any" e sinal de que o tipo ainda nao foi entendido (PRACTICES.md).
      '@typescript-eslint/no-explicit-any': 'error',
      // Modulos do NestJS sao classes vazias que existem pelo decorator.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Promises esquecidas sao a origem classica de erro silencioso em codigo assincrono.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    // Regras do Next (core-web-vitals + TypeScript) so para o dashboard.
    files: ['apps/web/**/*.{ts,tsx,js,mjs}'],
    extends: [nextVitals, nextTs],
    settings: { next: { rootDir: 'apps/web' } },
  },
  {
    // Arquivos de configuracao em JS ficam fora de qualquer tsconfig: sem regras que exigem tipos.
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
]);
