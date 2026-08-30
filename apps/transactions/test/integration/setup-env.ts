import { inject } from 'vitest';

/**
 * Roda antes de cada arquivo de teste, antes de qualquer import da aplicacao: o ConfigModule le o
 * ambiente no momento em que `app.module` e importado, entao a URL do banco de teste precisa
 * estar em `process.env` ja aqui — nao no `beforeAll`.
 */
process.env.DATABASE_URL = inject('databaseUrl');
process.env.NODE_ENV = 'test';
