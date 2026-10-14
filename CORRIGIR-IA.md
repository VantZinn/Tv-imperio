# Conexão automática e análises sem limite diário interno

Empire TV 1.0.0.1 BETA · revisão Android 10006 · V&D Digital.

## Publicar primeiro o servidor

1. Extraia **Empire_TV_Servidor_IA.zip** e substitua os arquivos do servidor na raiz do repositório VantZinn/Tv-imperio. Preserve o ZIP Android e .github/workflows.
2. No Environment do Render, defina **AI_GLOBAL_DAILY_LIMIT=0** e **AI_USER_DAILY_LIMIT=0**. Substitua os valores anteriores 20 e 16, se existirem.
3. Mantenha **AI_PROVIDER=gemini**, sua **GEMINI_API_KEY** privada e o **AI_MODEL** configurado. Mantenha **AI_BACKGROUND_DAILY_LIMIT=4** e **AI_TIMEOUT_MS=60000**.
4. Salve as variáveis e publique o novo commit: **Manual Deploy → Deploy latest commit**, quando necessário.
5. Abra https://tv-imperio.onrender.com/health. O resultado informa configuração e pausas conhecidas; uma análise real confirma acesso ao modelo. Esse endpoint não chama a API do Gemini.

O código atualizado é necessário: no servidor antigo, colocar zero não removia as cotas. As contagens anteriores são preservadas e deixam de bloquear análises quando as cotas internas estão desativadas. Uma pausa real do Google continua valendo.

O Render Free pode perder seu banco após reiniciar ou publicar. A nova identificação automática recupera o acesso criando a identificação novamente quando o banco não existe mais. O histórico que estava apenas nesse banco não pode ser recuperado por essa operação. Preserve DATA_DIR em armazenamento persistente quando houver esse recurso.

## Publicar o APK

1. Substitua **Empire_TV_1.0.0.1_BETA_Projeto_APK.zip** na raiz do GitHub, mantendo exatamente esse nome.
2. Execute **Actions → Gerar APK Empire TV → Run workflow**. O workflow existente continua compatível.
3. Baixe o APK da nova execução e instale. O versionCode é **10006**; a versão exibida permanece **1.0.0.1 BETA**. Exporte o progresso antes de trocar o aplicativo.

Ao entrar em uma campanha, o app usa https://tv-imperio.onrender.com automaticamente. Cada perfil recebe uma identificação própria, e a sessão é renovada quando expira ou desaparece do servidor. O jogador não precisa informar URL, chave ou uma segunda senha.

Em **Configurações → Universo online**, o jogador pode escolher **Usar somente modo local**. Essa escolha é lembrada e impede reconexão até ele ativá-la novamente. Contas manuais já conectadas são preservadas. A configuração manual permanece em uma seção opcional.

Atualizar só o servidor libera o limite interno para APKs anteriores. A conexão automática e a biblioteca de análise local exigem o APK atualizado.

## Análise local ampliada

O APK inclui **44,2 MiB (aproximadamente 46,4 MB) de recursos locais**, antes da compactação: **13.824 estudos fictícios originais**, cobrindo 12 gêneros. Cada estudo traz motivação, conflito, decisão, consequência, intenção, mecanismos, riscos, reescritas e perguntas de revisão. Um índice lexical seleciona referências próximas da proposta. O jogo carrega o gênero sob demanda e mantém até dois módulos em memória.

As notas são calculadas pelos critérios e sinais no texto atual. Os estudos não contêm notas prontas e aparecem como exemplos fictícios. Cada critério mostra trecho ou informação ausente, efeito e sugestão. Documentário e Reality têm critérios próprios; filmes e séries distinguem fechamento e continuidade. O tamanho do texto não concede pontos.

O motor é uma avaliação por regras e referências, com limites para significados implícitos; não é um modelo de linguagem no aparelho. A abertura de aproximadamente 8 segundos e as animações anteriores são preservadas. A biblioteca não é lida integralmente na abertura. Os JSONs e índices ficam sem compressão dentro do APK, preservando os 44,2 MiB de dados. O ZIP do projeto é menor por causa da compactação externa.

## O que os avisos significam

| Aviso | Significado |
|---|---|
| Sem limite interno | O jogo não impõe cota diária de análises. A cota do Google continua válida. |
| Limite diário do servidor ou da conta | Uma cota positiva permanece no Environment. Coloque ambos os limites em 0 para removê-la. |
| Cota diária do provedor | O Google informou cota excedida. O serviço aguarda sua renovação. |
| Pausa entre chamadas | O provedor pediu espera; repetir imediatamente não libera a cota. |
| Tempo excedido ou provedor indisponível | A geração não foi confirmada. O progresso permanece e as ações podem usar avaliação local. |
| Identificação automática não confirmada | Confira se publicou o servidor com /v1/auth/device. O jogo permanece local enquanto não consegue conectar. |
| Chave ou modelo sem acesso | Confira GEMINI_API_KEY e AI_MODEL no painel privado do servidor. |

As cotas do Google são por projeto; trocar a chave do mesmo projeto não as reinicia. O serviço mantém pausas reais e não muda automaticamente para uma API paga. Todos os jogadores compartilham a cota configurada no servidor.

## Verificação

Os testes usam respostas controladas, sem gastar sua cota: 32 testes do servidor, 14 testes da conexão automática e da biblioteca local, testes das regras do jogo e da abertura. O acesso real ao Gemini deve ser confirmado depois da publicação com sua chave. A compilação do APK e a instalação no aparelho serão verificadas pelo workflow e pelo teste no celular.

Referência oficial de cotas: https://ai.google.dev/gemini-api/docs/rate-limits

© V&D Digital. Todos os direitos reservados.

