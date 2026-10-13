# Empire TV — servidor com IA gratuita

Node.js 24, SQLite e **Gemini** como provedor padrão. Sem dependências npm externas. O Gemini 3.5 Flash-Lite tem Free tier; mantenha seu projeto no nível gratuito, sem cobrança ativada. Cotas e disponibilidade são definidas pelo Google.

~~~sh
cp .env.example .env
# Configure GEMINI_API_KEY e DATA_DIR em seu ambiente privado.
npm test
npm start
~~~

Na hospedagem, configure AI_PROVIDER=gemini, GEMINI_API_KEY e AI_MODEL=gemini-3.5-flash-lite pelo painel de segredos. A chave nunca vai ao APK. O guia **ATIVAR-IA.md** explica criação da chave, hospedagem, conexão e limites.

O APK já entregue continua compatível com as rotas abaixo. GET /health informa aiProvider, aiModel e se há uma chave configurada; esse indicador não comprova acesso ao provedor. O novo campo aiStatus informa uma pausa conhecida, seu motivo e quando tentar novamente. Confirme acesso fazendo uma análise real no jogo. O projeto Android com versionCode 10004 também permite continuar negociação, financiamento e produção com análise local quando a IA falha.

| Rota | Uso |
|---|---|
| POST /v1/auth/register | Criar conta do universo |
| POST /v1/auth/login | Obter sessão |
| POST /v1/analyse | Parecer criativo com cache por autor, versão, modelo e provedor |
| POST /v1/sync | Sincronizar resumo e receber conversas/concorrentes |
| POST /v1/wallet | Consultar carteira premium comprada, ainda zerada |
| POST /v1/shop/purchase | Desativada; não cobra nem credita MF |

Use Authorization: Bearer com o token da conta nas rotas da campanha. Nenhuma chave do provedor deve ser informada pelo jogador.

Os padrões gratuitos são 20 chamadas globais/dia, 16 análises por conta/dia e no máximo 4 chamadas automáticas/dia no servidor. As chamadas automáticas usam a cota global, mas não gastam a cota pessoal de análises. Conversas e concorrentes têm intervalos de 360 e 720 minutos. Tentativas enviadas ao provedor são contabilizadas mesmo se falharem; nenhuma chamada é contabilizada durante uma pausa. Configure AI_BACKGROUND_DAILY_LIMIT=0 para suspender apenas a geração automática, se desejar.

Os limites locais não garantem nem ampliam a cota do Google. Erros 429, falhas de conexão, indisponibilidade e tempo excedido iniciam uma pausa persistente com espera crescente. Tentativas automáticas também respeitam seus intervalos após falhar, inclusive após reiniciar. O serviço distingue limite do servidor, limite por conta, cota diária do provedor e pausa temporária. Conteúdo fora do esquema não é aplicado. Análises repetidas são reaproveitadas e solicitações simultâneas iguais são agrupadas.

Use HTTPS e armazenamento persistente. O Render Free permite experimentar, mas suspende o processo e perde o SQLite em reinícios/suspensões/publicações. Para guardar o histórico e gerar conteúdo continuamente, mantenha o processo ativo e preserve DATA_DIR.

OpenAI permanece opcional para instalações anteriores, exclusivamente com AI_PROVIDER=openai explícito. Não há fallback automático para uma API paga.

Os 25 testes verificam respostas simuladas das APIs, dados inválidos, cache, chamadas concorrentes, cotas, pausa persistida, fuso de reinício diário inclusive mudança de horário do Pacífico, isolamento, reinício do banco, ausência de chave, autenticação e pagamento bloqueado. A correção também testa repetição de falhas, cancelamento por tempo excedido e reserva de chamadas para jogadores. O acesso real ao Gemini deve ser verificado depois da configuração. Consulte CORRIGIR-IA.md para aplicar esta atualização ao Render.

© V&D Digital. Todos os direitos reservados.
