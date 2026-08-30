import { Logger } from '@nestjs/common';
import type { MessagingLogger } from '@challenge/messaging';

/** Adapta o Logger do Nest a interface minima que o pacote de mensageria espera. */
export function nestMessagingLogger(context: string): MessagingLogger {
  const logger = new Logger(context);
  return {
    log: (message) => {
      logger.log(message);
    },
    warn: (message) => {
      logger.warn(message);
    },
    error: (message, stack) => {
      logger.error(message, stack);
    },
  };
}
