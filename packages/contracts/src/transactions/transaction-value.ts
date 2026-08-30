import { z } from 'zod';

/** numeric(15,2) no banco: 13 digitos inteiros e 2 decimais. */
export const MAX_TRANSACTION_VALUE = 9_999_999_999_999.99;

/**
 * Compara em centavos com tolerancia para ruido de ponto flutuante: 0.1 + 0.2 e um valor valido
 * mesmo que em binario nao seja exatamente 0.3.
 */
function hasAtMostTwoDecimals(value: number): boolean {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

/** Valor monetario aceito pela API: positivo, dentro da precisao do banco e com no maximo duas casas. */
export const transactionValueSchema = z
  .number({ error: 'valor deve ser um numero' })
  .positive({ error: 'valor deve ser maior que zero' })
  .max(MAX_TRANSACTION_VALUE, { error: 'valor excede o limite suportado' })
  .refine(hasAtMostTwoDecimals, { error: 'valor deve ter no maximo duas casas decimais' });
