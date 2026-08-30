import { setupServer } from 'msw/node';

/** Servidor MSW sem handlers padrao: cada teste declara o que a API responde. */
export const server = setupServer();
