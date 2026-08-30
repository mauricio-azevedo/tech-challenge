import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';

/**
 * Compila o grafo de modulos inteiro (sem chamar os hooks de inicializacao, logo sem Kafka).
 * Pega dependencia nao resolvida — o tipo de erro que so apareceria no boot em producao.
 */
describe('AppModule (anti-fraud)', () => {
  it('resolve todas as dependencias', async () => {
    process.env.KAFKA_BROKERS ??= 'localhost:9092';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
