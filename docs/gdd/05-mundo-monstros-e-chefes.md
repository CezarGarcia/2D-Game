# 05 · Mundo, monstros e chefões

## Capítulos

Cada capítulo tem 12 fases: 10 normais, 1 de elite (fase 11) e 1 de chefão (fase 12).

| # | Região | Encantado (chefão) | Elemento ganho | Elite da fase 11 | Novidade das fases |
|---|---|---|---|---|---|
| 1 | Mata Atlântica | Curupira | Natureza | Caipora | Inimigos camuflados, trilhas que mudam |
| 2 | Rios do Norte | Iara | Água | Boto | Correnteza; trechos alagados molham todos |
| 3 | Sertão | Saci | Tempestade | Corpo-Seco | Redemoinhos que arremessam |
| 4 | Cerrado em chamas | Boitatá | Fogo | Mula-sem-Cabeça | Fogo que se espalha pelo capim |
| 5 | Selva Profunda | Mapinguari | Terra | Capelobo | Pouca luz; inimigos blindados |
| 6 | Pampa de lua cheia | Lobisomem | Sombra | Teiniaguá | A lua enche e fortalece os monstros |
| 7 | Pantanal da Cuca | Cuca | Encanto | Pisadeira | Ilusões entre os inimigos |
| 8 | Terra Sem Nome | O Esquecimento | nenhum | Ecos dos sete | Seus feitiços vão sendo apagados |

## Uma fase

- 5 a 7 salas ligadas. Cada sala fecha até os inimigos caírem.
- Tipos de sala: combate, emboscada, corredor de armadilhas, sala do **altar** (escolha 1 de 3 bênçãos que valem até o fim da fase), sala secreta (precisa ser encontrada), sala final.
- As salas de cada fase são fixas, para o tempo no ranking ser comparável. A composição exata de inimigos varia um pouco dentro de uma lista.

### Achados dentro da fase

Bônus que deixam a fase menos previsível. Ninguém precisa deles para vencer. Os números estão em `src/data/loot.ts`; o ouro é sempre uma fração do ouro base da fase, para valer o mesmo em qualquer nível.

- **Baús.** Caem dos monstros e abrem quando o herói encosta. Monstro comum: 2,2% (com um azar acumulado pequeno); campeão: 8%; elite: 30%. O chefão da sala final sempre deixa um, e o grande elite da fase 11 também.

| Baú | Ouro | Além do ouro |
|---|---|---|
| Madeira | 3% | nada (50), fruta (20), efeito (30) |
| Bronze | 6% | nada (25), fruta (15), efeito (45), oferenda de 2 (15) |
| Dourado | 10% | efeito (50), oferenda de 3 (50) |
| Encantado | 20% | oferenda de 3, até Rara |

  - **Fruta do mato:** cura 10% da vida.
  - **Efeito:** dura alguns segundos de luta (o relógio para entre as salas); veja `03-combate-e-feiticos.md`.
  - **Oferenda:** escolha 1 entre 2 ou 3 bênçãos simples (só Comuns; o encantado aceita Raras), que valem até o fim da fase como as do altar. A luta espera a escolha.
  - Baú que fica no chão abre sozinho ao trocar de sala ou ao acabar a fase, e o prêmio vira ouro. Por isso o baú do chefão final aparece já abrindo na vitória.
- **Moedas e orbes.** Elites soltam 3 moedas, campeões 2, e o monstro comum às vezes 1. Às vezes cai um orbe de mana. Moedas saltam, esperam meio segundo e correm para o herói quando ele chega perto; com a sala limpa, todas correm sozinhas.
- **Potes de barro.** De 0 a 2 por sala (nenhum na do chefão); quebram com qualquer golpe ou disparo, que segue em frente, e soltam moedas, às vezes um orbe (de vida, raro).
- **Mãe-do-Ouro.** A bola de fogo que mostra onde há ouro. Às vezes (12% por sala de combate, uma vez por fase) aparece na primeira onda e foge pela sala por 9 s. Quem acerta 4 golpes antes ganha um baú dourado.
- **Desafio do totem.** Às vezes (25% por sala de combate a partir da segunda, uma vez por fase) um totem propõe: vencer a sala tomando no máximo 2 golpes, ou dentro de um tempo (12 s + 2,4 s por inimigo). Cumprido, um baú dourado. Falhar não custa nada.
- O ouro achado aparece no canto da tela durante a fase e entra no resultado com os mesmos multiplicadores do ouro da fase. Vale mesmo na derrota.
- A Torre usa as mesmas regras, andar por andar.
- Em média, com o jogador automático: cerca de 2,5 baús por fase e um terço do ouro base em achados.

## Monstros

### Arquétipos

Todo monstro comum é um destes oito comportamentos, com a aparência e o elemento do capítulo:

| Arquétipo | Comportamento | Como se vence |
|---|---|---|
| **Enxame** | Fraco, vem em grupo, cerca | Dano em área |
| **Bruto** | Lento, golpe pesado com aviso longo, armadura | Esquivar e punir; quebrar armadura |
| **Atirador** | Mantém distância e dispara | Encurtar distância, desviar projéteis |
| **Investida** | Marca uma linha e corre por ela | Sair da linha; fica tonto se bater na parede |
| **Conjurador** | Cria áreas de perigo, invoca | Alvo prioritário |
| **Protetor** | Dá escudo ou cura aos outros | Matar primeiro |
| **Emboscada** | Escondido, enterrado ou camuflado | Atenção ao cenário; o companheiro pode farejar |
| **Explosivo** | Corre até você e explode | Matar à distância ou esquivar no instante |

### Regra visual

Assombros são **cinzentos com um resto de cor**: o olho, uma folha que ainda carregam, a brasa do cabelo. O resto de cor mostra o que eles eram e funciona como ponto fraco em alguns casos.

### Monstros do Capítulo 1

| Monstro | Arquétipo | Detalhe |
|---|---|---|
| Saúva-Cinza | Enxame | Vem em fila; carrega um pedaço de folha ainda verde |
| Queixada Sombria | Investida | Marca a linha, corre e bate na árvore |
| Tronco-Oco | Bruto | Toco de árvore que anda; os olhos brilham dentro do oco |
| Cuspidor | Atirador | Planta carnívora que cospe sementes em arco |
| Urutau | Emboscada | Parece um galho quebrado até abrir os olhos |
| Cogumelo-Estouro | Explosivo | Incha e solta esporos venenosos |

Os outros capítulos seguem o mesmo molde, com 5 a 6 monstros cada. Total previsto: cerca de 45.

### Modificadores de elite

Um elite é um monstro comum, maior, com mais vida e 1 modificador (2 a partir do Capítulo 5, 3 na dificuldade Mítica):

Veloz · Blindado · Vampírico · Explosivo ao morrer · Elemental (aplica o elemento do capítulo) · Duplicador (divide-se em dois ao chegar a 50%) · Regenerador · Refletor (devolve parte do dano de feitiço) · Líder (fortalece quem está perto).

O nome do modificador aparece sobre o elite, para o jogador saber o que esperar.

### Escala de vida e dano

```
vidaDoMonstro(nível) = vidaBase × (1 + 0,18 × nível)
danoDoMonstro(nível) = danoBase × (1 + 0,12 × nível)
```

Elite: vida ×5, dano ×1,5. Chefão: vida calculada para uma luta de 2 a 3 minutos com equipamento no Poder recomendado.

## Chefões

### Estrutura comum

1. **Três fases**, em 100%, 66% e 33% de vida. Cada fase acrescenta um padrão novo.
2. **Postura.** Barra separada da vida. Golpes carregados, aparar e reações enchem a barra; cheia, o chefão fica caído por 4 s e recebe o dobro de dano. É onde a habilidade mais rende.
3. **Janela de punição.** Depois do golpe mais forte de cada padrão, o chefão fica exposto por 2 a 3 s.
4. **Truque da lenda.** Uma mecânica que só ele tem, tirada da história.
5. **Fúria** aos 4 minutos.
6. **Recompensa na primeira vitória:** o elemento, o Supremo, 1 ponto de talento, 1 Lágrima de Encantado. Depois disso, tabela de drops com dois ou três únicos.

### Curupira (Capítulo 1), em detalhe

O guardião da mata tem cabelo de fogo e os pés virados para trás. Corrompido, ele está cinzento; só o cabelo ainda queima em cor.

**Arena:** clareira redonda cercada de árvores.

**Truque da lenda:** as pegadas dele apontam para o lado contrário de onde ele foi. Quem segue o rastro olha para o lado errado.

| Fase | Padrões |
|---|---|
| 1 (100%) | **Rastro Falso:** some na mata e deixa pegadas brilhando; ataca vindo do lado oposto ao que elas indicam. **Assobio:** três cópias aparecem; só a verdadeira tem os pés virados. Acertar a errada solta espinhos. |
| 2 (66%) | Mantém os anteriores. **Mata Viva:** raízes brotam em linhas marcadas no chão. **Estouro:** três queixadas atravessam a arena por linhas marcadas. |
| 3 (33%) | Monta num queixada. **Investidas em série:** três corridas seguidas; a arena encolhe com espinhos nas bordas. |

**Janela de punição:** depois da terceira investida ele tropeça nos próprios pés e fica 3 s exposto.

**O que ensina:** ler o aviso em vez de reagir ao que parece óbvio. É o tutorial do jogo inteiro.

### Os outros, em uma linha

| Chefão | Truque da lenda |
|---|---|
| **Iara** | Canta e puxa você para a água; debaixo d'água a esquiva é mais lenta. Aparar o canto no ritmo certo quebra a postura. |
| **Saci** | Rouba um dos seus feitiços e usa contra você até levar um golpe. Anda dentro de um redemoinho e some. |
| **Boitatá** | Cobra de fogo que ocupa a arena; o corpo dela é o cenário. Onde ela passa o capim queima. |
| **Mapinguari** | Coberto de couraça; só toma dano na boca da barriga, que abre quando ele ruge. Exige quebrar armadura. |
| **Lobisomem** | Começa homem e fraco. A lua enche durante a luta; quanto mais demora, mais rápido ele fica. |
| **Cuca** | Põe você para dormir: a luta continua dentro do sonho, com as regras trocadas (seus botões de feitiço embaralhados). |
| **O Esquecimento** | Apaga seus feitiços um a um. Cada Encantado libertado aparece para devolver um. |

Os Encantados não são mortos. Ao vencer, a cor volta e eles passam para o seu lado.
