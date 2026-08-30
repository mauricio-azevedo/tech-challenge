import type { ReactNode } from 'react';

import { AppSidebar } from './app-sidebar';

/** Casca do mockup: sidebar fixa a esquerda e uma coluna de conteudo que ocupa o resto. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
