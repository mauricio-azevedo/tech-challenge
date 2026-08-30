# Registro de decisões

Cada decisão estruturante do projeto, com as alternativas consideradas e o porquê da escolha.
O formato segue o [PRACTICES.md](./PRACTICES.md). Novas entradas são adicionadas no PR que as
introduz, na ordem em que o projeto nasceu.

## Organização do projeto: monorepo com pnpm workspaces e Turborepo

**Decisão:** um único repositório com `apps/` (transactions, anti-fraud, web) e `packages/`
(código compartilhado), gerenciado por pnpm workspaces; Turborepo orquestra `typecheck`, `test` e
`build` respeitando o grafo de dependências entre pacotes.

**Alternativas consideradas:** repositórios separados por serviço; monorepo com `pnpm -r` puro
(sem orquestrador); Nx.

**Por quê:** os dois serviços e o dashboard compartilham os contratos dos eventos e da API — em
repositórios separados isso vira pacote publicado ou copy/paste, e a mudança de contrato deixa de ser
atômica. `pnpm -r` resolve a ordem topológica, mas o Turborepo declara explicitamente que `typecheck`
e `test` de um app dependem do `build` dos pacotes que ele consome, roda tarefas em paralelo e cacheia
o que não mudou. Nx faria o mesmo com muito mais superfície (generators, plugins) do que três apps
justificam.

## Quality gate: ESLint + Prettier + Vitest + tsc, com hooks de git

**Decisão:** `pnpm quality` = `lint` → `format:check` → `turbo run typecheck test build`. ESLint 10
(flat config único na raiz, regras `strictTypeChecked` do typescript-eslint), Prettier como única
fonte de formatação, Vitest como único runner de testes em todos os pacotes. `husky` + `lint-staged`
no `pre-commit`; `commitlint` no `commit-msg`; um guard de nome de branch no `pre-commit`.

**Alternativas consideradas:** Biome ou oxlint no lugar de ESLint/Prettier; Jest para o backend
(padrão histórico do NestJS) e Vitest para o frontend; validar branch/commit só no CI.

**Por quê:** as regras com checagem de tipos do typescript-eslint (`no-floating-promises`,
`no-misused-promises`, `no-explicit-any` como erro) pegam a classe de bug que mais importa em código
assíncrono orientado a eventos, e Biome/oxlint ainda não as têm com a mesma profundidade. Um único
runner de testes evita dois conjuntos de config, mocks e matchers no mesmo repositório — e o NestJS 12
já gera projetos com Vitest. Validar no hook, além do CI, impede que a mensagem errada sequer entre no
histórico, que é parte do que se avalia.

## Versões: TypeScript 6, não 7; Node 22.23

**Decisão:** TypeScript fixado em `~6.0` em todo o workspace (via `catalog` do pnpm) e Node 22.23
(LTS) no `.nvmrc`.

**Alternativas consideradas:** TypeScript 7 (port nativo em Go, `latest` no registry); manter o
Node 22.14 que já estava instalado.

**Por quê:** o TypeScript 7.0 não expõe API JavaScript, e é dela que dependem `nest build`, os
plugins do NestJS CLI e o typescript-eslint (que aceita `< 6.1`). O `@nestjs/cli@12` fixa `~6.0.2`.
O Node 22.14 não atende os requisitos mínimos de `lint-staged@17` (≥ 22.22) nem do
`@nestjs/schematics` (≥ 22.22.3); 22.23 é a LTS corrente e continua dentro do "Node 22+" do desafio.
