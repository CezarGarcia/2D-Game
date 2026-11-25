# Encantados

RPG de ação 2D para navegador. Os seres do folclore brasileiro estão sendo esquecidos e viraram monstros sem cor; você liberta um por capítulo e herda o poder de cada um.

Estado atual: **campanha completa jogável** (etapa 3). Oito capítulos e 96 fases, do Curupira ao Esquecimento, com final; seis armas, sete elementos e 35 feitiços com reações entre eles, 16 companheiros, conjuntos, gemas, itens com nome e a Torre dos Cem Andares. Acampamento com inventário, ferreiro, atributos e teia de talentos. O progresso fica salvo no navegador; a parte online (contas, rankings, mercado) vem depois.

Em andamento, a **etapa 4** (`docs/gdd/09` e `10`): um modo rejogável de sessão curta, o Sonho. As três primeiras fases dela já estão no jogo:

- Almanaque do Folclore com conquistas e bestiário, Terreiro de treino com medidor de dano, Caçada automática nas fases com 3 estrelas, filtro de saque, builds salvas e troca de missão do dia.
- Bênçãos com padrinho: 64 bênçãos de altar (8 de cada Encantado e 8 neutras), sinergia com 3, 5 e 7 bênçãos do mesmo padrinho, Despertar das bênçãos que chegam ao máximo e Compadrios entre dois padrinhos. Na fase, Esc pausa e mostra as sinergias acesas.

## Rodar

Precisa de Node 20 ou mais novo.

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

## Controles

| Ação | Tecla |
|---|---|
| Mover | WASD ou setas |
| Mirar | mouse |
| Atacar | clique esquerdo, ou segurar |
| Golpe próprio da arma: defender com o escudo (facão), carregar o tiro (arco), golpe carregado que racha a armadura (borduna) ou estocada que atravessa a fila (zagaia) | botão direito, segurando |
| Esquivar | Espaço ou Shift |
| Feitiços | Q, E e R |
| Habilidade do companheiro | F |
| Chamar o Encantado libertado (Supremo), quando a carga enche | T |
| Poção | 1 ou C |
| Escolher bênção no altar | 1 a 4, ou clique |
| Pausar | Esc (X abandona a fase) |
| Ligar e desligar o som | M |
| Caçada automática: mudar a velocidade (1x, 2x, 3x) | V |
| Terreiro de treino: zerar o medidor de dano | Z |

Nos menus, as teclas 1 a 9 trocam de aba (a 8 abre o Diário: missões do dia, descanso e expedições; a 9, o Almanaque: conquistas, bestiário e itens com nome).

Na tela do herói, o botão do alvo abre o **Terreiro de treino** e o da prancheta, as **builds salvas**; o funil na mochila é o **filtro de saque**. No mapa, uma fase com 3 estrelas ganha o botão **Automático** embaixo do Jogar.

As peixeiras não têm golpe próprio: depois de uma esquiva perfeita o próximo golpe é crítico. O cajado ataca de longe com o elemento do último feitiço usado.

Toda marca vermelha no chão avisa um golpe. Esquivar no último instante é uma esquiva perfeita: o próximo golpe causa 50% a mais. Defender com o escudo no instante do golpe apara: anula o dano e atordoa quem bateu.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes das regras de combate e das fórmulas de progressão |
| `npx vite-node tests/calib.ts 24 35` | Calibração: um jogador automático que erra como gente joga as fases indicadas |
| `npm run build` | Confere os tipos e gera a versão final em `dist/` |

## Onde está cada coisa

- `docs/gdd/` — documento de design. Comece por `docs/gdd/README.md`.
- `src/data/` — os números e o conteúdo: `balance.ts` (combate), `progression.ts` (XP e dificuldade), `items.ts`, `talents.ts`, `content.ts` (feitiços, companheiros, bênçãos) e `stages.ts` (as fases).
- `src/meta/` — o perfil salvo e as regras fora do combate: atributos, talentos, inventário, ferreiro e recompensas. Também os contadores de longo prazo (`life.ts`) e as conquistas (`achievements.ts`).
- `src/data/achievements.ts`, `src/data/lore.ts` e `src/data/training.ts` — as conquistas, os textos do Almanaque e a fase do Terreiro.
- `src/data/bestiary.ts` e `src/data/tower.ts` — monstros e chefes dos capítulos 3 a 8, e a Torre.
- `src/sim/` — regras do combate, sem dependência de tela: `archetypes.ts` (os oito comportamentos de monstro), `bosses.ts` (chefes dos capítulos 3 a 8), `status.ts` (efeitos e reações), `spells.ts` (feitiços novos e aliados), `terrain.ts` (o que cada capítulo muda).
- `src/ui/` — telas de menu em HTML, por cima do jogo.
- `src/art/` — personagens e cenário desenhados por código. Cada capítulo de 3 a 8 tem o seu arquivo (`ch3.ts`…`ch8.ts`), gerado só quando uma fase dele começa; o contrato está em `src/art/kit.ts` e a lista de criaturas em `docs/arte/etapa3-criaturas.md`.
- `src/game/` — cena do Phaser, efeitos, HUD e som. As molduras do HUD da fase são geradas em `hudart.ts`.
- `src/sim/bot.ts` — o jogador automático: calibra as fases nos testes e guia o herói na Caçada automática.
- `legacy/java/` — o projeto Java original.
