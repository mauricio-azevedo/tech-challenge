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
          <AppShell>
            {/* Largura e respiro do mockup (conteudo alinhado a esquerda, nao centrado). */}
            <main className="w-full max-w-[1360px] flex-1 px-6 pt-[26px] pb-10">{children}</main>
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
