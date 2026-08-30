import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './msw/server';

// jsdom nao implementa pointer capture, scrollIntoView nem ResizeObserver, que os primitivos
// Radix (Select, Dialog) usam. Stubs inofensivos; o cast para Partial evita que o eslint
// considere as condicoes do ??= impossiveis (os tipos do DOM dizem que sempre existem).
const elementProto: Partial<Element> = Element.prototype;
elementProto.hasPointerCapture ??= () => false;
elementProto.setPointerCapture ??= () => undefined;
elementProto.releasePointerCapture ??= () => undefined;
elementProto.scrollIntoView ??= () => undefined;

const matchMediaStub = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;
(window as { matchMedia?: typeof window.matchMedia }).matchMedia ??= matchMediaStub;

class ResizeObserverStub implements ResizeObserver {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
}
(globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??= ResizeObserverStub;

// Toda chamada de rede passa pelo MSW; uma requisicao sem handler e erro de teste, nao rede real.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  // O sonner guarda os toasts em estado de modulo: sem isso, um toast de um teste reaparece no
  // Toaster montado pelo teste seguinte.
  toast.dismiss();
});

afterAll(() => {
  server.close();
});
