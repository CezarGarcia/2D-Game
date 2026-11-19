# Encantados

RPG de ação 2D para navegador. Os seres do folclore brasileiro estão sendo esquecidos e viraram monstros sem cor; você liberta um por capítulo e herda o poder de cada um.

Estado atual: **protótipo de sensação** (etapa 1). Uma sala da Mata Atlântica com três ondas de inimigos.

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
| Atacar (sequência de 3 golpes) | clique esquerdo, ou segurar |
| Esquivar | Espaço ou Shift |
| Dardo de Espinho | Q ou clique direito |
| Recomeçar depois de vencer ou cair | R |
| Ligar e desligar o som | M |

Toda marca vermelha no chão avisa um golpe. Esquivar no último instante é uma esquiva perfeita: o próximo golpe causa 50% a mais.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes das regras de combate e das fórmulas de progressão |
| `npm run build` | Confere os tipos e gera a versão final em `dist/` |

## Onde está cada coisa

- `docs/gdd/` — documento de design. Comece por `docs/gdd/README.md`.
- `src/data/balance.ts` — todos os números do combate. É o arquivo para mexer ao ajustar a sensação.
- `src/sim/` — regras do combate, sem dependência de tela.
- `src/art/` — personagens e cenário desenhados por código.
- `src/game/` — cena do Phaser, efeitos, HUD e som.
- `legacy/java/` — o projeto Java original.
