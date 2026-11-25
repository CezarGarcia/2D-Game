/** Tipos da simulação de combate. */
import type { EliteMod, EnemyKind } from '../data/balance';
import type { BlessingId, CompanionId, ElementId, SpellId } from '../data/content';
import type { BuffId, ChestTier } from '../data/loot';
import type { RoomDef } from '../data/stages';
import type { HeroStats } from '../meta/stats';

export interface Input {
  /** Direção de movimento, de -1 a 1 em cada eixo. */
  mx: number; my: number;
  /** Ponto do mundo para onde o jogador mira. */
  aimX: number; aimY: number;
  attackPressed: boolean; attackHeld: boolean;
  /** Golpe próprio da arma: defender (escudo) ou carregar o tiro (arco). */
  altHeld: boolean;
  dodgePressed: boolean;
  /** Feitiços dos espaços Q, E e R. */
  spell: [boolean, boolean, boolean];
  petPressed: boolean;
  potionPressed: boolean;
  /** Chamar o Encantado (Supremo), quando a carga está cheia. */
  supremoPressed: boolean;
}

export const NO_INPUT: Input = {
  mx: 0, my: 0, aimX: 0, aimY: 0, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false,
  spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false,
};

export type Telegraph =
  | { shape: 'circle'; x: number; y: number; r: number; t: number; dur: number }
  | { shape: 'line'; x: number; y: number; x2: number; y2: number; w: number; t: number; dur: number };

export type PlayerState = 'idle' | 'attack' | 'dodge' | 'hurt' | 'dead' | 'block' | 'charge';

export interface Player {
  x: number; y: number; vx: number; vy: number; kx: number; ky: number;
  aim: number; facing: 1 | -1;
  hp: number; mana: number;
  state: PlayerState; stateT: number;
  combo: number; comboT: number; hitDone: boolean;
  dodgeCharges: number; dodgeTimer: number; iframes: number; hurtInv: number;
  /** Recarga restante e recarga total de cada espaço de feitiço. */
  cds: [number, number, number]; cdMax: [number, number, number];
  perfectT: number; perfectUsed: boolean;
  dx: number; dy: number; rolled: number[];
  moving: boolean; walk: number;
  bufAttack: number; bufDodge: number; bufSpell: [number, number, number];
  /** Tempo desde que começou a defender. */
  blockT: number;
  /** Carga do tiro do arco, de 0 a 1. */
  charge: number; shotCd: number;
  contraT: number; presaT: number; cascaT: number; slowT: number;
  stacks: number; stackT: number; jabutiUsed: boolean;
  potions: number; potionCd: number;
  /** Amparo: o próximo golpe desta sala não causa dano. */
  shield: boolean;
  novaT: number;
  /** Carga do Supremo, de 0 a 100. */
  supremo: number;
  /** Dentro de uma poça. */
  inPuddle: boolean;
  /** Dano da Correnteza enquanto o herói desliza (0 = esquiva comum). */
  surf: number;
  /** Tipo do deslize em andamento: esquiva, Correnteza ou Pé-de-Vento. */
  surfKind: 'dodge' | 'correnteza' | 'pedevento';
  /** Próximo golpe de arma é crítico (peixeiras depois da esquiva perfeita, Passo nas Sombras). */
  critNext: boolean;
  /** Pele de Pedra, forma de lobo (Supremo da Sombra), chamas em órbita. */
  stoneT: number; wolfT: number; orbT: number; orbHit: Record<number, number>; orbPower: number;
  /** Último elemento usado num feitiço (o cajado dispara com ele). */
  lastElement: ElementId;
  /** Efeitos de estado no herói, vindos dos monstros. */
  burnT: number; burnTick: number; poisonT: number; poisonTick: number; curseT: number; crackT: number; confuseT: number; wetT: number; sleepT: number;
  /** Feitiços apagados (segundos; Infinity até o fim da sala) e o roubado pelo Saci. */
  erased: [number, number, number];
  stolen: number;
  /** Sonho da Cuca: os botões dos feitiços trocam de lugar. */
  dreamT: number; spellMap: [number, number, number];
  /** Agarrado (Corpo-Seco, Capelobo): não age. */
  heldT: number;
  /** Golpes desde o último tremor (conjunto do Seringueiro) e tempo de luta (conjunto da Lua). */
  hitCount: number; fightT: number; frenzyT: number;
  /** Bênçãos: chão andado desde o último fogo do Rastro Aceso; pressa depois da esquiva; abates seguidos da Lua Ventosa e o tempo que falta; o fôlego da Iara já usado nesta sala. */
  trailD: number; hasteT: number; windStacks: number; windT: number; secondWind: boolean;
}

export type EnemyState =
  | 'spawn' | 'chase' | 'windup' | 'recover' | 'stagger' | 'roam' | 'aim' | 'charge' | 'stunned' | 'idle' | 'spit' | 'exposed'
  | 'perched' | 'reveal' | 'hover' | 'dash' | 'fuse' | 'skid' | 'tired' | 'call'
  | 'vanish' | 'cast' | 'volley' | 'roar' | 'downed' | 'clone'
  | 'leap' | 'hop' | 'buried' | 'sting' | 'tail' | 'dive' | 'sing';

export interface Enemy {
  id: number; kind: EnemyKind; elite: boolean; champion: boolean; mods: EliteMod[];
  x: number; y: number; kx: number; ky: number;
  hp: number; maxHp: number; radius: number;
  /** Multiplicadores de dano, velocidade e tempo de aviso deste inimigo. */
  dmg: number; speedMult: number; windupMult: number;
  state: EnemyState; stateT: number;
  facing: 1 | -1; dirX: number; dirY: number;
  tele: Telegraph | null;
  cd: number; flag: boolean; count: number;
  flash: number; sinceHit: number;
  poisonT: number; poisonTick: number; slowT: number; rootT: number; stunT: number;
  /** Molhado, marcado pela arara, preso numa bolha. */
  wetT: number; markT: number; bubbleT: number;
  /** Protegido por um Caramujo-Concha próximo (recalculado a cada passo). */
  guarded: boolean;
  /** Efeitos de elemento e de controle (segundos). */
  chargeT: number; burnT: number; burnTick: number; crackT: number; curseT: number; curseBonus: number; confuseT: number;
  sleepT: number; charmT: number; blindT: number; frogT: number; fearT: number; silenceT: number;
  /** Virou pedra (reação Estátua): o próximo golpe causa o dobro. */
  stone: boolean;
  /** Fogo-fátuo da reação: ao cair, a maldição pula para o vizinho. */
  wisp: boolean;
  /** Ilusão do Pantanal: some com um golpe e não conta para limpar a sala. */
  illusion: boolean;
  /** Golpes recebidos (o Saci devolve o feitiço depois de alguns). */
  hits: number;
  /** Memória de curto prazo dos chefes (valores por nome). */
  mem: Record<string, number>;
  walk: number; moving: boolean;
  /** Tempo restante atacando o companheiro em vez do herói. */
  aggroPet: number;
  /** Não pode ser atingido nem mirado (urutau camuflado, chefão sumido). */
  hidden: boolean;
  /** Cópia ilusória do Curupira. */
  fake: boolean;
  /** Dados de chefão. */
  phase: number; posture: number; pattern: string; step: number; calls: number;
  ax: number; ay: number;
}

export type ProjectileKind = 'thorn' | 'arrow' | 'cipo' | 'seed' | 'ethorn' | 'stampede' | 'jet' | 'bubble' | 'sting' | 'glob' | 'wall'
  /** Projéteis de feitiço genéricos (o feitiço em `spell`) e disparos de monstros e chefes (`tex`). */
  | 'spell' | 'staff' | 'eproj' | 'elob' | 'spin';

export interface Projectile {
  id: number; kind: ProjectileKind;
  x: number; y: number; vx: number; vy: number; dist: number; range: number;
  damage: number; pierce: boolean; hit: number[]; charged: boolean;
  /** Projéteis em arco (semente do Cuspidor). */
  sx: number; sy: number; tx: number; ty: number; t: number; dur: number;
  tele: Telegraph | null;
  owner: number;
  /** Feitiço que criou (spell), elemento (staff, eproj), textura para desenhar. */
  spell?: SpellId;
  element?: ElementId | null;
  tex?: string;
  /** Saltos restantes (Faísca). */
  jumps?: number;
}

/** Golpe com atraso marcado no chão que não pertence a um inimigo vivo. */
export interface Hazard {
  id: number;
  kind: 'blast' | 'roots' | 'lane' | 'burst' | 'jet' | 'dive' | 'bolt' | 'fire' | 'shadow' | 'quake' | 'sleep' | 'spell';
  /** Elemento aplicado ao herói (golpes de inimigo) ou aos inimigos (golpes do herói, kind 'spell'). */
  element?: ElementId | null;
  /** Efeito extra quando estoura. */
  extra?: { stun?: number; sleep?: number; erase?: boolean; spell?: SpellId };
  tele: Telegraph;
  damage: number;
  slow: number;
}

/** Efeito que fica no chão por um tempo. */
export interface Zone {
  id: number;
  kind: 'sementes' | 'broto' | 'cloud' | 'chuva' | 'puddle' | 'whirl' | 'pop'
    | 'fire' | 'curse' | 'void' | 'redemoinho' | 'coivara' | 'vapor' | 'dust' | 'trovao' | 'explosao' | 'borbulhante' | 'tornado' | 'firelane';
  /** Linha (Coivara): ponto final. */
  x2?: number; y2?: number;
  /** Quem criou: o herói (fere inimigos) ou um inimigo (fere o herói). */
  hostile?: boolean;
  x: number; y: number; r: number; t: number; dur: number; tick: number; power: number;
}

export interface Companion {
  id: CompanionId;
  x: number; y: number;
  hp: number; maxHp: number;
  state: 'follow' | 'attack' | 'pounce' | 'down';
  stateT: number;
  cd: number; atkCd: number; tauntT: number;
  facing: 1 | -1; walk: number; moving: boolean;
  target: number; flash: number;
  sx: number; sy: number;
}

/** Aliados temporários: lobos da Matilha, cópia do Espelho, Estaca, Nuvem Carregada. */
export interface Ally {
  id: number; kind: 'wolf' | 'decoy' | 'turret' | 'cloud';
  x: number; y: number; hp: number; maxHp: number; t: number; dur: number; cd: number;
  facing: 1 | -1; target: number; walk: number; moving: boolean; power: number;
}

/** Redemoinho de poeira do Sertão: anda pela sala e arremessa quem pega. */
export interface Devil { id: number; x: number; y: number; vx: number; vy: number; r: number; t: number; dur: number }
/** Touceira de capim (Cerrado): pega fogo, queima por um tempo e espalha. */
export interface Grass { x: number; y: number; r: number; burnT: number; burnt: boolean }
/** Bloco da Muralha. */
export interface WallBlock { x: number; y: number; r: number; t: number }

/** Baú no chão. Salta de onde o monstro caiu (sx, sy) até (x, y) e abre quando o herói encosta. */
export interface Chest { id: number; tier: ChestTier; x: number; y: number; sx: number; sy: number; t: number; /** Tempo desde que abriu (−1 = fechado). */ open: number }
/** Moeda ou orbe solto: salta, espera um instante e corre para o herói. */
export interface Pickup { id: number; kind: 'moeda' | 'vida' | 'mana'; x: number; y: number; vx: number; vy: number; t: number; value: number }
/** Efeito de baú ativo. `value` guarda o que sobra da carapaça; `el`, o elemento do Golpe Elemental. */
export interface Buff { id: BuffId; t: number; dur: number; value: number; el?: ElementId }
/** Pote de barro: quebra com um golpe. */
export interface Pot { id: number; x: number; y: number }
/** Mãe-do-Ouro: foge pela sala até o tempo acabar. */
export interface Wisp { id: number; x: number; y: number; vx: number; vy: number; t: number; dur: number; hits: number; need: number; cd: number; flash: number }
/** Desafio da sala atual. */
export interface Challenge { kind: 'intocado' | 'ligeiro'; limit: number; hits0: number; /** Tempo de luta no começo da sala. */ t0: number; state: 'ativo' | 'vencido' | 'perdido'; x: number; y: number }
/** Achados da fase: ouro já recolhido, baús abertos e a sorte (semente própria, para não mexer nos sorteios do combate). */
export interface LootState { gold: number; chests: number; since: number; wisps: number; challenges: number; rng: number }

export type SimEventType =
  | 'swing' | 'hit' | 'kill' | 'hurt' | 'death' | 'revive' | 'dodge' | 'perfect' | 'parry' | 'block' | 'cast' | 'shoot' | 'spawn' | 'wave'
  | 'roomClear' | 'roomStart' | 'altar' | 'blessing' | 'win' | 'lose'
  | 'bite' | 'charge' | 'crash' | 'spit' | 'splat' | 'slam' | 'telegraph' | 'reveal' | 'explode' | 'hazard'
  | 'sementes' | 'cipo' | 'heal' | 'potion' | 'pet' | 'petHurt' | 'petDown' | 'taunt'
  | 'phase' | 'vanish' | 'appear' | 'footprints' | 'whistle' | 'cloneBurst' | 'downed' | 'call' | 'jabuti' | 'shrink' | 'enrage' | 'stack'
  | 'supremo' | 'brotar' | 'nova' | 'shield' | 'mark' | 'bubble' | 'splash' | 'dive' | 'sing' | 'wave' | 'onda' | 'correnteza' | 'pop' | 'freecast'
  | 'reaction' | 'spark' | 'status' | 'zap' | 'blink' | 'erase' | 'restore' | 'steal' | 'dream' | 'help' | 'grab' | 'ignite' | 'moon' | 'transform' | 'petAct' | 'heavy' | 'thrust' | 'devil' | 'roar' | 'miss'
  | 'chest' | 'chestOpen' | 'offer' | 'pickup' | 'buff' | 'buffEnd' | 'guard' | 'pot' | 'wisp' | 'challenge';

export interface SimEvent {
  type: SimEventType;
  x: number; y: number;
  value?: number; crit?: boolean; kind?: string; id?: number; ang?: number; armored?: boolean; x2?: number; y2?: number; text?: string;
  /** Elemento do golpe (evento `hit`). No evento `kill`, `value` diz quem caiu: 0 comum, 1 campeão, 2 elite, 3 chefe. */
  el?: ElementId;
}

export interface StageConfig {
  stageId: string;
  /** Nível dos monstros. */
  level: number;
  rooms: RoomDef[];
  stats: HeroStats;
  seed: number;
  /** Partida com ranking (Torre): o bônus de conhecer o inimigo não vale. */
  ranked?: boolean;
  /** O Sonho: o que o herói traz do nó anterior, no lugar de começar inteiro. */
  carry?: Carry;
  /** Multiplicadores de vida e de dano dos monstros (maldições de Causo e, depois, os Presságios). */
  foes?: { hp: number; damage: number };
}

/** O que passa de uma sala do Sonho para a seguinte. As bênçãos já têm que estar contadas em `stats`. */
export interface Carry {
  blessings: BlessingId[];
  /** Fração da vida máxima com que o herói entra. */
  hpFrac: number;
  potions: number;
  /** Altares seguidos só com bênçãos comuns. */
  altarDry: number;
  /** Quedas que ainda permitem continuar. */
  revives: number;
  /** Carga do Supremo, de 0 a 100. */
  supremo: number;
}

export type Phase = 'fight' | 'cleared' | 'altar' | 'dead' | 'won' | 'lost';

export interface Arena { x0: number; y0: number; x1: number; y1: number }

export interface World {
  cfg: StageConfig;
  stats: HeroStats;
  time: number; tick: number;
  phase: Phase;
  room: number;
  arena: Arena;
  player: Player;
  pet: Companion | null;
  enemies: Enemy[];
  projectiles: Projectile[];
  hazards: Hazard[];
  zones: Zone[];
  events: SimEvent[];
  wave: number; waveTimer: number;
  nextId: number; rng: number;
  /** Multiplicadores pela diferença de nível entre o herói e a fase. */
  dealt: number; taken: number;
  blessings: BlessingId[];
  /** Bênçãos oferecidas na sala de altar atual. */
  altar: BlessingId[] | null;
  /** Altares seguidos só com bênçãos comuns (azar com limite: o próximo garante uma rara). */
  altarDry: number;
  revives: number; deaths: number; deadT: number;
  kills: number; perfects: number; hitsTaken: number; roomsCleared: number;
  /** Tempo de luta contra o chefão, para a fúria. */
  bossTime: number;
  spells: (SpellId | null)[];
  /** Poças da sala: molham quem pisa e atrasam o herói. */
  puddles: { x: number; y: number; r: number }[];
  /** Correnteza da sala, em pixels por segundo (0 = sem correnteza). */
  current: number;
  supremo: ElementId | null;
  /** O chão está alagado (fase final da Iara): todos ficam Molhados e o herói anda mais devagar. */
  flooded: boolean;
  allies: Ally[];
  devils: Devil[];
  grass: Grass[];
  walls: WallBlock[];
  /** Lua da sala (Pampa), de 0 a 1. */
  moon: number;
  /** Tempo até o próximo feitiço apagado (Terra Sem Nome). */
  eraseT: number;
  /** Rastro da cabeça do Boitatá: o corpo segue por ele. */
  trail: { x: number; y: number }[];
  /** Itens afanados pelo graxaim nesta fase. */
  steals: number;
  /** Nível dos monstros da sala atual (a Torre muda a cada andar). */
  level: number;
  chests: Chest[];
  pickups: Pickup[];
  buffs: Buff[];
  pots: Pot[];
  wisp: Wisp | null;
  challenge: Challenge | null;
  /** Bênçãos oferecidas por um baú. Enquanto houver escolha, a luta espera. */
  offer: BlessingId[] | null;
  loot: LootState;
}
