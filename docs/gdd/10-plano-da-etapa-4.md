# 10 · Plano da etapa 4

Como construir o que o [09 · O Sonho e a rejogabilidade](09-sonho-e-rejogabilidade.md) descreve, em cinco fases. Cada fase termina com o jogo jogável, os testes passando e a calibração conferida, e cada uma entrega algo que o jogador sente sozinho.

**Tamanho:** P é pequeno (um dia de trabalho focado), M é médio (alguns dias), G é grande (uma ou duas semanas). Serve para comparar as partes, não é prazo.

## Estado

| Fase | Estado |
|---|---|
| 0 · Preparação | **Feita** |
| 1 · Conveniências e coleção | **Feita** |
| 2 · Bênçãos com padrinho | **Feita** |
| 3 · O Sonho, o núcleo | **Feita** |
| 4 · Roda, Presságios, Cordéis e Aspectos | **Feita** |
| 5 · Aldeia, companheiros, pós-jogo e exagero | A fazer |

### O que mudou em relação ao plano nas fases 0 e 1

- **Campos do perfil.** A versão 2 só ganhou os campos que as fases 0 e 1 usam: `life`, `achievements`, `uniquesFound`, `lootFilter`, `builds` e `daily.rerolls`. Os do Sonho, da Aldeia, dos Cordéis e dos Aspectos entram com as fases deles, cada um com o seu passo de migração.
- **Conquistas.** São 58 (o plano pedia 40 nesta fase): Campanha, Combate, Coleção, Ofício e Segredos. O prêmio é ouro e material, porque as Lembranças só existem a partir da fase 3. As do Sonho entram com ele.
- **Almanaque.** Três seções: Conquistas, Bestiário e Itens com nome. Os Encantados ficam dentro do Bestiário, como o chefão de cada capítulo, e o texto de cada companheiro aparece na tela dos Companheiros.
- **Terreiro.** Três bonecos fixos (comum, blindado e elite) no lugar de um boneco configurável: cobre os três casos em que o dano muda, sem tela de ajuste. O medidor mostra dano por segundo (últimos 4 s), média, total, maior golpe, reações e de onde veio o dano.
- **Caçada automática.** As cartas de bênção ficam 0,75 s na tela (o plano dizia 0,4 s) e o jogador ainda pode escolher na mão nesse tempo. O automático escolhe a mais rara. Cada partida da fila usa uma semente diferente.
- **Filtro de saque.** Além de conjunto e item com nome, também nunca desmonta o que aumenta o Poder.
- **Builds.** Guardam também atributos e talentos, e trocar é sempre grátis: o custo de redistribuir já foi pago ao montar cada build.
- **Fora do plano: HUD da fase.** A vida, a mana, a barra de ações, o cabeçalho, a barra de chefe e as cartas de bênção foram redesenhados em placas de madeira, no estilo dos menus (`src/game/hudart.ts`).

### O que mudou em relação ao plano na fase 2

- **Despertar sem escolha em dois passos.** As duas formas ocupam dois lugares do altar, em vez de um lugar que abriria uma segunda escolha. É mais rápido e não precisa de tela nova.
- **A forma desperta se soma à bênção**, em vez de trocar as cópias dela. Os bônus da bênção no máximo continuam valendo e a forma só acrescenta o efeito novo.
- **Despertares: 20 bênçãos (40 formas) agora.** As outras 22 bênçãos com máximo maior que 1 ganham forma junto com o Sonho. As receitas secretas dependem dos amuletos e também ficam para lá.
- **Compadrios: 8** (o plano pedia 7), para o Mapinguari também aparecer em dois pares.
- **Lendária é a raridade das formas despertas e dos Compadrios.** Nenhuma sai do sorteio comum.
- **Efeitos.** Tudo o que muda regra fica em `HeroStats.bless` (`src/meta/stats.ts`) e é lido em poucos pontos da simulação: o dano no inimigo, o golpe no herói, a esquiva, o último golpe da sequência e a poção.
- **Bênção redundante sai do sorteio:** a que só ligaria um efeito que um talento ou conjunto já liga.
- **Calibração.** Com o jogador automático de referência, 10 partidas em cada uma das 96 fases: 787 vitórias antes e 805 depois (82% e 84%). Ficou dentro da variação entre sementes, e nenhum número de fase foi mexido.
- **Erro antigo corrigido.** Um monstro que explode (Cogumelo-Estouro, Taturana, Fogo-Fátuo, Vazio) derrubava o jogo se o golpe voltasse e o derrubasse no mesmo instante, por exemplo com a esquiva perfeita que molha em volta. Era raro com o conjunto do Ribeirinho e ficaria comum com a Onda Mansa.

### O que mudou em relação ao plano na fase 3

- **Uma sala por nó, como planejado.** Combate, elite, provação, chefe e altar são fases de uma sala só, com o id `sonho-<tipo>-<capítulo>-<nível>-<trecho>-<semente>-<extra>`: o id sozinho refaz a sala, então fechar o jogo no meio dela e voltar dá na mesma sala. O que passa de uma para a outra (bênçãos, vida, poções, carga do Supremo, quedas e o azar do altar) vai em `StageConfig.carry`; a maldição vai em `StageConfig.foes`. Amuletos e vinténs ficam só no estado da noite.
- **O trecho tem 8 passos.** Um combate de entrada, cinco passos com duas ou três faixas (o terceiro é sempre de altares, cada um de um padrinho diferente), o descanso (Fonte e Feira, ao alcance de qualquer faixa) e o chefe. A Roda do Saci entra na fase 4 e o peso dela ficou com o combate.
- **Vintém é pago por sala**, não cai dos monstros: 16 por combate, 32 por elite, 30 por provação, 48 por chefe e 5 por baú aberto. Evita um tipo novo de saque no chão e deixa a conta previsível.
- **Chefes.** O trecho que não é o último tem a grande elite do capítulo; o último tem o Encantado. O chefe misturado ("Eco") fica para a fase 4.
- **Quedas.** No Sonho o herói não levanta: cair acorda. Só o Muiraquitã dá uma segunda chance por noite.
- **Altar.** A sala de altar traz três bênçãos do padrinho do nó. O Rancho, a Feira e os causos sorteiam fora da sala, com as mesmas regras de repetição e de bênção redundante.
- **Bênçãos fora do Sonho.** Pote de Ouro e Lição da Mata só mexem no que a fase paga, e o Sonho não paga por sala: não aparecem nele.
- **Causos mostram o resultado antes.** O que cada escolha dá (qual bênção, qual amuleto) é sorteado ao abrir o causo e aparece na tela. A incerteza fica no caminho, não na letra miúda.
- **Feira.** Três bênçãos, dois amuletos, uma garrafada por visita (40% da vida), troca de banca (cada troca mais cara) e tirar uma bênção inteira.
- **Aldeia, primeira versão: três construções**, todas com três níveis e pagas com Lembranças. **Rancho do Andarilho** (novo, não estava no 09): começa a noite com 30 vinténs, depois com um amuleto comum, depois escolhendo uma bênção comum. **Mural do Almanaque**: +10/20/30% de Lembranças. **Casa de Farinha**: +10/20/30% de ouro na campanha. As outras construções do 09 dependem das fases 4 e 5.
- **O que a noite paga.** Lembranças por sala (4, 8, 25 na provação vencida, 15 no chefe), levadas mesmo na derrota. Por trecho completo, 60% da experiência e do ouro de uma fase do nível do herói. A primeira vitória com cada arma dá um ponto de talento.
- **Fora do Sonho por enquanto:** o bônus de Conhecimento do Bestiário e as missões do Diário não contam nas salas do Sonho.
- **Resultado.** O resumo da noite é uma tela própria da aba Sonho (`src/ui/sonho.ts`), não um ramo de `renderResultado`: os dois mostram coisas diferentes demais.
- **Almanaque.** Ganhou a aba Sonho, com os 20 amuletos e os 10 causos e o texto de folclore de cada um. Fica fora da conta geral do Almanaque, para quem não sonha não perder os 100%.
- **Conquistas do Sonho: 18** (o plano pedia 15).
- **Perfil na versão 3:** `dream` (Lembranças, recordes, o que já foi visto e a noite em andamento) e `village`.
- **Calibração** (`npx vite-node tests/calib-sonho.ts`, 40 noites, facão, jogador automático que erra como gente): nível 22 com 2 capítulos, 45% de noites completas; nível 38 com 4 capítulos, 73%; nível 60 com 8 capítulos, 35%. Cerca de 10 salas por noite. A maior parte das quedas é no segundo trecho, sem passar de 70% em nenhum.
- **Duração.** O jogador automático luta de 5 a 7 minutos por noite; com as escolhas no meio, uma pessoa deve levar de 15 a 20. É menos que os 25 a 35 do 09, de propósito nesta primeira versão: a Roda, os Presságios e os Cordéis da fase 4 alongam a noite. Falta medir com gente jogando.
- **Erro corrigido no caminho.** Da faixa de cima do mapa só se chegava à Fonte, e da de baixo, só à Feira. Agora as duas ficam ao alcance de qualquer faixa.

### O que mudou em relação ao plano na fase 4

- **Roda do Saci.** Um nó novo do mapa (no máximo um por trecho, do quarto passo em diante), que só aparece depois de libertar o Saci. A conta fica em `src/meta/roda.ts`, as regras em `src/meta/dream.ts` e a tela em `src/ui/roda.ts`.
  - **A grade tem três padrinhos**, sorteados entre os libertados e puxados pelos que o herói já segue, mais Gorro, Vintém e Olho. Com os sete padrinhos na grade quase nunca fecharia linha.
  - **Chances, com a build vazia:** 57% de alguma linha, 41% de bênção e 0,5% de sorte grande por giro. O painel mostra a conta exata, somando todas as grades possíveis (uns 10 milhões); ela é feita em fatias para a tela não travar, e um teste confere contra 100 mil giros.
  - **Sorte grande são 4 linhas do mesmo padrinho num giro**, e não a grade inteira igual, que sairia uma vez em 20 mil giros. Ela desperta na hora uma bênção à escolha.
  - **Receber é um passo à parte do giro:** depois de girar dá para usar o Pulo (gira de novo uma coluna) e o Assobio (troca uma casa por Gorro) antes de receber.
  - **Giros:** um grátis por Roda, depois 20, 40 e 80 vinténs. Três giros seguidos sem linha garantem uma no próximo.
- **Presságios.** Os doze do 09, em `src/data/omens.ts`, com estas diferenças:
  - **Os de combate ficaram mais leves** que na tabela do 09: +12% de vida, +10% de dano e +7% de velocidade de ataque por grau, e chefes com +30% de vida. Com os números do 09 (+20%, +15%, +10%), Peso 8 derrubava o jogador automático de 70% para 3% de noites vencidas.
  - **Chefe Teimoso** dá vida ao chefe em vez de uma fase a mais. **Poucas Velas** corta a cura da Fonte (metade, depois nada), porque o trecho só tem uma. **Pressa** não encerra a noite: passou do tempo de luta do trecho (5, 4 ou 3 minutos), os monstros batem 50% mais forte até o chefe.
  - **A primeira noite de todas não aceita Presságios.**
  - **Na campanha**, um botão no painel da fase abre os cinco Presságios de combate, até Peso 10, nas fases que já têm 3 estrelas, depois que o Sonho abre. Valem só ao jogar na mão. Cada ponto dá +4% de chance de raridade maior por item e +3% de ouro, e o maior Peso vencido fica anotado na fase.
- **Cordéis.** Vinte folhetos, com três níveis, em `src/data/cordeis.ts`. O Fôlego começa em 5 e a **Casa de Cordel**, uma construção nova da Aldeia com cinco níveis, leva até 20. Os Cordéis estão liberados desde que o Sonho abre; a Casa só aumenta o Fôlego. Equipar um folheto de cada custo, de 1 a 5, é o Cordel Completo (+10% de Lembranças). Vários efeitos são diferentes da tabela de exemplo do 09, para caberem nas regras que já existem; o Fiado do Saci, por exemplo, dá giros grátis na Roda em vez de compra a prazo na Feira.
- **Aspectos de arma.** Doze, dois por arma, comprados com Lembranças na aba Sonho (120 e 180) e válidos também na campanha. Cada um é lido num ponto só da simulação: aparar (facão), tiro carregado (arco), golpe carregado (borduna), estocada (zagaia), último corte e esquiva perfeita (peixeiras) e orbe (cajado).
- **Conteúdo.** Mais 20 amuletos (são 40) e mais 10 causos (são 20), além de 10 conquistas da fase.
- **Perfil na versão 4:** `cordeis`, `aspects`, os recordes da Roda e do Peso, e o maior Peso vencido em cada fase. Uma noite que ficou pela metade na versão 3 continua de onde parou.
- **Calibração** (40 noites, nível 38 com 4 capítulos, facão, jogador automático que erra como gente):

  | | Peso 0 | Peso 8 | Peso 16 |
  |---|---|---|---|
  | Sem Cordéis | 70% | 20% | 10% |
  | Com um kit de meio de jogo (Fôlego 14) | 95% | 70% | 30% |

  O Peso 16 ficou na meta (10% a 25%) sem Cordéis. Com Cordéis o Peso 0 fica fácil, de propósito: é o que empurra o jogador para os Presságios.
- **Ficou para a fase 5:** o chefe misturado ("Eco"), a Noite Funda, os folhetos rasgados que liberam itens no sorteio e as falas dos Encantados ao acordar.

## O que o código atual já dá

| Precisamos de | Já existe |
|---|---|
| Simular uma sala sem tela | A simulação é determinística e não depende do Phaser (`src/sim/world.ts`: `createWorld`, `step`; `fingerprint` para os testes). A calibração e o `tests/bench.ts` já rodam assim |
| Um herói que joga sozinho | `makeBot(profile, opts)` em `tests/bot.ts` devolve `(w: World) => Input` e só lê o `World`. Escolhe bênçãos chamando `chooseBlessing` direto. Tem os perfis `HUMAN` e `PERFECT` |
| Gerar salas de qualquer capítulo | `wave()`, `TERRAIN[capítulo]` e as listas de monstros em `src/data/stages.ts`, já reaproveitados pela Torre (`floorRoom`) e pelas expedições |
| Fases com identificador próprio | `findStage(id)` em `src/data/tower.ts:73` escolhe o gerador pelo prefixo (`torre-`, `exp-`). O Sonho e o Terreiro entram do mesmo jeito |
| Bênçãos | `BLESSINGS` em `src/data/content.ts`; o altar sorteia em `rollBlessings` (`world.ts:97`); os efeitos são todos aplicados em `deriveStats` (`src/meta/stats.ts:124`) e lidos pela simulação como marcas em `HeroStats` |
| Herói de referência | `referenceProfile(level)` (`stats.ts:305`): itens Incomuns do nível, levemente aprimorados. É o herói do Sonho |
| Contar o que acontece | Toda ação do combate vira um `SimEvent` (`types.ts:219`). A cena passa cada um para `countEvent` (`src/meta/daily.ts`), que soma num `RunTally` |
| Relógio que dá para trocar nos testes | `setClock` em `src/meta/daily.ts:27` |
| Abas do acampamento | `TABS` em `src/ui/app.ts:31`; aba nova = tipo `Tab`, entrada em `TABS`, caso em `tabContent()`, função `renderX(ctx)` e ícone em `src/art/uiicons.ts` |

O que **não** existe e precisa ser feito: conquistas, contadores de longo prazo, proteção contra azar nos altares, nível e forma de companheiro (o `level` está sempre em 1), salvar no meio de uma fase, e qualquer migração de versão do perfil (hoje `migrate` só completa campos que faltam).

---

## Fase 0 · Preparação (P)

1. **Jogador automático dentro do jogo.** Mover `tests/bot.ts` para `src/sim/bot.ts`, sem mudar o comportamento, e deixar `tests/bot.ts` só reexportando. É TypeScript puro, sem nada do Node.
2. **Perfil versão 2.**
   - Uma lista de passos de migração em `src/meta/profile.ts` (`v1 → v2`), no lugar do "espalhar padrões por baixo".
   - Os campos novos, todos com valor padrão vazio: `life` (contadores de longo prazo), `achievements`, `almanac`, `dream`, `village`, `cordeis`, `aspects`, `builds`, `lootFilter`, e `temper` e `bond` em cada companheiro.
   - A chave do armazenamento continua `encantados.save.v1`, porque a versão fica dentro do perfil.
3. **Contadores de longo prazo.** Criar `src/meta/life.ts` com `recordRun(p, outcome, tally)`, chamado em `settleStage` (`src/meta/daily.ts:422`). Ele soma abates por tipo de monstro, reações, esquivas perfeitas, Supremos, feitiços por elemento, baús e vitórias por arma.
   - Para os abates por tipo, o evento de abate precisa trazer o tipo do monstro, se ainda não traz.
   - Isso alimenta as conquistas, o Almanaque e o "Conhecer o inimigo".

**Testes:**

- um perfil v1 salvo vira v2 sem perder nada;
- `recordRun` é idempotente por partida;
- o jogador automático movido continua dando o mesmo resultado na calibração (mesma semente, mesmo `fingerprint`).

---

## Fase 1 · Conveniências e coleção (M)

O jogador sente na hora: menos repetição chata e uma coleção para completar.

### 1.1 Terreiro de treino (P)

- **Fase e sala.** `src/data/training.ts` gera uma fase `treino` de uma sala só, e `findStage` passa a reconhecer o prefixo. A sala tem um novo tipo de monstro `boneco`: não anda, não ataca, tem vida enorme e se cura inteiro quando chega a zero. Pode ser marcado como elite ou chefe e receber um elemento.
- **Medidor.** Um painel na cena (`src/game/`) soma os eventos de dano para mostrar dano por segundo de arma e de feitiço, dano por elemento e reações. Para isso o `SimEvent` de dano precisa trazer a origem.
- **Fim da partida.** `settleStage` não paga nada para `treino`, e o resultado só mostra o medidor.

### 1.2 Caçada automática (M)

- **A cena.** `StageScene` recebe `auto?: { speed: 1|2|3 }`. Com ele ligado, `update` usa `bot(world)` no lugar de `readInput()` e roda `speed` passos de `step` por quadro (o acumulador já é de passo fixo). O altar é escolhido pelo jogador automático, como na calibração. As cartas aparecem por 0,4 s só para o jogador ver.
- **A fila.** Fica em `src/main.ts`, depois de `onStageEnd`: repete enquanto houver repetições, a fase for vencida e a mochila tiver espaço. Esc interrompe a fila.
- **Quando aparece.** No painel da fase em `src/ui/mapa.ts`, só para fases com 3 estrelas e que não são a fase 12 do capítulo.
- **Desempenho.** Medir 3x com `tests/bench.ts` no capítulo 7, que é o mais pesado. Se não couber em 16 ms por quadro, o teto vira 2x.

### 1.3 Filtro de saque (P)

- `p.lootFilter = { dismantleBelow: Rarity | null, keepSets: true, keepUniques: true }`.
- É aplicado em `applyOutcome` depois dos drops, com a mesma função de desmontar do ferreiro, e a tela de resultado mostra "N itens desmontados → material".
- Ajuste na aba do herói.

### 1.4 Diário: uma troca de missão por dia (P)

`daily.rerolls`. A troca sorteia de novo só aquela missão, entre os grupos que não estão em uso.

### 1.5 Builds salvas (P)

`p.builds[3]` guarda os ids dos itens equipados, os talentos, os feitiços, o companheiro e os Cordéis. Ao aplicar uma build, os itens que já não existem ficam vazios e o jogo avisa.

### 1.6 Conquistas e Almanaque (M)

- **Dados.** `src/data/achievements.ts`: `{ id, group, name, desc, hidden, counter, target, reward }`, onde `counter` é uma chave de `p.life` ou uma função pequena que lê o perfil.
- **Regras.** `src/meta/achievements.ts` traz `checkAchievements(p)`, chamado depois de `settleStage` e do ferreiro, e devolve as novas para virar aviso na tela.
- **Textos do folclore.** `src/data/lore.ts`, com um parágrafo por monstro, Encantado e companheiro, e depois por causo.
- **A aba.** Uma 9ª aba, **Almanaque**, com sub-abas Conquistas, Bestiário, Encantados, Companheiros e Itens únicos. Bênçãos e Amuletos entram na fase 3.
- **Conhecer o inimigo.**
  - `deriveStats` recebe `bonusVs: Partial<Record<EnemyKind, number>>`, vindo de `p.life.kills`.
  - O cálculo de dano no alvo (`src/sim/core.ts`) multiplica pelo bônus do tipo dele.
  - O bônus fica de fora no Sonho e na Torre, para o ranking.

**Testes:**

- cada conquista é alcançável (um perfil montado a cumpre) e nenhuma dispara duas vezes;
- o filtro nunca desmonta item travado, de conjunto ou único;
- a fila automática para quando a mochila enche;
- o Terreiro nunca termina sozinho e não paga nada.

**Conteúdo:** 40 conquistas nesta fase (as do Sonho vêm na fase 3) e cerca de 60 textos de folclore.

---

## Fase 2 · Bênçãos com padrinho (M a G)

Vale já na campanha e prepara o Sonho.

### 2.1 Padrinhos e bênçãos novas (M)

- **Os dados.** `BlessingDef` ganha `patron: ElementId | null` e o tier `4` (Lendária). As 30 bênçãos atuais recebem padrinho ou ficam neutras, e entram as novas até chegar a 64.
- **Efeitos que são números** entram em `deriveStats`.
- **Efeitos que mudam regras** viram marcas novas em `HeroStats`, lidas em `src/sim/player.ts` e `src/sim/core.ts`. Exemplos: o rastro da esquiva, o redemoinho da esquiva perfeita e o fogo ao correr.
- **O altar.** `rollBlessings(w, opts)` ganha `opts.patron` (altar de um padrinho só) e a proteção contra azar (`w.altarDry`, que conta altares seguidos sem nada raro).

### 2.2 Despertar (M)

- **Os dados.** `AWAKENINGS: Partial<Record<BlessingId, [BlessingId, BlessingId]>>`. As formas despertas também são `BlessingId`, com `awakens: base`.
- **Escolher uma forma** troca todas as cópias da bênção base em `w.blessings` pela forma escolhida. Assim `blessingCounts` e `deriveStats` continuam funcionando.
- **No altar.** `rollBlessings` põe o Despertar no lugar de uma opção quando o jogador tem uma bênção no máximo.
- **Receitas secretas** ficam em `SECRET_AWAKENINGS: { base, amulet, result }[]`, e só valem no Sonho porque precisam de amuleto.

### 2.3 Sinergia de padrinho e Compadrio (M)

- **Contagem.** `patronCounts(blessings, companionElement)` em `content.ts`, mais `PATRON_TIERS[el] = [{ at: 3, … }, { at: 5, … }, { at: 7, … }]` aplicado em `deriveStats`.
- **Compadrio.** `COMPADRIOS: { a, b, id }[]`. `rollBlessings` inclui o compadrio do par quando há 2 bênçãos de cada padrinho.
- **HUD.** Ícones dos padrinhos com o número de bênçãos e a faixa ativa, embaixo da barra de vida.

### 2.4 Altar na tela (P)

`StageScene.showCards` ganha o ícone do padrinho, a moldura de Despertar e a de Compadrio, e mostra o nível atual e o máximo da bênção.

**Testes:**

- o altar nunca oferece bênção no máximo;
- o Despertar só aparece com a base no máximo;
- o Compadrio só aparece com 2 e 2;
- a proteção contra azar garante uma rara no 3º altar;
- todas as bênçãos têm efeito (cada `BlessingId` muda `deriveStats` ou alguma marca);
- o determinismo continua.

**Calibração:** rodar `tests/calib.ts` nos capítulos 1 a 8. As fases finais de cada capítulo têm que continuar perto de metade das tentativas vencidas com o herói de referência. Se as sinergias facilitarem demais, os bônus da faixa 5 baixam.

**Conteúdo:** 34 bênçãos novas, cerca de 40 formas despertas (2 por bênção com máximo maior que 1), 7 Compadrios, 21 faixas de sinergia e ícones em `uiicons.ts`.

---

## Fase 3 · O Sonho, o núcleo (G)

### 3.1 Uma sala por nó (decisão de arquitetura)

Cada nó de combate do mapa vira uma **fase de uma sala só**, com o id `sonho-<semente>-<trecho>-<nó>`, gerada em `src/data/dream.ts` como a Torre gera seus andares. O que passa de um nó para o outro fica fora do `World`, no estado da noite. Para isso o `StageConfig` ganha:

```ts
carry?: { blessings: BlessingId[]; hpFrac: number; potions: number; amulets: AmuletId[]; vintem: number }
```

Com isso:

- **salvar entre nós sai de graça**: basta guardar o estado da noite no perfil depois de cada nó;
- a cena, a recompensa por sala e o jogador automático continuam iguais;
- Feira, Fonte, Causo e Roda **não** são salas: são telas de interface entre um nó e outro.

### 3.2 Gerador da noite (M)

`src/data/dream.ts` gera a noite assim:

```ts
dreamNight(seed, unlocks): Night  // 3 trechos, cada um com um capítulo, nós e ligações
```

- **Os nós** são sorteados com os pesos do 09 e as regras de caminho do 09: o primeiro nó é combate, o penúltimo é Fonte ou Feira, há altar em todo caminho, nunca dois Causos seguidos e no máximo uma Provação por trecho.
- **As salas** vêm de `dreamRoom(node, level)`, que reaproveita `wave`, `TERRAIN` e a lista de monstros do capítulo, como faz `floorRoom`.
- **Os chefes** vêm de `CHAPTER_BOSSES` (`tower.ts`).

### 3.3 Regras da noite (G)

`src/meta/dream.ts` guarda o estado da noite:

```ts
DreamRun = { seed, omens, cordeis, weapon, aspect, spells, companion, trecho, nodeId, path,
             blessings, amulets, vintem, hpFrac, potions, earned, dry }
```

E as funções que o movem: `startNight`, `heroFor(run)`, `settleNode(run, outcome)`, `applyShop`, `applyFountain`, `applyCauso` e `wake(p, run)`.

- **O herói.** `heroFor` monta o herói com `deriveStats` sobre `referenceProfile(nível)`, trocando a arma, os feitiços e o companheiro pelos escolhidos, mais bênçãos e amuletos.
- **Vintém.** `src/sim/loot.ts` só deixa cair vintém quando `cfg.dream` estiver ligado.
- **Amuletos.**
  - Dados em `src/data/amulets.ts`.
  - Efeitos de número entram em `deriveStats`; os que mudam regras viram marcas em `HeroStats`.
  - As regras da noite (Feira, Fonte, Roda) leem `run.amulets` direto.
- **Provação.** `RoomDef.trial = { kind, target, seconds }`. `updateWaves` confere a regra e emite `trialFail` ou `trialWin`. Perder a Provação não encerra a sala; só leva a vida e a recompensa.
- **Causos.**
  - Dados em `src/data/causos.ts`: `{ id, title, text, art, choices: { label, cost?, effects: DreamEffect[] }[] }`.
  - `DreamEffect` é uma lista fechada: dar bênção, dar amuleto, curar, maldição, vintém, nível de bênção, companheiro extra e regra no próximo combate.
  - Assim um causo novo é só dado, sem código.
- **Lembranças.** `wake` paga Lembranças, XP e ouro como no 09, registra em `p.life` e confere as conquistas do Sonho.

### 3.4 Interface (G)

- **A aba Sonho** (em `src/ui/sonho.ts`). Antes da noite: escolha de arma, Aspecto, feitiços e companheiro, mais os Presságios e Cordéis quando abrirem. Durante a noite, a mesma aba mostra o mapa do trecho em SVG, com os nós clicáveis.
- **Telas da noite.** Feira, Fonte e Causo, este com a ilustração gerada por código, como o resto da arte.
- **Resultado.** O resumo da noite reaproveita `renderResultado`, que ganha o ramo do Sonho.
- **HUD durante o nó:** vintém, amuletos e a sinergia.
- **Aldeia, primeira versão.** As construções aparecem como uma lista na aba Sonho, para as Lembranças já terem onde ser gastas. A arte da Aldeia vem na fase 5.

**Testes:**

- as regras do mapa valem para 1.000 sementes;
- a mesma semente gera a mesma noite;
- salvar e carregar entre nós dá o mesmo resultado que jogar direto;
- `wake` paga certo para noite vencida e para noite perdida;
- cada `DreamEffect` faz o que diz.

**Calibração nova:** `tests/calib-sonho.ts` joga 50 noites com o jogador automático `HUMAN` e o herói de referência, sem Presságios. **Meta:** 35% a 50% de noites completas, 25 a 35 minutos de jogo (em tempo da simulação) e nenhum trecho com mais de 70% das quedas.

**Conteúdo:** 20 amuletos (completam 40 na fase 4), 10 causos, 15 conquistas do Sonho, textos do Almanaque para bênçãos e amuletos.

**Marco:** depois desta fase dá para montar uma **demo**, com os capítulos 1 e 2, o Sonho com os padrinhos Curupira e Iara e um trecho só. É o formato da demo do Slotbound e do que vai bem nos festivais de demo da Steam.

---

## Fase 4 · Roda, Presságios, Cordéis e Aspectos (G)

### 4.1 Roda do Saci (M)

- **A lógica** fica em `src/meta/roda.ts`, separada da tela:
  - `spin(rng, weights)`, `lines(grid)` e `payout(lines, run)`;
  - `nudge(grid, col, rng)` e `whistle(grid, cell)`;
  - a proteção contra azar (`run.dry`).
- **O painel de chances** é calculado exatamente a partir dos pesos (a chance de cada símbolo e a chance de pelo menos uma linha) e mostrado antes de girar.
- **A tela** fica em `src/ui/roda.ts`, com rolos em CSS, o momento de jackpot e o som. A animação de cada rolo para em sequência.

**Testes:**

- a soma das chances dá 1;
- a proteção garante linha no 4º giro;
- o jackpot paga Lendária;
- o painel bate com uma simulação de 100 mil giros (diferença menor que 1%).

### 4.2 Presságios (M)

- **Os dados** ficam em `src/data/omens.ts`, e `cfg.omens` entra em `createWorld`. Lá ficam os multiplicadores de vida, dano e velocidade de ataque dos monstros, e os modificadores de elite.
- **Os que mudam a noite** (Fontes, preços, Roda, Juízo, Esquecimento e Pressa) são lidos pelo gerador e pelas regras da noite.
- **Na campanha:**
  - um seletor no painel da fase com 3 estrelas, com no máximo 10 pontos;
  - `applyOutcome` soma +4% de raridade e +3% de ouro por ponto;
  - o mapa mostra o maior Peso vencido em cada fase.

### 4.3 Cordéis (P a M)

- `src/data/cordeis.ts`.
- A tela de montagem com o orçamento de Fôlego e o Cordel Completo.
- Os efeitos entram no `DreamRun` ao começar a noite.

### 4.4 Aspectos de arma (M)

- `src/data/aspects.ts`, mais `p.aspects = { owned: AspectId[], equipped: Partial<Record<WeaponKind, AspectId>> }`.
- Cada aspecto é uma marca em `HeroStats`, lida no golpe próprio da arma em `src/sim/player.ts`.
- Vale na campanha também.

**Testes:** cada Aspecto muda o resultado de uma situação montada (por exemplo, aparar com o Aspecto do Curupira fere quem está em volta).

**Calibração:** `calib-sonho` com Peso 0, 8 e 16. Peso 16 tem que ficar entre 10% e 25% de noites completas.

**Conteúdo:** 20 amuletos, 10 causos, 20 Cordéis, 12 Aspectos e a arte dos símbolos da Roda.

---

## Fase 5 · Aldeia, companheiros, pós-jogo e exagero (G)

1. **Aldeia (M).** Uma cena desenhada por código (`src/art/aldeia.ts`). Cada construção ganha cor quando construída. Os dados ficam em `src/data/village.ts`, e cada sistema confere se a sua construção existe com `hasBuilding(p, id)`: a Roda pede a Barraca do Saci, os Cordéis pedem a Casa de Cordel, as Andanças pedem o Viveiro.
2. **Falas (P).** `src/data/falas.ts` guarda `{ who, when: Condition, text }`. Ao voltar de uma noite, a Aldeia mostra uma fala que ainda não apareceu.
3. **Andanças (M).** `src/meta/andancas.ts` usa o relógio de `setClock`. O teto diário vem do ouro e do material de 2 fases. Os testes avançam o relógio em vez de esperar.
4. **Temperamento e Laço (P).** Sorteados no resgate, em `applyOutcome`. Os efeitos entram em `deriveStats` e na habilidade do companheiro. Perfis antigos sorteiam o temperamento na migração, com a semente do perfil.
5. **Profundezas da Torre (P).** `towerLevel` e a escala depois do andar 100, mais o recorde por semana, que já existe (`TowerRecord`).
6. **Noite da Semana (P).** Semente tirada de `weekKey()`, Presságios fixos e recorde local.
7. **Desafio dos Encantados (P).** Uma fase `desafio` com os chefes em sequência, gerada como a Torre.
8. **Exagero (M).**
   - Efeitos de jackpot, Despertar e Lendária em `src/game/`.
   - O resumo da noite desenhado num canvas e salvo como PNG.
   - Números de dano maiores e com outra cor acima de um limiar.

---

## Conteúdo a produzir, somado

| O quê | Quantidade | Fase |
|---|---:|---|
| Bênçãos novas | 34 | 2 |
| Formas despertas | ~40 | 2 |
| Despertares secretos | 6 | 3 e 4 |
| Compadrios | 7 | 2 |
| Amuletos | 40 | 3 e 4 |
| Causos | 20 | 3 e 4 |
| Cordéis | 20 | 4 |
| Aspectos | 12 | 4 |
| Construções da Aldeia | 8 (×3 níveis) | 3 e 5 |
| Conquistas | ~60 | 1, 3 e 4 |
| Textos do Almanaque | ~120 | 1 a 4 |
| Falas da Aldeia | ~80 | 5 |

## Riscos

| Risco | Como tratar |
|---|---|
| As sinergias e os Despertares deixam a campanha fácil demais | Calibração ao fim da fase 2. A faixa 7 é quase impossível na campanha de propósito |
| O volume de conteúdo atrasa tudo | Os Causos, amuletos e Cordéis são só dados. O código só precisa da lista de efeitos fechada (`DreamEffect`, marcas em `HeroStats`) |
| Perfis salvos quebram | Migração com passos e teste com um perfil v1 real |
| O automático em 3x pesa demais | Medir na fase 1 com `tests/bench.ts`; o teto pode ficar em 2x |
| A Roda parecer jogo de azar | Sem dinheiro real, chances sempre visíveis, proteção contra azar, e ela é um nó entre vários, não o centro do Sonho |
| O jogador novo se perde em tantos sistemas (crítica ao Hades II) | Tudo abre aos poucos pela Aldeia e pela campanha. Cada sistema novo tem uma tela de explicação na primeira vez |

## Ordem sugerida

**0 → 1 → 2 → 3 → 4 → 5.** As fases 1 e 2 já melhoram a campanha sozinhas. A fase 3 é o salto grande, e a demo pode sair logo depois dela.
