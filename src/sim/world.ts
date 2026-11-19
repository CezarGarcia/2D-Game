/**
 * Simulação de uma fase: sequência de salas, ondas, altar, quedas e vitória.
 * Não depende do Phaser nem do navegador: recebe comandos, avança um passo fixo e devolve eventos.
 * Isso permite testar as regras sem tela e, mais adiante, gravar partidas e conferi-las no servidor.
 */
import { ARENA, PLAYER, WAVE_DELAY } from '../data/balance';
import { BLESSING_ORDER, MAX_POTIONS, type BlessingId } from '../data/content';
import { levelCombatModifiers } from '../data/progression';
import type { HeroStats } from '../meta/stats';
import { clampArena, emit, healPlayer, rand, spawnEnemy } from './core';
import { separate, updateEnemy } from './enemies';
import { makePet, updateHazards, updatePet, updatePlayer, updateProjectiles, updateZones } from './player';
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
    potions: Math.min(MAX_POTIONS, stats.potions), potionCd: 0,
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
    blessings: [], altar: null,
    revives: PLAYER.revives, deaths: 0, deadT: 0,
    kills: 0, perfects: 0, hitsTaken: 0, roomsCleared: 0, bossTime: 0,
    spells: cfg.stats.loadout.slice(0, 3),
  };
  w.pet = makePet(w);
  startRoom(w, 0);
  return w;
}

/** Zona de saída: aparece na borda direita quando a sala está limpa. */
export function exitZone(w: World): { x: number; y: number; h: number } {
  return { x: w.arena.x1 - 46, y: (w.arena.y0 + w.arena.y1) / 2, h: 120 };
}

function startRoom(w: World, index: number): void {
  const p = w.player, room = w.cfg.rooms[index];
  w.room = index;
  w.arena = { ...ARENA };
  w.enemies = []; w.projectiles = []; w.hazards = []; w.zones = [];
  w.wave = -1; w.waveTimer = WAVE_DELAY - 0.5; w.bossTime = 0; w.altar = null;
  p.x = ARENA.x0 + 100; p.y = (ARENA.y0 + ARENA.y1) / 2;
  p.kx = p.ky = 0; p.state = 'idle'; p.stateT = 0; p.charge = 0; p.slowT = 0; p.iframes = 0; p.hurtInv = 0;
  const pet = w.pet;
  if (pet) {
    if (pet.state === 'down') { pet.state = 'follow'; pet.hp = Math.round(pet.maxHp * 0.6); }
    pet.x = p.x - 50; pet.y = p.y + 18; pet.tauntT = 0;
  }
  if (room.type === 'altar') {
    const pool = BLESSING_ORDER.filter((b) => !w.blessings.includes(b)), picks: BlessingId[] = [];
    while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(rand(w) * pool.length), 1)[0]);
    w.altar = picks; w.phase = 'altar';
    emit(w, { type: 'altar', x: (ARENA.x0 + ARENA.x1) / 2, y: (ARENA.y0 + ARENA.y1) / 2 });
  } else w.phase = 'fight';
  emit(w, { type: 'roomStart', x: p.x, y: p.y, value: index, kind: room.type });
}

/**
 * Escolhe uma das bênçãos do altar. `restat` recalcula os números do herói com a lista nova
 * (a simulação não conhece o perfil; quem conhece é quem a chama).
 */
export function chooseBlessing(w: World, index: number, restat: (blessings: BlessingId[]) => HeroStats): boolean {
  if (w.phase !== 'altar' || !w.altar || !w.altar[index]) return false;
  const id = w.altar[index], p = w.player, before = w.stats.maxHp;
  w.blessings.push(id);
  w.stats = restat(w.blessings);
  if (id === 'vigor') healPlayer(w, w.stats.maxHp - before, true);
  if (id === 'cura') { healPlayer(w, w.stats.maxHp * 0.6, true); p.potions = MAX_POTIONS; }
  p.hp = Math.min(p.hp, w.stats.maxHp); p.mana = Math.min(p.mana, w.stats.maxMana);
  w.altar = null; w.phase = 'cleared'; w.roomsCleared++;
  emit(w, { type: 'blessing', x: p.x, y: p.y, kind: id });
  return true;
}

export function step(w: World, inp: Input, dt: number): void {
  w.tick++;
  if (w.phase === 'won' || w.phase === 'lost') return;
  const p = w.player;
  if (w.phase === 'dead') {
    w.deadT += dt; p.stateT += dt;
    if (w.deadT >= 1.7) {
      if (w.revives > 0) {
        w.revives--;
        startRoom(w, w.room);
        p.hp = Math.round(w.stats.maxHp * PLAYER.reviveHp); p.mana = w.stats.maxMana;
        emit(w, { type: 'revive', x: p.x, y: p.y });
      } else {
        w.phase = 'lost';
        emit(w, { type: 'lose', x: p.x, y: p.y });
      }
    }
    return;
  }
  if (w.phase === 'fight') w.time += dt;
  updatePlayer(w, inp, dt);
  updatePet(w, inp, dt);
  if (w.phase === 'fight') {
    for (const e of w.enemies) updateEnemy(w, e, dt);
    separate(w);
  }
  updateProjectiles(w, dt);
  updateZones(w, dt);
  updateHazards(w, dt);
  w.enemies = w.enemies.filter((e) => e.hp > 0);
  if ((w.phase as string) === 'dead') return;
  if (w.phase === 'fight') updateWaves(w, dt);
  else if (w.phase === 'cleared') {
    const z = exitZone(w);
    if (p.x >= z.x && Math.abs(p.y - z.y) <= z.h) startRoom(w, w.room + 1);
  }
}

function updateWaves(w: World, dt: number): void {
  if (w.enemies.some((e) => !e.fake)) return;
  const room = w.cfg.rooms[w.room];
  if (w.wave >= room.waves.length - 1) {
    if (w.hazards.length) return;
    w.projectiles = []; w.roomsCleared++;
    for (const e of w.enemies) e.hp = 0;
    w.enemies = [];
    if (w.room >= w.cfg.rooms.length - 1) {
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
    emit(w, { type: 'wave', x: 0, y: 0, value: w.wave, kind: String(room.waves.length) });
  }
}

/** Resumo do estado, para comparar duas simulações nos testes. */
export function fingerprint(w: World): string {
  const r = (v: number) => Math.round(v * 100) / 100;
  return JSON.stringify([
    w.tick, w.phase, w.room, w.wave, r(w.player.x), r(w.player.y), Math.round(w.player.hp), r(w.player.mana),
    w.enemies.map((e) => [e.id, e.kind, e.state, r(e.x), r(e.y), e.hp]),
    w.projectiles.length, w.hazards.length, w.rng,
  ]);
}
