import { describe, expect, it } from 'vitest';

import { createTransactionSchema } from './create-transaction.schema.js';

const validInput = {
  accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
  accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  transferTypeId: 1,
  value: 120,
};

function messagesByPath(input: unknown): Record<string, string> {
  const result = createTransactionSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

describe('createTransactionSchema', () => {
  it('aceita o corpo do contrato do desafio', () => {
    expect(createTransactionSchema.parse(validInput)).toEqual(validInput);
  });

  it('rejeita contas que nao sao UUID, apontando o campo', () => {
    const errors = messagesByPath({ ...validInput, accountExternalIdDebit: 'conta-1' });

    expect(errors).toEqual({ accountExternalIdDebit: 'deve ser um identificador (UUID) valido' });
  });

  it.each([
    [0, 'valor deve ser maior que zero'],
    [-10, 'valor deve ser maior que zero'],
    [10.005, 'valor deve ter no maximo duas casas decimais'],
    ['120', 'valor deve ser um numero'],
  ])('rejeita valor %s', (value, message) => {
    expect(messagesByPath({ ...validInput, value })).toEqual({ value: message });
  });

  it.each([0.01, 0.1 + 0.2, 1000, 1000.01, 9_999_999_999_999.99])('aceita valor %s', (value) => {
    expect(createTransactionSchema.safeParse({ ...validInput, value }).success).toBe(true);
  });

  it('rejeita transferencia para a mesma conta, apontando o destino', () => {
    expect(
      messagesByPath({ ...validInput, accountExternalIdCredit: validInput.accountExternalIdDebit }),
    ).toEqual({
      accountExternalIdCredit: 'conta de destino deve ser diferente da conta de origem',
    });
  });

  it('exige tipo de transferencia inteiro e positivo', () => {
    expect(messagesByPath({ ...validInput, transferTypeId: 0 })).toEqual({
      transferTypeId: 'tipo de transferencia e obrigatorio',
    });
    expect(messagesByPath({ ...validInput, transferTypeId: 1.5 })).toEqual({
      transferTypeId: 'tipo de transferencia deve ser um inteiro',
    });
  });

  it('acusa todos os campos ausentes de uma vez', () => {
    expect(Object.keys(messagesByPath({})).sort()).toEqual([
      'accountExternalIdCredit',
      'accountExternalIdDebit',
      'transferTypeId',
      'value',
    ]);
  });
});
