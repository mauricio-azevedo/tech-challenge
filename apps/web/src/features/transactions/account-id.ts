/**
 * Identificador colado de outro sistema costuma vir com espaco, quebra de linha ou em maiusculas;
 * nada disso muda a conta, entao o campo normaliza em vez de acusar erro.
 */
export function normalizeAccountId(raw: unknown): unknown {
  return typeof raw === 'string' ? raw.replace(/\s/gu, '').toLowerCase() : raw;
}
