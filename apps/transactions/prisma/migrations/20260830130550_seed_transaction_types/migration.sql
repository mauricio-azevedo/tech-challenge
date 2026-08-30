-- Tipos de transferencia aceitos pela API (`transferTypeId` no contrato).
-- Ficam em migration, e nao em seed script, para que todo ambiente que aplicou as migrations
-- tenha exatamente o mesmo catalogo — inclusive o CI e os testes de integracao.
INSERT INTO "transaction_types" ("id", "name") VALUES
  (1, 'TED'),
  (2, 'PIX'),
  (3, 'DOC')
ON CONFLICT ("id") DO NOTHING;
