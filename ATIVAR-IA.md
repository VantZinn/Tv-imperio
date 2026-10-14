# Ativar a IA gratuita no Empire TV

Esta entrega usa **Gemini** como padrão. O **Gemini 3.5 Flash-Lite** tem uma modalidade gratuita da API, sujeita às cotas do Google. Não é necessário comprar créditos da OpenAI. A chave fica no servidor, nunca no APK.

## 1. Criar sua chave gratuita

1. Entre em https://aistudio.google.com/apikey com sua conta Google.
2. Crie uma chave de API em um projeto do Google AI Studio.
3. Confira no painel que o projeto está em **Free tier**, sem faturamento ativado. Se sua conta já tem um projeto pago, use um novo projeto sem cobrança para este teste.
4. Consulte as cotas ativas do modelo no AI Studio. Elas variam por projeto e podem mudar; o limite local do jogo não aumenta a cota do Google.
5. Copie a chave para o painel privado da hospedagem. Não envie a chave ao GitHub, ao aplicativo ou ao chat.

O servidor chama apenas geração de texto estruturado. Não habilita ferramentas de pesquisa, imagens, cobrança ou pagamentos. No nível gratuito, o Google informa que os conteúdos podem ser usados para melhorar seus produtos; consulte os termos do provedor.

## 2. Preparar o servidor

Use Node.js 24. Extraia **Empire_TV_Servidor_IA.zip** ou use o diretório **server** do projeto completo. Não há dependências npm externas.

Na hospedagem, configure estas variáveis no painel de Environment/Secrets:

| Variável | Valor |
|---|---|
| AI_PROVIDER | gemini |
| GEMINI_API_KEY | sua chave gratuita |
| AI_MODEL | gemini-3.5-flash-lite |
| AI_GLOBAL_DAILY_LIMIT | 0 · sem limite diário interno |
| AI_USER_DAILY_LIMIT | 0 · sem limite diário interno |
| AI_BACKGROUND_DAILY_LIMIT | 4 |
| AI_TIMEOUT_MS | 60000 |
| SOCIAL_INTERVAL_MINUTES | 360 |
| WORLD_INTERVAL_MINUTES | 720 |

Em um computador ou servidor privado, você também pode copiar **.env.example** para **.env**, preencher a chave e executar:

~~~sh
npm test
npm start
~~~

Não envie **.env** ao GitHub. O processo inicia na porta configurada por PORT, ou 3000. Publique com HTTPS para conectar o APK. Configure **DATA_DIR** para um diretório persistente quando sua hospedagem oferecer esse recurso; o arquivo **empire.sqlite** guarda contas, sessões, análises e comentários.

O projeto mantém a versão 1.0.0.1 BETA e usa versionCode 10006. O APK conecta automaticamente a https://tv-imperio.onrender.com ao entrar na campanha. O jogador não precisa informar URL ou criar outra conta. Configurações → Universo online permite escolher somente o modo local ou uma conexão personalizada opcional. A chave Gemini fica no servidor.

Se os limites 20 e 16 já existem no Render, altere **ambos para 0**. Uma variável existente tem prioridade sobre o padrão do código. O servidor anterior não interpreta zero como ilimitado; publique esta atualização junto com a mudança das variáveis.

## 3. Hospedagem gratuita para experimentar

No Render, você pode criar **New → Web Service**, conectar o repositório com os arquivos extraídos do servidor e selecionar **Language: Node**. Se houver Dockerfile, confira que escolheu Node para seguir estas instruções.

- Build Command: **npm install**.
- Start Command: **npm start**.
- Environment: as variáveis da tabela, mais **NODE_VERSION=24.19.0**.
- Para um teste no plano **Free**, use **DATA_DIR=./data**.
- Se usar o repositório do projeto completo, configure **Root Directory=server**. Se o ZIP separado foi extraído na raiz, deixe Root Directory vazio.

O Render Free suspende o serviço após inatividade e não preserva arquivos locais após reiniciar, suspender ou publicar novamente. Portanto, contas do universo, sessões e conversas podem desaparecer; o progresso local do jogo permanece no celular. Talvez seja necessário recriar a conta do universo e conectar novamente. Esse modo serve para experimentar a IA sem pagar hospedagem, não para manter o universo ativo durante as 24 horas.

Para funcionamento contínuo e histórico durável, é necessário um processo que permaneça ativo e armazenamento persistente. O Dockerfile incluído pode ser usado em um servidor que você já tenha:

~~~sh
docker build -t empire-tv-universe .
docker run --env-file .env -p 3000:3000 -v empire-data:/app/data empire-tv-universe
~~~

Exponha por HTTPS. GitHub Pages não executa este serviço Node.js.

## 4. Conferir e conectar no jogo

1. Abra **https://SEU-SERVIDOR/health**. Deve informar **aiProvider: gemini** e **aiAvailable: true**.
2. Esse indicador confirma que há uma chave configurada. Uma análise real é necessária para verificar acesso ao modelo e cota; o endpoint não faz uma chamada paga ou gratuita apenas para verificar a saúde do serviço.
3. Abra uma campanha no APK atualizado; identificação e conexão começam automaticamente.
4. Em **Configurações → Universo online**, confira o estado. Durante uma falha de conexão, o jogo continua localmente e tenta conectar depois.
5. Para uma conta manual anterior, abra **Conexão personalizada · opcional** e entre com suas credenciais. A identificação automática mantém cada perfil separado e renova sua sessão quando necessário.
6. Abra uma obra no catálogo, entre em **Parecer** e toque em **Analisar ideia com IA**.

A análise influencia a criatividade, os comentários, o prazo e a negociação. Audiência, verba e MF continuam calculadas pelo jogo. O modelo não pode conceder dinheiro ou alterar o saldo.

## 5. Usar a cota com cuidado

Este perfil remove os limites diários internos de análises e de chamadas globais. O zero em **AI_GLOBAL_DAILY_LIMIT** e **AI_USER_DAILY_LIMIT** significa sem limite interno. A geração automática mantém até **4 chamadas por dia**; nessa variável, zero desativa os lotes. As cotas do Google continuam válidas por projeto, compartilhadas entre os jogadores. Uma chave nova do mesmo projeto não reinicia a cota.

Tentativas enviadas, inclusive falhas, continuam contadas. Chamadas bloqueadas antes do envio não gastam cota. A contagem do Gemini segue o fuso do Pacífico. O APK mostra **Sem limite interno**, uso automático e motivo de uma pausa do provedor. Essa indicação não significa Gemini ilimitado.

O servidor reaproveita pareceres da mesma versão da ideia. Chamadas idênticas simultâneas são agrupadas. Uma análise de outro modelo ou provedor não é apresentada como se tivesse sido feita pelo Gemini.

Por padrão, os comentários automáticos são gerados a cada **6 horas por campanha ativa** e as propostas concorrentes a cada **12 horas**. O app busca o conteúdo guardado a cada minuto enquanto conectado; sincronizar não significa fazer uma nova chamada de IA a cada minuto. Os intervalos maiores reservam parte da cota para analisar suas ideias. A campanha mais recente de cada conta recebe os lotes; após sete dias sem acesso, os lotes personalizados ficam suspensos até o jogador voltar.

Ao receber erro **429**, o serviço distingue pausa por minuto de cota diária quando o provedor informa essa distinção. A pausa diária segue a próxima meia-noite do Pacífico; uma pausa temporária respeita o prazo de nova tentativa informado. Erros de conexão, indisponibilidade e tempo excedido também iniciam uma espera persistida e crescente. O worker respeita o intervalo de comentários/concorrentes após falhar, impedindo que repita falhas a cada minuto.

Quando a cota termina, o serviço informa o motivo e o horário sem fingir que criou uma análise. Pareceres já guardados continuam acessíveis. No APK atualizado, negociação, financiamento e produção usam a avaliação local por regras durante falhas temporárias, preservando o funcionamento do jogo. O botão de analisar com IA continua informando a pausa; a aba Parecer mostra uma análise local identificada quando não há parecer de IA dessa versão. Em um APK anterior, use **Configurações → Universo online → Desconectar** para continuar por regras; você poderá conectar novamente depois.

Nunca há troca automática para um serviço pago. Para uma instalação anterior que já usava OpenAI, configure **AI_PROVIDER=openai**, **OPENAI_API_KEY** e **AI_MODEL** explicitamente. Essa opção pode gerar custos e não é necessária para o Gemini gratuito.

## Validação

Os testes do servidor usam respostas simuladas para verificar o contrato HTTP, os pareceres, conversas, concorrentes, autenticação, cotas, cache, erros e persistência. Não foi feita uma chamada com uma chave real neste ambiente. Faça o teste de Parecer depois de configurar sua chave gratuita.

## Fontes oficiais consultadas

- Preços e modalidade gratuita: https://ai.google.dev/gemini-api/docs/pricing
- Criar e proteger a chave: https://ai.google.dev/gemini-api/docs/api-key
- Cotas por projeto: https://ai.google.dev/gemini-api/docs/rate-limits
- Disponibilidade dos modelos: https://ai.google.dev/gemini-api/docs/deprecations
- API de geração: https://ai.google.dev/api/generate-content
- Serviço Node no Render: https://render.com/docs/deploy-node-express-app
- Limitações do Render Free: https://render.com/docs/free
- Disco persistente: https://render.com/docs/disks

© V&D Digital. Todos os direitos reservados.
