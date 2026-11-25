# 12 · Online: plano da etapa 5

O que o [07 · Online e economia](07-online-e-economia.md) pede para a parte online (contas, save na nuvem, servidor, rankings), revisto depois do Sonho (etapas 3 e 4) e comparado com jogos parecidos. O mercado e a loja continuam nas etapas seguintes; aqui entra só o que eles vão precisar.

**Numeração.** O Sonho ocupou a etapa 4 ([09](09-sonho-e-rejogabilidade.md), [10](10-plano-da-etapa-4.md)). A ordem passa a ser: 4 · Sonho, 5 · Online, 6 · Mercado, 7 · Loja e temporadas. A tabela do [08](08-arte-e-tecnica.md) foi atualizada.

---

## 1. O que outros jogos fazem e o que vale para nós

| Jogo | O que fazem | O que pegamos |
|---|---|---|
| **Spelunky** (Desafio Diário) | Uma caverna por dia, igual para todos, uma tentativa só, ranking por pontos | O **Desafio do Dia**: uma fase com a mesma semente para todos. Uma tentativa vale para o ranking; as outras são treino |
| **Dead Cells**, **The Binding of Isaac** | Corrida diária com ranking, tentativas à vontade | Na Noite da Semana, tentativas à vontade e vale a melhor |
| **Vampire Hunters** | Desafio semanal de sexta a segunda, com regras e armas impostas e ranking global | A Noite da Semana ganha uma regra da semana (arma imposta, Presságio fixo) e um prazo claro |
| **Dark Souls**, **Returnal**, **Phantom Abyss**, **Coop Catacombs** | Multiplayer sem estar junto: mensagens no chão, fantasmas de quem morreu, marcas de queda, fantasmas da tentativa de outro | **Cruzes de beira de estrada** onde outros caíram, **recados** montados com palavras prontas e o **fantasma** do jogador logo acima no ranking |
| **Diablo IV** (reino sazonal × eterno), **Path of Exile** (ligas, SSF) | Personagens de temporada que, no fim, migram para o reino permanente; um modo "só o que eu achei", separado do comércio | Dois mundos: o **Solo** (o save de hoje, no navegador) e o **Online** (o servidor guarda o personagem). Só o Online entra no mercado e no ranking Livre |
| **Last Epoch** (Guilda dos Mercadores × Círculo da Fortuna) | Quem negocia não ganha bônus de saque; quem quer saque melhor não negocia. Itens comprados ficam marcados | Para a etapa 6: itens do mercado ficam **marcados** e o jogador escolhe se joga negociando ou "achado por mim" |
| **Torchlight: Infinite** | Uma casa de comércio só para todos os servidores; o limite de itens à venda mantém o mercado ativo | Para a etapa 6: um mercado só, com limite de anúncios (já previsto no 07) |
| **Photon Quantum**, jogos de prêmio | O servidor refaz a partida a partir dos comandos gravados e calcula o resultado ele mesmo; não confia no número enviado | **A base do ranking**: o jogo grava os comandos e o servidor refaz a partida |
| **Vampire Survivors** | Co-op online chegou anos depois do lançamento | Co-op fica fora desta etapa. A simulação determinística permite fazer depois, com troca de comandos entre os jogadores |

---

## 2. A peça que torna o ranking confiável: refazer a partida

A simulação de combate (`src/sim`) é determinística: com a mesma semente, o mesmo herói e os mesmos comandos, ela dá exatamente o mesmo resultado. Então o jogo não precisa mandar o tempo ou os pontos: manda **a gravação dos comandos**, e o servidor refaz a partida e calcula ele mesmo.

**Medido** com o jogador automático no Chromium (`tests/bench.ts` e um teste de gravação):

| Fase | Duração | Gravação (só os quadros em que o comando muda) | Refazer no servidor |
|---|---|---|---|
| 1-6 | 94 s | 26 KB comprimido | 71 ms |
| 4-8 | 127 s | 27 KB comprimido | 63 ms |
| 8-11 | 162 s | 38 KB comprimido | 90 ms |

Todas as três deram exatamente o mesmo resultado ao refazer (`fingerprint` igual), **desde que a gravação inclua as escolhas feitas fora do passo da simulação** (bênção do altar, oferenda do baú). Uma pessoa troca de comando menos vezes que o jogador automático, então a gravação real deve ser menor. Com codificação binária, cai para uns 10 KB.

**O risco: contas com seno e cosseno.** A simulação usa `Math.sin`, `cos`, `atan2`, `hypot` e `exp` (cerca de 330 chamadas). O padrão do JavaScript deixa cada navegador calcular essas funções do seu jeito, e uma diferença na última casa decimal cresce ao longo de milhares de quadros. Então uma partida feita no Safari pode não bater quando o servidor a refaz no motor do Chrome. **Correção:** uma biblioteca nossa de contas (`src/sim/fmath.ts`) com seno, cosseno, arco-tangente e exponencial feitos só com soma e multiplicação, que dão o mesmo resultado em qualquer lugar. A raiz quadrada já é exata em todos os navegadores (`hypot` vira `Math.sqrt(x*x + y*y)`). Um teste roda a mesma gravação no Chromium, no Firefox e no WebKit e compara.

**O que o ranking pode confiar sem confiar no save.** Refazer a partida prova que *aquela partida* aconteceu com *aquele herói*. Se o herói vem de um save adulterado no navegador, a partida é verdadeira, mas o herói é falso. Por isso o ranking começa pelos modos em que **o herói não vem do save**:

- **O Sonho e a Noite da Semana:** o herói tem o nível do jogador e um equipamento igual para todos (já é assim).
- **Desafio do Dia e tempo por fase na categoria Padrão:** herói de referência do nível da fase, só a arma e os feitiços mudam.
- **Torre e categoria Livre:** usam o equipamento do jogador. Só ficam confiáveis no **Mundo Online** (seção 5), em que o servidor guarda o personagem.

---

## 3. Contas e save na nuvem

**Jogar sem conta continua possível.** É como hoje: o progresso fica no navegador. A conta é um convite ("Guarde seu progresso e entre no ranking"), nunca uma parede na primeira tela.

- **Entrar:** com Google ou com um link mágico por e-mail (sem senha). O jogador escolhe um **apelido** (único, com filtro de palavras); o e-mail nunca aparece.
- **Vincular:** ao entrar pela primeira vez, o save do navegador sobe para a conta.
- **Sincronizar:** o save sobe ao fim de cada fase e a cada 60 s no acampamento. Cada save tem uma versão; se dois aparelhos divergirem, o jogo mostra os dois (nível, tempo de jogo, data) e pergunta qual manter, sem misturar.
- **Sem internet:** o jogo continua funcionando e sincroniza quando a conexão voltar.
- **LGPD:** política de privacidade, botão "apagar minha conta e meus dados" e o mínimo de dados (apelido e o identificador do login).

---

## 4. Rankings, fantasmas e rastros

### Rankings

| Ranking | Regra | Verificação |
|---|---|---|
| **Desafio do Dia** (novo) | Uma fase por dia, mesma semente e mesmo herói de referência para todos. A primeira tentativa do dia vale; as outras são treino. Ordem: vencer, depois o menor tempo | Refeita no servidor |
| **Noite da Semana** | Já existe localmente. Até segunda-feira, tentativas à vontade, vale a melhor. Ordem: trechos vencidos, depois Lembranças, depois tempo | Refeita no servidor |
| **Tempo por fase, Padrão** | Por fase vencida com 3 estrelas: herói de referência, menor tempo | Refeita no servidor |
| **Desafio dos Encantados** | Os chefes em sequência, herói de referência, menor tempo (entra junto, porque o 09 já pedia) | Refeita no servidor |
| **Torre, Profundezas e tempo Livre** | Equipamento do jogador | Só no Mundo Online (seção 5) |
| **Primeira vitória** | O primeiro jogador a libertar cada Encantado em cada dificuldade, gravado para sempre | Refeita no servidor |

- Cada ranking mostra o **topo**, a **sua posição** e o **percentil** ("top 12%"); os amigos entram depois.
- A gravação carrega a **versão da simulação**. Quando um ajuste de equilíbrio muda o combate, os rankings daquela versão fecham e um novo começa.
- **Semente vinda do servidor:** nos modos de ranking, o jogo pede a semente ao começar. Isso impede que alguém escolha uma semente fácil, e cada tentativa fica registrada mesmo se o jogador fechar o jogo no meio.

### Fantasmas

O jogador logo acima de você no ranking aparece **translúcido**, refeito a partir da gravação dele, na mesma fase e com a mesma semente. É o "fantasma" que o 07 já previa. Como a gravação já existe para a verificação, o fantasma sai quase de graça.

### Cruzes e recados

Inspirados nas mensagens do Dark Souls e nos montes de ossos do Coop Catacombs, mas com um elemento nosso: **as cruzes de beira de estrada**.

- **Cruzes:** na Noite da Semana e no Desafio do Dia, uma cruzinha de madeira marca onde outros jogadores caíram. Passar perto mostra o apelido e o que o derrubou ("caiu para o Saci, sala 6"). Uma sala cheia de cruzes avisa sozinha.
- **Recados:** uma placa no chão com uma frase **montada de partes prontas** ("Cuidado com…" + "a Mula sem Cabeça", "Tente…" + "Água"). Não existe texto livre, então não há o que moderar. Quem lê pode agradecer com uma vela, e as placas com mais velas ficam mais tempo.

---

## 5. Os dois mundos: Solo e Online

Para o mercado (etapa 6) e para os rankings com equipamento, o servidor precisa ser o dono do personagem.

- **Mundo Solo:** o save de hoje. Joga sem internet, faz tudo, entra nos rankings verificáveis (seção 4), mas não no mercado nem nos rankings Livres.
- **Mundo Online:** um personagem novo, guardado no servidor. O servidor sorteia os drops, faz a forja e paga XP e ouro depois de refazer cada fase. É o caminho do 07 ("o servidor decide, o navegador só mostra").
- **Um sentido só:** dá para **copiar** um personagem Online para o Solo, nunca do Solo para o Online (como o SSF do Path of Exile e os reinos do Diablo IV).

Esta parte é a mais cara e pode ficar para o começo da etapa 6, junto com o mercado. A etapa 5 entrega as seções 2 a 4, e o desenho do Mundo Online fica pronto e testado só na simulação.

---

## 6. Onde hospedar

Hoje o jogo roda como página publicada no Claude, pensada para ser vista e testada, não para conversar com um servidor nosso. Com contas e ranking, ele precisa de um endereço próprio.

| Peça | Recomendação | Por quê |
|---|---|---|
| **O jogo** | Cloudflare Pages ou GitHub Pages | De graça, publica sozinho a cada envio para a `main` |
| **Contas, banco e funções** | **Supabase** para começar | Contas com Google e link mágico prontas, banco Postgres, armazenamento de arquivos e funções em TypeScript (que importam a nossa simulação sem mudança). O plano gratuito cobre os testes: 500 mil chamadas de função por mês e 2 s de processamento por chamada, sobrando muito para os ~0,1 s de refazer uma fase |
| **Alternativa** | Cloudflare Workers + D1 | Mais barato com muitos jogadores, mas as contas e o login teriam de ser feitos à mão. O plano grátis dá só 10 ms de processamento por chamada; precisa do pago (US$ 5 por mês) |
| **Servidor de jogo pronto** | Nakama (código aberto) | Tem login, armazenamento, rankings e torneios prontos, mas é um servidor para manter rodando. Faz sentido se um dia houver co-op em tempo real |

**Custos:** zero enquanto for teste. No plano gratuito do Supabase, projeto parado por muito tempo é pausado; com jogadores de verdade, o plano Pro custa US$ 25 por mês. As gravações ocupam uns 10 a 30 KB cada: guardamos as do topo de cada ranking e as dos últimos 30 dias.

**Por que a lógica fica no nosso código, e não num serviço:** a parte que importa (refazer a partida, a semente, as regras) é TypeScript puro em `src/sim` e `src/meta`. O serviço só guarda e entrega. Trocar de Supabase para outro lugar depois é trocar um adaptador.

### Desenho do banco

| Tabela | Campos principais |
|---|---|
| `jogadores` | id, apelido, criado_em |
| `saves` | jogador, mundo (`solo` ou `online`), versão, perfil (JSON), atualizado_em |
| `tentativas` | id, jogador, modo, chave (dia, semana ou fase), semente, versão da simulação, estado (`aberta`, `verificada`, `rejeitada`), resultado, gravação (arquivo) |
| `ranking` | modo, chave, jogador, ordem, tentativa (consulta sobre `tentativas` verificadas) |
| `cruzes` e `recados` | modo, chave, sala, x, y, jogador, conteúdo, velas |

---

## 7. Fases da etapa 5

Cada fase termina com o jogo funcionando, os testes passando e nada quebrado para quem joga sem conta.

### Fase 0 · Preparação, sem servidor (M)

1. **Contas iguais em todo navegador:** `src/sim/fmath.ts` e a troca das chamadas de `Math` na simulação. A calibração tem de dar o mesmo resultado de antes, dentro da variação.
2. **Gravador:** `src/sim/replay.ts` grava os comandos que mudam e as escolhas de fora do passo (altar, oferenda, Roda, causos), com codificação binária compacta. `verifyRun(gravação)` refaz e devolve o resultado.
3. **Versão da simulação:** um número gerado no build a partir do código de `src/sim`, `src/data/balance.ts` e afins.
4. **Desafio do Dia** e **Desafio dos Encantados**, primeiro locais, como a Noite da Semana.
5. **Testes:** gravar com o jogador automático e refazer em todas as fases (96) e no Sonho; uma gravação adulterada (um comando a mais, uma semente trocada) é rejeitada; a mesma gravação dá o mesmo resultado no Chromium, no Firefox e no WebKit.

### Fase 1 · Endereço próprio e contas (M)

- O jogo publicado no Cloudflare Pages ou no GitHub Pages a partir da `main`.
- Projeto Supabase; login com Google e link mágico; apelido; vincular o save do navegador; sincronizar e resolver conflito; jogar sem internet.
- Tela da conta nas Opções; política de privacidade; apagar a conta.

### Fase 2 · Rankings verificados (M)

- Funções: `iniciar-tentativa` (devolve a semente e abre a tentativa), `enviar-tentativa` (recebe a gravação, refaz, grava o resultado), `ranking` (topo, você, percentil).
- Rankings: Desafio do Dia, Noite da Semana, tempo por fase Padrão, Desafio dos Encantados e Primeira vitória.
- A aba de cada modo ganha o seu ranking; o resultado da fase mostra "enviando… verificada: 34º (top 8%)".

### Fase 3 · Fantasmas, cruzes e recados (M)

- Fantasma do jogador logo acima, em qualquer ranking com gravação.
- Cruzes de beira de estrada e recados de partes prontas, com velas.
- Arte nova: a cruz, a placa, o fantasma translúcido.

### Fase 4 · Mundo Online, só a base (G, pode ir para a etapa 6)

- O servidor como dono do personagem: drops, forja, XP e ouro calculados pelo servidor depois de refazer a fase.
- Copiar do Online para o Solo.
- Rankings Livres (Torre, Profundezas, tempo por fase com equipamento).

---

## 8. O que precisa de decisão

1. **Onde hospedar:** Supabase (recomendado para começar) ou Cloudflare.
2. **Login:** Google e link mágico por e-mail são suficientes para começar? Discord é uma terceira opção comum entre jogadores.
3. **Mundo Online:** fica na etapa 5 (fase 4) ou vai para o começo da etapa 6, junto com o mercado?
4. **Endereço:** usar um domínio próprio (algo como `encantados.com.br`, cerca de R$ 40 por ano) ou o endereço gratuito do Pages por enquanto.

---

## Fontes consultadas

- Last Epoch, facções de item: [Icy Veins](https://icy-veins.com/last-epoch/trade-and-item-factions-overview), [Maxroll](https://maxroll.gg/last-epoch/getting-started/item-faction-overview)
- Torchlight: Infinite, casa de comércio: [Dev Blog #21](https://www.taptap.io/post/1719892), [Maxroll, Q&A S3](https://maxroll.gg/torchlight-infinite/news/crows-corner-qa-recap-s3-1-7)
- Desafios diários: [Spelunky Wiki](https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)), [PC Gamer, Dead Cells](https://pcgamer.com/dead-cells-adds-daily-challenge-mode), [Yacht Club, Daily Mode](https://www.yachtclubgames.com/blog/daily-mode)
- Desafio semanal: [Vampire Hunters](https://gamedeveloper.com/press-release/prove-your-power-to-the-brotherhood-in-the-new-vampire-hunters-challenge-runs-update)
- Multiplayer sem estar junto: [The Ringer, ambient multiplayer](https://www.theringer.com/2024/06/21/video-games/ambient-multiplayer-video-games-elden-ring-dragons-dogma-journey), [Coop Catacombs](https://aikoncwd.itch.io/coop-catacombs)
- Reinos e ligas: [GamesRadar, Diablo IV](https://www.gamesradar.com/games/diablo/diablo-4-seasonal-eternal-realms-explained/), [PoE Wiki, Ligas](https://www.poewiki.net/wiki/League)
- Refazer a partida no servidor: [Photon Quantum](https://doc.photonengine.com/quantum/current/manual/cheat-protection), [Don't trust the score](https://dev.to/gowtham_r_2002/dont-trust-the-score-building-server-authoritative-validation-for-a-prize-based-mobile-game-246i), [BugNet, determinismo](https://bugnet.io/blog/how-to-fix-replay-verification-failing-from-nondeterministic-simulation)
- Co-op: [Vampire Survivors, FAQ do online](https://poncle.games/vs-online-faq)
- Serviços: [Supabase, limites das funções](https://supabase.com/docs/guides/functions/limits), [Supabase, preço das funções](https://supabase.com/docs/guides/functions/pricing), [Cloudflare Workers, preço](https://developers.cloudflare.com/workers/platform/pricing/), [Nakama](https://heroiclabs.com/nakama/)
