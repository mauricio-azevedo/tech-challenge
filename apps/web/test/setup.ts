import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
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
});

afterAll(() => {
  server.close();
});
