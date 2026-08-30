import Link from 'next/link';

import { SidebarCountBadge } from './sidebar-count-badge';

/**
 * Sidebar do mockup (248px, fundo um tom acima, marca + navegacao); some abaixo de `lg`, onde a
 * tela inteira fica para o conteudo. Um unico destino: a listagem, sempre ativa (fundo branco).
 */
export function AppSidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col gap-1 border-r bg-surface p-3 lg:flex">
      <div className="flex items-center gap-2.5 px-2 pt-2.5 pb-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-[7px] bg-primary text-[13px] font-bold tracking-tight text-primary-foreground">
          B
        </div>
        <span className="truncate text-[13px] font-semibold tracking-tight">BIUD Payments</span>
      </div>
      <nav aria-label="Principal">
        <Link
          href="/transactions"
          className="flex w-full items-center gap-2.5 rounded-md bg-background px-2.5 py-2 text-[13.5px] font-medium"
        >
          <span aria-hidden="true" className="grid size-4 place-items-center opacity-85">
            {/* Glifo do mockup: retangulo com linhas de listagem. */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 9h10M7 14h6" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 truncate">Transações</span>
          <SidebarCountBadge />
        </Link>
      </nav>
    </aside>
  );
}
