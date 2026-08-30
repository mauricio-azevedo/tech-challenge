import { Prisma } from '../generated/prisma/client.js';

/** Codigos do Prisma para falhas de conectividade (nao de consulta). */
const CONNECTIVITY_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

/** Erros de socket que o driver `pg` propaga quando o banco nao esta acessivel. */
const SOCKET_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH']);

/**
 * Distingue "o banco nao esta acessivel" (503, vale tentar de novo) de qualquer outro erro
 * (500, bug ou dado inesperado). E a diferenca entre um alerta de infraestrutura e um de codigo.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError)
    return CONNECTIVITY_CODES.has(error.code);
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return SOCKET_CODES.has(String(error.code));
  }
  return false;
}
