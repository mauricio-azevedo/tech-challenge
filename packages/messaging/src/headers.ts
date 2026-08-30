import type { IHeaders } from 'kafkajs';

/** Headers do kafkajs sao Buffers (ou undefined); o resto do codigo so fala em strings. */
export function encodeHeaders(headers: Record<string, string>): IHeaders {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Buffer.from(value)]),
  );
}

export function decodeHeaders(headers: IHeaders | undefined): Record<string, string> {
  if (headers === undefined) return {};
  const decoded: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined) decoded[key] = single.toString();
  }
  return decoded;
}
