/**
 * O Sonho (docs/gdd/09): o modo de sessão curta. Aqui ficam os números, o gerador do mapa de uma noite
 * e a fase de uma sala só de cada nó. As regras que mexem no perfil estão em src/meta/dream.ts.
 *
 * Uma noite tem trechos; cada trecho é um mapa em passos, da esquerda para a direita, que acaba num chefe.
 * Tudo sai da semente da noite: a mesma semente e as mesmas liberações dão a mesma noite.
 */
import { ARENA, type EliteMod, type EnemyKind, type SpawnDef } from './balance';
import { MONSTERS } from './bestiary';
import type { ElementId } from './content';
import { expeditionPool } from './daily';
import { CHALLENGE } from './loot';
import { makeRng, pick, type Rng } from './rng';
import { CHAPTERS, TERRAIN, wave, type RoomDef, type StageDef } from './stages';
import { isMonster } from './balance';

export type NodeKind = 'combate' | 'elite' | 'altar' | 'feira' | 'causo' | 'fonte' | 'provacao' | 'chefe' | 'roda';

/** Nós que são uma tela entre as salas, e não uma sala. */
export function isPanelNode(kind: NodeKind): boolean { return kind === 'feira' || kind === 'fonte' || kind === 'causo' || kind === 'roda'; }
export type TrialKind = 'ligeiro' | 'intocado' | 'tres';

export const NODE_INFO: Record<NodeKind, { name: string; icon: string; desc: string }> = {
  combate: { name: 'Combate', icon: 'dano', desc: 'Uma sala de monstros do capítulo.' },
  elite: { name: 'Elite', icon: 'elite', desc: 'Um elite com modificadores. Quem vence escolhe um amuleto.' },
  altar: { name: 'Altar', icon: 'altar', desc: 'Escolha uma de três bênçãos deste padrinho.' },
  feira: { name: 'Feira', icon: 'vender', desc: 'Bênçãos, amuletos e cura, pagos em vinténs.' },
  causo: { name: 'Causo', icon: 'credito', desc: 'Um encontro do folclore, com uma escolha.' },
  fonte: { name: 'Fonte', icon: 'cura', desc: 'Cura parte da vida e devolve as poções, ou fortalece uma bênção.' },
  provacao: { name: 'Provação', icon: 'caveira', desc: 'Uma sala com regra própria. Vencer paga muitas Lembranças; perder custa metade da vida.' },
  chefe: { name: 'Chefe', icon: 'coroa', desc: 'O fim do trecho.' },
  roda: { name: 'Roda do Saci', icon: 'roda', desc: 'O Saci deve uma. Gire a roda: três iguais numa linha pagam.' },
};

export const TRIAL_INFO: Record<TrialKind, { name: string; desc: string }> = {
  ligeiro: { name: 'Contra o relógio', desc: 'Limpe a sala antes de o tempo acabar.' },
  intocado: { name: 'Sem levar pancada', desc: 'Limpe a sala tomando no máximo 3 golpes.' },
  tres: { name: 'Três castigos', desc: 'Um elite com três modificadores de uma vez.' },
};

/** Números do Sonho. */
export const DREAM = {
  /** Fase da campanha que abre o Sonho. */
  unlock: '2-12',
  trechos: 3,
  /** Passos de um trecho: começo, cinco passos do meio, descanso e chefe. */
  steps: 8,
  /** Passo em que todos os nós são altares: todo caminho passa por um. */
  altarStep: 2,
  /** Peso de cada tipo de nó nos passos livres do meio. */
  weights: { combate: 46, elite: 12, altar: 18, causo: 14, provacao: 5, feira: 5, roda: 10 } as Record<string, number>,
  /** Nível dos monstros: o do herói menos `levelBelow`, mais `levelPerTrecho` a cada trecho. */
  levelBelow: 1, levelPerTrecho: 2.5,
  /** Tamanho das ondas em relação a uma expedição do mesmo nível, e quanto cresce por trecho. */
  budget: 1.05, budgetPerTrecho: 0.4,
  /** Vinténs por nó vencido, e por baú aberto dentro dele. */
  vintem: { combate: 16, elite: 32, provacao: 30, chefe: 48, perChest: 5 } as Record<string, number>,
  /** Lembranças por nó vencido. */
  memories: { combate: 4, elite: 8, provacao: 25, chefe: 15 } as Record<string, number>,
  /** Fração da experiência e do ouro de uma fase do nível do herói, por trecho completo. */
  campaignShare: 0.6,
  /** Fonte: cura esta fração da vida. Chefe vencido: cura esta. */
  fountainHeal: 0.4, bossHeal: 0.3,
  /** Provação perdida: sobra esta fração da vida que o herói tinha. */
  trialFail: 0.5,
  /** Preços da Feira, por raridade da bênção (1 a 3), e dos serviços. */
  price: { blessing: [0, 32, 52, 80], heal: 26, reroll: 12, remove: 20 },
  feiraHeal: 0.4,
  /** Roda do Saci. */
  roda: {
    /** Custo de cada giro pago, em ordem, e quantos giros de graça toda Roda tem. */
    costs: [20, 40, 80], free: 1,
    /** Padrinhos na grade, Pulos de toda Roda, e o peso de cada símbolo. */
    patrons: 3, pulos: 1,
    weights: { patron: 8, gorro: 5, vintem: 9, olho: 6 },
    /** Cada bênção de um padrinho aumenta o peso do símbolo dele. */
    buildPull: 0.15,
    /** Linha de vinténs paga isto; linha de Olhos amaldiçoa assim até o fim do trecho (e dobra as Lembranças dele). */
    vintemPay: 80, curse: { hp: 0.2, damage: 0.1 },
    /** Giros seguidos sem linha até o próximo ser garantido, e linhas de um mesmo padrinho para a sorte grande. */
    pityAfter: 3, jackpotLines: 4,
  },
};

export interface DreamNode {
  id: number;
  /** Passo (coluna do mapa) e faixa (linha, de 0 a 2; pode ser meio-termo). */
  step: number; row: number;
  kind: NodeKind;
  /** Nós do passo seguinte ligados a este. */
  next: number[];
  /** Altar: de que padrinho. Provação: qual. Chefe: quem. Causo: qual (escolhido ao entrar, não aqui). */
  patron?: ElementId;
  trial?: TrialKind;
  boss?: EnemyKind;
}

export interface Trecho { index: number; chapter: number; level: number; nodes: DreamNode[] }
export interface Night { seed: number; trechos: Trecho[] }

export interface NightSetup {
  /** Capítulos já vencidos (cenário e monstros) e padrinhos já libertados (altares). */
  chapters: number[];
  patrons: ElementId[];
  /** Nível do herói. */
  level: number;
  /** Primeira noite: um trecho só. */
  short?: boolean;
  /** O Saci já foi libertado: a Roda dele pode aparecer no mapa. */
  roda?: boolean;
  /** Presságio Sem Padrinho: o passo de altares vira combate. */
  noAltarStep?: boolean;
}

/** Grande elite (fase 11) e Encantado (fase 12) de cada capítulo. */
export const DREAM_BOSSES: Record<number, [EnemyKind, EnemyKind]> = {
  1: ['caipora', 'curupira'], 2: ['boto', 'iara'], 3: ['corposeco', 'saci'], 4: ['mula', 'boitata'],
  5: ['capelobo', 'mapinguari'], 6: ['teiniagua', 'lobisomem'], 7: ['pisadeira', 'cuca'], 8: ['ecos', 'esquecimento'],
};

function hash(text: string): number {
  let v = 2166136261;
  for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
  return v >>> 0;
}

function weightedKind(rng: Rng, allow: (k: string) => boolean): NodeKind {
  const keys = Object.keys(DREAM.weights).filter(allow);
  let roll = rng() * keys.reduce((s, k) => s + DREAM.weights[k], 0);
  for (const k of keys) { roll -= DREAM.weights[k]; if (roll <= 0) return k as NodeKind; }
  return 'combate';
}

/** Capítulos dos trechos: em ordem crescente, sem repetir enquanto houver capítulo vencido sobrando. */
function pickChapters(rng: Rng, chapters: number[], n: number): number[] {
  const pool = [...new Set(chapters)].sort((a, b) => a - b), out: number[] = [];
  const left = pool.slice();
  while (out.length < n && left.length) out.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  while (out.length < n) out.push(pool[Math.floor(rng() * pool.length)] ?? 1);
  return out.sort((a, b) => a - b);
}

function makeTrecho(rng: Rng, index: number, chapter: number, level: number, setup: NightSetup, last: boolean): Trecho {
  const nodes: DreamNode[] = [], steps: DreamNode[][] = [];
  const add = (step: number, row: number, kind: NodeKind): DreamNode => { const n: DreamNode = { id: nodes.length, step, row, kind, next: [] }; nodes.push(n); (steps[step] ??= []).push(n); return n; };
  const patrons = setup.patrons.length ? setup.patrons : (['natureza'] as ElementId[]);
  let trial = false, wheel = false;
  add(0, 1, 'combate');
  const mid = DREAM.steps - 3, rest = DREAM.steps - 2, end = DREAM.steps - 1;
  for (let step = 1; step <= mid; step++) {
    /* duas ou três faixas por passo; com duas, elas ficam nas pontas ou numa ponta e no meio */
    const rows = rng() < 0.55 ? [0, 1, 2] : pick(rng, [[0, 2], [0, 1], [1, 2]]);
    const used: ElementId[] = [];
    for (const row of rows) {
      let kind: NodeKind;
      if (step === DREAM.altarStep) kind = setup.noAltarStep ? 'combate' : 'altar';
      else {
        kind = weightedKind(rng, (k) => {
          if (k === 'provacao') return !trial && step >= 2;
          if (k === 'causo') return step % 2 === 1;
          if (k === 'roda') return !!setup.roda && !wheel && step >= 3;
          if (k === 'elite') return !(index === 0 && step === 1);
          return true;
        });
      }
      if (kind === 'provacao') trial = true;
      if (kind === 'roda') wheel = true;
      const n = add(step, row, kind);
      if (kind === 'altar') { const free = patrons.filter((p) => !used.includes(p)); n.patron = pick(rng, free.length ? free : patrons); used.push(n.patron); }
      if (kind === 'provacao') n.trial = pick(rng, ['ligeiro', 'intocado', 'tres'] as TrialKind[]);
    }
    /* cada passo do meio tem pelo menos um combate ou elite ao alcance, fora o passo dos altares */
    if (step !== DREAM.altarStep && !steps[step].some((n) => n.kind === 'combate' || n.kind === 'elite')) steps[step][Math.floor(rng() * steps[step].length)].kind = 'combate';
  }
  /* descanso: uma Fonte e uma Feira, lado a lado; todo caminho escolhe uma */
  add(rest, 0.5, 'fonte'); add(rest, 1.5, 'feira');
  const boss = add(end, 1, 'chefe');
  boss.boss = DREAM_BOSSES[chapter]?.[index === 0 && !last ? 0 : 1] ?? 'caipora';
  /* ligações: cada nó leva aos do passo seguinte que estão na mesma faixa ou na vizinha */
  for (let step = 0; step < end; step++) {
    const from = steps[step], to = steps[step + 1];
    for (const a of from) {
      /* o descanso é escolha de todo caminho: Fonte e Feira ficam ao alcance de qualquer faixa */
      const near = step + 1 === rest ? to : to.filter((b) => Math.abs(b.row - a.row) <= 1);
      a.next = (near.length ? near : [to.reduce((x, y) => (Math.abs(y.row - a.row) < Math.abs(x.row - a.row) ? y : x), to[0])]).map((b) => b.id);
    }
    /* ninguém do passo seguinte fica sem entrada */
    for (const b of to) {
      if (from.some((a) => a.next.includes(b.id))) continue;
      const a = from.reduce((x, y) => (Math.abs(y.row - b.row) < Math.abs(x.row - b.row) ? y : x), from[0]);
      a.next.push(b.id);
    }
    for (const a of from) a.next.sort((x, y) => nodes[x].row - nodes[y].row);
  }
  return { index, chapter, level, nodes };
}

/** O mapa de uma noite. */
export function dreamNight(seed: number, setup: NightSetup): Night {
  const rng = makeRng((seed | 0) || 1), n = setup.short ? 1 : DREAM.trechos;
  const chapters = pickChapters(rng, setup.chapters.length ? setup.chapters : [1], n);
  const trechos = chapters.map((ch, i) => makeTrecho(rng, i, ch, nodeLevel(setup.level, i), setup, i === n - 1));
  return { seed, trechos };
}

/** Nível dos monstros de um trecho. */
export function nodeLevel(heroLevel: number, trecho: number): number {
  return Math.max(1, Math.min(64, Math.round(heroLevel - DREAM.levelBelow + DREAM.levelPerTrecho * trecho)));
}

/* ---------- a fase de cada nó ---------- */

const PREFIX = 'sonho-';
export function isDreamId(id: string): boolean { return id.startsWith(PREFIX); }

export interface DreamKey { kind: NodeKind; chapter: number; level: number; trecho: number; seed: number; extra: string }

/** Identificador da fase de um nó: carrega tudo o que a sala precisa para ser refeita. */
export function dreamStageId(k: DreamKey): string {
  return `${PREFIX}${k.kind}-${k.chapter}-${k.level}-${k.trecho}-${k.seed >>> 0}-${k.extra || 'x'}`;
}
export function parseDreamId(id: string): DreamKey | null {
  if (!isDreamId(id)) return null;
  const [kind, chapter, level, trecho, seed, extra] = id.slice(PREFIX.length).split('-');
  const k: DreamKey = { kind: kind as NodeKind, chapter: Number(chapter), level: Number(level), trecho: Number(trecho), seed: Number(seed), extra: extra === 'x' || !extra ? '' : extra };
  if (!(k.kind in NODE_INFO) || !(k.chapter >= 1 && k.chapter <= 8) || !(k.level >= 1 && k.level <= 80) || !Number.isFinite(k.seed) || !Number.isFinite(k.trecho)) return null;
  return k;
}

/** Fase de um nó do mapa (combate, elite, provação, chefe ou altar). `flags` vai no fim do identificador do altar. */
export function nodeStageId(night: Night, trecho: Trecho, node: DreamNode, flags = ''): string {
  const extra = node.kind === 'altar' ? `${node.patron ?? 'natureza'}${flags}` : node.kind === 'provacao' ? node.trial ?? 'ligeiro' : node.kind === 'chefe' ? String(node.boss ?? 'caipora') : '';
  return dreamStageId({ kind: node.kind, chapter: trecho.chapter, level: trecho.level, trecho: trecho.index, seed: (hash(`${night.seed}|${trecho.index}|${node.id}`) % 1_000_000_000), extra });
}

const ELITE_MODS: EliteMod[] = ['blindado', 'veloz', 'regenerador', 'vampirico', 'explosivo'];
const cost = (k: EnemyKind): number => (isMonster(k) ? (MONSTERS[k].arch === 'protetor' ? 0 : MONSTERS[k].cost) : ({ sauva: 1, cogumelo: 1.4, cuspidor: 1.8, urutau: 1.8, queixada: 2.6, piranha: 1.1, sapo: 1.7, arraia: 2, caramujo: 0, jacare: 3.4, tronco: 3 } as Record<string, number>)[k] ?? 1);

function mods(rng: Rng, n: number): EliteMod[] {
  const left = ELITE_MODS.slice(), out: EliteMod[] = [];
  while (out.length < n && left.length) out.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  return out;
}

/** Monta a sala de um nó. Devolve nulo se o identificador não vale. */
export function dreamStage(id: string): StageDef | null {
  const k = parseDreamId(id);
  if (!k) return null;
  const rng = makeRng(hash(id) | 1), chapter = CHAPTERS.find((c) => c.id === k.chapter)!, terrain = TERRAIN[k.chapter], level = k.level;
  const room: RoomDef = { type: 'combat', waves: [], bg: hash(id) % 3, artChapter: k.chapter, level };
  const where = `Sonho · ${chapter.name}`;
  const done = (name: string, final: StageDef['final'], intro: string): StageDef => ({
    id, chapter: k.chapter, index: -1, number: 0, name, intro, level, rooms: [room], starTime: 0,
    kinds: Array.from(new Set(room.waves.flat().map((s) => s.kind))), final, map: { x: 0, y: 0 },
  });
  if (k.kind === 'altar') {
    room.type = 'altar';
    /* o padrinho vem no fim do identificador; um F depois dele limita o altar às bênçãos comuns (Ferradura Virada) */
    /* um R no lugar do F pede rara ou melhor (o cordel do Pavão Misterioso) */
    const common = k.extra.endsWith('F'), fine = k.extra.endsWith('R'), patron = (common || fine ? k.extra.slice(0, -1) : k.extra) as ElementId;
    room.altar = { patron, ...(common ? { maxTier: 1 as const } : {}), ...(fine ? { minTier: 2 as const } : {}) };
    return done(where, 'normal', NODE_INFO.altar.desc);
  }
  if (k.kind === 'chefe') {
    room.type = 'boss';
    room.waves = [[{ kind: k.extra as EnemyKind, x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.72), y: Math.round((ARENA.y0 + ARENA.y1) / 2), elite: true }]];
    if (terrain) { const t = terrain(rng, 11); if (t.dark) room.dark = true; if (t.moon) room.moon = true; }
    return done(where, 'chefao', NODE_INFO.chefe.desc);
  }
  const pool = expeditionPool(k.chapter, 12);
  if (terrain) Object.assign(room, terrain(rng, 6));
  if (k.chapter === 2) room.puddles = [{ x: 500 + Math.round(rng() * 300), y: 300 + Math.round(rng() * 200), r: 90 }];
  const base = 5.5 + 1.25 * Math.min(level, 12) + 0.35 * Math.max(0, Math.min(level, 24) - 12);
  const budget = base * DREAM.budget * (1 + DREAM.budgetPerTrecho * k.trecho);
  const champion = level <= 2 ? 0 : Math.min(0.5, 0.1 + level * 0.03);
  const eliteWave = (n: number, share: number): SpawnDef[][] => {
    /* o elite é o monstro mais caro do capítulo; os outros entram depois, em volta */
    const kind = pool.reduce((a, b) => (cost(b) > cost(a) ? b : a), pool[0]);
    const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.75), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
    const adds = pool.length > 1 ? pool.filter((p) => p !== kind) : pool;
    const first: SpawnDef[] = [{ kind, ...c, elite: true, mods: mods(rng, n) }, ...(share > 0 ? wave(rng, adds, budget * share, [c], 0) : [])];
    return share > 0 ? [first, wave(rng, adds, budget * share, [], 0)] : [first];
  };
  if (k.kind === 'elite') {
    room.type = 'elite';
    room.waves = eliteWave(1 + (rng() < 0.3 + 0.2 * k.trecho ? 1 : 0), 0.4);
    return done(where, 'elite', NODE_INFO.elite.desc);
  }
  if (k.kind === 'provacao' && k.extra === 'tres') {
    room.type = 'elite';
    room.waves = eliteWave(3, 0);
    return done(`Provação · ${TRIAL_INFO.tres.name}`, 'elite', TRIAL_INFO.tres.desc);
  }
  room.waves = [0, 1, 2].map((w) => wave(rng, pool, budget * (0.44 + w * 0.06), [], w > 0 ? champion : 0));
  if (k.kind === 'provacao') {
    const trial = k.extra === 'intocado' ? 'intocado' : 'ligeiro', enemies = room.waves.reduce((a, w) => a + w.length, 0);
    /* contra o relógio: o tempo do desafio do totem, com folga para as três ondas entrarem */
    room.trial = { kind: trial, limit: trial === 'intocado' ? 3 : Math.round(CHALLENGE.time.base + CHALLENGE.time.perEnemy * enemies + 6) };
    return done(`Provação · ${TRIAL_INFO[trial].name}`, 'normal', TRIAL_INFO[trial].desc);
  }
  return done(where, 'normal', NODE_INFO.combate.desc);
}

/** Todos os nós a que se chega a partir de `from` (nulo = começo do trecho). */
export function nextNodes(trecho: Trecho, from: number | null): number[] {
  return from == null ? [0] : trecho.nodes[from]?.next ?? [];
}
