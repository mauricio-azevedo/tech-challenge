import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/app-header';
import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Transações', template: '%s · Transações' },
  description: 'Dashboard de transações com validação antifraude',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="flex min-h-full flex-col">
        <Providers>
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
