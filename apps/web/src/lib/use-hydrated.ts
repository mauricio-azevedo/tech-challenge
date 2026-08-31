'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

/**
 * `false` no HTML do servidor e no render de hidratacao; `true` dali em diante (e ja no primeiro
 * render de quem monta so no cliente, como numa navegacao entre rotas).
 *
 * Serve para o caso em que **o cache pode estar quente antes da hidratacao**: duas telas que
 * compartilham a mesma query hidratam em momentos diferentes (a casca do app fica fora do
 * `<Suspense>` da pagina), entao a primeira ja buscou os dados quando a segunda hidrata — e o
 * React acusa divergencia entre o esqueleto que veio do servidor e os dados que o cliente ja tem.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
