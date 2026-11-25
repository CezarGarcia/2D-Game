/**
 * Simulação de uma fase: sequência de salas, ondas, altar, quedas e vitória.
 * Não depende do Phaser nem do navegador: recebe comandos, avança um passo fixo e devolve eventos.
 * Isso permite testar as regras sem tela e, mais adiante, gravar partidas e conferi-las no servidor.
 */
import { ARENA, ENEMY, PLAYER, WAVE_DELAY, WAVE_OVERLAP } from '../data/balance';
import {
  ALTAR_PITY, BLESSINGS, BLESSING_ORDER, BLESSING_WEIGHT, STAGE_ONLY_BLESSINGS, awakeningsFor, blessingCounts, compadriosFor,
  type BaseBlessingId, type BlessingId, type ElementId,
} from '../data/content';
import { levelCombatModifiers } from '../data/progression';
import type { HeroStats } from '../meta/stats';
import { clampArena, emit, healPlayer, max0, rand, spawnEnemy, wet } from './core';
import { separate, updateEnemy } from './enemies';
import { flushLoot, lootOnRoomClear, lootOnWave, startRoomLoot, updateLoot } from './loot';
import { makePet, updateHazards, updatePet, updatePlayer, updateProjectiles, updateZones } from './player';
import { updateAllies } from './spells';
import { startTerrain, updateTerrain } from './terrain';
import type { Input, Player, StageConfig, World } from './types';

export * from './types';
export { spawnEnemy } from './core';

function newPlayer(stats: HeroStats): Player {
  return {
    x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, aim: 0, facing: 1,
    hp: stats.maxHp, mana: stats.maxMana,
    state: 'idle', stateT: 0, combo: 0, comboT: 0, hitDone: false,
    dodgeCharges: stats.dodgeCharges, dodgeTimer: 0, iframes: 0, hurtInv: 0,
    cds: [0, 0, 0], cdMax: [1, 1, 1], perfectT: 0, perfectUsed: false,
    dx: 1, dy: 0, rolled: [], moving: false, walk: 0,
    bufAttack: 0, bufDodge: 0, bufSpell: [0, 0, 0],
    blockT: 0, charge: 0, shotCd: 0, contraT: 0, presaT: 0, cascaT: 0, slowT: 0,
    stacks: 0, stackT: 0, jabutiUsed: false,
    potions: stats.potions, potionCd: 0,
    shield: stats.firstHitShield, novaT: 0, supremo: 0, inPuddle: false, surf: 0,
    surfKind: 'dodge', critNext: false, stoneT: 0, wolfT: 0, orbT: 0, orbHit: {}, orbPower: 0, lastElement: 'natureza', aspectN: 0,
    burnT: 0, burnTick: 0, poisonT: 0, poisonTick: 0, curseT: 0, crackT: 0, confuseT: 0, wetT: 0, sleepT: 0,
    erased: [0, 0, 0], stolen: -1, dreamT: 0, spellMap: [0, 1, 2], heldT: 0, hitCount: 0, fightT: 0, frenzyT: 0,
    trailD: 0, hasteT: 0, windStacks: 0, windT: 0, secondWind: false,
  };
}

export function createWorld(cfg: StageConfig): World {
  const mods = levelCombatModifiers(cfg.stats.level, cfg.level);
  const w: World = {
    cfg, stats: cfg.stats, time: 0, tick: 0, phase: 'fight', room: 0, arena: { ...ARENA },
    player: newPlayer(cfg.stats), pet: null,
    enemies: [], projectiles: [], hazards: [], zones: [], events: [],
    wave: -1, waveTimer: 0, nextId: 1, rng: cfg.seed | 0,
    dealt: mods.dealt, taken: mods.taken,
    blessings: [], altar: null, altarDry: 0,
    revives: cfg.stats.revives, deaths: 0, deadT: 0,
    kills: 0, perfects: 0, hitsTaken: 0, roomsCleared: 0, bossTime: 0,
    spells: cfg.stats.loadout.slice(0, 3),
    puddles: [], current: 0, supremo: cfg.stats.supremo, flooded: false,
    allies: [], devils: [], grass: [], walls: [], moon: 0, eraseT: 0, trail: [], steals: 0, level: cfg.level,
    chests: [], pickups: [], buffs: [], reacting: null, pots: [], wisp: null, challenge: null, offer: null,
    loot: { gold: 0, chests: 0, since: 0, wisps: 0, challenges: 0, rng: (cfg.seed ^ 0x5bd1e995) | 0 },
  };
  /* o Sonho: o herói chega como saiu da sala anterior */
  const c = cfg.carry;
  if (c) {
    w.blessings = c.blessings.slice(); w.altarDry = c.altarDry; w.revives = c.revives;
    w.player.hp = Math.max(1, Math.min(cfg.stats.maxHp, Math.round(cfg.stats.maxHp * c.hpFrac)));
    w.player.potions = Math.max(0, Math.min(cfg.stats.potions, c.potions));
    w.player.supremo = Math.max(0, Math.min(100, c.supremo));
  }
  w.pet = makePet(w);
  startRoom(w, 0);
  return w;
}

/** Zona de saída: aparece na borda direita quando a sala está limpa. */
export function exitZone(w: World): { x: number; y: number; h: number } {
  return { x: w.arena.x1 - 46, y: (w.arena.y0 + w.arena.y1) / 2, h: 120 };
}

function startRoom(w: World, index: number, revive = false): void {
  const p = w.player, room = w.cfg.rooms[index];
  w.room = index;
  w.arena = { ...ARENA };
  w.enemies = []; w.projectiles = []; w.hazards = []; w.zones = [];
  w.wave = -1; w.waveTimer = WAVE_DELAY - 0.5; w.bossTime = 0; w.altar = null;
  w.puddles = room.puddles ?? []; w.current = room.current ?? 0; w.flooded = false;
  w.level = room.level ?? w.cfg.level;
  const mods = levelCombatModifiers(w.stats.level, w.level);
  w.dealt = mods.dealt; w.taken = mods.taken;
  w.allies = [];
  startTerrain(w, room);
  startRoomLoot(w, room, index, revive);
  p.shield = w.stats.firstHitShield; p.surf = 0; p.surfKind = 'dodge';
  p.erased = [0, 0, 0]; p.stolen = -1; p.dreamT = 0; p.spellMap = [0, 1, 2]; p.heldT = 0; p.sleepT = 0; p.confuseT = 0;
  p.secondWind = false; p.windStacks = 0; p.windT = 0; p.hasteT = 0; p.trailD = 0;
  p.x = ARENA.x0 + 100; p.y = (ARENA.y0 + ARENA.y1) / 2;
  p.kx = p.ky = 0; p.state = 'idle'; p.stateT = 0; p.charge = 0; p.slowT = 0; p.iframes = 0; p.hurtInv = 0;
  const pet = w.pet;
  if (pet) {
    if (pet.state === 'down') { pet.state = 'follow'; pet.hp = Math.round(pet.maxHp * 0.6); }
    pet.x = p.x - 50; pet.y = p.y + 18; pet.tauntT = 0;
  }
  if (room.type === 'altar') {
    w.altar = rollBlessings(w, room.altar ?? {}); w.phase = 'altar';
    emit(w, { type: 'altar', x: (ARENA.x0 + ARENA.x1) / 2, y: (ARENA.y0 + ARENA.y1) / 2 });
  } else w.phase = 'fight';
  emit(w, { type: 'roomStart', x: p.x, y: p.y, value: index, kind: room.type });
}

/** Chance de um Compadrio já liberado aparecer num altar. */
export const COMPADRIO_CHANCE = 0.5;

/** Bênção que não mudaria nada: um talento, um conjunto ou outra bênção já liga o mesmo efeito. */
export function redundantBlessing(s: HeroStats, b: BaseBlessingId): boolean {
  switch (b) {
    case 'perfurar': return s.pierce;
    case 'pegadas': return s.passives.dodgeDust;
    case 'ondaMansa': return s.passives.perfectWave;
    case 'piao': return s.passives.perfectWhirl;
    case 'brasaViva': return s.passives.critBurn;
    case 'quebraPedra': return s.ignoreArmor;
    case 'sedeDeSangue': return s.talents.sedeDeBriga;
    case 'luaCheia': return s.passives.frenzy;
    case 'segundaChance': return s.talents.cascaDeJabuti;
    case 'amparo': return s.firstHitShield;
    default: return false;
  }
}

/** Bênçãos comuns que este herói pode receber agora (sem as que já estão no máximo nem as que não mudariam nada). */
export function blessingPool(w: World, patron: ElementId | null = null): BaseBlessingId[] {
  const have = blessingCounts(w.blessings), s = w.stats;
  return BLESSING_ORDER.filter((b) => {
    if ((have[b] ?? 0) >= BLESSINGS[b].max) return false;
    if (patron && BLESSINGS[b].patron !== patron) return false;
    if (b === 'parceria' && !s.companion) return false;
    if (w.cfg.carry && STAGE_ONLY_BLESSINGS.includes(b)) return false;
    if (b === 'cura' && w.player.hp > s.maxHp * 0.8 && w.player.potions >= s.potions) return false;
    return !have[b] ? !redundantBlessing(s, b) : true;
  });
}

function weighted<T extends BlessingId>(w: World, pool: T[]): number {
  let total = 0;
  for (const b of pool) total += BLESSING_WEIGHT[BLESSINGS[b].tier];
  let roll = rand(w) * total;
  for (let i = 0; i < pool.length; i++) { roll -= BLESSING_WEIGHT[BLESSINGS[pool[i]].tier]; if (roll <= 0) return i; }
  return 0;
}

export interface AltarOpts {
  /** Altar de um padrinho só (o Sonho): as bênçãos saem todas dele. */
  patron?: ElementId | null;
  /** Raridade mais alta que o altar traz (a Ferradura Virada limita às comuns). */
  maxTier?: 1 | 2 | 3;
  /** Raridade mais baixa (o cordel do Pavão Misterioso pede rara ou melhor). Se não houver nenhuma assim, vale qualquer uma. */
  minTier?: 1 | 2 | 3;
}

/**
 * Sorteia as bênçãos do altar: as mais fortes saem menos, e nenhuma passa do limite de vezes.
 * - Despertar: se alguma bênção chegou ao máximo e ainda não despertou, as duas formas dela ocupam dois lugares.
 * - Compadrio: com duas bênçãos de cada padrinho de um par, a bênção do par pode ocupar um lugar.
 * - Azar com limite: depois de `ALTAR_PITY` altares só com comuns, este traz pelo menos uma rara.
 */
export function rollBlessings(w: World, opts: AltarOpts = {}): BlessingId[] {
  const s = w.stats, patron = opts.patron ?? null, picks: BlessingId[] = [];
  const mine = (id: BlessingId) => { const d = BLESSINGS[id]; return !patron || d.patron === patron || !!d.pair?.includes(patron); };
  const awake = awakeningsFor(w.blessings).filter(([a]) => mine(a));
  if (awake.length) { const forms = awake[Math.floor(rand(w) * awake.length)]; picks.push(forms[0], forms[1]); }
  else {
    const comp = compadriosFor(w.blessings).filter(mine);
    if (comp.length && rand(w) < COMPADRIO_CHANCE) picks.push(comp[Math.floor(rand(w) * comp.length)]);
  }
  const cap = opts.maxTier ?? 3;
  let pool: BlessingId[] = blessingPool(w, patron).filter((b) => BLESSINGS[b].tier <= cap);
  if (opts.minTier && opts.minTier > 1) { const fine = pool.filter((b) => BLESSINGS[b].tier >= opts.minTier!); if (fine.length >= Math.min(2, s.altarChoices)) pool = fine; }
  /* padrinho sem mais nada a dar: o altar não fica vazio, traz de qualquer um */
  if (!pool.length && !picks.length) pool = blessingPool(w).filter((b) => BLESSINGS[b].tier <= cap);
  const special = picks.length;
  while (picks.length < s.altarChoices && pool.length) picks.push(pool.splice(weighted(w, pool), 1)[0]);
  const good = (id: BlessingId) => BLESSINGS[id].tier >= 2;
  if (w.altarDry >= ALTAR_PITY && picks.length > special && !picks.some(good)) {
    const rare = pool.filter(good);
    if (rare.length) picks[picks.length - 1] = rare[weighted(w, rare)];
  }
  w.altarDry = picks.some(good) ? 0 : w.altarDry + 1;
  return picks;
}

/**
 * Escolhe uma das bênçãos do altar. `restat` recalcula os números do herói com a lista nova
 * (a simulação não conhece o perfil; quem conhece é quem a chama).
 */
export function chooseBlessing(w: World, index: number, restat: (blessings: BlessingId[]) => HeroStats): boolean {
  if (w.phase !== 'altar' || !w.altar || !w.altar[index]) return false;
  grantBlessing(w, w.altar[index], restat);
  w.altar = null; w.roomsCleared++;
  if (w.room >= w.cfg.rooms.length - 1) {
    /* altar que é a fase inteira (um nó do Sonho): escolher encerra */
    flushLoot(w);
    w.phase = 'won';
    emit(w, { type: 'win', x: w.player.x, y: w.player.y, value: w.time });
  } else w.phase = 'cleared';
  return true;
}

/** Escolhe uma das bênçãos da oferenda de um baú. A luta volta de onde parou. */
export function chooseOffer(w: World, index: number, restat: (blessings: BlessingId[]) => HeroStats): boolean {
  if (!w.offer || !w.offer[index]) return false;
  const id = w.offer[index];
  w.offer = null;
  grantBlessing(w, id, restat, 'baú');
  return true;
}

function grantBlessing(w: World, id: BlessingId, restat: (blessings: BlessingId[]) => HeroStats, from?: string): void {
  const p = w.player, before = w.stats.maxHp, dodges = w.stats.dodgeCharges;
  w.blessings.push(id);
  w.stats = restat(w.blessings);
  /* quem ganha vida máxima cura a diferença; quem ganha esquiva ou poção já sai com ela */
  if (w.stats.maxHp > before) healPlayer(w, w.stats.maxHp - before, true);
  if (id === 'cura') { healPlayer(w, w.stats.maxHp * 0.6, true); p.potions = w.stats.potions; }
  if (id === 'cantil') p.potions = Math.min(w.stats.potions, p.potions + 1);
  if (id === 'amparo') p.shield = true;
  if (w.stats.dodgeCharges > dodges) p.dodgeCharges = Math.min(w.stats.dodgeCharges, p.dodgeCharges + w.stats.dodgeCharges - dodges);
  p.hp = Math.min(p.hp, w.stats.maxHp); p.mana = Math.min(p.mana, w.stats.maxMana);
  emit(w, { type: 'blessing', x: p.x, y: p.y, kind: id, text: from });
}

export function step(w: World, inp: Input, dt: number): void {
  w.tick++;
  if (w.phase === 'won' || w.phase === 'lost' || w.offer) return;
  const p = w.player;
  if (w.phase === 'dead') {
    w.deadT += dt; p.stateT += dt;
    if (w.deadT >= 1.7) {
      if (w.revives > 0) {
        w.revives--;
        startRoom(w, w.room, true);
        p.hp = Math.round(w.stats.maxHp * PLAYER.reviveHp); p.mana = w.stats.maxMana;
        emit(w, { type: 'revive', x: p.x, y: p.y });
      } else {
        w.phase = 'lost';
        flushLoot(w);
        emit(w, { type: 'lose', x: p.x, y: p.y });
      }
    }
    return;
  }
  if (w.phase === 'fight') w.time += dt;
  updatePlayer(w, inp, dt);
  updatePet(w, inp, dt);
  updateAllies(w, dt);
  updateTerrain(w, dt);
  if (w.phase === 'fight') {
    /* quem está perto de um Caramujo-Concha fica protegido; quem pisa em poça fica Molhado */
    const shells = w.enemies.filter((e) => e.kind === 'caramujo' && e.hp > 0 && e.state !== 'spawn');
    const soak = w.tick % 15 === 0;
    for (const e of w.enemies) {
      e.wetT = max0(e.wetT - dt); e.markT = max0(e.markT - dt); e.bubbleT = max0(e.bubbleT - dt);
      e.exposeT = max0(e.exposeT - dt);
      /* a Casca quebrada volta depois de um tempo */
      if (e.shellMax > 0 && e.shell <= 0 && e.hp > 0) { e.shellT -= dt; if (e.shellT <= 0) { e.shell = e.shellMax; emit(w, { type: 'shellBack', x: e.x, y: e.y, id: e.id }); } }
      e.guarded = shells.some((c) => c !== e && Math.hypot(c.x - e.x, c.y - e.y) < ENEMY.caramujo.aura * (c.elite ? 1.3 : 1));
      if (soak && !e.hidden && (w.flooded || w.puddles.some((q) => Math.hypot(e.x - q.x, e.y - q.y) < q.r) || w.zones.some((z) => z.kind === 'puddle' && Math.hypot(e.x - z.x, e.y - z.y) < z.r))) wet(w, e);
      updateEnemy(w, e, dt);
    }
    separate(w);
  }
  updateProjectiles(w, dt);
  updateZones(w, dt);
  updateHazards(w, dt);
  updateLoot(w, dt);
  w.enemies = w.enemies.filter((e) => e.hp > 0);
  if ((w.phase as string) === 'dead') return;
  if (w.phase === 'fight') updateWaves(w, dt);
  else if (w.phase === 'cleared') {
    const z = exitZone(w);
    if (p.x >= z.x && Math.abs(p.y - z.y) <= z.h) startRoom(w, w.room + 1);
  }
}

function updateWaves(w: World, dt: number): void {
  const room = w.cfg.rooms[w.room], alive = w.enemies.filter((e) => !e.fake && !e.illusion).length;
  const lastWave = w.wave >= room.waves.length - 1;
  /* a onda seguinte entra quando a atual está quase no fim, para não haver respiro */
  const size = w.wave >= 0 ? room.waves[w.wave].length : 0;
  if (alive > (lastWave ? 0 : Math.max(1, Math.round(size * WAVE_OVERLAP))) && !(w.wave < 0)) return;
  if (lastWave) {
    if (alive > 0 || w.hazards.length) return;
    w.projectiles = []; w.roomsCleared++;
    for (const e of w.enemies) e.hp = 0;
    w.enemies = [];
    lootOnRoomClear(w);
    if (w.room >= w.cfg.rooms.length - 1) {
      flushLoot(w);
      w.phase = 'won';
      emit(w, { type: 'win', x: w.player.x, y: w.player.y, value: w.time });
    } else {
      w.phase = 'cleared';
      emit(w, { type: 'roomClear', x: w.player.x, y: w.player.y, value: w.room });
    }
    return;
  }
  w.waveTimer += dt;
  if (w.waveTimer >= WAVE_DELAY) {
    w.waveTimer = 0; w.wave++;
    for (const def of room.waves[w.wave]) {
      const pos = { x: def.x, y: def.y };
      clampArena(w, pos, 20);
      spawnEnemy(w, { ...def, ...pos });
    }
    /* Pantanal: cópias falsas de alguns monstros da onda */
    const wv = room.waves[w.wave];
    for (let i = 0; i < (room.illusions ?? 0) && wv.length; i++) {
      const src = wv[Math.floor(rand(w) * wv.length)], pos = { x: src.x + (rand(w) - 0.5) * 160, y: src.y + (rand(w) - 0.5) * 140 };
      clampArena(w, pos, 20);
      const e = spawnEnemy(w, { kind: src.kind, x: pos.x, y: pos.y });
      e.illusion = true; e.hp = e.maxHp = 1; e.dmg *= 0.3;
    }
    emit(w, { type: 'wave', x: 0, y: 0, value: w.wave, kind: String(room.waves.length) });
    lootOnWave(w);
  }
}

/** Resumo do estado, para comparar duas simulações nos testes. */
export function fingerprint(w: World): string {
  const r = (v: number) => Math.round(v * 100) / 100;
  return JSON.stringify([
    w.tick, w.phase, w.room, w.wave, r(w.player.x), r(w.player.y), Math.round(w.player.hp), r(w.player.mana),
    w.enemies.map((e) => [e.id, e.kind, e.state, r(e.x), r(e.y), e.hp]),
    w.projectiles.length, w.hazards.length, w.rng, w.loot.rng, Math.round(w.loot.gold), w.loot.chests,
  ]);
}
