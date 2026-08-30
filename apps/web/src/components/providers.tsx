'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { VerdictToasts } from '@/features/transactions/verdict-toasts';

/**
 * Um QueryClient por sessao do navegador (criado no cliente, nunca compartilhado entre
 * requisicoes do servidor). Sem retry automatico: o erro aparece na tela, com botao para tentar
 * de novo — melhor do que tres tentativas silenciosas antes de mostrar qualquer coisa.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: true, staleTime: 0 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Acima das paginas: o rastreador de vereditos sobrevive a troca de rota. */}
      <VerdictToasts />
      <Toaster />
    </QueryClientProvider>
  );
}
