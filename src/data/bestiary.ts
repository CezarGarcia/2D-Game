/**
 * Monstros e chefes dos capítulos 3 a 8 (docs/gdd/05). Cada monstro comum é um dos oito arquétipos,
 * com a aparência e o elemento do capítulo; os números estão no valor do nível 1, como em balance.ts.
 * O comportamento de cada arquétipo está em src/sim/archetypes.ts; o dos chefes, em src/sim/bosses.ts.
 */
import type { ElementId } from './content';

export type Archetype = 'enxame' | 'bruto' | 'atirador' | 'investida' | 'conjurador' | 'protetor' | 'emboscada' | 'explosivo';

export type MonsterKind =
  | 'calango' | 'cascavel' | 'mandacaru' | 'bode' | 'urubu'
  | 'formiga' | 'seriema' | 'pequizeiro' | 'cupinzeiro' | 'taturana'
  | 'morcego' | 'besouro' | 'aranha' | 'macaco' | 'totem'
  | 'queroquero' | 'boibarroso' | 'almapenada' | 'fatuo' | 'espantalho'
  | 'ariranha' | 'soco' | 'jararaca' | 'cururu' | 'tracaja'
  | 'vulto' | 'vazio' | 'lembranca' | 'esquecido' | 'silencio';

export type BossKind = 'corposeco' | 'saci' | 'mula' | 'boitata' | 'capelobo' | 'mapinguari' | 'teiniagua' | 'lobisomem' | 'pisadeira' | 'cuca' | 'ecos' | 'esquecimento';

export interface ShotDef {
  /** bolt: um disparo reto; fan: leque; lob: arremesso em arco com marca no chão; spin: foice que vai e volta. */
  mode: 'bolt' | 'fan' | 'lob' | 'spin';
  count: number; spread: number; speed: number; range: number;
  /** Raio da marca no chão (lob). */
  radius: number;
  tex: string;
  /** Tempo de voo (lob). */
  flight: number;
}

export interface MonsterDef {
  kind: MonsterKind; chapter: number; name: string; hint: string;
  arch: Archetype; element: ElementId | null;
  radius: number; hp: number; speed: number; damage: number;
  /** Custo no orçamento de uma onda e máximo por onda. */
  cost: number; cap: number;
  fly?: boolean;
  /** Tempo de aviso dos golpes (antes da redução por nível e por modificador). */
  windup: number;
  /** Alcance do golpe (enxame, bruto) ou da revelação (emboscada) ou distância para explodir. */
  reach: number;
  /** Raio do golpe em área (enxame, bruto, explosivo) ou largura da linha (investida, emboscada). */
  area: number;
  recover: number;
  shot?: ShotDef;
  /** Conjurador: quantas marcas por feitiço, raio delas e o atraso até estourarem. */
  circles?: { count: number; radius: number; delay: number; spread: number; every: number; silence?: boolean };
  /** Explosivo: o que fica no chão depois. */
  leaves?: 'fogo' | 'sombra' | 'vazio';
  /** Bruto e protetor: blindado (recebe metade até ficar exposto ou rachado). */
  armored?: boolean;
}

const M = (kind: MonsterKind, chapter: number, name: string, arch: Archetype, element: ElementId | null, n: Partial<MonsterDef>, hint: string): MonsterDef => {
  const base: Record<Archetype, Omit<MonsterDef, 'kind' | 'chapter' | 'name' | 'hint' | 'arch' | 'element'>> = {
    enxame: { radius: 15, hp: 44, speed: 160, damage: 14, cost: 1, cap: 10, windup: 0.45, reach: 78, area: 44, recover: 0.55 },
    bruto: { radius: 34, hp: 150, speed: 62, damage: 46, cost: 4, cap: 1, windup: 1.3, reach: 128, area: 108, recover: 2.1, armored: true },
    atirador: { radius: 20, hp: 70, speed: 95, damage: 14, cost: 2.4, cap: 2, windup: 0.85, reach: 0, area: 0, recover: 2.9 },
    investida: { radius: 27, hp: 175, speed: 95, damage: 32, cost: 3.6, cap: 1, windup: 1.1, reach: 0, area: 60, recover: 2.2 },
    conjurador: { radius: 20, hp: 92, speed: 85, damage: 22, cost: 3, cap: 1, windup: 0.8, reach: 0, area: 0, recover: 3.4 },
    protetor: { radius: 23, hp: 190, speed: 52, damage: 22, cost: 2.4, cap: 1, windup: 0.95, reach: 115, area: 105, recover: 1.6, armored: true },
    emboscada: { radius: 18, hp: 92, speed: 120, damage: 22, cost: 2.2, cap: 2, windup: 0.65, reach: 175, area: 44, recover: 1.1 },
    explosivo: { radius: 15, hp: 34, speed: 140, damage: 28, cost: 1.4, cap: 4, windup: 0.8, reach: 80, area: 100, recover: 0 },
  };
  return { kind, chapter, name, hint, arch, element, ...base[arch], ...n };
};

const bolt = (tex: string, speed = 560, count = 1, spread = 0): ShotDef => ({ mode: count > 1 ? 'fan' : 'bolt', count, spread, speed, range: 760, radius: 0, tex, flight: 0 });
const lob = (tex: string, radius = 56, flight = 0.85): ShotDef => ({ mode: 'lob', count: 1, spread: 0, speed: 0, range: 760, radius, tex, flight });

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  /* Capítulo 3 · Sertão (Tempestade) */
  calango: M('calango', 3, 'Calango-Cinza', 'enxame', 'tempestade', { speed: 185, radius: 14 }, 'Rápido e em bando. Morde de perto.'),
  cascavel: M('cascavel', 3, 'Cascavel', 'emboscada', 'tempestade', {}, 'Enterrada na areia. O chocalho avisa antes do bote.'),
  mandacaru: M('mandacaru', 3, 'Mandacaru', 'atirador', 'tempestade', { speed: 55, hp: 96, shot: bolt('e_espinho', 470, 3, 0.26) }, 'Dispara um leque de espinhos.'),
  bode: M('bode', 3, 'Bode-Preto', 'investida', 'tempestade', {}, 'Marca uma linha e corre. Fica tonto se bater.'),
  urubu: M('urubu', 3, 'Urubu', 'conjurador', 'tempestade', { fly: true, circles: { count: 2, radius: 66, delay: 1.1, spread: 130, every: 3.4 } }, 'Voa em círculos e chama raios onde você está.'),
  /* Capítulo 4 · Cerrado (Fogo) */
  formiga: M('formiga', 4, 'Formiga-de-Fogo', 'enxame', 'fogo', { radius: 12, hp: 34, cost: 0.8, speed: 175 }, 'Muitas, pequenas e queimam.'),
  seriema: M('seriema', 4, 'Seriema', 'investida', 'fogo', { speed: 120, hp: 150 }, 'Corre em linha reta e chuta.'),
  pequizeiro: M('pequizeiro', 4, 'Pequizeiro', 'atirador', 'fogo', { speed: 40, hp: 110, shot: lob('e_pequi', 62, 0.9) }, 'Arremessa pequis em brasa onde você vai estar.'),
  cupinzeiro: M('cupinzeiro', 4, 'Cupinzeiro', 'bruto', 'fogo', {}, 'Blindado. Só sente depois que bate.'),
  taturana: M('taturana', 4, 'Taturana', 'explosivo', 'fogo', { leaves: 'fogo' }, 'Corre até você e estoura em fogo.'),
  /* Capítulo 5 · Selva Profunda (Terra) */
  morcego: M('morcego', 5, 'Morcego', 'enxame', 'terra', { fly: true, speed: 190, hp: 38 }, 'Bando que mergulha do escuro.'),
  besouro: M('besouro', 5, 'Besouro-Rinoceronte', 'bruto', 'terra', { hp: 170 }, 'Carapaça de pedra. Espere o golpe e bata.'),
  aranha: M('aranha', 5, 'Caranguejeira', 'emboscada', 'terra', { hp: 100 }, 'Desce do escuro quando você chega perto.'),
  macaco: M('macaco', 5, 'Macaco-Prego', 'atirador', 'terra', { speed: 130, shot: lob('e_pedra', 50, 0.75) }, 'Joga pedras e foge.'),
  totem: M('totem', 5, 'Totem de Barro', 'protetor', 'terra', {}, 'Protege os inimigos em volta. Derrube primeiro.'),
  /* Capítulo 6 · Pampa (Sombra) */
  queroquero: M('queroquero', 6, 'Quero-Quero', 'enxame', 'sombra', { fly: true, speed: 200, hp: 40 }, 'Bando barulhento que mergulha de bico.'),
  boibarroso: M('boibarroso', 6, 'Boi-Barroso', 'investida', 'sombra', { radius: 32, hp: 230, damage: 46 }, 'Pesado. A investida derruba.'),
  almapenada: M('almapenada', 6, 'Alma Penada', 'conjurador', 'sombra', { fly: true, circles: { count: 2, radius: 90, delay: 1.2, spread: 90, every: 3.4 } }, 'Amaldiçoa o chão onde você pisa.'),
  fatuo: M('fatuo', 6, 'Fogo-Fátuo', 'explosivo', 'sombra', { fly: true, speed: 160, leaves: 'sombra' }, 'Chama fria que estoura e amaldiçoa.'),
  espantalho: M('espantalho', 6, 'Espantalho', 'atirador', 'sombra', { speed: 70, hp: 100, shot: { mode: 'spin', count: 1, spread: 0, speed: 460, range: 520, radius: 0, tex: 'e_foice', flight: 0 } }, 'Lança foices que voltam.'),
  /* Capítulo 7 · Pantanal (Encanto) */
  ariranha: M('ariranha', 7, 'Ariranha', 'enxame', 'encanto', { speed: 180, hp: 48 }, 'Caça em grupo, rápida.'),
  soco: M('soco', 7, 'Socó', 'atirador', 'encanto', { speed: 80, shot: bolt('e_bico', 820) }, 'Fica parado e dispara o bico em linha reta.'),
  jararaca: M('jararaca', 7, 'Jararaca', 'emboscada', 'encanto', { hp: 96 }, 'Escondida no capim. O bote confunde.'),
  cururu: M('cururu', 7, 'Cururu-da-Cuca', 'conjurador', 'encanto', { circles: { count: 3, radius: 72, delay: 1.1, spread: 140, every: 3.2 } }, 'Joga poções que estouram em volta de você.'),
  tracaja: M('tracaja', 7, 'Tracajá', 'bruto', 'encanto', { hp: 180 }, 'Casco duro. Ataca devagar e forte.'),
  /* Capítulo 8 · Terra Sem Nome (sem elemento) */
  vulto: M('vulto', 8, 'Vulto', 'enxame', null, { speed: 180, hp: 50 }, 'Silhuetas que cercam você.'),
  vazio: M('vazio', 8, 'Vazio', 'explosivo', null, { leaves: 'vazio', speed: 150 }, 'Estoura e puxa tudo para dentro.'),
  lembranca: M('lembranca', 8, 'Lembrança', 'atirador', null, { fly: true, shot: bolt('e_caco', 560, 2, 0.2) }, 'Retrato rasgado que atira cacos.'),
  esquecido: M('esquecido', 8, 'Esquecido', 'bruto', null, { hp: 190, radius: 36 }, 'Estátua sem rosto. Lenta e enorme.'),
  silencio: M('silencio', 8, 'Silêncio', 'conjurador', null, { circles: { count: 2, radius: 80, delay: 1.2, spread: 100, every: 3.6, silence: true }, hp: 100 }, 'Se a marca te pegar, um feitiço fica apagado por 5 s.'),
};

export interface BossDef {
  kind: BossKind; chapter: number; name: string; hint: string; element: ElementId | null;
  /** Chefe da fase 12 (Encantado) ou elite da fase 11. */
  encantado: boolean;
  radius: number; hp: number; speed: number; damage: number;
  /** Limites de vida (fração) em que muda de fase. */
  phases: number[];
  /** Padrões de ataque em cada fase, em ordem. */
  patterns: string[][];
  idle: number;
  posture?: { max: number; hit: number; spell: number; parry: number; perfect: number; downed: number; downedMult: number };
  enrageAt: number;
}

const POSTURE = { max: 100, hit: 3.5, spell: 5, parry: 35, perfect: 14, downed: 4, downedMult: 2 };

const BS = (kind: BossKind, chapter: number, name: string, encantado: boolean, element: ElementId | null, n: Partial<BossDef>, hint: string): BossDef => ({
  kind, chapter, name, hint, element, encantado,
  radius: encantado ? 28 : 30, hp: encantado ? 3600 : 2800, speed: 110, damage: 40,
  phases: encantado ? [0.66, 0.33] : [0.5], patterns: [], idle: 0.9, enrageAt: encantado ? 270 : 200,
  ...(encantado ? { posture: POSTURE } : {}),
  ...n,
});

export const BOSSES: Record<BossKind, BossDef> = {
  corposeco: BS('corposeco', 3, 'Corpo-Seco', false, 'tempestade', { speed: 90, patterns: [['agarrar', 'chuva', 'enterrar'], ['agarrar', 'enterrar', 'chuva', 'chamado']] }, 'Agarra e suga a vida. Some na terra e sai do outro lado.'),
  saci: BS('saci', 3, 'Saci', true, 'tempestade', { speed: 150, radius: 22, patterns: [['chute', 'roubo', 'leque'], ['redemoinho', 'chute', 'roubo', 'chuva'], ['redemoinho', 'leque', 'roubo', 'redemoinho', 'chuva']] }, 'Rouba um feitiço seu e só devolve quando apanha. Some dentro do redemoinho.'),
  mula: BS('mula', 4, 'Mula-sem-Cabeça', false, 'fogo', { speed: 120, patterns: [['investida', 'sopro', 'investida'], ['investida', 'sopro', 'chuva', 'investida']] }, 'Galopa deixando fogo no chão e cospe fogo pelo pescoço.'),
  boitata: BS('boitata', 4, 'Boitatá', true, 'fogo', { radius: 30, speed: 210, patterns: [['serpente', 'cruzar', 'cuspe'], ['cruzar', 'serpente', 'cuspe', 'cruzar'], ['cruzar', 'cruzar', 'cuspe', 'serpente', 'anel']] }, 'Uma cobra de fogo do tamanho da sala. Só a cabeça sente golpe.'),
  capelobo: BS('capelobo', 5, 'Capelobo', false, 'terra', { speed: 120, patterns: [['salto', 'agarrar', 'salto'], ['salto', 'pisao', 'agarrar', 'salto']] }, 'Salta em cima de você. Saia da marca.'),
  mapinguari: BS('mapinguari', 5, 'Mapinguari', true, 'terra', { radius: 40, hp: 4000, speed: 80, patterns: [['patada', 'pisao', 'rugido'], ['pisao', 'patada', 'rugido', 'chuva'], ['pisao', 'rugido', 'patada', 'pisao', 'rugido']] }, 'Couro de pedra: só sente golpe na boca da barriga, que abre quando ele ruge.'),
  teiniagua: BS('teiniagua', 6, 'Teiniaguá', false, 'sombra', { speed: 170, radius: 24, patterns: [['investida', 'brilho', 'investida'], ['investida', 'investida', 'brilho', 'anel']] }, 'Rápida. Quando a pedra da testa brilha, saia de perto.'),
  lobisomem: BS('lobisomem', 6, 'Lobisomem', true, 'sombra', { speed: 120, radius: 26, patterns: [['facada', 'facada', 'chamado'], ['salto', 'garras', 'uivo', 'salto'], ['salto', 'garras', 'salto', 'uivo', 'garras']] }, 'Começa homem e fraco. A lua enche durante a luta e ele fica mais rápido.'),
  pisadeira: BS('pisadeira', 7, 'Pisadeira', false, 'encanto', { speed: 130, patterns: [['pisar', 'risada', 'pisar'], ['pisar', 'pisar', 'risada', 'chuva']] }, 'Quem fica parado é pisado. Não pare de andar.'),
  cuca: BS('cuca', 7, 'Cuca', true, 'encanto', { speed: 95, patterns: [['colherada', 'pocoes', 'ninar'], ['sonho', 'pocoes', 'colherada', 'ninar'], ['sonho', 'pocoes', 'onda', 'colherada', 'ninar']] }, 'Põe você para sonhar: no sonho, os botões dos feitiços trocam de lugar.'),
  ecos: BS('ecos', 8, 'Ecos dos Sete', false, null, { hp: 2400, phases: [6 / 7, 5 / 7, 4 / 7, 3 / 7, 2 / 7, 1 / 7], patterns: [['eco']], idle: 0.8 }, 'A cada golpe forte, vira o eco de um Encantado diferente.'),
  esquecimento: BS('esquecimento', 8, 'O Esquecimento', true, null, { radius: 40, hp: 5200, speed: 70, phases: [0.75, 0.5, 0.25], patterns: [['varrer', 'apagar', 'chuva'], ['vazio', 'varrer', 'apagar', 'onda'], ['vazio', 'anel', 'apagar', 'varrer', 'chuva'], ['vazio', 'onda', 'anel', 'varrer', 'apagar']] }, 'Apaga seus feitiços um por um. Cada Encantado que você libertou volta para ajudar.'),
};

/** Números dos padrões dos chefes (no valor do nível 1, multiplicados pelo dano do chefe). */
export const BOSS_NUM = {
  investida: { aim: 0.85, lockAt: 0.5, speed: 800, width: 60, damage: 0.55, count: 2, exposed: 2.6 },
  leque: { cast: 0.5, lines: 5, spread: 0.32, delay: 0.85, width: 46, len: 700, damage: 0.9 },
  chuva: { cast: 0.6, count: 5, radius: 74, delay: 1.0, spread: 160, damage: 0.9 },
  anel: { cast: 0.6, count: 16, speed: 360, damage: 0.6, waves: 2 },
  pisao: { cast: 0.5, rings: 3, step: 95, delay: 0.85, gap: 0.45, damage: 0.65 },
  salto: { aim: 0.75, radius: 110, damage: 1.2, air: 0.45 },
  agarrar: { aim: 0.75, len: 300, width: 56, speed: 820, hold: 0.9, drain: 0.5 },
  enterrar: { under: 0.9, radius: 100, delay: 0.8, damage: 1 },
  chamado: { cast: 0.9, count: 4 },
  chute: { aim: 0.45, radius: 92, offset: 60, damage: 1 },
  roubo: { cast: 0.6, hits: 6 },
  redemoinho: { duration: 3.4, speed: 215, radius: 66, damage: 0.55, devils: 1 },
  sopro: { cast: 0.6, lines: 7, spread: 0.18, delay: 0.75, width: 50, len: 460, damage: 1 },
  serpente: { duration: 5, speed: 230, segs: 14, gap: 40, damage: 0.3 },
  cruzar: { aim: 1.0, speed: 1000, width: 100, damage: 0.9 },
  cuspe: { cast: 0.5, count: 3, radius: 80, delay: 0.9, spread: 140, damage: 0.9 },
  patada: { aim: 0.8, radius: 150, offset: 90, damage: 1.3 },
  rugido: { cast: 0.5, open: 3, push: 420, damage: 0.4 },
  brilho: { cast: 1.1, radius: 200, damage: 0.8 },
  facada: { aim: 0.45, radius: 80, offset: 50, damage: 0.7 },
  garras: { aim: 0.4, radius: 100, offset: 60, damage: 0.8, count: 3, between: 0.25 },
  uivo: { cast: 0.8, summon: 4 },
  pisar: { still: 0.9, aim: 0.7, radius: 100, damage: 1.4, air: 0.5 },
  risada: { cast: 0.6, count: 4 },
  colherada: { aim: 0.6, radius: 130, offset: 80, damage: 1.2 },
  pocoes: { cast: 0.6, count: 4, radius: 76, flight: 0.9, spread: 150, damage: 0.8 },
  ninar: { cast: 0.6, count: 3, radius: 90, delay: 1.1, sleep: 1.4 },
  sonho: { cast: 1.0, duration: 10 },
  onda: { cast: 0.5, delay: 1.2, width: 70, gap: 150, speed: 520, damage: 1, count: 2, between: 0.9 },
  varrer: { aim: 0.9, radius: 260, arc: 1.2, damage: 0.85 },
  apagar: { cast: 0.8, duration: 9 },
  vazio: { cast: 0.7, duration: 2.4, pull: 140, ring: 12, damage: 0.22 },
  eco: { every: 2.2 },
  /** Lobisomem: a lua enche com o tempo de luta; cheia em 90 s. */
  lua: { full: 90, transformAt: 0.25, speedMax: 0.6 },
};

export const BOSS_KINDS = Object.keys(BOSSES) as BossKind[];
export const MONSTER_KINDS = Object.keys(MONSTERS) as MonsterKind[];
