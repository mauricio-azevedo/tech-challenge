/** Nomes dos topicos Kafka. O nome do evento e o nome do topico: um so vocabulario nos dois lados. */
export const TOPICS = {
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_STATUS_UPDATED: 'transaction.status.updated',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

const DLQ_SUFFIX = '.dlq';

/** Topico de dead letter de um topico: recebe mensagens que nao puderam ser processadas. */
export function dlqTopicFor(topic: string): string {
  return `${topic}${DLQ_SUFFIX}`;
}

export function isDlqTopic(topic: string): boolean {
  return topic.endsWith(DLQ_SUFFIX);
}
