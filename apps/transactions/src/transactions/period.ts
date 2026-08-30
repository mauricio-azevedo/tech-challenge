const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface CreatedAtRange {
  gte?: Date;
  lt?: Date;
}

function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/**
 * Converte o periodo do filtro (`from`/`to` em AAAA-MM-DD, inclusivos, UTC) no intervalo
 * meio-aberto `[from 00:00, to + 1 dia 00:00)`, que e como se compara timestamp com dia sem
 * perder o ultimo segundo do dia final.
 */
export function toCreatedAtRange(from?: string, to?: string): CreatedAtRange | undefined {
  if (from === undefined && to === undefined) return undefined;
  const range: CreatedAtRange = {};
  if (from !== undefined) range.gte = startOfUtcDay(from);
  if (to !== undefined) range.lt = new Date(startOfUtcDay(to).getTime() + DAY_IN_MS);
  return range;
}
