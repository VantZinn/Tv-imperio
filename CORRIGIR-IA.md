# Corrigir limite diário, indisponibilidade e tempo excedido

O pacote corrige dois comportamentos: geração automática que podia gastar as chamadas repetindo falhas e ações do jogo que dependiam de uma resposta da IA para continuar.

## Aplicar no seu servidor atual

1. Extraia Empire_TV_Servidor_IA.zip e substitua os arquivos do servidor na raiz do repositório VantZinn/Tv-imperio. Mantenha o ZIP Android e a pasta .github/workflows existentes.
2. Faça o commit. No Render, publique esse commit; se a publicação automática estiver desligada, use Manual Deploy → Deploy latest commit.
3. Mantenha GEMINI_API_KEY somente no painel privado do Render. Mantenha AI_PROVIDER=gemini e AI_MODEL=gemini-3.5-flash-lite.
4. Acrescente AI_BACKGROUND_DAILY_LIMIT=4 e AI_TIMEOUT_MS=60000 no Environment. Os padrões gratuitos já usam esses valores se as variáveis estiverem ausentes.
5. Abra https://tv-imperio.onrender.com/health. O campo aiStatus aparece neste servidor atualizado e informa uma pausa conhecida. O campo aiAvailable continua significando que há uma chave configurada; não comprova que uma geração real funcionou.

As cotas locais continuam em 20 chamadas globais e 16 análises por conta por dia, salvo configuração existente diferente. Ajuste AI_GLOBAL_DAILY_LIMIT e AI_USER_DAILY_LIMIT somente após conferir as cotas reais do seu projeto no Google AI Studio. Aumentar o limite local não amplia a cota do Google. Trocar a chave do mesmo projeto também não reinicia a cota do provedor.

## Aplicar no APK

1. Substitua Empire_TV_1.0.0.1_BETA_Projeto_APK.zip na raiz do GitHub, com esse nome exato.
2. Execute Actions → Gerar APK Empire TV → Run workflow.
3. Baixe o APK da nova execução. O versionCode desta correção é 10004; a versão exibida continua 1.0.0.1 BETA. O workflow existente continua compatível.

O APK mostra motivos e horários de pausa em Configurações → Universo online. Na aba Parecer, a avaliação por regras aparece identificada como Parecer local quando não há análise de IA válida da ideia. Negociação, financiamento e produção continuam localmente se a IA estiver temporariamente indisponível; conteúdo recusado não é convertido em um parecer de IA.

Enquanto ainda usa o APK anterior, Configurações → Universo online → Desconectar permite continuar usando a avaliação por regras.

## O que os avisos significam

| Aviso | Significado |
|---|---|
| Limite diário do servidor | Limite de chamadas configurado neste jogo; separado da cota do Google. |
| Limite diário desta conta | Limite pessoal de análises novas; parecer guardado não consome outra chamada. |
| Cota diária do provedor | O Google informou uma cota diária excedida. A IA aguarda a renovação dessa cota. |
| Pausa entre chamadas | O provedor pediu um intervalo antes de uma nova tentativa. |
| Tempo excedido | O provedor ou a conexão não respondeu no prazo. A geração não foi confirmada. |
| Provedor indisponível | Houve falha na resposta do provedor; o servidor informa o código HTTP sem expor a chave. |
| Chave ou modelo sem acesso | Confira GEMINI_API_KEY e AI_MODEL no painel privado da hospedagem. |

Um aviso pode ter mais de uma causa no mesmo dia. O servidor não remove cotas do provedor nem muda automaticamente para uma API paga. Chamadas enviadas, inclusive tentativas que falham, continuam contadas para conservar os limites. Pausas e intervalos evitam novas tentativas desnecessárias.

Os testes desta atualização usam respostas simuladas: 25 testes do servidor, testes do jogo para negociação/produção/financiamento durante falhas e verificações de inicialização. Não foi usada a chave do seu servidor para gerar uma análise. Depois de publicar, faça uma análise real pelo jogo quando a cota estiver disponível.

Referência oficial de cotas: https://ai.google.dev/gemini-api/docs/rate-limits

© V&D Digital. Todos os direitos reservados.
