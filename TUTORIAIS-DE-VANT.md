# Empire TV — tutoriais de Vant · revisão 10008

Versão 1.0.0.1 BETA · V&D Digital.

## Como aprender no jogo

Abra **Configurações → Tutoriais**. A central contém 46 explicações com quatro passos cada: propósito da função, uso dos controles, custos e limites, e como conferir o resultado.

As páginas oferecem **Vant: como usar esta página**. Escolha a função para iniciar sua explicação. A ajuda é oferecida sem bloquear a navegação; o diálogo só abre quando o jogador escolhe.

- **Próximo e Voltar:** mudam o passo da explicação.
- **Mais tarde, Escape ou voltar do Android:** guardam o ponto em que parou.
- **Mostrar na página:** navega para a função e destaca seu controle quando disponível. Na página atual, preserva campos ainda não salvos. Requisitos ausentes, como não ter uma produção publicada, são explicados sem criar dados falsos.
- **Concluir explicação:** registra a leitura do último passo. Não paga recompensa, inicia produção, envia formulário ou conclui missão.
- **Busca e filtros:** encontram uma função por texto, área e progresso.
- **Dicas automáticas:** podem ser desativadas; a central continua disponível.
- **Recomeçar todas as explicações:** zera apenas o progresso das explicações.

O progresso acompanha a campanha e seu backup. Outra campanha começa com suas próprias explicações. A apresentação geral do Vant tem prioridade para impedir dois tutoriais ao mesmo tempo. **O tutorial principal continua exigindo todas as missões iniciais.** A voz opcional lê os passos quando habilitada em Som e acessibilidade.

## Funções cobertas

| Área | Explicação | Página |
|---|---|---|
| Histórias | Escrever uma ideia completa | Catálogo → Criar obra |
| Histórias | Entender a análise local | Catálogo → Parecer |
| Histórias | Análise online em segundo plano | Catálogo → Parecer |
| Histórias | Bíblia da obra | Catálogo → Bíblia e continuidade |
| Histórias | Mudanças de fatos e promessas | Produção → Sala de produção |
| Produção | Etapas, verba e estreia | Produção → Sala de produção |
| Produção | Salas e melhorias do estúdio | Estúdio → Estúdio visual |
| Produção | Filas e agendas de produção | Produção |
| Equipe | Audições e adequação ao papel | Catálogo → Equipe da obra |
| Equipe | Elenco de apoio e química | Catálogo → Equipe da obra |
| Equipe | Carreira, experiência e fadiga | Equipe → Carreiras e agenda |
| Equipe | Treinamento permanente | Equipe → Carreiras e agenda |
| Equipe | Duração dos vínculos | Equipe → Carreiras e agenda |
| Produção | Pré-exibição com público-teste | Produção |
| Produção | Revisar o acabamento | Produção |
| Distribuição | Negociar uma contraproposta | Catálogo → Contratos e catálogo |
| Distribuição | Escolher um modelo de licença | Catálogo → Contratos e catálogo |
| Distribuição | Piloto e encomenda | Catálogo → Contratos e catálogo |
| Distribuição | Exclusividade e prazo | Catálogo → Contratos e catálogo |
| Distribuição | Contrato por desempenho | Catálogo → Contratos e catálogo |
| Distribuição | Patrocínios de obras | Catálogo → Contratos e catálogo |
| Distribuição | Reprises remuneradas | Catálogo → Contratos e catálogo |
| Distribuição | Direitos internacionais | Catálogo → Contratos e catálogo |
| Histórias | Continuações e expansões | Catálogo → Universo e final |
| Histórias | Planejar o final de uma série | Catálogo → Universo e final |
| Distribuição | Publicar uma temporada em lote | Catálogo → Universo e final |
| Público | Público com memória | Redes |
| Público | Narrativa, técnica e afinidade | Análises → Alcance |
| Empresa | Receitas detalhadas da estreia | Análises → Resultado |
| Distribuição | Ranking e alcance das emissoras | Emissoras |
| Distribuição | Administrar suas emissoras | Emissoras → Minhas emissoras |
| Público | Concorrentes com projetos e caixa | Emissoras → Concorrência |
| Público | Entender o júri dos prêmios | Prêmios |
| Público | Galeria, troféus e carreiras | Prêmios → Galeria |
| Empresa | Crédito e parcelas da empresa | Empresa → Contratos e dívida |
| Empresa | Reorganizar equipamentos e caixa | Empresa → Contratos e dívida |
| Empresa | Desafios com MF e impulsos | Objetivos → Desafios de criação |
| Empresa | MF, trocas e loja | Loja → Trocas |
| Equipe | Agência e renovação de candidatos | Equipe → Agência |
| Empresa | Missões diárias e troca por MF | Objetivos → Missões diárias |
| Ajuda | Orientação contextual do Vant | Configurações → Vant |
| Ajuda | Música, efeitos e Vant falado | Configurações → Som e acessibilidade |
| Ajuda | Campanhas, salvamento e backup | Configurações |
| Ajuda | Diagnóstico da campanha | Configurações → Diagnóstico |
| Ajuda | Carregamento e modo de animações | Configurações → Visual e animações |
| Ajuda | Instalar a versão web | Configurações → Como jogar |

## Atualizar a instalação e o servidor

Faça um backup antes de instalar o APK de teste. A revisão Android e a revisão exibida no Diagnóstico são 10008; a versão comercial permanece 1.0.0.1 BETA.

O pacote do servidor inclui public/ com o jogo pronto. No Render, envie o conteúdo extraído mantendo a estrutura de pastas. Não basta enviar um ZIP na raiz. Confira Configurações → Diagnóstico após a atualização. A hospedagem e a cota da IA continuam sob responsabilidade de quem administra o serviço.

O projeto completo inclui os arquivos src/vant-tutorials.js, src/vant-tutorials.css e tests/vant-tutorials.test.cjs. As funções futuras devem registrar seu tutorial no catálogo VANT_TOPICS, usando a rota e o controle reais. A central e a ajuda contextual utilizam esse catálogo automaticamente.

## Instalável desta revisão

O APK de teste tem **361,844,833 bytes**, aproximadamente **361.84 MB** (345.08 MiB). A assinatura, o alinhamento e a revisão Android 10008 foram conferidos. Os 52 recursos do APK coincidem por hash com o projeto atualizado.

Como esta alteração afeta a interface, o instalável reutiliza a base nativa já compilada da revisão 10007, com o mesmo código Java, recursos nativos e dependências. O conteúdo do jogo e o código de versão foram atualizados, e o pacote foi alinhado e assinado novamente para testes. Não foi concluída uma nova compilação integral do componente nativo nesta entrega. O projeto e o workflow incluem a compilação integral pelo GitHub com JDK 17.

Não foi gerado um novo AAB nesta revisão. Para publicar na Play Store, gere o AAB com a chave da empresa pelo workflow. A versão entregue ainda requer validação em aparelho físico. Consulte APK-TUTORIAIS-VERIFICADO.json.

## Verificação

Os testes de tutoriais validam cobertura, migração, passos, pausa, conclusão, backup, isolamento entre campanhas, busca, filtros, preferência de dicas, requisitos ausentes, botões reais e preservação de rascunhos. Também verificam que ler as explicações não muda recursos nem concede recompensas.

Os testes gerais das regras e do servidor e os cenários de abertura continuam na verificação. A compilação e as verificações visuais desta revisão são registradas em validation/ e nos relatórios JSON do projeto.

O APK de teste usa assinatura de desenvolvimento. Publicação definitiva exige chave de upload da empresa e validação em aparelhos físicos. O pagamento real continua desativado.

© V&D Digital. Todos os direitos reservados.
