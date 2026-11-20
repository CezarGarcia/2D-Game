/**
 * Contrato entre os arquivos de arte de cada capítulo e o resto do jogo.
 * Um arquivo de capítulo (ch3.ts … ch8.ts) exporta `ART: ChapterArt`: as folhas de sprites dos bichos,
 * uma função que as desenha usando o `Kit`, o chão da arena, a moldura e o mapa do capítulo.
 * A arte de um capítulo só é gerada quando uma fase dele começa (veja `ensureChapterArt` em bake.ts).
 */
export type Ctx = CanvasRenderingContext2D;

export interface Sheet {
  key: string;
  cellW: number; cellH: number;
  /** Posição dos pés dentro da célula. */
  ox: number; oy: number;
  scale: number;
  /** Nome da animação → número de quadros. Os quadros se chamam `nome0`, `nome1`… */
  anims: Record<string, number>;
  /** Bicho que voa: a cena o desenha acima da sombra. */
  fly?: boolean;
}

/**
 * Animações de passagem: `k` vai de 0 a 1 inclusive (primeiro quadro = começo do gesto, último = golpe).
 * As outras são ciclos: `k` vai de 0 a quase 1 e o último quadro emenda no primeiro.
 *
 * Nomes padrão (a cena escolhe o quadro só por eles):
 * - monstro comum: `move` (ciclo, andando ou voando), `atk` (passagem: aviso → golpe/disparo),
 *   `hide` (passagem, só para emboscada: 0 = escondido, 1 = revelado).
 * - chefe: `idle`, `move` (ciclos), `atk`, `cast` (passagens), `down` (ciclo: atordoado/exposto),
 *   `special` (ciclo opcional, o truque da lenda).
 * - companheiro: `idle`, `walk` (ciclos) e `act` (passagem: a habilidade). Quem voa usa `fly` no lugar de `idle` e `walk`.
 */
export const RAMP_ANIMS = ['atk', 'cast', 'hide', 'act'];

export interface Kit {
  /** Desenha todos os quadros da folha. `draw` recebe o nome da animação e `k` (0 a 1). Desenhe virado para a direita, pés em (0,0). */
  creature(s: Sheet, draw: (c: Ctx, anim: string, k: number) => void): void;
  /** Textura simples de `w`×`h` pixels lógicos (projéteis, efeitos, objetos de cenário). */
  image(key: string, w: number, h: number, draw: (c: Ctx) => void): void;
}

export interface ChapterArt {
  chapter: number;
  sheets: Record<string, Sheet>;
  bake(kit: Kit): void;
  /** Chão da arena em 1280×720. `variant` de 0 a 2. A área jogável é x 120–1160, y 150–640: só detalhe de chão nela. */
  ground(c: Ctx, W: number, H: number, variant: number, seed: number): void;
  /** Moldura desenhada por cima de tudo (galhos, pedras, bordas), com o centro transparente. */
  canopy(c: Ctx, W: number, H: number, seed: number): void;
  /** Mapa ilustrado do capítulo; `points` são as 12 fases em pixels do canvas, na ordem. */
  map(c: Ctx, w: number, h: number, points: { x: number; y: number }[]): void;
}
