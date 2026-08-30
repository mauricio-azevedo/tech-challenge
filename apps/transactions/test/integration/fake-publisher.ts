import type { MessagePublisher, OutgoingMessage, RawOutgoingMessage } from '@challenge/messaging';

/**
 * Substitui o producer Kafka nos testes de integracao: o CI nao tem broker, e o que se testa
 * aqui e a API com o banco. O caminho real ate o Kafka e coberto pelo smoke test.
 */
export class FakePublisher implements MessagePublisher {
  readonly published: OutgoingMessage[] = [];
  readonly raw: RawOutgoingMessage[] = [];
  failWith: Error | undefined;

  publish(message: OutgoingMessage): Promise<void> {
    if (this.failWith !== undefined) return Promise.reject(this.failWith);
    this.published.push(message);
    return Promise.resolve();
  }

  publishRaw(message: RawOutgoingMessage): Promise<void> {
    this.raw.push(message);
    return Promise.resolve();
  }

  reset(): void {
    this.published.length = 0;
    this.raw.length = 0;
    this.failWith = undefined;
  }
}
