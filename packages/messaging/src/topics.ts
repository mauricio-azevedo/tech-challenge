import type { Kafka } from 'kafkajs';

import { silentLogger, type MessagingLogger } from './logger.js';

export interface TopicSpec {
  name: string;
  numPartitions: number;
}

/**
 * Cria no boot os topicos que ainda nao existem, com o numero de particoes desejado, e espera a
 * eleicao de lider. Sem isso, o primeiro publish num topico auto-criado falha com
 * LEADER_NOT_AVAILABLE e o consumer nao consegue assinar um topico inexistente.
 */
export async function ensureTopics(
  kafka: Kafka,
  topics: TopicSpec[],
  logger: MessagingLogger = silentLogger,
): Promise<string[]> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = new Set(await admin.listTopics());
    const missing = topics.filter((topic) => !existing.has(topic.name));
    if (missing.length === 0) return [];

    await admin.createTopics({
      waitForLeaders: true,
      topics: missing.map((topic) => ({ topic: topic.name, numPartitions: topic.numPartitions })),
    });
    const names = missing.map((topic) => topic.name);
    logger.log(`topicos criados: ${names.join(', ')}`);
    return names;
  } finally {
    await admin.disconnect();
  }
}
