import { describe, expect, it } from 'vitest';

import { toCreatedAtRange } from './period.js';

describe('toCreatedAtRange', () => {
  it('nao filtra quando nenhuma data e informada', () => {
    expect(toCreatedAtRange()).toBeUndefined();
  });

  it('inclui o dia final inteiro: o limite superior e o inicio do dia seguinte, exclusivo', () => {
    expect(toCreatedAtRange('2026-08-01', '2026-08-31')).toEqual({
      gte: new Date('2026-08-01T00:00:00.000Z'),
      lt: new Date('2026-09-01T00:00:00.000Z'),
    });
  });

  it('aceita so o inicio ou so o fim do periodo', () => {
    expect(toCreatedAtRange('2026-08-15')).toEqual({ gte: new Date('2026-08-15T00:00:00.000Z') });
    expect(toCreatedAtRange(undefined, '2026-08-15')).toEqual({
      lt: new Date('2026-08-16T00:00:00.000Z'),
    });
  });

  it('um unico dia vira um intervalo de 24 horas', () => {
    expect(toCreatedAtRange('2026-02-28', '2026-02-28')).toEqual({
      gte: new Date('2026-02-28T00:00:00.000Z'),
      lt: new Date('2026-03-01T00:00:00.000Z'),
    });
  });
});
