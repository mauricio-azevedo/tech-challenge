import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { VerdictToasts } from '@/features/transactions/verdict-toasts';

/**
 * Renderiza com um QueryClient novo por teste: nada de cache vazando entre casos. `toasts` liga
 * o Toaster + VerdictToasts — desligado por padrao para os toasts (role="status") nao poluirem
 * as consultas por papel dos outros testes.
 */
export function renderWithQuery(ui: ReactElement, options?: RenderOptions & { toasts?: boolean }) {
  const { toasts = false, ...renderOptions } = options ?? {};
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      {children}
      {toasts && (
        <>
          <VerdictToasts />
          <Toaster />
        </>
      )}
    </QueryClientProvider>
  );
  return { client, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
