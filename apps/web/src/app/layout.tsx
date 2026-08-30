import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell/app-shell';
import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Transações', template: '%s · Transações' },
  applicationName: 'Transações',
  description: 'Dashboard de transações com validação antifraude',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Fontes do pacote `geist` (arquivos empacotados, sem rede no build), expostas como variaveis
    // que o globals.css liga em --font-sans/--font-mono.
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body>
        <Providers>
          {/* Cada pagina rende seu proprio <main> (e, na listagem, o header fixo da coluna). */}
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
