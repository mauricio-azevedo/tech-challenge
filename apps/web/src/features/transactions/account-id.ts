/**
 * Identificador colado de outro sistema costuma vir com espaco, quebra de linha ou em maiusculas;
 * nada disso muda a conta, entao o campo normaliza em vez de acusar erro.
 */
export function normalizeAccountId(raw: string): string {
  return raw.replace(/\s/gu, '').toLowerCase();
}
