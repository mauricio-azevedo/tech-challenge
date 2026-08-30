import { dlqTopicFor, TOPICS } from '@challenge/contracts';
import type { TopicSpec } from '@challenge/messaging';

/**
 * Todos os topicos do fluxo, com as respectivas DLQs. Cada servico garante o conjunto inteiro no
 * boot: nao importa quem sobe primeiro. DLQs tem uma particao — volume baixo, ordem irrelevante.
 */
export function topicSpecs(businessPartitions: number): TopicSpec[] {
  return Object.values(TOPICS).flatMap((topic) => [
    { name: topic, numPartitions: businessPartitions },
    { name: dlqTopicFor(topic), numPartitions: 1 },
  ]);
}
