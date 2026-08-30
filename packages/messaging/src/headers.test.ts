import { describe, expect, it } from 'vitest';

import { decodeHeaders, encodeHeaders } from './headers.js';

describe('headers', () => {
  it('codifica e decodifica sem perder nada', () => {
    const headers = { 'x-request-id': 'req-1', 'x-attempts': '3' };

    expect(decodeHeaders(encodeHeaders(headers))).toEqual(headers);
  });

  it('ignora headers ausentes e usa o primeiro valor de headers repetidos', () => {
    expect(decodeHeaders(undefined)).toEqual({});
    expect(decodeHeaders({ a: undefined, b: [Buffer.from('1'), Buffer.from('2')] })).toEqual({
      b: '1',
    });
  });
});
