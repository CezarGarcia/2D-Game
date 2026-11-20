/**
 * O que cada capítulo muda nas salas (docs/gdd/05): redemoinhos do Sertão, capim que pega fogo no Cerrado,
 * a lua do Pampa e os feitiços apagados da Terra Sem Nome. O escuro da Selva e as ilusões do Pantanal
 * são de desenho e de onda (veja world.ts).
 */
import type { RoomDef } from '../data/stages';
import { damageEnemy, emit, hurtPlayer, isBoss, rand, spellScale } from './core';
import { applyElement } from './status';
import type { World } from './types';

export const DEVIL = { r: 52, speed: 105, throw: 520, damage: 9, stun: 0.3 };
export const GRASS = { r: 46, burn: 4, spread: 130, spreadAt: 1.0, damage: 7 };
export const MOON = { fill: 60 };
export const ERASE = { every: 14 };

export function startTerrain(w: World, room: RoomDef): void {
  const a = w.arena;
  w.devils = []; w.walls = []; w.trail = []; w.moon = 0; w.eraseT = ERASE.every;
  w.grass = (room.grass ?? []).map((g) => ({ x: g.x, y: g.y, r: GRASS.r, burnT: 0, burnt: false }));
  for (let i = 0; i < (room.whirls ?? 0); i++) {
    const ang = rand(w) * Math.PI * 2;
    w.devils.push({ id: w.nextId++, x: a.x0 + 300 + rand(w) * (a.x1 - a.x0 - 400), y: a.y0 + 80 + rand(w) * (a.y1 - a.y0 - 160), vx: Math.cos(ang) * DEVIL.speed, vy: Math.sin(ang) * DEVIL.speed, r: DEVIL.r, t: 0, dur: Infinity });
  }
}

/** Acende o capim em volta de um ponto (golpes de fogo, chão em chamas, inimigos queimando). */
export function igniteAt(w: World, x: number, y: number, r: number): void {
  for (const g of w.grass) if (!g.burnt && g.burnT <= 0 && Math.hypot(g.x - x, g.y - y) < g.r + r) { g.burnT = GRASS.burn; emit(w, { type: 'ignite', x: g.x, y: g.y }); }
}

export function updateTerrain(w: World, dt: number): void {
  const p = w.player, a = w.arena, room = w.cfg.rooms[w.room], fighting = w.phase === 'fight';
  /* redemoinhos: andam pela sala, ricocheteiam nas bordas e arremessam */
  w.devils = w.devils.filter((d) => {
    d.t += dt;
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.x < a.x0 + d.r || d.x > a.x1 - d.r) { d.vx = -d.vx; d.x = Math.max(a.x0 + d.r, Math.min(a.x1 - d.r, d.x)); }
    if (d.y < a.y0 + d.r || d.y > a.y1 - d.r) { d.vy = -d.vy; d.y = Math.max(a.y0 + d.r, Math.min(a.y1 - d.r, d.y)); }
    if (fighting && p.state !== 'dodge' && p.heldT <= 0 && Math.hypot(p.x - d.x, p.y - d.y) < d.r * 0.7) {
      if (hurtPlayer(w, DEVIL.damage * levelDamage(w), d.x, d.y, DEVIL.throw, { element: 'tempestade', unblockable: true })) { p.heldT = DEVIL.stun; emit(w, { type: 'devil', x: p.x, y: p.y }); }
    }
    for (const e of w.enemies) if (!isBoss(e) && !e.hidden && e.state !== 'spawn' && Math.hypot(e.x - d.x, e.y - d.y) < d.r * 0.7) { const k = 300 / (Math.hypot(e.x - d.x, e.y - d.y) || 1); e.kx = (e.x - d.x) * k; e.ky = (e.y - d.y) * k; }
    return d.t < d.dur;
  });
  /* capim: queima, fere quem está dentro e espalha para as touceiras vizinhas */
  for (const g of w.grass) {
    if (g.burnT <= 0) {
      if (!g.burnt) for (const e of w.enemies) if (e.burnT > 0 && Math.hypot(e.x - g.x, e.y - g.y) < g.r) { g.burnT = GRASS.burn; emit(w, { type: 'ignite', x: g.x, y: g.y }); break; }
      continue;
    }
    const before = g.burnT;
    g.burnT -= dt;
    if (before > GRASS.burn - GRASS.spreadAt && g.burnT <= GRASS.burn - GRASS.spreadAt) for (const o of w.grass) if (o !== g && !o.burnt && o.burnT <= 0 && Math.hypot(o.x - g.x, o.y - g.y) < GRASS.spread) { o.burnT = GRASS.burn; emit(w, { type: 'ignite', x: o.x, y: o.y }); }
    if (Math.floor(before * 2) !== Math.floor(g.burnT * 2)) {
      if (Math.hypot(p.x - g.x, p.y - g.y) < g.r && p.state !== 'dodge') hurtPlayer(w, GRASS.damage * levelDamage(w), g.x, g.y, 0, { element: 'fogo', soft: true, unblockable: true });
      for (const e of w.enemies) if (e.hp > 0 && !e.hidden && Math.hypot(e.x - g.x, e.y - g.y) < g.r) { applyElement(w, e, 'fogo'); damageEnemy(w, e, GRASS.damage * spellScale(w) * 0.5, 'burn', 0, false, 'fogo'); }
    }
    if (g.burnT <= 0) { g.burnT = 0; g.burnt = true; }
  }
  if (!fighting) return;
  /* lua do Pampa: enche durante a sala (o Lobisomem tem a própria) */
  if (room.moon && !w.enemies.some((e) => e.kind === 'lobisomem')) {
    const before = w.moon;
    w.moon = Math.min(1, w.moon + dt / MOON.fill);
    if (Math.floor(before * 4) !== Math.floor(w.moon * 4)) emit(w, { type: 'moon', x: p.x, y: p.y, value: w.moon });
  }
  /* Terra Sem Nome: de tempos em tempos um feitiço é apagado até o fim da sala */
  if (room.erase && w.enemies.length) {
    w.eraseT -= dt;
    if (w.eraseT <= 0) {
      w.eraseT = ERASE.every;
      const slots = [0, 1, 2].filter((i) => w.spells[i] && p.erased[i] <= 0 && p.stolen !== i);
      if (slots.length > 1) { const i = slots[Math.floor(rand(w) * slots.length)]; p.erased[i] = Infinity; emit(w, { type: 'erase', x: p.x, y: p.y, value: i }); }
    }
  }
}

function levelDamage(w: World): number {
  return (1 + 0.26 * w.level) / 1.26;
}
