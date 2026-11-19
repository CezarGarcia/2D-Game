# Encantados

RPG de ação 2D para navegador. Os seres do folclore brasileiro estão sendo esquecidos e viraram monstros sem cor; você liberta um por capítulo e herda o poder de cada um.

Estado atual: **Capítulo 1 jogável** (etapa 2). Doze fases na Mata Atlântica, com acampamento, inventário, ferreiro, atributos, teia de talentos, feitiços e companheiros. O progresso fica salvo no navegador.

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
| Golpe próprio da arma: defender com o escudo, ou carregar o tiro do arco | botão direito, segurando |
| Esquivar | Espaço ou Shift |
| Feitiços | Q, E e R |
| Habilidade do companheiro | F |
| Poção | 1 ou C |
| Escolher bênção no altar | 1, 2 ou 3, ou clique |
| Pausar | Esc (X abandona a fase) |
| Ligar e desligar o som | M |

Nos menus, as teclas 1 a 6 trocam de aba.

Toda marca vermelha no chão avisa um golpe. Esquivar no último instante é uma esquiva perfeita: o próximo golpe causa 50% a mais. Defender com o escudo no instante do golpe apara: anula o dano e atordoa quem bateu.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes das regras de combate e das fórmulas de progressão |
| `npm run build` | Confere os tipos e gera a versão final em `dist/` |

## Onde está cada coisa

- `docs/gdd/` — documento de design. Comece por `docs/gdd/README.md`.
- `src/data/` — os números e o conteúdo: `balance.ts` (combate), `progression.ts` (XP e dificuldade), `items.ts`, `talents.ts`, `content.ts` (feitiços, companheiros, bênçãos) e `stages.ts` (as fases).
- `src/meta/` — o perfil salvo e as regras fora do combate: atributos, talentos, inventário, ferreiro e recompensas.
- `src/sim/` — regras do combate, sem dependência de tela.
- `src/ui/` — telas de menu em HTML, por cima do jogo.
- `src/art/` — personagens e cenário desenhados por código.
- `src/game/` — cena do Phaser, efeitos, HUD e som.
- `legacy/java/` — o projeto Java original.
