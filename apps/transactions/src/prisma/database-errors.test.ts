import { describe, expect, it } from 'vitest';

import { Prisma } from '../generated/prisma/client.js';
import { isDatabaseUnavailableError } from './database-errors.js';

describe('isDatabaseUnavailableError', () => {
  it('reconhece falha de conexao do Prisma e do driver', () => {
    expect(
      isDatabaseUnavailableError(new Prisma.PrismaClientInitializationError('down', '7.10.0')),
    ).toBe(true);
    expect(
      isDatabaseUnavailableError(
        new Prisma.PrismaClientKnownRequestError('unreachable', {
          code: 'P1001',
          clientVersion: '7',
        }),
      ),
    ).toBe(true);
    expect(
      isDatabaseUnavailableError(Object.assign(new Error('x'), { code: 'ECONNREFUSED' })),
    ).toBe(true);
  });

  it('nao confunde erro de consulta (bug) com banco fora do ar', () => {
    expect(
      isDatabaseUnavailableError(
        new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '7' }),
      ),
    ).toBe(false);
    expect(isDatabaseUnavailableError(new Error('qualquer coisa'))).toBe(false);
    expect(isDatabaseUnavailableError(undefined)).toBe(false);
  });
});
