# Transações com validação antifraude

Solução para o [desafio técnico fullstack da BIUD](./docs/desafio.md): uma API de transações
financeiras que nasce `pendente`, é validada de forma assíncrona por um serviço antifraude via Kafka
e tem seu status atualizado depois — e um dashboard que reflete essa mudança sem o usuário recarregar.

> Projeto em construção. Este README cresce a cada pull request; o histórico de decisões está em
> [DECISIONS.md](./DECISIONS.md) e as práticas seguidas em [PRACTICES.md](./PRACTICES.md).

## Pré-requisitos

| Ferramenta | Versão | Observação                                                    |
| ---------- | ------ | ------------------------------------------------------------- |
| Node.js    | 22.23+ | `nvm install` lê o `.nvmrc`                                   |
| pnpm       | 11.x   | versão fixada em `packageManager`; o pnpm 11 se auto-gerencia |
| Docker     | 24+    | com o plugin `compose`, para Postgres, Kafka e Kafka UI       |

## Como rodar

```bash
nvm install              # Node da versao do .nvmrc
cp .env.example .env     # variaveis do ambiente local
docker compose up -d     # Postgres :5432, Kafka :9092, Kafka UI :8080
pnpm install
```

```bash
pnpm db:migrate        # aplica as migrations no Postgres do compose
pnpm dev               # sobe as aplicacoes em modo watch
```

> Já existe um PostgreSQL em `localhost:5432`? Defina `POSTGRES_PORT=5433` no `.env` (e ajuste a
> porta em `DATABASE_URL`) antes do `docker compose up`.

| Serviço      | Endereço                              |
| ------------ | ------------------------------------- |
| transactions | http://localhost:3001/health          |
| Postgres     | `localhost:5432` (ou `POSTGRES_PORT`) |
| Kafka        | `localhost:9092`                      |
| Kafka UI     | http://localhost:8080                 |

## Quality gate

Um único comando roda tudo que valida o projeto — é o mesmo que a integração contínua executa:

```bash
pnpm quality
```

Cada etapa também roda isolada, para o ciclo curto do dia a dia:

| Comando             | O que faz                                                     |
| ------------------- | ------------------------------------------------------------- |
| `pnpm db:generate`  | gera o client Prisma (roda no `pnpm install` e antes do lint) |
| `pnpm lint`         | ESLint (regras com checagem de tipos) em todo o repo          |
| `pnpm format:check` | Prettier em modo verificação (`pnpm format` corrige)          |
| `pnpm typecheck`    | `tsc --noEmit` em cada pacote                                 |
| `pnpm test`         | Vitest em cada pacote                                         |
| `pnpm build`        | build de cada pacote, na ordem do grafo                       |

Antes de cada commit, `lint-staged` roda ESLint e Prettier apenas nos arquivos alterados, e o
`commitlint` recusa mensagens fora do padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/).
Um guard adicional recusa commits diretos em `develop` e branches fora do padrão `<tipo>/<descricao-kebab>`.

> Os hooks são instalados pelo `pnpm install` (via `husky`). Se você commita por um cliente gráfico
> (WebStorm, VS Code) e usa `nvm`, crie `~/.config/husky/init.sh` carregando o nvm para que `pnpm`
> esteja no `PATH` do hook:
>
> ```sh
> export NVM_DIR="$HOME/.nvm"
> [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
> ```

## Organização do repositório

```
apps/transactions     API NestJS de transacoes (Prisma + Postgres); migrations em prisma/migrations
packages/contracts    schemas zod da API e dos eventos, compartilhados por backend e frontend
docs/                 enunciado original do desafio
```

Monorepo com pnpm workspaces e Turborepo — o porquê está em [DECISIONS.md](./DECISIONS.md).

## Convenções

- Branches saem de `develop` com o tipo do commit no nome: `feat/criacao-de-transacao`.
- Commits pequenos, no padrão Conventional Commits: `feat(transactions): adiciona endpoint de criacao`.
- Todo trabalho entra por pull request para `develop`, com o template preenchido.
