'use client';

import type { TransactionResponse } from '@challenge/contracts';
import { useEffect, useRef, useState } from 'react';

const FLASH_MS = 1400;

/**
 * Detecta transicoes de status entre respostas do polling e devolve os ids que acabaram de
 * mudar, mantidos pelo tempo do flash de fundo do mockup. A primeira leitura so semeia o mapa —
 * nada pisca ao abrir a tela.
 */
export function useStatusFlash(transactions: TransactionResponse[]): ReadonlySet<string> {
  const seen = useRef<Map<string, string> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const previous = seen.current;
    seen.current = new Map(
      transactions.map((t) => [t.transactionExternalId, t.transactionStatus.name] as const),
    );
    if (previous === null) return;

    const changed = transactions
      .filter((t) => {
        const before = previous.get(t.transactionExternalId);
        return before !== undefined && before !== t.transactionStatus.name;
      })
      .map((t) => t.transactionExternalId);
    if (changed.length === 0) return;

    setFlashing((current) => new Set([...current, ...changed]));
    timers.current.push(
      setTimeout(() => {
        setFlashing((current) => {
          const next = new Set(current);
          for (const id of changed) next.delete(id);
          return next;
        });
      }, FLASH_MS),
    );
  }, [transactions]);

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach(clearTimeout);
    };
  }, []);

  return flashing;
}
