# Empire TV — jogo com tutoriais de Vant

V&D Digital · 1.0.0.1 BETA · revisão 10008.

Os **46 tutoriais estão dentro do jogo**, com quatro passos por assunto.
Use “Vant: como usar esta página” ou **Configurações → Tutoriais**.
Há busca, filtros, pausa, revisão e progresso salvo. Ler as orientações não
gasta dinheiro, MF ou impulsos da campanha.

Extraia o pacote de atualização e envie seu conteúdo para a raiz do repositório,
substituindo os arquivos existentes e preservando as pastas. Inclua `public/`,
`empire-project/` e `.github/workflows/gerar-apk.yml`. Não envie apenas o ZIP.
Veja os passos curtos em **LEIA-ME-GITHUB.txt**.

O site completo está em `public/` e é servido por Node 24 com `npm start`.
O Dockerfile inclui os recursos do jogo; `.dockerignore` mantém as partes do
projeto Android fora da imagem do servidor. As configurações privadas continuam
no painel do serviço. Após enviar, aguarde o deploy do Render.

Para gerar o APK, abra **Actions → Gerar APK Empire TV → Run workflow**, deixando
`project_url` vazio. O workflow monta e verifica o projeto em `empire-project/`,
usando a revisão 10008 em lugar do ZIP antigo que permaneça na raiz. Cada parte
tem menos de 25 MiB. A opção de AAB exige sua chave de upload configurada.

Os tutoriais e sua navegação foram verificados em retrato e paisagem. A publicação,
a compilação na sua conta e o teste no aparelho ainda devem ser conferidos.

# Empire TV — servidor com IA gratuita

Node.js 24, SQLite e **Gemini** como provedor padrão. Sem dependências npm externas. O Gemini 3.5 Flash-Lite tem Free tier; mantenha seu projeto no nível gratuito, sem cobrança ativada. Cotas e disponibilidade são definidas pelo Google.

~~~sh
cp .env.example .env
# Configure GEMINI_API_KEY e DATA_DIR em seu ambiente privado.
npm test
npm start
~~~

Na hospedagem, configure AI_PROVIDER=gemini, GEMINI_API_KEY e AI_MODEL=gemini-3.5-flash-lite pelo painel de segredos. A chave nunca vai ao APK. O guia **ATIVAR-IA.md** explica criação da chave, hospedagem, conexão e limites.

O APK atualizado (versionCode 10008) conecta cada perfil automaticamente a https://tv-imperio.onrender.com, usando uma identificação aleatória própria e renovando sessões quando necessário. O responsável configura a chave somente neste servidor. GET /health informa configuração e pausas conhecidas; não confirma uma geração real. Os APKs anteriores continuam compatíveis com o login manual.

| Rota | Uso |
|---|---|
| POST /v1/auth/register | Criar conta do universo |
| POST /v1/auth/login | Obter sessão |
| POST /v1/auth/device | Criar ou recuperar a identificação automática de um perfil |
| POST /v1/analyse | Parecer criativo com cache por autor, versão, modelo e provedor |
| POST /v1/sync | Sincronizar resumo e receber conversas/concorrentes |
| POST /v1/wallet | Consultar carteira premium comprada, ainda zerada |
| POST /v1/shop/purchase | Desativada; não cobra nem credita MF |

Use Authorization: Bearer com o token da conta nas rotas da campanha. Nenhuma chave do provedor deve ser informada pelo jogador.

As análises ficam **sem limite diário interno** por padrão: AI_GLOBAL_DAILY_LIMIT=0 e AI_USER_DAILY_LIMIT=0. Valores positivos reativam essas cotas opcionais. Substitua os valores antigos 20/16 por 0 no Environment depois de publicar o código atualizado. A contagem é preservada; uma cota desativada usa limit:null, unlimited:true.

A geração automática mantém até 4 chamadas/dia, com intervalos de 360 minutos para conversas e 720 para concorrentes. AI_BACKGROUND_DAILY_LIMIT=0 desativa somente os lotes automáticos. Sem cota global interna, essa parcela continua funcionando. Pausas do provedor e limites por minuto permanecem ativos. Todos os jogadores compartilham a cota do projeto Google configurado.

A identificação automática usa deviceId e deviceSecret aleatórios de 256 bits por perfil local. O banco guarda somente o hash do segredo. A resposta contém token e expiresAt; a recuperação reutiliza a mesma conta. REGISTRATION_ENABLED=false impede novas contas e permite recuperar identificações existentes. Essa conta não sincroniza todo o progresso entre celulares; backups e contas em nuvem mantêm seus fluxos.

Os limites locais não garantem nem ampliam a cota do Google. Erros 429, falhas de conexão, indisponibilidade e tempo excedido iniciam uma pausa persistente com espera crescente. Tentativas automáticas também respeitam seus intervalos após falhar, inclusive após reiniciar. O serviço distingue limite do servidor, limite por conta, cota diária do provedor e pausa temporária. Conteúdo fora do esquema não é aplicado. Análises repetidas são reaproveitadas e solicitações simultâneas iguais são agrupadas.

Use HTTPS e armazenamento persistente. O Render Free permite experimentar, mas suspende o processo e perde o SQLite em reinícios/suspensões/publicações. Para guardar o histórico e gerar conteúdo continuamente, mantenha o processo ativo e preserve DATA_DIR.

OpenAI permanece opcional para instalações anteriores, exclusivamente com AI_PROVIDER=openai explícito. Não há fallback automático para uma API paga. Nessa instalação opcional, quando as cotas não estão configuradas no Environment, os padrões anteriores 144/48 são preservados; zero explícito também desativa essas cotas.

Os 35 testes do servidor verificam respostas simuladas, isolamento, identificação automática, recuperação, ausência de limite interno, cotas opcionais, cache, erros, pausas e persistência. O acesso real ao Gemini deve ser confirmado depois da publicação. Consulte CORRIGIR-IA.md para aplicar ao Render.

© V&D Digital. Todos os direitos reservados.
