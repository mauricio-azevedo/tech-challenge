# Guia de trabalho neste repositório

Solução do desafio técnico da BIUD: API de transações (NestJS) que cria transações `pendentes`,
um serviço antifraude que as avalia via Kafka e um dashboard (Next.js) que reflete o veredito sem
recarregar. Este arquivo diz **como trabalhar aqui** — fluxo, convenções e armadilhas já
conhecidas — para que qualquer pessoa (ou assistente) entregue com a mesma qualidade e sem
redescobrir o que já custou tempo.

Leia antes de mudar qualquer coisa:

- [`README.md`](./README.md) — o que foi construído, como rodar e testar, o que ficou de fora.
- [`DECISIONS.md`](./DECISIONS.md) — por que cada coisa é como é. **Mudar arquitetura = nova entrada
  lá**, no mesmo PR, no formato Decisão / Alternativas consideradas / Por quê.
- [`PRACTICES.md`](./PRACTICES.md) — requisitos de processo (gate, commits, branches, PRs, testes).

Idioma: identificadores de código em inglês; mensagens de commit e nomes de branch em português
**sem acento** (como os exemplos do PRACTICES); documentação, textos de UI e `DECISIONS.md` em
português com acento; enum de status na API em inglês (`PENDING | APPROVED | REJECTED`), rótulos
em português só na tela.

## Mapa do repositório

| Caminho                               | Responsabilidade                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/transactions/src/transactions/` | endpoints, repositório Prisma, mapper para o contrato, consumer do veredito            |
| `apps/transactions/src/outbox/`       | outbox transacional (`enqueue` na transação de quem chama) e relay que publica         |
| `apps/transactions/src/kafka/`        | cliente kafkajs, producer com criação de tópicos no boot                               |
| `apps/transactions/src/common/`       | pipe de validação (schemas zod), filtro global de erro, `x-request-id`                 |
| `apps/transactions/prisma/`           | `schema.prisma` e migrations versionadas (o catálogo de tipos é semeado por migration) |
| `apps/transactions/test/integration/` | app inteira contra o Postgres do compose, schema `test`, Kafka substituído por fakes   |
| `apps/anti-fraud/src/anti-fraud/`     | regra pura (`fraud-policy.ts`), handler que publica o veredito, consumer               |
| `apps/web/src/features/transactions/` | API client, filtros na URL, hooks com polling condicional, telas                       |
| `apps/web/src/components/ui/`         | estados de tela (carregando / erro / vazio), badge de status, paginação                |
| `apps/web/test/`                      | setup do MSW, fixtures, `renderWithQuery`                                              |
| `packages/contracts/src/`             | schemas zod da API e dos eventos, tópicos, fábrica `createEvent`                       |
| `packages/messaging/src/`             | producer, `runConsumer` (validação → retry com backoff → DLQ), `ensureTopics`          |
| `scripts/smoke.ts`                    | verificação ponta a ponta contra a stack real (`pnpm smoke`)                           |
| `docs/desafio.md`                     | enunciado original                                                                     |

Tudo que entra ou sai pela rede (corpo, query, resposta, evento) tem schema em
`@challenge/contracts`; backend e frontend validam com o **mesmo objeto**.

## Ambiente e comandos

```bash
source ~/.nvm/nvm.sh && nvm use   # Node do .nvmrc; sem isso, node/pnpm nao estao no PATH de shells nao interativos
cp .env.example .env              # antes do pnpm install; porta 5432 ocupada? ajuste POSTGRES_PORT e DATABASE_URL
docker compose up -d              # Postgres, Kafka (KRaft), Kafka UI
pnpm install                      # roda `pnpm bootstrap`: gera o client Prisma e compila packages/*
pnpm db:migrate                   # prisma migrate deploy
pnpm dev                          # transactions :3001, anti-fraud :3002, dashboard :3000
pnpm quality                      # o gate inteiro: bootstrap, lint, format:check, typecheck, test, build
pnpm smoke                        # fluxo real: cria 120/1500/1000 e espera os vereditos
```

Etapas isoladas: `pnpm lint`, `pnpm format` / `pnpm format:check`, `pnpm typecheck`, `pnpm test`,
`pnpm build`, e por pacote `pnpm --filter @challenge/<nome> <script>` (ex.:
`pnpm --filter @challenge/web test:watch`). Nova migration:
`pnpm --filter @challenge/transactions db:migrate:dev --name <nome>` e depois `pnpm db:generate`
(o Prisma 7 não gera o client no `migrate dev`). Testes de integração e `db:*` exigem o compose de pé.

## Fluxo de trabalho (obrigatório)

1. `git checkout develop && git pull` e crie `git checkout -b <tipo>/<descricao-em-kebab>`
   (`feat`, `fix`, `docs`, `test`, `build`, `ci`, `chore`, `refactor`, `perf`, `style`, `revert`).
   Commit direto em `develop` é recusado pelo hook.
2. Implemente **com os testes no mesmo PR**: regra de negócio nova ⇒ teste nos limites; endpoint ⇒ teste
   de integração; tela ⇒ estados carregando, erro e vazio, consultados por papel acessível.
3. Decisão de arquitetura? Escreva a entrada em `DECISIONS.md` antes de abrir o PR.
4. `pnpm format` e `pnpm quality` verdes localmente. Se falha aqui, falha no CI.
5. Commits pequenos, **um tema por commit**, mensagem no padrão Conventional Commits em português sem
   acento (`feat(transactions): adiciona ...`). Use `git add` explícito por arquivo e confira
   `git show --stat` — o commit leva tudo que está _staged_, não só o que você acabou de adicionar.
6. `git push -u origin <branch>` e abra o PR para `develop` com o template
   (`.github/pull_request_template.md`) preenchido de verdade: "O que foi feito" diz o porquê, "Como
   testar" tem comandos reproduzíveis, o checklist é honesto (marque "não houve decisão" quando for o caso).
7. Espere o check `quality` (`gh pr checks <n> --watch`). Vermelho não se contorna: corrija na branch.
8. Merge preservando os commits e com subject convencional:
   `gh pr merge <n> --merge --subject "<tipo>(<escopo>): <descricao> (#<n>)"`. Nunca `--admin`, nunca
   force-push em `develop` (a proteção vale para administradores). Depois confira o CI de `develop`
   (`gh run list --branch develop --limit 1`).

PRs pequenos e sequenciais valem mais do que um PR grande: a história do projeto faz parte da entrega.
Um problema encontrado depois do merge vira um PR `fix/` próprio, com a causa no corpo do PR.

## Convenções de código

- TypeScript estrito em tudo (`strict`, `noUncheckedIndexedAccess`); `any` é erro de lint. Se um tipo
  não fecha, o problema costuma ser o desenho, não o lint.
- Apps NestJS são **ESM**: imports relativos com extensão `.js` (`./foo.service.js`).
- Entrada da API só pelos schemas de `@challenge/contracts` (`@Body({ schema })`,
  `@Query({ schema })`, `@Param(nome, { schema })`); no dashboard, os mesmos schemas via `zodResolver`.
  Erros da API sempre em `{ statusCode, message, errors? }` (filtro global em `common/`).
- Configuração só pelo `ConfigService<Env, true>` de cada app (`config/env.schema.ts`, validado no
  boot). Variável nova: schema + `.env.example` (com comentário) + `.env` local.
- Banco só pelo `PrismaService`; SQL cru apenas quando o Prisma não expressa a operação (ex.: o claim
  do outbox com `FOR UPDATE SKIP LOCKED`), e sempre parametrizado.
- Kafka só por `@challenge/messaging`; handlers de consumer devem ser **idempotentes** (entrega repetida
  é normal). Mensagem inválida ou falha persistente vai para a DLQ, nunca trava a partição.
- Logs carregam o `correlationId` (vem do `x-request-id` da requisição e viaja no envelope do evento).
- Comentários explicam o porquê; o quê está no código. Arquivos focados numa responsabilidade.
- Frontend: páginas do App Router são cascas finas; dados no cliente com TanStack Query; estado da
  listagem na URL; marcação acessível (`<label>`, `role="status"`/`aria-busy`, `role="alert"`,
  `<table>` com `caption`, `<nav aria-label>`), porque os testes consultam por papel.

## Testes

- Um runner só (Vitest). `transactions` tem os projetos `unit` (`src/**/*.test.ts`) e `integration`
  (`test/integration/**`), rodando em série porque compartilham um schema.
- Integração: `createTestApp()` sobe a app inteira com `KafkaProducerService` trocado por
  `FakePublisher` e o consumer por `{ isRunning: true }`; `resetDatabase()` trunca `transactions` e
  `outbox_events` no `beforeEach`. O `globalSetup` aplica as migrations no schema `test` e falha com
  instrução clara se o Postgres não responde.
- `web`: `renderWithQuery()` + MSW; requisição sem handler é erro do teste. Polling nos testes usa
  `NEXT_PUBLIC_POLL_INTERVAL_MS=200` (config do Vitest), com timers reais.
- `messaging` e `anti-fraud`: fakes puros; `app.module.test.ts` compila o grafo de módulos para pegar
  dependência não resolvida sem precisar de Kafka.
- Kafka de verdade só no `pnpm smoke`. Se mudar o fluxo de eventos, rode-o antes de abrir o PR.

## Versões fixadas — e por quê

| Peça       | Versão                | Motivo (detalhes em `DECISIONS.md`)                                            |
| ---------- | --------------------- | ------------------------------------------------------------------------------ |
| Node       | 22.23 (`.nvmrc`)      | mínimo de `lint-staged@17` e `@nestjs/schematics@12`                           |
| pnpm       | 11 (`packageManager`) | configuração só em `pnpm-workspace.yaml`; `minimumReleaseAge` de 1 dia ativo   |
| TypeScript | `~6.0`                | o 7 não tem API JS: quebra `nest build` e typescript-eslint                    |
| ESLint     | `^9`                  | `eslint-plugin-react` (via `eslint-config-next`) não roda no 10                |
| Prisma     | `7.10.0` exato        | o `latest` do registry é um 8.0 _release candidate_                            |
| NestJS     | 12 (ESM)              | `@Body({ schema })` e `ConfigModule` com Standard Schema; ESM é o padrão do 12 |
| kafkajs    | `2.2.4`               | estável; sem manutenção ativa — a troca fica confinada a `packages/messaging`  |

Regra de dependências: o pnpm recusa versões com menos de 24 horas. Quando isso acontecer, **fixe a
versão anterior** — não adicione `minimumReleaseAgeExclude` (a política existe por segurança de
supply chain). Se o `pnpm install` falhar por "ignored build scripts", adicione o pacote em
`allowBuilds` com `true` (precisa de binário) ou `false` (postinstall dispensável) e apague os
placeholders `set this to true or false` que o pnpm insere no arquivo.

## Armadilhas conhecidas (já custaram tempo)

- **`ConfigModule` lê o ambiente no `import`**, não na inicialização: variáveis de teste vão em
  `setupFiles` do Vitest (`test/integration/setup-env.ts`), nunca em `beforeAll`. `createTestApp()`
  tem um guard para isso.
- **`PrismaPg` aplica `schema` só às queries tipadas**; SQL cru segue o `search_path` da conexão. O
  `PrismaService` define os dois a partir do `?schema=` da URL — mantenha assim ao mexer no adapter.
- **Vitest `projects` não herda a config raiz** sem `extends: true` (foi assim que os testes de
  integração rodaram em paralelo e se contaminaram).
- **O lint com checagem de tipos precisa do client Prisma e dos `dist` dos pacotes**: por isso
  `pnpm bootstrap` roda no `install` e no início do `quality`. Lint falhando com "type could not be
  resolved" = rode `pnpm bootstrap`.
- **No CI, `pnpm/setup@v2` roda `pnpm install` sozinho** (desligado com `install: false`); o `.env`
  precisa existir antes do install porque o `prepare` gera o client Prisma.
- **Portas 3000–3002 ocupadas** por processos antigos fazem o `pnpm dev` subir uma app com
  `EADDRINUSE` enquanto a antiga responde — e o smoke falha de forma confusa. `ss -ltnp | grep 300`
  antes de subir.
- **`git stash` restaura arquivos já _staged_**; ao dividir commits por tema, use `git add` explícito e
  confira `git show --stat` antes do push.
- **Prettier reformata antes de você editar**: edições por script (`sed`, Python) devem ser feitas
  depois de `pnpm format`, ou relendo o arquivo; senão o trecho a substituir não casa.
- **`pnpm smoke` e `next start` usam o build existente**: depois de mudar código, `pnpm dev` (watch)
  ou rebuild antes de verificar.
- **O `OutboxRelay` roda em segundo plano também na app de teste**: `createTestApp()` chama
  `relay.stop()` logo após o `init`; sem isso o timer disputa os eventos com os `flush()` dos testes
  (falhou no CI, não localmente). Ao montar outra app de teste, faça o mesmo.
- **Tarefas do Turbo que escrevem no mesmo diretório não podem rodar em paralelo**: `typecheck`
  (`next typegen`) e `build` do dashboard escrevem em `.next`; `apps/web/turbo.json` serializa os dois.
- **PostgreSQL local em 5432** é comum: `POSTGRES_PORT=5433` + porta em `DATABASE_URL` no `.env`.

## Antes de dar uma tarefa por concluída

1. `pnpm quality` verde localmente.
2. Tocou no fluxo de eventos? `pnpm smoke` verde com a stack de pé.
3. Tocou no dashboard? `pnpm --filter @challenge/web build` e conferir as rotas servidas (`next start`).
4. PR com check `quality` verde; `DECISIONS.md` atualizado se houve decisão; template preenchido.
5. Após o merge, CI de `develop` verde.

## Escopo e próximos passos plausíveis

O que ficou de fora — e por quê — está no README. Candidatos naturais, cada um com a decisão a
registrar em `DECISIONS.md`:

- **SSE** como otimização de latência sobre o polling condicional (o polling continua como
  garantia; a limitação a documentar é o fan-out entre instâncias). Ponto de troca: os hooks em
  `apps/web/src/features/transactions/hooks.ts`.
- **`Idempotency-Key`** no `POST /transactions` (header + `UNIQUE` no banco) contra retries do cliente.
- **OpenAPI** gerado a partir dos schemas zod, se surgirem consumidores externos.
- **Dockerfiles** das apps e **Kafka no CI** (service container) para automatizar o smoke.
