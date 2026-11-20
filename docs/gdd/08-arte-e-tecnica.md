# 08 · Arte e técnica

## Direção de arte

**Ilustração recortada, 2D, vista de cima em três quartos.** Personagens são montados em peças (cabeça, tronco, braços, pernas, arma, acessórios) e animados por código.

Regras:

1. **Contorno escuro e quente**, mais grosso na silhueta e mais fino nos detalhes internos.
2. **Três tons por peça:** cor base, sombra em meia-lua do lado oposto à luz, brilho do lado da luz. A luz vem sempre de cima e da esquerda.
3. **Detalhe que conta história:** costura no couro, moedas no chapéu, musgo no tronco, cicatriz. Cada personagem tem pelo menos três detalhes que só ele tem.
4. **Assombros são cinzentos com um resto de cor.** Encantados corrompidos seguem a mesma regra; a cor volta quando são libertados.
5. **Cada capítulo tem uma cor dominante** e uma hora do dia: Mata ao meio-dia filtrado (verde), Rios ao amanhecer (azul), Sertão ao fim da tarde (laranja), Cerrado à noite com fogo (vermelho), Selva na penumbra (verde-escuro), Pampa sob a lua (violeta), Pantanal na névoa (rosa), Terra Sem Nome sem cor.
6. **Cenário em camadas:** chão com textura, objetos ordenados por profundidade, copas e neblina por cima, raios de luz.
7. **Efeitos legíveis:** cada elemento tem uma cor só dele, usada no feitiço, no efeito sobre o inimigo e no ícone.

Referência cultural: gibão e chapéu de couro do sertão, xilogravura de cordel nos contornos, fauna e flora reais de cada bioma.

## O que é feito por código e o que vem de fora

| Por código | De fora |
|---|---|
| Personagens, monstros, chefões, cenários | Efeitos sonoros e música (bibliotecas livres no começo) |
| Animação, luz, partículas, efeitos de feitiço | Ilustração de capa para divulgação |
| Toda a interface | |

## Tecnologia

- **TypeScript**, **Phaser 3** (motor 2D para navegador) e **Vite**.
- Roda no navegador, em computador e celular. Empacotável para Steam depois.
- Dados do jogo (monstros, itens, feitiços, talentos, fases, fórmulas) em arquivos de configuração, separados do código.
- Simulação determinística com passo fixo, para gravar e reproduzir partidas.
- Progresso salvo no navegador até existir conta.
- Servidor (contas, drops, rankings, mercado): decidido quando chegar a etapa 4.

- A arte é desenhada por código (Canvas 2D) e convertida em folhas de sprites na abertura do jogo (`src/art/bake.ts`). Durante a partida o Phaser só troca quadros.

O código Java antigo não é reaproveitado. Está em `legacy/java`.

### Organização do código

| Pasta | Conteúdo |
|---|---|
| `src/data` | Números do jogo: `balance.ts` (combate do protótipo) e `progression.ts` (fórmulas do documento 01) |
| `src/sim` | Regras do combate, sem Phaser e sem navegador. É o que os testes exercitam |
| `src/art` | Desenho dos personagens e do cenário, e a conversão em texturas |
| `src/game` | Cena do Phaser: comandos, sprites, efeitos, HUD e som |
| `tests` | Testes das regras (`npm test`) |

## Ordem de construção

| Etapa | Entrega | Critério para seguir |
|---|---|---|
| 1 · Sensação (**feita, em avaliação**) | Uma sala com três ondas: herói com movimento, sequência de três golpes, esquiva com esquiva perfeita e Dardo de Espinho; Saúva-Cinza, Queixada Sombria, Cuspidor e o elite Tronco-Oco | Controlar o herói é gostoso |
| 2 · Fatia vertical (**feita, em avaliação**) | Capítulo 1 completo: 12 fases, Caipora e Curupira, facão com escudo e arco, 5 feitiços de Natureza, capivara e onça, loot, inventário, ferreiro (aprimorar e fundir), atributos e a teia de talentos | Alguém de fora joga 1 hora sem pedir ajuda |
| 3 · Campanha (**em andamento: Capítulo 2 feito, em avaliação**) | Capítulos 2 a 8, todas as armas, elementos, talentos, conjuntos, únicos, Torre | Créditos alcançáveis, curva de dificuldade ajustada |
| 4 · Online | Contas, save na nuvem, servidor decidindo drops, rankings | Rankings confiáveis |
| 5 · Mercado | Compra e venda com ouro | Economia estável |
| 6 · Loja e temporadas | Loja direta, passe, primeira temporada | — |

## Referência de arte

`docs/arte/referencia-capitulo-1.html` guarda o código de desenho da proposta atual, ainda em revisão: herói, capivara, Saúva-Cinza, Queixada Sombria, Tronco-Oco, Cuspidor, Curupira e a cena da Mata. Abra no navegador para ver. As funções de desenho desse arquivo são a base das do jogo.

## Etapa 2: o que entrou e o que ficou diferente do documento

Entrou: as 12 fases do Capítulo 1 com salas em sequência, altar de bênçãos, elites com modificadores, a Caipora (fase 11) e o Curupira em três fases com barra de postura; duas armas; cinco feitiços; dois companheiros; itens com raridade e bônus; inventário; ferreiro com aprimorar e fundir; atributos; teia de talentos; estrelas; livro de drops com azar limitado; redução de XP e ouro em fase fácil; save no navegador.

Decisões tomadas para a fatia vertical, a revisar:

- **Ordem de abertura.** O ferreiro abre na fase 1-2 e os feitiços de Natureza são aprendidos por nível (1, 3, 4, 6 e 7), para o Capítulo 1 já exercitar os sistemas. No jogo completo, parte disso deve vir só depois do Curupira.
- **Queda.** Cair uma vez recomeça a sala atual com metade da vida; cair de novo encerra a fase. A segunda estrela pede terminar sem cair.
- **Onça.** É resgatada ao vencer a fase 1-9 sem cair, no lugar da sala secreta.
- **Golpe próprio da arma** fica no botão direito do mouse (defender ou carregar o tiro). Feitiços em Q, E e R.

Ainda fora: Supremo (invocar o Encantado), níveis de feitiço com tomos, encantar e reforjar no ferreiro, gemas, conjuntos, salas secretas, formas dos companheiros, equipamento mudando a aparência do herói além da arma, controle por toque, Torre e missões diárias.

## Etapa 3, primeira parte: o que entrou

Veio depois do primeiro teste de quem jogou a etapa 2. O retorno foi: o jogo estava fácil demais, a interface parecia um site e a teia de talentos confundia.

**Dificuldade.** As fases passaram a ser calibradas com um jogador automático que erra como gente (`tests/bot.ts`: reage com 0,27 s de atraso e percebe 72% dos avisos), jogando com o personagem de referência (`referenceProfile` em `src/meta/stats.ts`). O poder recomendado de cada fase é o poder desse personagem. As metas: no nível da fase, ele passa com folga no começo do capítulo e apertado no fim (cerca de metade das tentativas nas três últimas fases); três níveis abaixo, não passa. Para rodar: `npx vite-node tests/calib.ts [de] [até] [diferença de nível]`. O que mudou para chegar lá:

- O nível da fase sobe mais rápido no começo: um por fase no Capítulo 1 (1 a 12) e quase isso no 2 (13 a 23). Com a regra antiga, quem jogava cada fase uma vez chegava três níveis acima dela e não encontrava parede nenhuma.
- A vida dos monstros cresce mais rápido que antes (com o quadrado do nível), o dano também, e de nível em nível eles andam mais rápido e avisam por menos tempo.
- A onda seguinte entra quando sobra metade da atual, em vez de esperar a sala esvaziar. Aparecem **campeões**: monstros comuns com mais vida e um modificador de elite.
- Saúvas cercam e dão bote onde o herói vai estar; o Cuspidor cospe duas sementes a partir do nível 5 (uma onde o herói está, outra onde ele vai); a Queixada mira por menos tempo.
- Poções: 2 por fase, 35% da vida cada.

**Bênçãos.** São 30, em três graus (Comum, Rara, Épica, com chances de 60, 30 e 12 de peso), e várias acumulam. Entre elas as pedidas: +1 projétil, +dano, +Força, +Agilidade, +Inteligência, ouro e XP da fase.

**Teia de talentos.** 78 nós: seis braços (um por atributo) com tronco, dois galhos e um Dom na ponta; um anel de elos entre braços vizinhos, cada um com uma joia. Entraram talentos de XP (Sabedoria, Joia do Curioso) e de ouro (Olho Vivo), de baú, de ferreiro, de poção e de companheiro.

**Capítulo 2, Rios do Norte.** 12 fases, do nível 13 ao 23. Monstros: Piranha-Cinza, Sapo-Cururu, Arraia de Areia, Caramujo-Concha e Jacaré de Lodo. Chefes: o Boto (fase 11) e a Iara (fase 12, três fases, postura, o canto que puxa). Terreno: poças que molham e atrasam, e correnteza em duas fases. Elemento Água com cinco feitiços (níveis 13, 14, 16, 18 e 20), o estado **Molhado** e a reação **Brotar** (Natureza em alvo molhado). Companheira arara (fase 2-3). Três itens com nome.

**Sistemas que estavam de fora na etapa 2 e entraram:** Supremo (tecla T; o Curupira é liberado ao vencer a 1-12 e a Iara ao vencer a 2-12), nível de feitiço com tomos (até 10, com marcos nos níveis 4, 7 e 10), encantar e reforjar no ferreiro.

**Interface.** Refeita com cara de jogo: ícones no lugar de frases, um só tipo de dica ao passar o mouse, mapa ilustrado sem barra lateral, herói no centro com os itens em volta e a mochila embaixo, ferreiro que acende o que dá para trabalhar, e a teia de talentos em tela cheia com arrastar e zoom.

Ainda fora: capítulos 3 a 8, gemas, conjuntos, salas secretas, formas dos companheiros, aparência do herói mudando com a armadura, controle por toque, Torre e missões, e tudo o que é online.

