import { describe, expect, it } from 'vitest';

import { normalizeAccountId } from './account-id';

describe('normalizeAccountId', () => {
  it('limpa o que a colagem traz de fora', () => {
    expect(normalizeAccountId(' 3F2B1D3E-8C4A-4F6E-9A1B-2C3D4E5F6A7B\n')).toBe(
      '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
    );
  });

  it('nao mexe no que ja esta normalizado', () => {
    expect(normalizeAccountId('3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b')).toBe(
      '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
    );
  });
});
