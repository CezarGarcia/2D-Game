/**
 * Feitiços de Tempestade, Fogo, Terra, Sombra e Encanto (docs/gdd/03), os aliados que alguns deixam
 * (lobos, cópia, estaca, nuvem), a muralha e os Supremos dos Encantados libertados nos capítulos 3 a 7.
 * Os feitiços de Natureza e Água continuam em player.ts.
 */
import { PLAYER } from '../data/balance';
import { ELEMENT_ORDER, SPELLS, SPELL_NUM, SUPREMO_NUM, type ElementId, type SpellId } from '../data/content';
import { clampArena, damageEnemy, emit, healPlayer, isBoss, max0, rand, setState, wrapAngle } from './core';
import { applyElement } from './status';
import { igniteAt } from './terrain';
import type { Enemy, Projectile, World, Zone } from './types';

const hittable = (e: Enemy): boolean => e.hp > 0 && !e.hidden && e.state !== 'spawn';
const N = SPELL_NUM;

function spellShot(w: World, id: SpellId, x: number, y: number, ang: number, speed: number, range: number, damage: number, tex: string): Projectile {
  const pr: Projectile = {
    id: w.nextId++, kind: 'spell', spell: id, element: SPELLS[id].element, tex, x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
    dist: 0, range, damage, pierce: false, hit: [], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner: 0,
  };
  w.projectiles.push(pr);
  return pr;
}

function zone(w: World, z: Omit<Zone, 'id'>): Zone {
  const out = { id: w.nextId++, ...z };
  w.zones.push(out);
  return out;
}

function nearestEnemy(w: World, x: number, y: number, range: number, skip: number[] = []): Enemy | null {
  let best: Enemy | null = null, bd = range;
  for (const e of w.enemies) { if (!hittable(e) || e.fake || skip.includes(e.id)) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
  return best;
}

function aimPoint(w: World, ax: number, ay: number, range: number): { x: number; y: number } {
  const p = w.player;
  let dx = ax - p.x, dy = ay - p.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d > range) { dx = (dx / d) * range; dy = (dy / d) * range; }
  const pos = { x: p.x + dx, y: p.y + dy };
  clampArena(w, pos, 10);
  return pos;
}

function hitArea(w: World, x: number, y: number, r: number, damage: number, el: ElementId | null, fn?: (e: Enemy) => void): void {
  for (const e of w.enemies) {
    if (!hittable(e) || Math.hypot(e.x - x, e.y - y) > r + e.radius * 0.5) continue;
    damageEnemy(w, e, damage, 'spell', Math.atan2(e.y - y, e.x - x), false, el);
    if (e.hp > 0) { if (el) applyElement(w, e, el); fn?.(e); }
  }
}

/**
 * Lança um feitiço dos elementos novos. `power` já tem o poder mágico, o nível do herói e o nível do feitiço.
 * Devolve false se o feitiço não for destes elementos.
 */
export function castNewSpell(w: World, id: SpellId, aim: number, ax: number, ay: number, power: number, lv: number): boolean {
  const p = w.player, s = w.stats, area = s.spellArea, dur = s.durationMult;
  const ox = p.x + Math.cos(aim) * 26, oy = p.y + Math.sin(aim) * 26;
  switch (id) {
    case 'faisca': { const pr = spellShot(w, id, ox, oy, aim, N.faisca.speed, N.faisca.range, N.faisca.damage * power, 'p_faisca'); pr.jumps = N.faisca.jumps + s.projectiles; break; }
    case 'trovao': { const pos = aimPoint(w, ax, ay, N.trovao.range); zone(w, { kind: 'trovao', x: pos.x, y: pos.y, r: N.trovao.radius * area, t: 0, dur: N.trovao.delay, tick: 0, power: N.trovao.damage * power }); break; }
    case 'redemoinho': { const pos = aimPoint(w, ax, ay, N.redemoinho.range); zone(w, { kind: 'redemoinho', x: pos.x, y: pos.y, r: N.redemoinho.radius * area, t: 0, dur: N.redemoinho.duration * dur, tick: 0, power: N.redemoinho.tick * power }); break; }
    case 'pedevento': {
      p.state = 'dodge'; p.stateT = 0; p.charge = 0; p.surf = N.pedevento.damage * power; p.surfKind = 'pedevento';
      p.dx = Math.cos(aim); p.dy = Math.sin(aim); p.iframes = N.pedevento.duration + 0.08; p.perfectUsed = true; p.rolled = [];
      emit(w, { type: 'correnteza', x: p.x, y: p.y, ang: aim, kind: 'vento' });
      break;
    }
    case 'nuvem': w.allies = w.allies.filter((a) => a.kind !== 'cloud'); w.allies.push({ id: w.nextId++, kind: 'cloud', x: p.x, y: p.y - 90, hp: 1, maxHp: 1, t: 0, dur: N.nuvem.duration * dur, cd: 0.3, facing: 1, target: 0, walk: 0, moving: false, power: N.nuvem.damage * power }); break;
    case 'brasa': spellShot(w, id, ox, oy, aim, N.brasa.speed, N.brasa.range, N.brasa.damage * power, 'p_brasa'); break;
    case 'explosao': { const pos = aimPoint(w, ax, ay, N.explosao.range); zone(w, { kind: 'explosao', x: pos.x, y: pos.y, r: N.explosao.radius * area, t: 0, dur: N.explosao.delay, tick: 0, power: N.explosao.damage * power }); break; }
    case 'coivara': {
      const len = N.coivara.length * area;
      zone(w, { kind: 'coivara', x: p.x + Math.cos(aim) * 30, y: p.y + Math.sin(aim) * 30, x2: p.x + Math.cos(aim) * (30 + len), y2: p.y + Math.sin(aim) * (30 + len), r: N.coivara.width / 2 * area, t: 0, dur: N.coivara.duration * dur, tick: 0, power: N.coivara.tick * power });
      break;
    }
    case 'passocinza': {
      zone(w, { kind: 'explosao', x: p.x, y: p.y, r: N.passocinza.radius * area, t: 0, dur: 0.15, tick: 0, power: N.passocinza.damage * power });
      const pos = aimPoint(w, ax, ay, N.passocinza.range);
      emit(w, { type: 'blink', x: p.x, y: p.y, x2: pos.x, y2: pos.y, kind: 'fogo' });
      p.x = pos.x; p.y = pos.y; p.iframes = Math.max(p.iframes, 0.3);
      break;
    }
    case 'fogofatuo': p.orbT = N.fogofatuo.duration * dur; p.orbHit = {}; p.orbPower = N.fogofatuo.damage * power; break;
    case 'pedrada': spellShot(w, id, ox, oy, aim, N.pedrada.speed, N.pedrada.range, N.pedrada.damage * power, 'p_pedra'); break;
    case 'tremor': hitArea(w, p.x, p.y, N.tremor.radius * area, N.tremor.damage * power, 'terra', (e) => { if (!isBoss(e)) { e.stunT = Math.max(e.stunT, N.tremor.stun * dur); e.tele = null; } }); emit(w, { type: 'slam', x: p.x, y: p.y, value: N.tremor.radius * area }); break;
    case 'muralha': {
      const M = N.muralha, cx = p.x + Math.cos(aim) * M.dist, cy = p.y + Math.sin(aim) * M.dist, nx = -Math.sin(aim), ny = Math.cos(aim);
      for (let i = 0; i < M.blocks; i++) { const k = i - (M.blocks - 1) / 2, b = { x: cx + nx * k * M.gap, y: cy + ny * k * M.gap }; clampArena(w, b, M.radius); w.walls.push({ x: b.x, y: b.y, r: M.radius, t: M.duration * dur }); }
      emit(w, { type: 'slam', x: cx, y: cy, value: 60 });
      break;
    }
    case 'pelepedra': p.stoneT = N.pelepedra.duration * dur * (1 + 0.05 * (lv - 1)); break;
    case 'estaca': { const pos = aimPoint(w, ax, ay, N.estaca.range); w.allies.push({ id: w.nextId++, kind: 'turret', x: pos.x, y: pos.y, hp: 1, maxHp: 1, t: 0, dur: N.estaca.duration * dur, cd: 0.4, facing: 1, target: 0, walk: 0, moving: false, power: N.estaca.damage * power }); break; }
    case 'garra': { const G = N.garra, n = G.count + s.projectiles; for (let i = 0; i < n; i++) { const a = aim + (i - (n - 1) / 2) * G.spread; spellShot(w, id, ox, oy, a, G.speed, G.range, G.damage * power, 'p_garra').pierce = s.pierce; } break; }
    case 'uivo': hitArea(w, p.x, p.y, N.uivo.radius * area, N.uivo.damage * power, 'sombra', (e) => { if (!isBoss(e)) { e.fearT = Math.max(e.fearT, N.uivo.fear * dur); e.tele = null; } }); emit(w, { type: 'roar', x: p.x, y: p.y, kind: 'uivo' }); break;
    case 'marcalua': spellShot(w, id, ox, oy, aim, N.marcalua.speed, N.marcalua.range, 0, 'p_garra'); break;
    case 'passosombra': {
      const t = nearestEnemy(w, ax, ay, N.passosombra.range) ?? nearestEnemy(w, p.x, p.y, N.passosombra.range);
      if (t) {
        const a = Math.atan2(t.y - p.y, t.x - p.x), pos = { x: t.x + Math.cos(a) * (t.radius + 26), y: t.y + Math.sin(a) * (t.radius + 26) };
        clampArena(w, pos, 16);
        emit(w, { type: 'blink', x: p.x, y: p.y, x2: pos.x, y2: pos.y, kind: 'sombra' });
        p.x = pos.x; p.y = pos.y; p.facing = t.x >= p.x ? 1 : -1;
      }
      p.critNext = true; p.iframes = Math.max(p.iframes, 0.25);
      break;
    }
    case 'matilha': {
      w.allies = w.allies.filter((a) => a.kind !== 'wolf');
      for (let i = 0; i < N.matilha.wolves; i++) w.allies.push({ id: w.nextId++, kind: 'wolf', x: p.x - 30 + i * 60, y: p.y + 20, hp: N.matilha.hp * (1 + 0.3 * (s.level - 1)), maxHp: N.matilha.hp * (1 + 0.3 * (s.level - 1)), t: 0, dur: N.matilha.duration * dur, cd: 0.3 * i, facing: 1, target: 0, walk: 0, moving: false, power: N.matilha.damage * power });
      break;
    }
    case 'sussurro': spellShot(w, id, ox, oy, aim, N.sussurro.speed, N.sussurro.range, N.sussurro.damage * power, 'p_sussurro'); break;
    case 'borbulhante': { const pos = aimPoint(w, ax, ay, N.borbulhante.range); zone(w, { kind: 'borbulhante', x: pos.x, y: pos.y, r: N.borbulhante.radius * area, t: 0, dur: N.borbulhante.delay, tick: 0, power: N.borbulhante.damage * power }); break; }
    case 'ninar': {
      const pos = aimPoint(w, ax, ay, N.ninar.range);
      for (const e of w.enemies) {
        if (!hittable(e) || Math.hypot(e.x - pos.x, e.y - pos.y) > N.ninar.radius * area + e.radius * 0.5) continue;
        if (isBoss(e)) e.slowT = Math.max(e.slowT, 2); else { e.sleepT = Math.max(e.sleepT, N.ninar.sleep * dur); e.tele = null; }
      }
      emit(w, { type: 'sing', x: pos.x, y: pos.y, value: 0, kind: 'ninar' });
      break;
    }
    case 'troca': {
      const t = nearestEnemy(w, ax, ay, 160) ?? nearestEnemy(w, p.x, p.y, N.troca.range);
      if (t && !isBoss(t)) {
        const px = p.x, py = p.y;
        emit(w, { type: 'blink', x: px, y: py, x2: t.x, y2: t.y, kind: 'encanto' });
        p.x = t.x; p.y = t.y; t.x = px; t.y = py; t.tele = null; t.confuseT = Math.max(t.confuseT, N.troca.confuse * dur);
        if (t.state === 'windup' || t.state === 'aim' || t.state === 'charge') setState(t, 'stagger');
      }
      p.iframes = Math.max(p.iframes, 0.3);
      break;
    }
    case 'espelho': w.allies = w.allies.filter((a) => a.kind !== 'decoy'); w.allies.push({ id: w.nextId++, kind: 'decoy', x: p.x, y: p.y, hp: s.maxHp * N.espelho.hp, maxHp: s.maxHp * N.espelho.hp, t: 0, dur: N.espelho.duration * dur, cd: 0, facing: p.facing, target: 0, walk: 0, moving: false, power: 0 }); break;
    default: return false;
  }
  return true;
}

/** Projétil de feitiço novo encostou num inimigo. Devolve true se o projétil acabou. */
export function spellHit(w: World, pr: Projectile, e: Enemy): boolean {
  const s = w.stats, ang = Math.atan2(pr.vy, pr.vx), el = pr.element ?? null;
  switch (pr.spell) {
    case 'faisca': {
      damageEnemy(w, e, pr.damage, 'spell', ang, false, 'tempestade');
      if (e.hp > 0) applyElement(w, e, 'tempestade');
      pr.hit.push(e.id);
      const next = (pr.jumps ?? 0) > 0 ? nearestEnemy(w, e.x, e.y, N.faisca.jumpRange, pr.hit) : null;
      if (!next) return true;
      pr.jumps = (pr.jumps ?? 0) - 1;
      const a = Math.atan2(next.y - e.y, next.x - e.x), sp = Math.hypot(pr.vx, pr.vy);
      pr.x = e.x; pr.y = e.y; pr.vx = Math.cos(a) * sp; pr.vy = Math.sin(a) * sp; pr.dist = 0;
      emit(w, { type: 'spark', x: e.x, y: e.y, x2: next.x, y2: next.y });
      return false;
    }
    case 'brasa': {
      damageEnemy(w, e, pr.damage, 'spell', ang, false, 'fogo');
      if (e.hp > 0) applyElement(w, e, 'fogo');
      for (const o of w.enemies) if (o !== e && hittable(o) && Math.hypot(o.x - e.x, o.y - e.y) < N.brasa.splash * s.spellArea) damageEnemy(w, o, pr.damage * (N.brasa.splashDamage / N.brasa.damage), 'spell', 0, false, 'fogo');
      igniteAt(w, e.x, e.y, 40);
      emit(w, { type: 'pop', x: e.x, y: e.y, value: N.brasa.splash, kind: 'fogo' });
      return true;
    }
    case 'pedrada': {
      damageEnemy(w, e, pr.damage, 'spell', ang, false, el);
      if (e.hp > 0) { applyElement(w, e, 'terra'); if (!isBoss(e) && !e.elite) { e.kx = Math.cos(ang) * N.pedrada.knock; e.ky = Math.sin(ang) * N.pedrada.knock; } }
      if (pr.pierce) { pr.hit.push(e.id); return false; }
      return true;
    }
    case 'garra': {
      const d = damageEnemy(w, e, pr.damage, 'spell', ang, false, 'sombra');
      if (e.hp > 0) applyElement(w, e, 'sombra');
      healPlayer(w, d * N.garra.lifesteal, true);
      if (pr.pierce) { pr.hit.push(e.id); return false; }
      return true;
    }
    case 'marcalua': {
      e.curseT = Math.max(e.curseT, N.marcalua.mark * s.durationMult); e.curseBonus = N.marcalua.bonus; e.slowT = Math.max(e.slowT, N.marcalua.mark * s.durationMult);
      emit(w, { type: 'mark', x: e.x, y: e.y, id: e.id, kind: 'lua' });
      return true;
    }
    case 'sussurro': {
      damageEnemy(w, e, pr.damage, 'spell', ang, false, 'encanto');
      if (e.hp > 0) applyElement(w, e, 'encanto');
      return true;
    }
    default: return true;
  }
}

/** Zonas dos feitiços novos e dos golpes que deixam algo no chão. Devolve se a zona continua (ou undefined se não é deste módulo). */
export function updateNewZone(w: World, z: Zone, dt: number): boolean | undefined {
  const p = w.player;
  switch (z.kind) {
    case 'trovao': if (z.t < z.dur) return true; hitArea(w, z.x, z.y, z.r, z.power, 'tempestade'); emit(w, { type: 'zap', x: z.x, y: z.y, value: z.r, kind: 'trovao' }); return false;
    case 'explosao': if (z.t < z.dur) return true; hitArea(w, z.x, z.y, z.r, z.power, 'fogo'); igniteAt(w, z.x, z.y, z.r); emit(w, { type: 'explode', x: z.x, y: z.y, value: z.r, kind: 'fogo' }); return false;
    case 'borbulhante': {
      if (z.t < z.dur) return true;
      const el = (['natureza', 'agua', 'tempestade', 'fogo', 'terra', 'sombra'] as ElementId[])[Math.floor(rand(w) * 6)];
      hitArea(w, z.x, z.y, z.r, z.power, el, (e) => applyElement(w, e, 'encanto'));
      emit(w, { type: 'explode', x: z.x, y: z.y, value: z.r, kind: el });
      return false;
    }
    case 'redemoinho': case 'tornado': {
      if (z.kind === 'tornado') { z.x += (z.x2 ?? 0) * dt; z.y += (z.y2 ?? 0) * dt; }
      const pull = z.kind === 'tornado' ? SUPREMO_NUM.tempestade.pull : N.redemoinho.pull;
      for (const e of w.enemies) {
        if (!hittable(e) || isBoss(e)) continue;
        const dx = z.x - e.x, dy = z.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (d < z.r * 1.6 && d > 14) { e.x += (dx / d) * pull * dt; e.y += (dy / d) * pull * dt; e.tele = null; }
      }
      z.tick -= dt;
      if (z.tick <= 0) { z.tick += 0.5; hitArea(w, z.x, z.y, z.r, z.power, 'tempestade'); }
      return z.t < z.dur;
    }
    case 'coivara': {
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick += 0.5;
        const ax = z.x, ay = z.y, bx = z.x2 ?? z.x, by = z.y2 ?? z.y, L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
        for (const e of w.enemies) {
          if (!hittable(e)) continue;
          const k = Math.max(0, Math.min(1, ((e.x - ax) * (bx - ax) + (e.y - ay) * (by - ay)) / L2));
          if (Math.hypot(e.x - (ax + (bx - ax) * k), e.y - (ay + (by - ay) * k)) < z.r + e.radius * 0.5) { damageEnemy(w, e, z.power, 'spell', 0, false, 'fogo'); if (e.hp > 0) applyElement(w, e, 'fogo'); }
        }
        for (let k = 0; k <= 1; k += 0.25) igniteAt(w, ax + (bx - ax) * k, ay + (by - ay) * k, z.r);
      }
      return z.t < z.dur;
    }
    case 'vapor': for (const e of w.enemies) if (hittable(e) && !isBoss(e) && Math.hypot(e.x - z.x, e.y - z.y) < z.r) e.blindT = Math.max(e.blindT, 0.3); return z.t < z.dur;
    case 'dust': for (const e of w.enemies) if (hittable(e) && !isBoss(e) && Math.hypot(e.x - z.x, e.y - z.y) < z.r) e.blindT = Math.max(e.blindT, 0.8); return z.t < z.dur;
    case 'fire': case 'curse': case 'void': {
      z.tick -= dt;
      const inside = Math.hypot(p.x - z.x, p.y - z.y) < z.r;
      if (z.kind === 'void' && z.hostile && p.state !== 'dodge') { const d = Math.hypot(z.x - p.x, z.y - p.y) || 1; if (d < z.r) { p.x += ((z.x - p.x) / d) * 160 * dt; p.y += ((z.y - p.y) / d) * 160 * dt; } }
      if (z.tick <= 0) {
        z.tick += 0.5;
        if (z.hostile) {
          if (inside && p.state !== 'dodge') { import_hurt(w, z, inside); }
        } else for (const e of w.enemies) if (hittable(e) && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.radius * 0.5) { damageEnemy(w, e, z.power, 'spell', 0, false, 'fogo'); if (e.hp > 0) applyElement(w, e, 'fogo'); }
        if (z.kind === 'fire') igniteAt(w, z.x, z.y, z.r * 0.6);
      }
      return z.t < z.dur;
    }
    case 'firelane': {
      if (z.t < 0) return true;
      if (!z.tick) {
        z.tick = 1;
        const a = w.arena;
        for (const e of w.enemies) if (hittable(e) && Math.abs(e.y - z.y) < z.r + e.radius * 0.5) { damageEnemy(w, e, z.power, 'spell', 0, false, 'fogo'); if (e.hp > 0) applyElement(w, e, 'fogo'); }
        for (let x = a.x0 + 40; x < a.x1; x += 90) zone(w, { kind: 'fire', x, y: z.y, r: 44, t: 0, dur: 2.5, tick: 0.5, power: z.power * 0.1 });
        emit(w, { type: 'supremo', x: a.x0, y: z.y, kind: 'fogoLane' });
      }
      return false;
    }
  }
  return undefined;
}

let hurtFn: ((w: World, z: Zone) => void) | null = null;
/** player.ts registra aqui como ferir o herói numa zona hostil (evita importação circular). */
export function registerZoneHurt(fn: (w: World, z: Zone) => void): void { hurtFn = fn; }
function import_hurt(w: World, z: Zone, _inside: boolean): void { hurtFn?.(w, z); }

/** Chamas em órbita do Fogo-Fátuo. */
function updateOrbs(w: World, dt: number): void {
  const p = w.player;
  if (p.orbT <= 0) return;
  p.orbT = max0(p.orbT - dt);
  const F = N.fogofatuo, power = p.orbPower;
  for (let i = 0; i < F.orbs; i++) {
    const a = w.time * F.spin + (i / F.orbs) * Math.PI * 2, ox = p.x + Math.cos(a) * F.radius, oy = p.y - 30 + Math.sin(a) * F.radius * 0.8;
    for (const e of w.enemies) {
      if (!hittable(e) || Math.hypot(e.x - ox, e.y - 20 - oy) > e.radius + 16) continue;
      if ((p.orbHit[e.id] ?? -9) > w.time - 0.5) continue;
      p.orbHit[e.id] = w.time;
      damageEnemy(w, e, power, 'spell', a, false, 'fogo');
      if (e.hp > 0) applyElement(w, e, 'fogo');
    }
  }
}

/** Lobos, cópia, estaca, nuvem e muralha. */
export function updateAllies(w: World, dt: number): void {
  const p = w.player, fighting = w.phase === 'fight';
  updateOrbs(w, dt);
  w.walls = w.walls.filter((b) => (b.t -= dt) > 0);
  if (w.walls.length) {
    for (const e of w.enemies) for (const b of w.walls) { const dx = e.x - b.x, dy = e.y - b.y, d = Math.hypot(dx, dy) || 0.01, min = b.r + e.radius * 0.8; if (d < min && !isBoss(e)) { e.x += (dx / d) * (min - d); e.y += (dy / d) * (min - d); } }
    w.projectiles = w.projectiles.filter((pr) => !((pr.kind === 'eproj' || pr.kind === 'ethorn' || pr.kind === 'sting' || pr.kind === 'spin') && w.walls.some((b) => Math.hypot(pr.x - b.x, pr.y - b.y) < b.r + 8)));
  }
  w.allies = w.allies.filter((a) => {
    a.t += dt; a.cd -= dt; a.moving = false;
    if (a.t >= a.dur || a.hp <= 0) { emit(w, { type: 'pop', x: a.x, y: a.y, value: 40, kind: a.kind }); return false; }
    if (!fighting) return true;
    if (a.kind === 'cloud') {
      a.x += (p.x - a.x) * Math.min(1, dt * 4); a.y += (p.y - 90 - a.y) * Math.min(1, dt * 4);
      if (a.cd <= 0) { const t = nearestEnemy(w, p.x, p.y, N.nuvem.range); if (t) { a.cd = N.nuvem.every; damageEnemy(w, t, a.power, 'spell', 0, false, 'tempestade'); if (t.hp > 0) applyElement(w, t, 'tempestade'); emit(w, { type: 'spark', x: a.x, y: a.y, x2: t.x, y2: t.y - 20 }); } }
    } else if (a.kind === 'turret') {
      if (a.cd <= 0) { const t = nearestEnemy(w, a.x, a.y, N.estaca.reach); if (t) { a.cd = N.estaca.every; a.facing = t.x >= a.x ? 1 : -1; const ang = Math.atan2(t.y - a.y, t.x - a.x); spellShot(w, 'pedrada', a.x + Math.cos(ang) * 20, a.y - 30 + Math.sin(ang) * 20, ang, 700, N.estaca.reach, a.power, 'p_pedra'); } }
    } else if (a.kind === 'wolf') {
      const t = nearestEnemy(w, a.x, a.y, 600);
      if (t) {
        const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 1;
        if (d > t.radius + 20) { a.x += (dx / d) * 300 * dt; a.y += (dy / d) * 300 * dt; a.moving = true; a.walk += 300 * dt * 0.09; }
        a.facing = dx >= 0 ? 1 : -1;
        if (d < t.radius + 30 && a.cd <= 0) { a.cd = 0.8; damageEnemy(w, t, a.power, 'ally', Math.atan2(dy, dx), false, 'sombra'); if (t.hp > 0) applyElement(w, t, 'sombra'); emit(w, { type: 'pet', x: a.x, y: a.y, kind: 'golpe' }); }
      } else { const dx = p.x - 40 - a.x, dy = p.y + 20 - a.y, d = Math.hypot(dx, dy); if (d > 20) { a.x += (dx / d) * 260 * dt; a.y += (dy / d) * 260 * dt; a.moving = true; a.walk += 260 * dt * 0.09; a.facing = dx >= 0 ? 1 : -1; } }
      clampArena(w, a, 12);
    }
    return true;
  });
}

/** Supremos dos Encantados dos capítulos 3 a 7. Devolve false para Natureza e Água (em player.ts). */
export function castNewSupremo(w: World, el: ElementId, scale: number): boolean {
  const p = w.player, a = w.arena, cy = (a.y0 + a.y1) / 2;
  switch (el) {
    case 'tempestade': {
      const S = SUPREMO_NUM.tempestade, fromLeft = p.x > (a.x0 + a.x1) / 2;
      zone(w, { kind: 'tornado', x: fromLeft ? a.x0 + 60 : a.x1 - 60, y: cy, x2: ((a.x1 - a.x0 - 120) / S.duration) * (fromLeft ? 1 : -1), y2: 0, r: S.radius, t: 0, dur: S.duration, tick: 0, power: S.tick * scale });
      for (const e of w.enemies) if (hittable(e)) applyElement(w, e, 'tempestade');
      return true;
    }
    case 'fogo': {
      const S = SUPREMO_NUM.fogo, h = a.y1 - a.y0;
      for (let i = 0; i < S.lanes; i++) zone(w, { kind: 'firelane', x: a.x0, y: a.y0 + h * ((i + 0.5) / S.lanes), r: S.width / 2 + h / S.lanes / 2 - S.width / 2, t: -i * 0.45, dur: 0.1, tick: 0, power: S.damage * scale });
      return true;
    }
    case 'terra': {
      const S = SUPREMO_NUM.terra;
      for (const e of w.enemies) {
        if (!hittable(e)) continue;
        damageEnemy(w, e, S.damage * scale, 'spell', 0, false, 'terra');
        if (e.hp <= 0) continue;
        e.crackT = Math.max(e.crackT, 8); e.mods = e.mods.filter((m) => m !== 'blindado');
        if (isBoss(e)) e.posture = Math.min(100, e.posture + 40); else { e.stunT = Math.max(e.stunT, S.stun); e.tele = null; }
      }
      return true;
    }
    case 'sombra': p.wolfT = SUPREMO_NUM.sombra.duration; return true;
    case 'encanto': {
      for (const e of w.enemies) {
        if (!hittable(e)) continue;
        if (isBoss(e) || e.elite) { e.confuseT = Math.max(e.confuseT, 3); e.slowT = Math.max(e.slowT, 3); }
        else { e.frogT = SUPREMO_NUM.encanto.duration; e.tele = null; }
      }
      return true;
    }
  }
  return false;
}

/** Efeitos de conjunto e de único na esquiva (poeira, redemoinho, rastro de fogo) e na esquiva perfeita. */
export function onDodge(w: World): void {
  const p = w.player, s = w.stats;
  if (s.passives.dodgeDust) zone(w, { kind: 'dust', x: p.x, y: p.y, r: 80, t: 0, dur: 2, tick: 0, power: 0 });
  if (s.uniques.crinaDaMula) zone(w, { kind: 'fire', x: p.x, y: p.y, r: 46, t: 0, dur: 3, tick: 0.5, power: s.weaponDamage * s.damageMult * 0.4 });
  if (s.uniques.alpercatasDoRedemoinho) zone(w, { kind: 'redemoinho', x: p.x, y: p.y, r: 90, t: 0, dur: 1.2, tick: 0, power: s.weaponDamage * s.damageMult * 0.5 });
}
export function onPerfect(w: World, power: number): void {
  const p = w.player, s = w.stats;
  if (s.passives.perfectNova) for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; w.projectiles.push({ id: w.nextId++, kind: 'thorn', x: p.x, y: p.y, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, dist: 0, range: 320, damage: SPELL_NUM.dardo.damage * power, pierce: false, hit: [], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner: 0 }); }
  if (s.passives.perfectWave) { for (const e of w.enemies) if (hittable(e) && Math.hypot(e.x - p.x, e.y - p.y) < 220) applyElement(w, e, 'agua'); healPlayer(w, s.maxHp * 0.05); emit(w, { type: 'onda', x: p.x, y: p.y, ang: 0, value: 220 }); }
  if (s.passives.perfectWhirl) zone(w, { kind: 'redemoinho', x: p.x, y: p.y, r: 120, t: 0, dur: 2, tick: 0, power: power * 6 });
}

export { ELEMENT_ORDER, PLAYER, wrapAngle };
