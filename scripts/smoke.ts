/**
 * Smoke test ponta a ponta contra a stack de verdade (Postgres, Kafka, transactions, anti-fraud):
 * cria transacoes e espera o veredito do antifraude chegar ao status.
 *
 * Uso: com `docker compose up -d` e `pnpm dev` rodando, `pnpm smoke`.
 * Nao faz parte do quality gate: exige a infraestrutura de pe.
 */
import { setTimeout as sleep } from 'node:timers/promises';

const apiUrl = process.env.SMOKE_API_URL ?? 'http://localhost:3001';
const antiFraudUrl = process.env.SMOKE_ANTI_FRAUD_URL ?? 'http://localhost:3002';
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 15_000);

interface TransactionResponse {
  transactionExternalId: string;
  transactionStatus: { name: 'PENDING' | 'APPROVED' | 'REJECTED' };
  value: number;
}

interface HealthResponse {
  status: string;
  checks: Record<string, string>;
}

const cases = [
  { value: 120, expected: 'APPROVED' },
  { value: 1500, expected: 'REJECTED' },
  { value: 1000, expected: 'APPROVED' },
] as const;

async function requestJson(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, init);
  return { status: response.status, body: await response.json() };
}

async function ensureHealthy(name: string, url: string): Promise<void> {
  const { status, body: raw } = await requestJson(`${url}/health`);
  const body = raw as HealthResponse;
  const checks = Object.entries(body.checks)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  if (status !== 200) throw new Error(`${name} nao esta pronto: ${checks}`);
  console.log(`✓ ${name} saudavel (${checks})`);
}

async function createTransaction(value: number): Promise<TransactionResponse> {
  const { status, body: raw } = await requestJson(`${apiUrl}/transactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-request-id': `smoke-${String(value)}` },
    body: JSON.stringify({
      accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
      accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      transferTypeId: 1,
      value,
    }),
  });
  if (status !== 201) throw new Error(`POST /transactions respondeu ${String(status)}`);
  const body = raw as TransactionResponse;
  if (body.transactionStatus.name !== 'PENDING') {
    throw new Error(`transacao nasceu ${body.transactionStatus.name}, esperava PENDING`);
  }
  return body;
}

async function waitForVerdict(id: string): Promise<TransactionResponse> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { body: raw } = await requestJson(`${apiUrl}/transactions/${id}`);
    const body = raw as TransactionResponse;
    if (body.transactionStatus.name !== 'PENDING') return body;
    await sleep(500);
  }
  throw new Error(`transacao ${id} continua PENDING apos ${String(timeoutMs)}ms`);
}

async function main(): Promise<void> {
  await ensureHealthy('transactions', apiUrl);
  await ensureHealthy('anti-fraud', antiFraudUrl);

  let failures = 0;
  for (const { value, expected } of cases) {
    const started = Date.now();
    const created = await createTransaction(value);
    const final = await waitForVerdict(created.transactionExternalId);
    const elapsed = Date.now() - started;
    const ok = final.transactionStatus.name === expected;
    if (!ok) failures += 1;
    console.log(
      `${ok ? '✓' : '✗'} valor ${String(value)} -> ${final.transactionStatus.name} (esperado ${expected}) em ${String(elapsed)}ms`,
    );
  }

  if (failures > 0) {
    console.error(`\n${String(failures)} caso(s) falharam`);
    process.exitCode = 1;
    return;
  }
  console.log('\nfluxo completo ok: criacao -> antifraude -> status atualizado');
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
