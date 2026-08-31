# Registro de decisões

# Tratamento de falha na mensageria

## Publicação do evento de criação

**Decisão:** ao criar uma transação, o registro dela e o evento que vai para o antifraude são
gravados no banco na mesma operação, no padrão outbox. Nada é enviado ao Kafka durante a chamada.

**Alternativas consideradas:** enviar o evento durante a própria chamada, logo depois de gravar; ler
as alterações direto do log do banco.

**Por quê:** se o envio acontecesse durante a chamada e o Kafka estivesse fora do ar, a transação
ficaria gravada sem nunca ser avaliada — pendente para sempre. Gravados juntos, ou existem os dois,
ou não existe nenhum.

## Integração com o Kafka

**Decisão:** a comunicação com o Kafka é feita por código do projeto, em `packages/messaging`, e não
pelo módulo pronto do framework.

**Alternativas consideradas:** usar o módulo de mensageria que o framework oferece.

**Por quê:** no módulo pronto do NestJS, um evento cujo processamento falha é descartado: o erro é
registrado e a fila segue adiante. Aqui, evento descartado é transação que nunca recebe veredito.

## Falha no processamento de um evento

**Decisão:** quando o processamento falha, o evento é tentado de novo algumas vezes, com intervalo
crescente. Se não passar, ou se vier malformado, vai para uma fila separada, no padrão DLQ, para
inspeção.

**Alternativas consideradas:** uma fila de espera, para tentar mais tarde; tentar indefinidamente.

**Por quê:** um evento com defeito não segura os que vêm atrás, e a ordem dos eventos de uma mesma
transação é preservada. As tentativas são rápidas de propósito: uma pausa longa faz o Kafka
considerar o serviço fora do ar e reenviar tudo.

## Atualização do status da transação

**Decisão:** ao receber o veredito do antifraude, o status muda apenas se a transação ainda estiver
pendente. Se já estiver aprovada ou rejeitada, nada acontece.

**Alternativas consideradas:** consultar a transação antes de alterar; manter um registro dos
eventos já processados.

**Por quê:** o Kafka pode entregar o mesmo evento duas vezes, e a segunda entrega não tem efeito. Se
dois vereditos diferentes chegarem, o primeiro prevalece.

# Formato dos eventos

## Formato dos eventos entre os serviços

**Decisão:** o evento leva os dados da transação, mais um identificador próprio, um número de versão
e o identificador da requisição que o originou.

**Alternativas consideradas:** enviar só o identificador da transação e deixar o antifraude buscar o
resto na API; enviar só os dados, sem os campos de controle.

**Por quê:** o antifraude avalia sem consultar a API, então uma indisponibilidade dela não trava a
avaliação. Os campos de controle permitem reconhecer evento repetido, mudar o formato sem quebrar
quem ainda lê o antigo, e acompanhar uma requisição até o veredito.

# Modelagem de dados

## Armazenamento dos eventos pendentes

**Decisão:** os eventos pendentes ficam numa tabela própria, `outbox_events`, no mesmo banco das
transações.

**Alternativas consideradas:** uma coluna de controle na própria tabela de transações; guardar os
pendentes fora do banco.

**Por quê:** a fila precisa ser escrita pela mesma transação de banco que grava o registro de
negócio, o que só acontece se as duas estiverem no mesmo banco. Em tabela separada, o registro da
transação não carrega estado de entrega, que não é informação de negócio e some quando o evento é
publicado.

## Status e tipo de transação

**Decisão:** o status é um enum do banco; o tipo de transação é uma tabela, semeada pela migration.

**Alternativas consideradas:** os dois como enum; os dois como tabela.

**Por quê:** o contrato devolve status e tipo na mesma forma, mas eles mudam em ritmos diferentes: o
status é um conjunto fechado de três valores, e o tipo é catálogo que cresce com o negócio. Como
enum, cada tipo novo seria uma migration; como tabela, o status cobraria um join em toda leitura.

**O que mudaria:** se passarem a surgir status novos com frequência, o enum vira tabela — `ALTER
TYPE` não roda dentro da transação da migration.

# Atualização do status na interface

## Como a tela reflete a mudança de status

**Decisão:** a tela volta a perguntar pelas transações a cada 3 segundos enquanto houver alguma
pendente, e para de perguntar quando todas chegam a um status final.

**Alternativas consideradas:** o servidor empurrar a mudança, por SSE ou WebSocket; perguntar em
intervalo fixo, sempre; exigir que o usuário recarregue a página.

**Por quê:** perguntar custa pouco enquanto há o que esperar, e o servidor não guarda nada por
usuário conectado — qualquer instância da API atende qualquer aba. Empurrar exigiria manter a
conexão aberta e, com mais de uma instância, um caminho para o veredito alcançar aquela em que o
usuário está.

**O que mudaria:** com muitas abas abertas e muitas pendentes ao mesmo tempo, o custo se inverte e
empurrar compensa.

# Estratégia de testes

## O que roda de verdade e o que é substituído

**Decisão:** os testes rodam contra o Postgres do compose, com o Kafka substituído por mocks. O
caminho com Kafka real fica no `pnpm smoke`, executado à mão.

**Alternativas consideradas:** substituir o banco também; subir um Kafka junto dos testes, dentro do
gate.

**Por quê:** filtro, paginação e a atualização condicional são consultas ao banco, e contra um mock
o que se testa é o mock. Do Kafka o que importa é a política de entrega — repetição, nova tentativa,
descarte —, e ela é verificada isoladamente, sem broker. O custo assumido é que o fluxo ponta a
ponta só é exercitado à mão.

# Organização do projeto

## Validação dos dados de entrada

**Decisão:** as regras de cada campo ficam num pacote comum, `packages/contracts`, usado pela API,
pelos eventos e pelo formulário do dashboard.

**Alternativas consideradas:** repetir as regras no dashboard; gerar os clientes a partir de uma
especificação da API.

**Por quê:** o formulário não aceita o que a API recusa. Regra escrita duas vezes diverge com o
tempo.

## Organização do repositório

**Decisão:** API, antifraude e dashboard ficam no mesmo repositório.

**Alternativas consideradas:** um repositório por serviço.

**Por quê:** os três dependem do mesmo contrato de dados, e uma mudança nele entra de uma vez só. Em
repositórios separados, a mesma mudança viraria várias entregas coordenadas.

# Outros

## Armazenamento no serviço de antifraude

**Decisão:** o serviço recebe o evento, aplica a regra e responde. Não tem banco de dados.

**Alternativas consideradas:** guardar cada avaliação para auditoria.

**Por quê:** sem nada guardado, várias cópias do serviço rodam em paralelo sem coordenação entre
elas. Cada veredito já fica registrado junto da transação.

## Comunicação entre o dashboard e a API

**Decisão:** o navegador chama a API de transações diretamente. O servidor do Next entrega a
aplicação, mas não intermedia os dados.

**Alternativas consideradas:** passar as chamadas por um intermediário no próprio Next (BFF); buscar
os dados no servidor e mandá-los prontos para a tela.

**Por quê:** um salto a menos entre o usuário e o dado, e o servidor do Next não precisa estar de pé
para a tela continuar funcionando. O custo é liberar a origem do dashboard na API e o endereço dela
ficar visível no navegador.

**O que mudaria:** com autenticação, o intermediário passa a valer — é onde o token ficaria, sem
chegar ao navegador.

# Volume e concorrência

> _"A aplicação pode precisar lidar com um volume alto de escritas e leituras concorrentes. Como
> você abordaria esse requisito?"_

Antes de mudar qualquer coisa, medir: quanto tempo cada chamada leva, quanto o antifraude está
atrasado e quantos eventos esperam publicação.

Os três serviços já rodam em várias cópias ao mesmo tempo, então crescer é subir mais cópias. O banco
não cresce assim, e é nele que o limite aparece primeiro: cada cópia abre suas conexões, e são elas
que acabam antes de faltar processamento.

Na escrita, o problema seguinte é a duplicata — sob carga o cliente desiste da espera e repete a
chamada, criando duas transações. Na leitura, as consultas podem ir para cópias do banco dedicadas a
isso, desde que uma transação recém-criada continue sendo lida da principal.

O que eu não faria é tornar a avaliação antifraude síncrona para simplificar: os dois serviços
passariam a cair juntos.
