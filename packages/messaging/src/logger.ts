/** Logger minimo que os servicos implementam com o logger deles (no NestJS, `Logger`). */
export interface MessagingLogger {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, stack?: string) => void;
}

export const silentLogger: MessagingLogger = {
  log: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
