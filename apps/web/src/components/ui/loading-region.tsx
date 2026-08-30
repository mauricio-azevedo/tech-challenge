import type { ReactNode } from 'react';

/**
 * Regiao de carregamento anunciada a tecnologia assistiva; o esqueleto que vem em `children` e
 * so decoracao. O aria-label permite consultas por nome quando ha mais de um status na tela.
 */
export function LoadingRegion({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
