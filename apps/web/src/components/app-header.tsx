import Link from 'next/link';

const links = [
  { href: '/transactions', label: 'Transações' },
  { href: '/transactions/new', label: 'Nova transação' },
] as const;

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Transações · antifraude
        </Link>
        <nav aria-label="Principal">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
