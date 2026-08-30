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

**Decisão:** `pnpm quality` = `lint` → `format:check` → `turbo run typecheck test build`. ESLint 9
(flat config único na raiz, regras `strictTypeChecked` do typescript-eslint), Prettier como única
fonte de formatação, Vitest como único runner de testes em todos os pacotes. `husky` + `lint-staged`
no `pre-commit`; `commitlint` no `commit-msg`; um guard de nome de branch no `pre-commit`.

**Alternativas consideradas:** Biome ou oxlint no lugar de ESLint/Prettier; ESLint 10 (o
`latest`); Jest para o backend (padrão histórico do NestJS) e Vitest para o frontend; validar
branch/commit só no CI.

**Por quê:** as regras com checagem de tipos do typescript-eslint (`no-floating-promises`,
`no-misused-promises`, `no-explicit-any` como erro) pegam a classe de bug que mais importa em código
assíncrono orientado a eventos, e Biome/oxlint ainda não as têm com a mesma profundidade. Um único
runner de testes evita dois conjuntos de config, mocks e matchers no mesmo repositório — e o NestJS 12
já gera projetos com Vitest. Validar no hook, além do CI, impede que a mensagem errada sequer entre no
histórico, que é parte do que se avalia. O ESLint ficou no 9 (e não no 10) porque o
`eslint-plugin-react`, que o `eslint-config-next` usa, ainda chama APIs removidas no 10
(`context.getFilename`) — o dashboard não lintaria; o typescript-eslint e o `eslint-config-next`
suportam os dois majors, então nada do que usamos depende do 10. O 9 está em modo de manutenção
(dist-tag `maintenance`): a troca para o 10 fica agendada para quando o `eslint-plugin-react`
acompanhar, e é uma linha no `package.json`.

## Versões: TypeScript 6, não 7; Node 22.23

**Decisão:** TypeScript fixado em `~6.0` em todo o workspace (via `catalog` do pnpm) e Node 22.23
(LTS) no `.nvmrc`.

**Alternativas consideradas:** TypeScript 7 (port nativo em Go, `latest` no registry); manter o
Node 22.14 que já estava instalado.

**Por quê:** o TypeScript 7.0 não expõe API JavaScript, e é dela que dependem `nest build`, os
plugins do NestJS CLI e o typescript-eslint (que aceita `< 6.1`). O `@nestjs/cli@12` fixa `~6.0.2`.
O Node 22.14 não atende os requisitos mínimos de `lint-staged@17` (≥ 22.22) nem do
`@nestjs/schematics` (≥ 22.22.3); 22.23 é a LTS corrente e continua dentro do "Node 22+" do desafio.

## Contratos compartilhados com zod, validando os dois lados da rede

**Decisão:** um pacote `@challenge/contracts` concentra os schemas zod dos corpos da API, das
respostas e dos eventos. O backend valida requisições com eles, o frontend valida o formulário com
os mesmos objetos, e os dois serviços validam o que consomem do Kafka com o schema do evento.

**Alternativas consideradas:** `class-validator` + DTOs em classe no NestJS (o padrão do
framework) e tipos TypeScript duplicados no frontend; OpenAPI como fonte de verdade com geração de
código para os clientes; JSON Schema.

**Por quê:** a regra de validação de um campo (`value` com duas casas, contas em UUID) existe uma
única vez e produz a mesma mensagem na tela e na API — o formulário não pode aceitar o que o backend
recusa nem o contrário. `class-validator` obriga a duplicar essa regra no frontend; OpenAPI com
geração de código é o caminho certo quando há vários consumidores externos, mas aqui o único
consumidor é o dashboard do próprio monorepo, e a geração adicionaria um passo de build sem ganho.
O NestJS 12 aceita qualquer schema _Standard Schema_ nativamente (`@Body({ schema })`), então não
há adaptador entre o zod e o framework.

## Formato dos eventos: envelope versionado com rastreio

**Decisão:** toda mensagem Kafka carrega um envelope
`{ eventId, eventType, version, occurredAt, correlationId, causationId?, data }`; o nome do evento
é o nome do tópico (`transaction.created`, `transaction.status.updated`); a chave da mensagem é o
`transactionExternalId`; cada tópico tem um `<topico>.dlq`. O payload de `transaction.created`
carrega os dados necessários à avaliação (valor, contas, tipo); o de `transaction.status.updated`
carrega o veredito, o motivo e o instante da avaliação.

**Alternativas consideradas:** publicar só o identificador e deixar o consumidor buscar o resto na
API (evento "magro"); payload sem envelope (só os dados); CloudEvents.

**Por quê:** o antifraude não deve depender da API de transações para avaliar — se dependesse, uma
indisponibilidade da API travaria a fila e a comunicação deixaria de ser assíncrona de fato. O
envelope dá idempotência (`eventId`), evolução controlada (`version`), e rastreabilidade
(`correlationId` liga requisição → evento → veredito → atualização; `causationId` diz qual evento
gerou qual). CloudEvents traria o mesmo com um vocabulário padronizado, mas exige biblioteca e
adapta mal ao formato de headers do kafkajs; o envelope próprio tem seis campos e um teste de
contrato nos dois sentidos. A chave por transação garante ordem por agregado dentro de uma partição.

## Modelagem de dados

**Decisão:** duas tabelas de negócio no Postgres, via Prisma com migrations versionadas:
`transaction_types` (catálogo, semeado pela própria migration) e `transactions` (`id` UUID v7 que
**é** o `transactionExternalId` do contrato, contas, tipo, `status` como enum Postgres, `value`
como `numeric(15,2)`, `created_at`/`updated_at`). Índices compostos `(status, created_at desc)`,
`(transaction_type_id, created_at desc)` e `(created_at desc)`, que são exatamente os filtros e a
ordenação da listagem.

**Alternativas consideradas:** status em tabela de lookup (como a forma `{ name }` do contrato
sugere); `value` como ponto flutuante ou como inteiro em centavos; UUID v4 (`gen_random_uuid()`);
`id` interno numérico + `external_id` separado; seed via script (`prisma db seed`).

**Por quê:** o enum é validado pelo banco, tipado pelo Prisma e só tem três valores estáveis; uma
tabela de lookup custaria um join em toda leitura para expressar o mesmo. O contrato devolve
`transactionStatus.name`, e o mapper produz essa forma a partir do enum. Dinheiro em
ponto flutuante é erro de arredondamento garantido; `numeric(15,2)` é exato, e o mapper converte para
número só na borda da API (o contrato mostra `120`, não `"120.00"`). Centavos inteiros seriam
igualmente corretos, mas tornariam todo `value` do código um `bigint` a converter. UUID v7 é ordenável
no tempo: numa tabela append-only, v4 fragmenta o índice primário a cada insert. Um único `id`
externo evita expor sequência e dispensa um índice extra. O seed na migration garante que
qualquer ambiente que aplicou as migrations tem o mesmo catálogo — inclusive o CI e os testes —
sem um passo manual que alguém esquece. O que mudaria: se surgissem novos status com frequência,
`ALTER TYPE … ADD VALUE` não roda dentro de transação de migration, e a lookup table passaria a
valer a pena.

## Estratégia de testes: unitários com fakes, integração com Postgres real, tudo no gate

**Decisão:** Vitest em todos os pacotes, com dois projetos no serviço de transações: `unit`
(regras e mapeamentos, sem I/O) e `integration` (a aplicação inteira contra o Postgres do docker
compose, num schema isolado `test`, migrations aplicadas por um `globalSetup`). Os dois rodam em
`pnpm test` e, portanto, no `pnpm quality` e no CI — que sobe um Postgres como _service container_.

**Alternativas consideradas:** mockar o Prisma nos testes de repositório; Testcontainers para
subir o banco dentro do próprio teste; deixar a integração fora do gate (só manual ou num job
separado).

**Por quê:** filtros, paginação e o update condicional de status _são_ as regras de negócio do
serviço e vivem em SQL — testá-los contra um mock do Prisma testa o mock. O compose já é passo um do
README, então exigir o banco no gate não adiciona pré-requisito; o `globalSetup` falha rápido com a
instrução de subir o compose quando o banco não responde. Testcontainers daria um `pnpm test`
autossuficiente ao custo de mais uma dependência pesada e de segundos de subida por execução; o
schema isolado protege os dados de desenvolvimento com custo zero. Os testes consultam a aplicação
pela borda (HTTP, banco), não pela implementação — é o que faz um teste quebrar quando o
comportamento quebra.

## Porta do Postgres parametrizada no docker-compose

**Decisão:** o mapeamento de porta do Postgres passa a ser `${POSTGRES_PORT:-5432}:5432`; o
padrão continua 5432.

**Alternativas consideradas:** manter fixo em 5432; trocar para uma porta "exótica" fixa.

**Por quê:** máquinas de desenvolvimento frequentemente já têm um PostgreSQL local em 5432 (foi o
caso aqui). Parametrizar mantém o padrão do desafio para quem não tem conflito e resolve o conflito
com uma linha no `.env`, em vez de exigir parar um serviço do sistema.

## Listagem: paginação por offset com total, período em dias inclusivos (UTC)

**Decisão:** `GET /transactions` pagina com `page`/`pageSize` (máximo 100) e devolve `total`;
ordena por `created_at desc, id desc`; o filtro de período recebe `from`/`to` como `AAAA-MM-DD`,
inclusivos nas duas pontas e interpretados em UTC (`[from 00:00, to + 1 dia 00:00)`).

**Alternativas consideradas:** paginação por cursor (keyset) em `(created_at, id)`; omitir o
`total` (só `hasNext`); período como timestamps completos; interpretar as datas no fuso do
usuário.

**Por quê:** o consumidor é um dashboard com páginas numeradas e "N resultados" — offset com
total é o que essa interface pede, e com os índices compostos o custo é irrelevante no volume
esperado. Keyset é a evolução natural quando o offset profundo ou o `COUNT(*)` passarem a pesar
(está na resposta sobre concorrência); o `id` UUID v7 no desempate já deixa a ordenação estável para
essa migração. Datas em dias são o que um filtro de tela oferece; o intervalo meio-aberto evita o
erro clássico de perder o último segundo do dia final, e UTC evita que o mesmo filtro devolva
resultados diferentes conforme o fuso do servidor. Um filtro por hora, se surgisse, seria outro par
de parâmetros, não uma reinterpretação deste.

## Formato único de erro e tratamento do caminho triste na API

**Decisão:** toda resposta de erro tem a forma `{ statusCode, message, errors? }`. Validação de
entrada usa os schemas do pacote de contratos diretamente nos decorators do NestJS 12
(`@Body`/`@Query`/`@Param` com `schema`) e responde 400 com um item por campo (`path`, `message`).
Um filtro global converte "banco inacessível" em 503 e qualquer exceção inesperada em 500 sem
detalhes, logando a stack — porque 500 é bug, 503 é infraestrutura.

**Alternativas consideradas:** `ValidationPipe` + `class-validator` (padrão do Nest); deixar o
formato de erro padrão do framework; devolver a mensagem da exceção desconhecida ao cliente.

**Por quê:** o dashboard precisa mapear erro de validação para o campo do formulário, e isso exige
`path` estruturado; o formato padrão do Nest devolve uma lista de strings. Distinguir 503 de 500
muda o que o cliente e a operação fazem: um pede para tentar de novo, o outro abre incidente.
Detalhes de exceção interna no corpo da resposta vazam estrutura do sistema sem ajudar quem chama.

## Publicação do evento de criação: transactional outbox

**Decisão:** `POST /transactions` grava a transação **e** o evento `transaction.created` na mesma
transação de banco (tabela `outbox_events`, `id` = `eventId`, `key` = id da transação, payload =
envelope completo). Um relay, em processo, lê o outbox e publica no Kafka; a requisição HTTP
nunca fala com o broker.

**Alternativas consideradas:** publicar no Kafka logo após o commit, dentro da requisição
(_publish after commit_); publicar antes de gravar; CDC (Debezium lendo o WAL do Postgres).

**Por quê:** as duas primeiras têm uma janela em que a transação existe sem evento (broker fora
do ar ou processo morto entre o commit e o `send`) ou o evento existe sem transação — e nesse
domínio "transação pendente para sempre" é exatamente o bug que o fluxo assíncrono não pode ter.
Com o outbox, a API continua aceitando escritas com o Kafka indisponível e os eventos saem quando
ele voltar; o custo é uma tabela e um relay. CDC entrega a mesma garantia sem o relay, mas exige
um componente de infraestrutura (conector, Kafka Connect) que não se justifica antes de o relay
virar gargalo. O `eventId` como chave primária do outbox torna a gravação idempotente por evento.

## Identificador de requisição como `correlationId`

**Decisão:** um middleware aceita `x-request-id` do cliente ou gera um UUID; o valor volta no
header da resposta e vira o `correlationId` do evento de criação, que o antifraude propaga para o
veredito.

**Alternativas consideradas:** não correlacionar; usar o id da transação como correlação.

**Por quê:** com um único identificador dá para seguir uma requisição da API até a atualização de
status nos logs dos dois serviços. O id da transação serve para o dado, não para a requisição —
um retry do cliente com o mesmo `x-request-id` fica visível como tal.

## Mensageria: camada própria sobre o kafkajs em vez do transporte Kafka do NestJS

**Decisão:** um pacote `@challenge/messaging` (sem dependência do Nest) com um producer
(`acks=-1`, particionador padrão explícito), um `runConsumer` com política única de consumo e um
`ensureTopics` para o boot. Cada serviço embrulha isso nos seus providers.

**Alternativas consideradas:** `@nestjs/microservices` com `Transport.KAFKA` (`@EventPattern`,
`ClientKafka`), que é o caminho idiomático do framework; `@confluentinc/kafka-javascript`
(librdkafka) ou `@platformatic/kafka` no lugar do kafkajs.

**Por quê:** lendo o fonte de `@nestjs/microservices@12.0.1` (`server/server-kafka.js`,
`context/rpc-proxy.js`, `server/server.js`): uma exceção num handler `@EventPattern` passa pelo
`RpcProxy` → `RpcExceptionsHandler` e vira um observable de erro que ninguém assina — é logada e o
offset avança. Ou seja, o transporte entrega eventos **at-most-once**, e a `KafkaRetriableException`
só é honrada no caminho request/response (`combineStreamsAndThrowIfRetriable`). Para este fluxo,
"o banco oscilou e o veredito se perdeu" é inaceitável; precisávamos de retry com backoff, DLQ e
at-least-once com handlers idempotentes, e isso exige controlar o `eachMessage`. A camada tem
~200 linhas, é testada com fakes e não conhece o Nest. O kafkajs está estável mas sem manutenção
ativa; as alternativas nativas exigiriam de qualquer forma um transporte próprio, e a troca fica
confinada a esse pacote.

## Relay do outbox: claim com `FOR UPDATE SKIP LOCKED`, publicação fora de transação

**Decisão:** o relay roda em processo, num `setTimeout` reagendado a cada ciclo (500ms). Cada
ciclo reivindica um lote (`UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING`),
publica cada evento fora de qualquer transação de banco e marca `published_at`. Falha incrementa
`attempts` e guarda o erro; no limite, `failed_at` retira o evento da fila. Um claim mais velho que
o timeout é considerado abandonado e volta a ser elegível.

**Alternativas consideradas:** `setInterval` (ciclos se sobrepõem quando o broker demora);
manter a transação de banco aberta durante o `send` no Kafka; `LISTEN/NOTIFY` do Postgres para
acordar o relay sem polling; publicar diretamente na requisição com o outbox só como fallback.

**Por quê:** o `SKIP LOCKED` é o que permite mais de um relay (ou mais de uma instância da API)
sem publicar em dobro, e custa uma cláusula. Transação aberta esperando o broker é a receita para
esgotar o pool quando o Kafka oscila. Polling de 500ms é invisível para o usuário e trivial de
operar; `LISTEN/NOTIFY` reduz a latência, mas adiciona uma conexão dedicada e um caminho a mais
para falhar — é a evolução natural se a latência importar. Publicar na requisição reintroduziria
justamente a dependência do broker que o outbox eliminou.

## Tópicos criados no boot, `fromBeginning` e desligamento controlado

**Decisão:** cada serviço garante no boot os tópicos do fluxo e suas DLQs (`admin.createTopics`
idempotente, com `waitForLeaders`, partições via `KAFKA_TOPIC_PARTITIONS`). Consumers assinam com
`fromBeginning: true`. `enableShutdownHooks()` desconecta producer e consumer em SIGTERM.

**Alternativas consideradas:** depender do `auto.create.topics.enable` do broker; script de
provisionamento à parte; `fromBeginning: false`.

**Por quê:** com auto-create, o primeiro publish num tópico novo falha com
`LEADER_NOT_AVAILABLE` até a eleição de líder, e um consumer não consegue assinar tópico
inexistente — as duas coisas acontecem exatamente na primeira execução, a demo. Um grupo novo com
`fromBeginning: false` ignora tudo que foi publicado antes de ele existir: transações criadas
antes de o antifraude subir ficariam pendentes para sempre. Sem `disconnect` no shutdown, cada
restart do `--watch` deixa um membro zumbi no grupo e a nova instância fica sem partições até o
`sessionTimeout`.

## Serviço antifraude: stateless, regra pura, limite vindo do ambiente

**Decisão:** `apps/anti-fraud` não tem banco. Consome `transaction.created`, aplica
`evaluateTransaction` (função pura: valor **acima** de `ANTI_FRAUD_VALUE_LIMIT`, padrão 1000, é
rejeitado; no limite, aprova) e publica `transaction.status.updated` com `causationId` apontando
para o evento consumido e o `correlationId` propagado. Expõe só `/health`, que reporta se o
consumer está de fato rodando.

**Alternativas consideradas:** persistir cada avaliação (auditoria) no antifraude; expor a
avaliação também como endpoint HTTP síncrono; limite fixo no código.

**Por quê:** a avaliação é determinística a partir do próprio evento, então reprocessar uma
mensagem (redelivery) produz o mesmo veredito — o serviço é idempotente por construção e escala
horizontalmente sem coordenação. Auditoria de vereditos é responsabilidade de quem guarda a
transação (o status final já fica lá); se fosse necessário histórico de avaliações, seria uma
tabela de eventos _no antifraude_, não uma dependência dele na API de transações. Um endpoint
síncrono reintroduziria o acoplamento que o enunciado pede para evitar. O limite é configuração
porque o número muda com o negócio; a regra ("acima de" estrito) é código, com teste nos limites
(1000 aprova, 1000.01 rejeita).

## Consumo do veredito: update condicional, idempotente por construção

**Decisão:** o serviço de transações aplica `transaction.status.updated` com um único
`UPDATE … WHERE id = ? AND status = 'PENDING'`. Zero linhas afetadas significa "já era final"
(entrega repetida) ou "não existe" — os dois casos são logados e a mensagem é confirmada, sem
retry. Só erro de infraestrutura propaga para a política de retry/DLQ do consumer.

**Alternativas consideradas:** ler-e-então-gravar (`findUnique` + `update`), com ou sem lock;
tabela de eventos processados (`processed_events` com o `eventId`) para deduplicar; tratar
"transação desconhecida" como erro e mandar para a DLQ.

**Por quê:** at-least-once significa que a mesma mensagem pode chegar duas vezes (rebalance,
restart entre o processamento e o commit do offset); com um update condicional, a segunda
entrega é um no-op sem transação explícita nem lock — a condição _é_ a deduplicação, e serve
também para o caso de dois vereditos diferentes (o primeiro vence). Uma tabela de eventos
processados seria necessária se o efeito não fosse naturalmente idempotente (um crédito em
conta, por exemplo); aqui seria uma tabela a mais para proteger o que a condição já protege.
"Transação desconhecida" não melhora com retry — com o outbox, a transação é gravada antes de o
evento existir, então esse cenário indica dado corrompido ou ambiente cruzado, e o lugar dele é o
log de alerta, não uma fila que ninguém drena.

## Dashboard: Next.js App Router com dados buscados no cliente (TanStack Query)

**Decisão:** as páginas do Next são cascas finas (Server Components sem dados); quem busca e
mantém os dados é o TanStack Query em componentes cliente, através de um `fetch` tipado contra a
API (`apiRequest`) que traduz erros em algo que a tela sabe usar (`fieldErrors` por campo,
`retryable`). Sem retry automático: o erro aparece, com botão de tentar de novo.

**Alternativas consideradas:** buscar nos Server Components e revalidar com `router.refresh()`;
Server Actions para a criação; SWR; `fetch` direto em `useEffect`.

**Por quê:** o requisito central da interface é refletir uma mudança que acontece _depois_ da
renderização (pendente → aprovada/rejeitada). Isso exige polling ou push no cliente de qualquer
jeito; concentrar toda a busca no cliente dá um único modelo mental (cache por chave, estados
`isPending`/`isError`, `refetch`) em vez de dois (RSC para a primeira carga, cliente para as
seguintes). O TanStack Query resolve cache, deduplicação, polling condicional e refetch ao voltar
para a aba — o que o `useEffect` faria na mão e mal. Server Actions acoplam o formulário ao Next
quando a API já existe e já valida com o mesmo schema. O custo é um _skeleton_ na primeira carga
em vez de HTML pronto — irrelevante num dashboard interno.

## Testes do frontend: Vitest + Testing Library + MSW, consultando por papel acessível

**Decisão:** componentes testados com Testing Library consultando por papel (`getByRole`,
`getByLabelText`), com a rede interceptada pelo MSW (um handler por teste; requisição sem
handler é erro). Estados de carregamento, erro e vazio têm marcação acessível (`role="status"`
com `aria-busy`, `role="alert"`) e são testados por ela.

**Alternativas consideradas:** mockar o módulo do client HTTP (`vi.mock`); testes end-to-end no
navegador (Playwright); `data-testid`.

**Por quê:** o MSW exercita o código real de `fetch`, serialização e tratamento de erro — é o
comportamento observável, não a implementação; mockar o módulo testaria a assinatura de uma
função interna. Consultar por papel obriga a marcação a ser acessível, que é o que o PRACTICES
pede e o que um usuário de leitor de tela recebe. Playwright cobriria o navegador de verdade,
mas com uma pilha inteira de pé para cada teste; fica como o próximo passo se o dashboard
crescer.

## Atualização de status na interface: polling condicional

**Decisão:** listagem e detalhe refazem a busca a cada `NEXT_PUBLIC_POLL_INTERVAL_MS` (3s)
**enquanto houver transação pendente na tela**; quando tudo é final, o polling para sozinho
(`refetchInterval` do TanStack Query em função dos dados). Voltar para a aba também refaz a busca.
A transação recém-criada aparece como `pendente` e muda de status sem recarregar.

**Alternativas consideradas:** Server-Sent Events alimentados pelo consumer de
`transaction.status.updated`; WebSocket; polling fixo (sempre ligado); não atualizar (exigir
recarregar a página).

**Por quê:** o veredito chega em ~1s e o número de transações pendentes ao mesmo tempo é baixo, então
o custo do polling condicional é uma requisição leve a cada 3s _só enquanto há o que esperar_ —
e zero estado de conexão no servidor, o que mantém a API stateless e horizontalmente escalável
sem mais nada. SSE é a evolução natural quando `pendentes × abas abertas` crescer: exige que o
servidor mantenha conexões abertas e, com mais de uma instância, um mecanismo de fan-out (cada
instância consumiria o tópico, ou um pub/sub) — custo que não se justifica hoje, e o ponto de
troca é um só hook (`useTransactions`/`useTransaction`). WebSocket seria bidirecional para um
fluxo que só desce. Polling fixo desperdiça requisições quando não há nada pendente.

## Filtros e paginação na URL

**Decisão:** o estado da listagem (status, tipo, período, página) vive na query string, lido
com o mesmo schema zod da API e escrito de volta a cada mudança (omitindo o que é padrão).
Mudar um filtro volta para a página 1.

**Alternativas consideradas:** estado em memória (React state); estado global (store).

**Por quê:** a URL é compartilhável, o botão voltar funciona e recarregar preserva o que o
usuário estava vendo — de graça, sem store. Um valor inválido na URL é ignorado campo a campo em
vez de quebrar a tela. A página N de um filtro não significa nada em outro filtro.

## Estatísticas da listagem: endpoint próprio em vez de agregação no cliente

**Decisão:** os cards de resumo do dashboard (total, aprovadas, rejeitadas, pendentes e volume
aprovado) vêm de `GET /transactions/stats`, um `GROUP BY status` com contagem e soma no banco,
devolvido no contrato `transactionStatsResponseSchema` com os três status sempre presentes
(zerados quando não há linhas). Sem filtros por enquanto: os números falam do período inteiro.

**Alternativas consideradas:** somar a página atual no cliente; buscar todas as páginas
(`pageSize=100` em série) e agregar; devolver os totais junto da resposta da listagem.

**Por quê:** a página atual enxerga no máximo `pageSize` itens — qualquer agregação em cima dela
mente quando existe mais de uma página. Buscar tudo transfere o custo da agregação para a rede e
cresce com a tabela. Embutir na listagem faria todo consumidor pagar o `GROUP BY` mesmo sem usar
os totais, e acoplaria o cache dos cards ao dos filtros. Um endpoint dedicado é uma consulta
coberta pelo índice `[status, created_at]`, resposta pequena e cacheável por conta própria, e o
lugar natural para ganhar `?from&to` se os cards um dia respeitarem o filtro de período.

## Dashboard: shadcn/ui (Radix) sobre Tailwind v4

**Decisão:** o dashboard usa componentes do shadcn/ui — primitivos Radix copiados para
`apps/web/src/components/ui` pelo CLI — com o tema descrito por tokens CSS em `globals.css`
mapeando a paleta do design aprovado (zinc, `--radius` de 6px, cores de status, fundo `surface`) e
a fonte Geist empacotada pelo pacote `geist`. Somente tema claro. O código gerado passa pelo mesmo
lint e format do repositório.

**Alternativas consideradas:** continuar com Tailwind puro (classes soltas, estado anterior);
Radix Themes; Base UI; biblioteca fechada (MUI/Chakra).

**Por quê:** o design usa os blocos do shadcn (dialog, sheet, select, toasts) e reproduzi-los à
mão significa reimplementar foco, `Escape`, `aria-*` e portais — exatamente o que o Radix já faz
bem e os testes por papel exigem. O shadcn copia o código para dentro do repositório: sem tema em
runtime, cada componente é editável (overlay, posição do check no select e animações foram
ajustados ao mockup) e o gate vale para ele como para qualquer arquivo nosso. Radix Themes e MUI
trazem opinião visual própria que brigaria com a fidelidade ao mockup; Tailwind puro funcionava,
mas cada overlay novo seria acessibilidade artesanal. A fonte vem empacotada para o build não
depender de rede; o modo escuro fica de fora por decisão de design — a variante `dark` fica presa
a uma classe que nunca existe, para os `dark:` do código gerado não dispararem com o tema do
sistema.

## Detalhe em sheet e criação em dialog, com deep link

**Decisão:** o detalhe abre num sheet lateral e a criação num dialog, por cima da listagem — mas
as rotas `/transactions/:id` e `/transactions/new` continuam existindo: renderizam a listagem com
o overlay aberto, e fechar navega de volta com a query preservada. O toast de veredito é um
assinante único do cache do TanStack Query, montado em `Providers`: ids `PENDING` entram num
conjunto e a primeira reaparição com status final gera exatamente um toast, venha da listagem, do
detalhe ou da criação.

**Alternativas consideradas:** páginas separadas para detalhe e criação (estado anterior);
overlay só em estado local, sem URL; intercepting/parallel routes do App Router; toast disparado
por cada tela que observa a transação.

**Por quê:** o design pede a lista viva por baixo do detalhe — linha piscando, cards e contador
atualizando enquanto se lê o veredito — e URLs compartilháveis já eram um requisito entregue;
abrir mão delas seria regressão. Manter a URL como única fonte de verdade também para os overlays
reaproveita a decisão dos filtros: voltar fecha o sheet, recarregar reabre no mesmo lugar.
Intercepting routes fariam o mesmo com mais estrutura (rotas paralelas por overlay) e sem ganho
aqui. O toast assinando o cache — e não as telas — evita o toast em dobro quando listagem e
detalhe observam a mesma transação, e sobrevive à troca de rota porque vive acima das páginas.

## Volume alto de escritas e leituras concorrentes: como eu abordaria

> _"A aplicação pode precisar lidar com um volume alto de escritas e leituras concorrentes.
> Como você abordaria esse requisito?"_

Antes de qualquer otimização: **medir**. Três números dizem onde dói — p95 de latência por
endpoint, _lag_ do consumer por partição e tamanho do backlog do outbox (`published_at IS NULL`).
Sem eles, "escalar" é chute. O que segue está em ordem de custo, e ancorado nos três caminhos que
este sistema tem.

### O que já está desenhado para concorrência

- **Criação** é um `INSERT` append-only mais uma linha de outbox, na mesma transação: não há linha
  disputada, logo não há lock de negócio. O `id` é UUID v7, ordenável no tempo — inserts caem no
  fim do índice primário em vez de fragmentá-lo como um v4 faria.
- **Atualização de status** é um único `UPDATE` condicional por chave primária, uma vez por
  transação. Duas entregas do mesmo veredito não competem: a segunda não afeta linha nenhuma.
- **Leitura da listagem** tem índices compostos exatamente nos filtros
  (`(status, created_at)`, `(transaction_type_id, created_at)`, `(created_at)`), e a API é
  stateless — N instâncias atrás de um balanceador sem nenhuma mudança de código.
- **Kafka** particionado pela chave da transação: paralelismo entre transações, ordem dentro de
  cada uma. Consumers idempotentes tornam o _at-least-once_ seguro.
- **Relay do outbox** já usa `FOR UPDATE SKIP LOCKED`: várias instâncias da API publicam lotes
  disjuntos sem coordenação.

### Escritas

1. **Conexões, antes de CPU.** O primeiro limite de escrita em Postgres com Node costuma ser
   `max_connections`: pool do Prisma × instâncias da API × relays. A resposta é **PgBouncer em
   modo transação** na frente do banco (com o cuidado de desligar _prepared statements_ no
   cliente), não um banco maior.
2. **Retries do cliente geram duplicatas.** Sob carga, timeouts fazem clientes repetir o `POST`.
   Uma chave de idempotência (`Idempotency-Key` no header, `UNIQUE` no banco, resposta anterior
   devolvida) transforma o retry em no-op. É a primeira coisa que eu adicionaria ao contrato.
3. **Relay como gargalo.** Se o backlog do outbox crescer, os passos são: aumentar o lote, rodar
   mais relays (o `SKIP LOCKED` já permite) e, só então, trocar o polling por CDC (Debezium lendo
   o WAL) — que elimina o polling mas traz Kafka Connect como componente. Expurgar linhas
   publicadas (retenção de dias) mantém o índice parcial pequeno.
4. **Producer**: `acks=all` já está; producer idempotente e `linger.ms`/lotes maiores trocam
   latência por throughput quando o volume justificar.

### Leituras

1. **Réplicas de leitura** para a listagem, com um cuidado: o detalhe de uma transação
   recém-criada precisa ler do primário (_read-your-writes_), senão o usuário cria e "não
   encontra". Rotear por endpoint resolve.
2. **Paginação por cursor** (`created_at, id` — o desempate estável já existe) no lugar do
   `OFFSET`, que degrada linearmente com a profundidade; e substituir o `COUNT(*)` exato por
   "há próxima página" ou uma contagem aproximada/cacheada — em tabelas grandes o `COUNT` custa
   mais do que a página.
3. **Cache** só onde não mente: o catálogo de tipos. O status de uma transação pendente exige
   frescor; cachear a listagem esconderia exatamente a mudança que o dashboard existe para mostrar.
4. **Tempestade de polling.** O custo do polling é `abas abertas × pendentes na tela`. O primeiro
   passo barato é um endpoint delta (`?updatedSince=`); o segundo é **SSE** alimentado pelo
   consumer de `transaction.status.updated`, com fan-out por instância (cada instância consome o
   tópico com seu próprio grupo, ou via pub/sub). O ponto de troca é um hook no frontend.

### Kafka e consumidores

- Partições são o teto de paralelismo: `consumers ≤ partições`. O número de partições é decidido
  cedo (aumentar depois quebra a ordem por chave), então eu o dimensionaria pelo pico esperado com
  folga.
- O _lag_ por partição é o sinal para escalar o antifraude, que é stateless e escala sem mais nada.
- A política de retry em processo (backoff curto, DLQ) preserva a ordem por partição; se um
  handler passar a demorar, o próximo passo é um tópico de retry com atraso, para não travar a
  partição.

### Dados que crescem

- Particionar `transactions` por `created_at` faz sentido **se houver política de retenção**
  (arquivar meses antigos); sem retenção, só complica.
- `outbox_events` publicados são descartáveis: expurgo periódico.

### O que eu não faria

- Tornar o antifraude síncrono para "simplificar": acopla a disponibilidade dos dois serviços e é
  o oposto do que o fluxo pede.
- Locks distribuídos ou uma tabela de "eventos processados" para deduplicar: a condição do
  `UPDATE` já resolve para este efeito.
- CQRS com leitura em outro banco, antes de réplicas e índices esgotarem: é o dobro de
  infraestrutura para um problema que ainda não existe.
