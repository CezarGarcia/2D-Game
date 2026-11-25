/**
 * Achados dentro da fase: baús que caem dos monstros, moedas e orbes, potes de barro, a Mãe-do-Ouro
 * e o desafio da sala. Os números estão em src/data/loot.ts.
 *
 * Tudo aqui sorteia com a semente própria dos achados (`lootRand`), separada da do combate: um baú a
 * mais ou a menos não muda o que os monstros fazem, e a mesma semente dá sempre os mesmos baús.
 */
import { fcos, fexp, fhypot, fsin } from './fmath';
import { ARENA } from '../data/balance';
import { BLESSINGS, BLESSING_ORDER, BLESSING_WEIGHT, ELEMENT_ORDER, blessingCounts, type BlessingId } from '../data/content';
import {
  BUFFS, BUFF_ORDER, CHALLENGE, CHESTS, CHEST_DROP, CHEST_HEAL, CHEST_ORDER, DROPS, FLUSH_BONUS, OFFER_EXCLUDE, PICKUP, POTS, WISP,
  type BuffId, type ChestPrize, type ChestTier,
} from '../data/loot';
import { stageGold } from '../data/progression';
import type { RoomDef } from '../data/stages';
import { clampArena, emit, healPlayer, isBoss } from './core';
import type { Buff, Chest, Enemy, Pickup, World } from './types';

const TAU = Math.PI * 2;

/** Sorteio dos achados: mesma conta de `rand`, com a semente própria. */
export function lootRand(w: World): number {
  const L = w.loot;
  L.rng = (L.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(L.rng ^ (L.rng >>> 15), 1 | L.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function weighted<K extends string>(w: World, table: Record<K, number>): K {
  const keys = Object.keys(table) as K[];
  let total = 0;
  for (const k of keys) total += table[k];
  let roll = lootRand(w) * total;
  for (const k of keys) { roll -= table[k]; if (roll < 0 && table[k] > 0) return k; }
  return keys.filter((k) => table[k] > 0).pop()!;
}

/** Ouro base da sala atual (a Torre muda de nível a cada andar). */
const base = (w: World): number => stageGold(w.level);

/* ---------- efeitos de baú ---------- */

export function buffOf(w: World, id: BuffId): Buff | undefined {
  return w.buffs.find((b) => b.id === id);
}
/** Força do efeito, ou 0 se não está ativo. */
export function buffPower(w: World, id: BuffId): number {
  return buffOf(w, id) ? BUFFS[id].power : 0;
}

export function addBuff(w: World, id: BuffId): Buff {
  const p = w.player;
  let b = buffOf(w, id);
  if (!b) { b = { id, t: 0, dur: BUFFS[id].duration, value: 0 }; w.buffs.push(b); }
  b.t = 0;
  if (id === 'jabuti') b.value = Math.round(w.stats.maxHp * BUFFS.jabuti.power);
  if (id === 'elemento') b.el = ELEMENT_ORDER[Math.floor(lootRand(w) * ELEMENT_ORDER.length)];
  emit(w, { type: 'buff', x: p.x, y: p.y, kind: id, text: b.el });
  return b;
}

/** Carapaça de Jabuti: absorve o dano que puder. Devolve o que sobra para a vida. */
export function absorbGuard(w: World, dmg: number): number {
  const b = buffOf(w, 'jabuti');
  if (!b || b.value <= 0) return dmg;
  const take = Math.min(b.value, dmg);
  b.value -= take;
  emit(w, { type: 'guard', x: w.player.x, y: w.player.y, value: Math.round(take), kind: b.value <= 0 ? 'quebrou' : undefined });
  if (b.value <= 0) b.t = b.dur;
  return dmg - take;
}

/* ---------- moedas e orbes ---------- */

function spawnPickup(w: World, kind: Pickup['kind'], x: number, y: number, value: number, speed = 1): void {
  const a = lootRand(w) * TAU, v = (110 + lootRand(w) * 170) * speed;
  w.pickups.push({ id: w.nextId++, kind, x, y, vx: fcos(a) * v, vy: fsin(a) * v * 0.7, t: 0, value });
}

function coins(w: World, x: number, y: number, n: number, each: number, speed = 1): void {
  for (let i = 0; i < n; i++) spawnPickup(w, 'moeda', x, y, each, speed);
}

function collect(w: World, k: Pickup, quiet = false): void {
  const p = w.player, s = w.stats;
  if (k.kind === 'moeda') {
    const v = k.value * (1 + buffPower(w, 'ima'));
    w.loot.gold += v;
    if (!quiet) emit(w, { type: 'pickup', x: p.x, y: p.y, kind: 'moeda', value: v });
  } else if (k.kind === 'vida') {
    if (quiet) return;
    healPlayer(w, s.maxHp * DROPS.orb.heal, true);
    emit(w, { type: 'pickup', x: p.x, y: p.y, kind: 'vida', value: Math.round(s.maxHp * DROPS.orb.heal * s.healMult) });
  } else {
    if (quiet) return;
    const v = s.maxMana * DROPS.orb.manaGain;
    p.mana = Math.min(s.maxMana, p.mana + v);
    emit(w, { type: 'pickup', x: p.x, y: p.y, kind: 'mana', value: Math.round(v) });
  }
}

/* ---------- baús ---------- */

export function dropChest(w: World, tier: ChestTier, x: number, y: number): Chest {
  const a = lootRand(w) * TAU, d = 30 + lootRand(w) * 30, to = { x: x + fcos(a) * d, y: y + fsin(a) * d * 0.6 };
  clampArena(w, to, 40);
  const c: Chest = { id: w.nextId++, tier, x: to.x, y: to.y, sx: x, sy: y, t: 0, open: -1 };
  w.chests.push(c);
  w.loot.since = 0;
  emit(w, { type: 'chest', x: c.x, y: c.y, kind: tier, id: c.id });
  return c;
}

/** Bênçãos de uma oferenda: só as mais simples, sem passar do limite de cada uma. */
export function rollOffer(w: World, n: number, maxTier: 1 | 2): BlessingId[] {
  const have = blessingCounts(w.blessings), s = w.stats, picks: BlessingId[] = [];
  const pool = BLESSING_ORDER.filter((b) => BLESSINGS[b].tier <= maxTier && !OFFER_EXCLUDE.includes(b) && (have[b] ?? 0) < BLESSINGS[b].max && (b !== 'parceria' || !!s.companion));
  while (picks.length < n && pool.length) {
    let total = 0;
    for (const b of pool) total += BLESSING_WEIGHT[BLESSINGS[b].tier];
    let roll = lootRand(w) * total, at = pool.length - 1;
    for (let i = 0; i < pool.length; i++) { roll -= BLESSING_WEIGHT[BLESSINGS[pool[i]].tier]; if (roll <= 0) { at = i; break; } }
    picks.push(pool.splice(at, 1)[0]);
  }
  return picks;
}

/**
 * Abre o baú. Com `auto` (a sala ou a fase acabou e ninguém abriu), as moedas vão direto para a bolsa
 * e o prêmio vira ouro, porque não há mais luta para aproveitá-lo.
 */
export function openChest(w: World, c: Chest, auto = false): void {
  if (c.open >= 0) return;
  const def = CHESTS[c.tier], gold = Math.max(1, Math.round(base(w) * def.gold));
  c.open = 0;
  w.loot.chests++;
  let prize: ChestPrize = weighted(w, def.prize);
  if (prize === 'oferenda' && (auto || w.offer)) prize = auto ? 'oferenda' : 'efeito';
  if (auto) {
    const v = gold * (1 + FLUSH_BONUS[prize]);
    w.loot.gold += v;
    emit(w, { type: 'chestOpen', x: c.x, y: c.y, kind: c.tier, id: c.id, text: 'auto', value: Math.round(v) });
    return;
  }
  coins(w, c.x, c.y - 10, def.coins, gold / def.coins);
  let text: string = prize;
  if (prize === 'cura') {
    healPlayer(w, w.stats.maxHp * CHEST_HEAL, true);
  } else if (prize === 'efeito') {
    text = 'efeito:' + addBuff(w, BUFF_ORDER[Math.floor(lootRand(w) * BUFF_ORDER.length)]).id;
  } else if (prize === 'oferenda') {
    const list = rollOffer(w, def.offer, def.offerTier);
    if (list.length) w.offer = list;
    else text = 'efeito:' + addBuff(w, BUFF_ORDER[Math.floor(lootRand(w) * BUFF_ORDER.length)]).id;
  }
  emit(w, { type: 'chestOpen', x: c.x, y: c.y, kind: c.tier, id: c.id, text, value: gold });
  if (w.offer) emit(w, { type: 'offer', x: c.x, y: c.y, kind: c.tier });
}

/** Baús fechados e moedas que ficaram no chão vão para a bolsa: nada se perde ao trocar de sala ou ao acabar a fase. */
export function flushLoot(w: World): void {
  for (const c of w.chests) if (c.open < 0) openChest(w, c, true);
  for (const k of w.pickups) collect(w, k, true);
  w.chests = []; w.pickups = [];
}

/* ---------- mortes ---------- */

export function lootOnKill(w: World, e: Enemy): void {
  if (e.illusion || e.fake) return;
  const room = w.cfg.rooms[w.room], boss = isBoss(e), x = e.x, y = e.y;
  const each = base(w) * DROPS.coin.value;
  /* moedas: elites e campeões sempre, monstro comum às vezes; com o Ímã de Ouro, todos */
  const n = e.elite || boss ? DROPS.coin.elite : e.champion ? DROPS.coin.champion : lootRand(w) < DROPS.coin.monster || buffOf(w, 'ima') ? 1 : 0;
  coins(w, x, y - 10, n, each);
  /* orbes */
  const r = lootRand(w);
  if (r < DROPS.orb.life) spawnPickup(w, 'vida', x, y - 10, 0);
  else if (r < DROPS.orb.life + DROPS.orb.mana) spawnPickup(w, 'mana', x, y - 10, 0);
  /* baús: chefão da sala final e o grande elite da fase 11 sempre deixam */
  if (boss && (room.type === 'boss' || room.type === 'elite')) { dropChest(w, room.type === 'boss' ? 'encantado' : 'dourado', x, y); return; }
  const kind = e.elite || boss ? CHEST_DROP.elite : e.champion ? CHEST_DROP.champion : CHEST_DROP.monster;
  const closed = w.chests.filter((c) => c.open < 0).length;
  w.loot.since++;
  if (closed >= CHEST_DROP.maxOnFloor) return;
  if (lootRand(w) < kind.chance + CHEST_DROP.pity * w.loot.since) dropChest(w, weighted(w, kind.tiers), x, y);
}

/* ---------- salas ---------- */

/** Começo de sala: guarda o que ficou da sala anterior, espalha os potes e às vezes propõe um desafio. */
export function startRoomLoot(w: World, room: RoomDef, index: number, revive: boolean): void {
  flushLoot(w);
  w.wisp = null;
  if (revive) { if (w.challenge?.state === 'ativo') w.challenge.state = 'perdido'; return; }
  w.pots = []; w.challenge = null;
  if (room.type === 'altar' || room.training) return;
  /* a sala do chefão fica limpa */
  const n = room.type === 'boss' ? 0 : Math.floor(lootRand(w) * (POTS.max + 1));
  for (let i = 0; i < n; i++) {
    const x = ARENA.x0 + 220 + lootRand(w) * (ARENA.x1 - ARENA.x0 - 340), y = ARENA.y0 + 40 + lootRand(w) * (ARENA.y1 - ARENA.y0 - 80);
    w.pots.push({ id: w.nextId++, x, y });
  }
  if (room.trial) {
    /* Provação do Sonho: a sala inteira é o desafio */
    w.loot.challenges++;
    w.challenge = { kind: room.trial.kind, limit: room.trial.limit, hits0: w.hitsTaken, t0: w.time, state: 'ativo', x: (ARENA.x0 + ARENA.x1) / 2, y: ARENA.y0 + 34 };
    emit(w, { type: 'challenge', x: w.challenge.x, y: w.challenge.y, kind: 'start', text: w.challenge.kind, value: w.challenge.limit });
    return;
  }
  if (room.type === 'combat' && index > 0 && w.loot.challenges < CHALLENGE.perStage && room.waves.some((wv) => wv.length) && lootRand(w) < CHALLENGE.chance) {
    w.loot.challenges++;
    const enemies = room.waves.reduce((a, wv) => a + wv.length, 0), fast = lootRand(w) < 0.5;
    w.challenge = {
      kind: fast ? 'ligeiro' : 'intocado', limit: fast ? Math.round(CHALLENGE.time.base + CHALLENGE.time.perEnemy * enemies) : CHALLENGE.hits,
      hits0: w.hitsTaken, t0: w.time, state: 'ativo', x: (ARENA.x0 + ARENA.x1) / 2, y: ARENA.y0 + 34,
    };
    emit(w, { type: 'challenge', x: w.challenge.x, y: w.challenge.y, kind: 'start', text: w.challenge.kind, value: w.challenge.limit });
  }
}

/** Uma onda entrou: na primeira de uma sala comum, às vezes aparece a Mãe-do-Ouro. */
export function lootOnWave(w: World): void {
  const room = w.cfg.rooms[w.room];
  if (w.wave !== 0 || room.type !== 'combat' || w.wisp || w.loot.wisps >= WISP.perStage || lootRand(w) >= WISP.chance) return;
  w.loot.wisps++;
  const left = lootRand(w) < 0.5, y = ARENA.y0 + 60 + lootRand(w) * (ARENA.y1 - ARENA.y0 - 120);
  w.wisp = { id: w.nextId++, x: left ? ARENA.x0 + 40 : ARENA.x1 - 40, y, vx: 0, vy: 0, t: 0, dur: WISP.duration, hits: 0, need: WISP.hits, cd: 0, flash: 0 };
  emit(w, { type: 'wisp', x: w.wisp.x, y: w.wisp.y, kind: 'appear' });
}

/** A sala ficou limpa: o desafio, se ainda valia, vira baú dourado. */
export function lootOnRoomClear(w: World): void {
  const ch = w.challenge;
  if (!ch || ch.state !== 'ativo') return;
  ch.state = 'vencido';
  emit(w, { type: 'challenge', x: ch.x, y: ch.y, kind: 'won' });
  dropChest(w, 'dourado', ch.x, ch.y + 70);
}

/* ---------- golpes em potes e na Mãe-do-Ouro ---------- */

/**
 * Golpe do herói que pode acertar um pote ou a Mãe-do-Ouro. `hits(x, y, r)` diz se o golpe pega
 * um círculo de raio `r` em (x, y). Devolve true se acertou algo.
 */
export function lootHit(w: World, hits: (x: number, y: number, r: number) => boolean): boolean {
  let any = false;
  if (w.pots.length) {
    w.pots = w.pots.filter((pt) => {
      if (!hits(pt.x, pt.y - 18, 22)) return true;
      any = true;
      emit(w, { type: 'pot', x: pt.x, y: pt.y, id: pt.id });
      coins(w, pt.x, pt.y - 16, POTS.coins + (lootRand(w) < 0.5 ? 1 : 0), base(w) * POTS.value, 0.8);
      if (lootRand(w) < POTS.orb) spawnPickup(w, lootRand(w) < POTS.life ? 'vida' : 'mana', pt.x, pt.y - 16, 0, 0.6);
      return false;
    });
  }
  const m = w.wisp;
  if (m && m.cd <= 0 && hits(m.x, m.y - 40, WISP.radius)) {
    any = true;
    m.hits++; m.cd = WISP.hitCd; m.flash = 0.12;
    if (m.hits >= m.need) {
      emit(w, { type: 'wisp', x: m.x, y: m.y - 40, kind: 'caught' });
      coins(w, m.x, m.y - 30, 4, base(w) * DROPS.coin.value * 2, 1.3);
      dropChest(w, 'dourado', m.x, m.y);
      w.wisp = null;
    } else emit(w, { type: 'wisp', x: m.x, y: m.y - 40, kind: 'hit', value: m.need - m.hits });
  }
  return any;
}

/* ---------- passo ---------- */

export function updateLoot(w: World, dt: number): void {
  const p = w.player, fighting = w.phase === 'fight', alive = p.state !== 'dead';
  /* efeitos: o relógio só anda com luta */
  if (fighting && w.buffs.length) {
    w.buffs = w.buffs.filter((b) => {
      b.t += dt;
      if (b.t < b.dur) return true;
      emit(w, { type: 'buffEnd', x: p.x, y: p.y, kind: b.id });
      return false;
    });
  }
  /* baús: abrem quando o herói encosta */
  for (const c of w.chests) {
    c.t += dt;
    if (c.open >= 0) c.open += dt;
    else if (alive && !w.offer && c.t >= 0.5 && fhypot(p.x - c.x, p.y - c.y) < PICKUP.open) openChest(w, c);
  }
  if (w.chests.length) w.chests = w.chests.filter((c) => c.open < 0 || c.open < 1.6);
  /* moedas e orbes: atrito, ímã e coleta. Com a sala limpa, tudo corre para o herói */
  if (w.pickups.length) {
    const reach = w.phase !== 'fight' || buffOf(w, 'ima') ? 1e9 : PICKUP.magnet, drag = fexp(-4 * dt);
    w.pickups = w.pickups.filter((k) => {
      k.t += dt;
      const dx = p.x - k.x, dy = p.y - 20 - k.y, d = fhypot(dx, dy) || 1;
      if (k.t >= PICKUP.delay && alive && d < reach) {
        const v = Math.min(PICKUP.pull, 260 + 1600 * (k.t - PICKUP.delay));
        k.vx = (dx / d) * v; k.vy = (dy / d) * v;
        if (d < PICKUP.grab + v * dt) { collect(w, k); return false; }
      } else { k.vx *= drag; k.vy *= drag; }
      k.x += k.vx * dt; k.y += k.vy * dt;
      clampArena(w, k, 10);
      return true;
    });
  }
  /* Mãe-do-Ouro: foge do herói em zigue-zague e some quando o tempo acaba */
  const m = w.wisp;
  if (m) {
    m.t += dt; m.cd = Math.max(0, m.cd - dt); m.flash = Math.max(0, m.flash - dt);
    if (m.t >= m.dur) { emit(w, { type: 'wisp', x: m.x, y: m.y - 40, kind: 'gone' }); w.wisp = null; }
    else {
      let ax = m.x - p.x, ay = m.y - p.y;
      const d = fhypot(ax, ay) || 1, wob = fsin(m.t * 3.1 + m.id) * 0.9;
      ax /= d; ay /= d;
      /* longe do herói ela passeia; perto, corre */
      const urge = d < 360 ? 1 : 0.45, cx = (ARENA.x0 + ARENA.x1) / 2 - m.x, cy = (ARENA.y0 + ARENA.y1) / 2 - m.y;
      let vx = ax - ay * wob + cx * 0.0015, vy = ay + ax * wob + cy * 0.0025;
      const len = fhypot(vx, vy) || 1;
      vx = (vx / len) * WISP.speed * urge; vy = (vy / len) * WISP.speed * urge;
      const k = 1 - fexp(-5 * dt);
      m.vx += (vx - m.vx) * k; m.vy += (vy - m.vy) * k;
      m.x += m.vx * dt; m.y += m.vy * dt;
      clampArena(w, m, 30);
    }
  }
  /* desafio */
  const ch = w.challenge;
  if (ch && ch.state === 'ativo' && fighting) {
    const failed = ch.kind === 'intocado' ? w.hitsTaken - ch.hits0 > ch.limit : w.time - ch.t0 > ch.limit;
    if (failed) { ch.state = 'perdido'; emit(w, { type: 'challenge', x: ch.x, y: ch.y, kind: 'lost' }); }
  }
}

/** Quanto tempo ainda resta ao desafio ligeiro (para o HUD). */
export function challengeLeft(w: World): number {
  const ch = w.challenge;
  if (!ch || ch.kind !== 'ligeiro') return 0;
  return Math.max(0, ch.limit - (w.time - ch.t0));
}

export { CHEST_ORDER };
