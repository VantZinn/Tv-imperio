# Empire TV — servidor com IA gratuita

Node.js 24, SQLite e **Gemini** como provedor padrão. Sem dependências npm externas. O Gemini 3.5 Flash-Lite tem Free tier; mantenha seu projeto no nível gratuito, sem cobrança ativada. Cotas e disponibilidade são definidas pelo Google.

~~~sh
cp .env.example .env
# Configure GEMINI_API_KEY e DATA_DIR em seu ambiente privado.
npm test
npm start
~~~

Na hospedagem, configure AI_PROVIDER=gemini, GEMINI_API_KEY e AI_MODEL=gemini-3.5-flash-lite pelo painel de segredos. A chave nunca vai ao APK. O guia **ATIVAR-IA.md** explica criação da chave, hospedagem, conexão e limites.

O APK já entregue continua compatível com as rotas abaixo. GET /health informa aiProvider, aiModel e se há uma chave configurada; esse indicador não comprova acesso ao provedor. Confirme fazendo uma análise real no jogo.

| Rota | Uso |
|---|---|
| POST /v1/auth/register | Criar conta do universo |
| POST /v1/auth/login | Obter sessão |
| POST /v1/analyse | Parecer criativo com cache por autor, versão, modelo e provedor |
| POST /v1/sync | Sincronizar resumo e receber conversas/concorrentes |
| POST /v1/wallet | Consultar carteira premium comprada, ainda zerada |
| POST /v1/shop/purchase | Desativada; não cobra nem credita MF |

Use Authorization: Bearer com o token da conta nas rotas da campanha. Nenhuma chave do provedor deve ser informada pelo jogador.

Os padrões gratuitos são 20 chamadas globais/dia, 16 por conta/dia, conversas a cada 360 minutos e concorrentes a cada 720 minutos. Os limites locais não garantem nem ampliam a cota do Google. Erros 429 iniciam uma pausa persistente; conteúdo fora do esquema não é aplicado. Análises repetidas são reaproveitadas e solicitações simultâneas iguais são agrupadas.

Use HTTPS e armazenamento persistente. O Render Free permite experimentar, mas suspende o processo e perde o SQLite em reinícios/suspensões/publicações. Para guardar o histórico e gerar conteúdo continuamente, mantenha o processo ativo e preserve DATA_DIR.

OpenAI permanece opcional para instalações anteriores, exclusivamente com AI_PROVIDER=openai explícito. Não há fallback automático para uma API paga.

Os 20 testes verificam respostas simuladas das APIs, dados inválidos, cache, chamadas concorrentes, cotas, pausa persistida, fuso de reinício diário, isolamento, reinício do banco, ausência de chave, autenticação e pagamento bloqueado. O acesso real ao Gemini deve ser verificado depois da configuração.

© V&D Digital. Todos os direitos reservados.
