import { describe, expect, it } from 'vitest';

import { splitDatabaseUrl } from './database-url.js';

describe('splitDatabaseUrl', () => {
  it('separa o schema da URL e entrega a URL limpa ao driver', () => {
    expect(splitDatabaseUrl('postgresql://u:p@localhost:5432/challenge?schema=test')).toEqual({
      connectionString: 'postgresql://u:p@localhost:5432/challenge',
      schema: 'test',
    });
  });

  it('preserva outros parametros e deixa o schema indefinido quando ausente', () => {
    expect(splitDatabaseUrl('postgresql://localhost/challenge?sslmode=require')).toEqual({
      connectionString: 'postgresql://localhost/challenge?sslmode=require',
      schema: undefined,
    });
  });
});
