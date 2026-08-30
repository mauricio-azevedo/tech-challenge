import { createTransactionSchema } from '@challenge/contracts';
import { describe, expect, it } from 'vitest';

import { validationErrorBody } from './validation.js';

describe('validationErrorBody', () => {
  it('lista um erro por campo, com o caminho em notacao de ponto', async () => {
    const result = await createTransactionSchema['~standard'].validate({
      accountExternalIdDebit: 'x',
      transferTypeId: 1,
      value: 10,
    });

    expect('issues' in result && result.issues).toBeTruthy();
    if (!('issues' in result) || result.issues === undefined) return;

    const body = validationErrorBody(result.issues);

    expect(body.statusCode).toBe(400);
    expect(body.errors?.map((error) => error.path).sort()).toEqual([
      'accountExternalIdCredit',
      'accountExternalIdDebit',
    ]);
  });
});
