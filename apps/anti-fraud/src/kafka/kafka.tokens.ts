/** Token do cliente kafkajs compartilhado pelo servico. */
export const KAFKA_CLIENT = Symbol('KAFKA_CLIENT');

/** Token do publisher: os handlers dependem da interface, nao do producer concreto. */
export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER');
