import { describe, expect, it } from 'vitest';

import {
  formatDateTime,
  formatShortDateTime,
  formatValue,
  shortId,
  statusLabels,
} from './transaction-labels';

describe('rotulos e formatos', () => {
  it('fala portugues com os rotulos do design', () => {
    expect(statusLabels).toEqual({
      PENDING: 'Pendente',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
    });
  });

  it('formata moeda em BRL', () => {
    expect(formatValue(1000.5)).toBe('R$ 1.000,50');
  });

  it('formata datas em UTC, curta como no mockup e completa no detalhe', () => {
    expect(formatShortDateTime('2026-08-30T12:00:00.000Z')).toBe('30/08 12:00');
    expect(formatDateTime('2026-08-30T12:00:00.000Z')).toContain('30/08/2026');
    expect(formatDateTime('2026-08-30T12:00:00.000Z')).toContain('12:00:00');
  });

  it('abrevia identificadores para toasts e resumos', () => {
    expect(shortId('0191c2f0-3a4b-7c5d-8e6f-1a2b3c4d5e6f')).toBe('0191c2f0');
  });
});
