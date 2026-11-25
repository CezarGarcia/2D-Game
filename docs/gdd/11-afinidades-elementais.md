# 11 · Afinidades elementais (proposta em discussão)

**Estado:** proposta. Nada daqui está no jogo ainda. Serve para decidir o que entra, com que peso e quando.

**A ideia, em uma frase:** cada monstro tem elementos a que é fraco e elementos a que resiste; cada fase avisa o que vem; e o jogador ganha (ou sofre) por montar o herói pensando nisso.

## O que o jogo já tem

Metade do sistema já existe, só que escondida:

| Já existe | Onde | O que falta |
|---|---|---|
| O herói tem **resistência por elemento**, de 0 a 75% | gemas na armadura, o afixo "resistência a todos", o talento Pele Grossa, conjuntos | Só existe afixo de resistência a Natureza. Não há fraqueza. A tela quase não mostra |
| Todo golpe de monstro **carrega o elemento** do capítulo e é reduzido pela resistência | `hurtPlayer` | O jogador não é avisado antes da fase |
| O herói tem **dano por elemento** | gema na arma, um afixo (só Natureza), um item com nome, a sinergia do Boitatá | Afixos para os outros seis elementos |
| Cada monstro e chefe **tem um elemento** | `bestiary.ts` | O elemento do monstro não muda o dano que ele recebe |
| **Reações** entre dois elementos | `status.ts` | Nada: continuam como estão |
| **Builds salvas**, com troca grátis | tela do herói | Um jeito de trocar de build direto da fase |

Ou seja: o lado da defesa está pronto e pouco usado, e o lado do ataque (monstro fraco ou resistente) não existe.

## Como os jogos de referência fazem

| Jogo | Como calcula | O que tirar disso |
|---|---|---|
| **Pokémon** | Tabela fixa de tipos. Multiplicador de 2 (fraco), 0,5 (resiste) ou 0 (imune), e os dois tipos do alvo se multiplicam. | Poucos números, sempre os mesmos, e o jogo diz na hora ("super efetivo"). A regra cabe na cabeça. |
| **Genshin Impact** | Cada inimigo tem uma resistência por elemento. Dano × (1 − resistência). Abaixo de zero a resistência conta pela metade. Escudos elementais caem muito mais rápido com o elemento certo. | O escudo é uma trava **mole**: o elemento errado ainda quebra, só que devagar. Ninguém fica preso. |
| **Honkai: Star Rail**, Persona, Octopath | Acertar a fraqueza esvazia uma barra de resistência do inimigo. Quando zera, ele "quebra": perde a vez ou fica atordoado. Em Star Rail, inimigo não quebrado recebe 10% menos dano. | A fraqueza paga em **tempo e controle**, não só em número. É o que dá gosto de explorar. |
| **Monster Hunter** | Cada monstro tem de 0 a 3 estrelas por elemento, anotadas no caderno do caçador depois que você o encontra. O dano de elemento é somado à parte do dano físico. | A graça está em **se preparar antes**: ler o caderno, trocar a arma, e só então sair. |
| **Path of Exile, Diablo IV** | Resistência do herói com teto de 75% (70% em Diablo). Em PoE a campanha tira 60% de resistência ao longo dos atos, e fechar o teto vira obrigação. Diablo IV refez a conta na temporada 2 para ela ser somada e fácil de ler. | Resistência **obrigatória** vira imposto: todo mundo paga e ninguém escolhe. Melhor ser uma vantagem que se busca do que um buraco que se tapa. |
| **Borderlands** | O elemento certo contra o tipo de barra (carne, escudo, armadura) dá de 150% a 250%; o errado, de 65% a 80%. A cor da barra diz o tipo. | **Bônus grande, castigo pequeno.** E a informação está na barra do inimigo, não num menu. |

A crítica que mais se repete entre designers: pedra-papel-tesoura levado ao extremo deixa o jogo interessante só na tela de escolha, e um chefe que **só** cai para um elemento é uma parede injusta para quem não o tem. A saída comum é o contra **mole**: o loadout certo ajuda muito, o errado atrapalha, e nenhum é proibido.

## A proposta

### 1. A Roda dos elementos

Uma regra que se decora em um minuto:

> **Água** apaga **Fogo** · **Fogo** queima **Natureza** · **Natureza** racha **Terra** · **Terra** aterra **Tempestade** · **Tempestade** eletrocuta **Água**
>
> **Sombra** e **Encanto** se desfazem um ao outro.

Um monstro de um elemento, por padrão:

- é **fraco** ao elemento que vence o dele;
- **resiste** ao próprio elemento e ao elemento que o dele vence.

Exemplo: os monstros de Fogo do capítulo 4 são fracos a Água e resistem a Fogo e a Natureza.

Só a Roda deixaria cada capítulo com uma resposta única ("capítulo 4, leve Água"), o que é raso. Por isso **cada tipo de monstro pode ter exceções** escritas à mão, por exemplo:

- o Caramujo-Concha (Água, blindado) também é fraco a Terra, que racha a casca;
- uma assombração do capítulo 6 resiste a tudo menos Encanto e Fogo;
- os monstros do capítulo 8 (sem elemento) não têm fraqueza nem resistência, mas cada elite sorteia uma.

Assim as fases de um mesmo capítulo pedem coisas diferentes conforme a mistura de monstros.

### 2. A conta

Do herói para o monstro:

```
dano = base × (1 + dano do elemento) × afinidade

afinidade:  fraco 1,5   ·   neutro 1,0   ·   resiste 0,65
```

- Vale para feitiços, para o golpe de arma com gema ou com elemento, para o companheiro e para as reações (que usam o melhor dos dois elementos envolvidos).
- Golpe de arma sem elemento é sempre neutro.
- Dois atributos novos mexem na conta: **Faro** aumenta o bônus contra fracos, e **Teimosia** diminui o castigo contra quem resiste. Nenhum zera o castigo.
- Na tela: o número do dano sai maior e com "**Fraco!**" quando acerta a fraqueza, e menor e cinza com "**Resiste**" no caso contrário.

Por que bônus maior que o castigo: errar custa 35% do dano daquele feitiço; acertar rende 50%. Quem só tem um elemento continua jogando, e quem se prepara sente a diferença.

Do monstro para o herói, a conta já existe e fica:

```
dano recebido = golpe × (1 − resistência ao elemento)        resistência de −50% a 75%
```

A novidade é o lado de baixo: resistência **negativa**, até −50%. É a "fraqueza" do herói, e só vem de escolhas dele (ver o item 5).

### 3. Casca elemental: a fraqueza que paga em tempo

É a peça que faz o loadout importar de verdade sem virar parede.

- Elites e chefes podem ter uma **Casca**: uma barra por cima da vida, da cor de um elemento.
- Enquanto a Casca existe, o monstro recebe 30% menos dano e não é interrompido.
- O elemento a que ele é fraco tira **três vezes** mais Casca; os que ele resiste tiram **metade**; golpe de arma tira o normal.
- Casca quebrada: o monstro fica **Exposto** por alguns segundos (atordoado e recebendo 50% a mais) e a Casca só volta bem depois.

Quem vem com o elemento certo quebra a Casca em segundos e ganha uma janela enorme. Quem vem sem ele ainda quebra, na base do golpe, mas a luta demora e fica perigosa. É o que Genshin faz com os escudos e Star Rail com a quebra.

### 4. A fase avisa: Ameaça e Preparo

Nada disso funciona se o jogador só descobrir morrendo. No painel da fase, no mapa:

- **Ameaça:** os elementos que os monstros da fase usam, do mais comum ao mais raro.
- **Fracos a / Resistem a:** somando os monstros da fase.
- **Preparo:** um selo verde, amarelo ou vermelho que compara o herói atual com a fase, com uma linha dizendo por quê ("seus três feitiços são de Natureza, e esta fase resiste a Natureza").
- **Trocar de build ali mesmo:** os três espaços de build aparecem no painel, cada um com o seu selo.

No Bestiário, a ficha de cada monstro ganha as fraquezas e resistências. Elas aparecem depois do primeiro encontro; antes disso, a fase mostra "?". É o caderno do caçador de Monster Hunter.

### 5. O arsenal que isso abre

| O quê | Como fica |
|---|---|
| **Afixos de item** | Resistência e dano para os **sete** elementos (hoje só Natureza tem). Novos: "dano contra monstros de (elemento)", Faro e Teimosia. |
| **Itens com preço** | Afixos fortes que cobram uma fraqueza: "+18% de dano de Fogo, −12% de resistência a Água". É de onde vem a resistência negativa. |
| **Garrafadas** | Um consumível por fase, escolhido antes de entrar: +30% de resistência a um elemento, ou os golpes de arma ganham um elemento. Feitas com material, viram um gasto novo para o que sobra. |
| **Gemas** | Já dão dano na arma e resistência na armadura. Ganham valor sem mudar nada. |
| **Feitiços e companheiros** | Já têm elemento. Passam a valer mais ou menos conforme a fase, o que dá motivo para evoluir mais de três feitiços. |
| **Talentos** | Um ramo pequeno de preparo: mais Faro, a Casca quebra mais rápido, a primeira reação da sala sempre conta como fraqueza. |
| **Conjuntos e itens com nome** | Um conjunto por elemento vencido ("Apaga-Fogo": resistência a Fogo e dano de Água). |
| **Sonho** | Presságios de elemento ("Noite de Brasa: todo elite tem Casca de Fogo"), Aspectos de arma com elemento e amuletos de afinidade. |
| **Torre** | Andares com um elemento do dia, para a build do ranking não ser sempre a mesma. |

### 6. Onde aperta e onde não

Você disse que o loadout padrão deveria perder em certas fases. Concordo com o efeito e discordo só do lugar: se a campanha travar quem ainda não tem o elemento certo, o jogador novo larga o jogo, e ele ainda nem tem os sete elementos (ganha um por capítulo).

| Conteúdo | Peso das afinidades |
|---|---|
| Capítulos 1 e 2 | Só ensina: os números aparecem, sem Casca. |
| Capítulos 3 a 8, primeira vitória | Peso normal. Casca só no chefe e na elite da fase 11. O loadout errado deixa a fase uns 30% mais difícil, não impossível. |
| Terceira estrela, fases difíceis, Caçada automática | Peso cheio: elites com Casca. Aqui o loadout padrão começa a perder. |
| Torre, e o Sonho com Presságios | Peso cheio e mais: é onde trocar de loadout vira obrigação, para quem já tem o arsenal. |

Assim a dificuldade que você quer existe, e fica onde o jogador já tem como responder a ela.

## Riscos

- **Virar imposto.** Se toda fase pedir resistência no teto, ninguém escolhe nada. Por isso a resistência continua sendo vantagem, e a fraqueza do herói só vem de itens que ele quis usar.
- **Trocar de build ser chato.** Sem troca rápida no painel da fase, o sistema vira trabalho. A troca tem de ser um clique.
- **Mochila cheia.** Sete resistências e sete danos multiplicam os afixos. O filtro de saque e as builds salvas seguram isso, mas o inventário pode precisar de mais espaço.
- **Recalibrar a campanha.** As 96 fases foram ajustadas com um herói de Natureza. Com afinidades, o jogador automático precisa escolher feitiços por capítulo, e as fases dos capítulos 3 a 8 precisam ser medidas de novo.
- **Reações.** Elas já são a camada "esperta" dos elementos. A afinidade não pode ser mais forte que elas, senão ninguém mais combina elementos. Com 1,5 e 0,65 as reações continuam valendo mais.

## Como eu faria, em três passos

1. **Ler e sentir (médio).** Fraquezas e resistências nos monstros, a conta, os avisos de "Fraco!" e "Resiste", Ameaça e Preparo no painel da fase, a ficha no Bestiário e os afixos para os sete elementos. Números mais leves no começo (1,3 e 0,8) para medir sem quebrar a campanha.
2. **Fazer valer (médio).** Casca elemental, troca de build no painel, Garrafadas, itens com preço, Faro e Teimosia, o ramo de talentos. Os números sobem para 1,5 e 0,65 e a campanha é medida de novo.
3. **Espalhar (médio).** Presságios, Aspectos e amuletos de elemento no Sonho, andares de elemento na Torre, conjuntos novos.

## Perguntas para decidir

1. **O quanto aperta.** Mole na campanha e duro no conteúdo opcional (a minha sugestão), ou duro já na campanha?
2. **Saber antes ou descobrir.** As fraquezas aparecem depois do primeiro encontro (a minha sugestão) ou desde o começo?
3. **Dano físico por tipo.** Dá para ir além e ter corte, impacto e perfuração (facão, borduna, flecha), com monstros fracos a cada um. Isso faria a arma também entrar na conta. Sugiro deixar para depois, se os elementos funcionarem: são duas tabelas para o jogador decorar.
4. **Quando.** Depois da fase 4 da etapa 4 (a minha sugestão), ou antes dela?

## Fontes

- [Resistance, Path of Exile 2 Wiki](https://poe2wiki.net/wiki/Resistance) e [guia de resistências do Mobalytics](https://mobalytics.gg/poe-2/guides/resistances)
- [Enemy resistances, KQM Theorycrafting Library (Genshin)](https://library.keqingmains.com/combat-mechanics/enemy-mechanics/enemy-resistances) e [guia de redução de resistência](https://hostedgg.com/blog/genshin-impact-resistance-shred-guide)
- [Toughness, Honkai: Star Rail Wiki](https://honkai-star-rail.fandom.com/wiki/Toughness) e [fórmula de dano no Prydwen](https://www.prydwen.gg/star-rail/guides/damage-formula)
- [Elemental damage explained, Mobalytics (Monster Hunter)](https://mobalytics.gg/mhw/guides/elemental-damage-explained) e [fraquezas em Monster Hunter Wilds, GamesRadar](https://gamesradar.com/games/monster-hunter/monster-hunter-wilds-weaknesses-elements-vulnerabilities)
- [Mudança das resistências em Diablo IV, Blizzard Watch](https://blizzardwatch.com/2023/10/16/diablo-4-totally-changing-resistances-armor-work-patch-1-2-season-2)
- [Elementos em Borderlands 3, Windows Central](https://www.windowscentral.com/elemental-damage-types-borderlands-3-explained) e [Electrocute, Borderlands Wiki](https://borderlands.fandom.com/wiki/Electrocute)
- [Rock-scissors-paper design in JRPG-styled games, Game Developer](https://www.gamedeveloper.com/design/rock-scissors-paper-design-in-jrpg-styled-games) e [Hard counters, Wayward Strategy](https://waywardstrategy.com/2021/07/27/hard-counters/)
