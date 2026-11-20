/**
 * Comportamento dos monstros dos capítulos 3 a 8, um por arquétipo (docs/gdd/05):
 * enxame, bruto, atirador, investida, conjurador, protetor, emboscada, explosivo.
 * Os números vêm de src/data/bestiary.ts; o elemento do golpe vem do monstro.
 */
import { PLAYER } from '../data/balance';
import { MONSTERS, type MonsterDef, type MonsterKind } from '../data/bestiary';
import { addHazard, clampArena, emit, hurtPlayer, rand, rayExit, setState, spawnEnemy, strike, targetOf } from './core';
import { chargeContact, moveToward } from './enemies';
import type { Enemy, World } from './types';

/** Estado em que o monstro começa depois de surgir. */
export function archetypeStart(e: Enemy): Enemy['state'] {
  const d = MONSTERS[e.kind as MonsterKind];
  if (d.arch === 'emboscada') { e.hidden = true; return 'buried'; }
  return d.arch === 'investida' ? 'roam' : d.arch === 'atirador' || d.arch === 'conjurador' ? 'roam' : 'chase';
}

function enemyShot(w: World, e: Enemy, d: MonsterDef, ang: number, speed: number, tex: string, spin = false): void {
  w.projectiles.push({
    id: w.nextId++, kind: spin ? 'spin' : 'eproj', x: e.x + Math.cos(ang) * 20, y: e.y + Math.sin(ang) * 20, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
    dist: 0, range: d.shot!.range, damage: d.damage * e.dmg, pierce: false, hit: [], charged: false, sx: e.x, sy: e.y, tx: 0, ty: 0, t: 0, dur: 0, tele: null,
    owner: e.id, element: d.element, tex,
  });
}

/** Distância que o atirador e o conjurador tentam manter. */
const KEEP: [number, number] = [240, 470];

export function updateArchetype(w: World, e: Enemy, dt: number): void {
  const d = MONSTERS[e.kind as MonsterKind], T = targetOf(w, e), p = w.player;
  const dx = T.x - e.x, dy = T.y - e.y, dist = Math.hypot(dx, dy) || 1;
  const moon = 1 + 0.15 * w.moon;
  const sp = e.speedMult * (e.slowT > 0 ? 0.5 : 1) * moon, wm = e.windupMult / (1 + 0.1 * w.moon), scale = e.radius / d.radius;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };
  const lead = (k: number) => (T === p ? { x: T.x + p.vx * k, y: T.y + p.vy * k } : { x: T.x, y: T.y });

  switch (d.arch) {
    case 'enxame': {
      if (e.state === 'chase') {
        face();
        const a = e.id * 2.4, L = lead(0.22);
        moveToward(e, L.x + Math.cos(a) * 30, L.y + Math.sin(a) * 30, d.speed * sp, dt);
        if (dist < d.reach * scale && e.cd <= 0) {
          const L2 = lead(0.18), lx = L2.x - e.x, ly = L2.y - e.y, ld = Math.hypot(lx, ly) || 1, reach = 34 + 46;
          setState(e, 'windup'); e.dirX = lx / ld; e.dirY = ly / ld;
          e.tele = { shape: 'circle', x: e.x + e.dirX * reach, y: e.y + e.dirY * reach, r: d.area * scale, t: 0, dur: d.windup * wm };
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
        }
      } else if (e.state === 'windup' && e.tele) {
        e.tele.t = e.stateT;
        if (e.stateT >= e.tele.dur * 0.6) { const v = 46 / (e.tele.dur * 0.4); e.x += e.dirX * v * dt; e.y += e.dirY * v * dt; }
        if (e.stateT >= e.tele.dur) { emit(w, { type: 'bite', x: e.tele.x, y: e.tele.y }); strike(w, e.tele, d.damage * e.dmg, 260, { src: e, melee: true }); e.tele = null; setState(e, 'recover'); }
      } else if (e.state === 'recover') {
        if (e.stateT >= d.recover) { setState(e, 'chase'); e.cd = 0.15 + rand(w) * 0.3; }
      } else if (e.state === 'stagger') { if (e.stateT >= 0.24) setState(e, 'chase'); } else setState(e, 'chase');
      break;
    }
    case 'bruto': {
      if (e.state === 'chase') {
        face();
        moveToward(e, T.x, T.y, d.speed * sp, dt);
        if (dist < d.reach * scale) {
          setState(e, 'windup'); e.dirX = dx / dist; e.dirY = dy / dist;
          e.tele = { shape: 'circle', x: e.x + e.dirX * 60 * scale, y: e.y + e.dirY * 60 * scale, r: d.area * scale, t: 0, dur: d.windup * wm };
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
        }
      } else if (e.state === 'windup' && e.tele && e.tele.shape === 'circle') {
        e.tele.t = e.stateT;
        if (e.stateT >= e.tele.dur) { emit(w, { type: 'slam', x: e.tele.x, y: e.tele.y, value: e.tele.r }); strike(w, e.tele, d.damage * e.dmg, 560, { src: e, melee: true }); e.tele = null; setState(e, 'exposed'); }
      } else if (e.state === 'exposed') {
        if (e.stateT >= d.recover) setState(e, 'chase');
      } else setState(e, 'chase');
      break;
    }
    case 'protetor': {
      if (e.state === 'chase') {
        face();
        let cx = 0, cy = 0, n = 0;
        for (const o of w.enemies) if (o !== e && o.hp > 0 && !o.hidden && !o.illusion) { cx += o.x; cy += o.y; n++; }
        if (n > 0) moveToward(e, cx / n, cy / n, d.speed * sp, dt); else moveToward(e, T.x, T.y, d.speed * sp, dt);
        if (dist < d.reach * scale && e.cd <= 0) {
          e.tele = { shape: 'circle', x: e.x, y: e.y, r: d.area * scale, t: 0, dur: d.windup * wm };
          setState(e, 'windup'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
        }
      } else if (e.state === 'windup' && e.tele) {
        e.tele.t = e.stateT;
        if (e.stateT >= e.tele.dur) { emit(w, { type: 'slam', x: e.x, y: e.y, value: d.area * scale }); strike(w, e.tele, d.damage * e.dmg, 420, { src: e, melee: true }); e.tele = null; setState(e, 'recover'); }
      } else if (e.state === 'recover') { if (e.stateT >= d.recover) { setState(e, 'chase'); e.cd = 1.6; } } else setState(e, 'chase');
      break;
    }
    case 'investida': {
      if (e.state === 'roam') {
        face();
        if (dist < 180) moveToward(e, e.x - dx, e.y - dy, d.speed * sp, dt);
        else if (dist > 500) moveToward(e, T.x, T.y, d.speed * sp, dt);
        if (e.cd <= 0) { setState(e, 'aim'); e.dirX = dx / dist; e.dirY = dy / dist; emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
      } else if (e.state === 'aim') {
        const aim = d.windup * wm;
        if (e.stateT < aim * 0.7) { const L = lead(0.15), lx = L.x - e.x, ly = L.y - e.y, ld = Math.hypot(lx, ly) || 1; e.dirX = lx / ld; e.dirY = ly / ld; face(); }
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius);
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: d.area * scale, t: e.stateT, dur: aim };
        if (e.stateT >= aim) { e.tele = null; e.flag = false; setState(e, 'charge'); emit(w, { type: 'charge', x: e.x, y: e.y }); }
      } else if (e.state === 'charge') {
        const v = 780 * Math.min(1.3, sp);
        e.x += e.dirX * v * dt; e.y += e.dirY * v * dt; e.walk += v * dt * 0.05; e.moving = true;
        chargeContact(w, e, d.damage * e.dmg, 520);
        const wall = w.walls.find((b) => Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.radius);
        if (clampArena(w, e, e.radius) || wall) { setState(e, 'stunned'); emit(w, { type: 'crash', x: e.x, y: e.y, text: 'TONTO' }); }
      } else if (e.state === 'stunned') {
        if (e.stateT >= d.recover * Math.max(0.6, wm)) { setState(e, 'roam'); e.cd = 1.3 * wm; }
      } else setState(e, 'roam');
      break;
    }
    case 'atirador': {
      const S = d.shot!;
      if (e.state === 'roam') {
        face();
        if (dist < KEEP[0]) moveToward(e, e.x - dx, e.y - dy, d.speed * sp, dt);
        else if (dist > KEEP[1]) moveToward(e, T.x, T.y, d.speed * sp, dt);
        else moveToward(e, e.x - dy * (e.id % 2 ? 1 : -1), e.y + dx * (e.id % 2 ? 1 : -1), d.speed * sp * 0.4, dt);
        if (e.cd <= 0 && dist < S.range && e.silenceT <= 0) {
          setState(e, 'aim'); e.flag = false;
          const L = S.mode === 'lob' ? lead(S.flight * 0.8) : lead(0.12);
          e.ax = L.x; e.ay = L.y;
          if (S.mode === 'lob') { const t = { x: L.x, y: L.y }; clampArena(w, t, PLAYER.radius); e.ax = t.x; e.ay = t.y; }
          else { const a = Math.atan2(L.y - e.y, L.x - e.x), [x2, y2] = rayExit(w, e.x, e.y, Math.cos(a), Math.sin(a), 0, S.range); e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: S.mode === 'fan' ? 30 : 22, t: 0, dur: d.windup * wm }; }
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
        }
      } else if (e.state === 'aim') {
        face();
        if (e.tele) e.tele.t = e.stateT;
        if (e.stateT >= d.windup * wm) {
          e.tele = null;
          if (S.mode === 'lob') {
            w.projectiles.push({
              id: w.nextId++, kind: 'elob', x: e.x, y: e.y, vx: 0, vy: 0, dist: 0, range: 0, damage: d.damage * e.dmg, pierce: false, hit: [], charged: false,
              sx: e.x, sy: e.y, tx: e.ax, ty: e.ay, t: 0, dur: S.flight, tele: { shape: 'circle', x: e.ax, y: e.ay, r: S.radius * scale, t: 0, dur: S.flight }, owner: e.id, element: d.element, tex: S.tex,
            });
          } else {
            const base = Math.atan2(e.ay - e.y, e.ax - e.x);
            for (let i = 0; i < S.count; i++) enemyShot(w, e, d, base + (i - (S.count - 1) / 2) * S.spread, S.speed, S.tex, S.mode === 'spin');
          }
          emit(w, { type: 'spit', x: e.x, y: e.y });
          e.cd = d.recover * wm; setState(e, 'recover');
        }
      } else if (e.state === 'recover') { if (e.stateT >= 0.45) setState(e, 'roam'); } else setState(e, 'roam');
      break;
    }
    case 'conjurador': {
      const C = d.circles!;
      if (e.state === 'roam') {
        face();
        if (dist < KEEP[0] + 40) moveToward(e, e.x - dx, e.y - dy, d.speed * sp, dt);
        else if (dist > KEEP[1] + 60) moveToward(e, T.x, T.y, d.speed * sp, dt);
        else moveToward(e, e.x + dy * 0.5, e.y - dx * 0.5, d.speed * sp * 0.35, dt);
        if (e.cd <= 0 && e.silenceT <= 0) { setState(e, 'cast'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
      } else if (e.state === 'cast') {
        face();
        if (e.stateT >= d.windup * wm) {
          for (let i = 0; i < C.count; i++) {
            const L = lead(0.3), a = rand(w) * Math.PI * 2, r = i === 0 ? 0 : C.spread * (0.5 + rand(w) * 0.6);
            const pos = { x: L.x + Math.cos(a) * r, y: L.y + Math.sin(a) * r };
            clampArena(w, pos, 20);
            addHazard(w, {
              kind: d.element === 'tempestade' ? 'bolt' : d.element === 'sombra' ? 'shadow' : 'spell', element: d.element,
              tele: { shape: 'circle', x: pos.x, y: pos.y, r: C.radius * (e.elite ? 1.25 : 1), t: -i * 0.15, dur: C.delay * wm }, damage: d.damage * e.dmg, slow: 0,
              extra: C.silence ? { erase: true } : undefined,
            });
          }
          e.cd = C.every * wm; setState(e, 'recover');
          /* às vezes some e reaparece em outro canto */
          if (rand(w) < 0.3) { const a = w.arena; e.x = a.x0 + 80 + rand(w) * (a.x1 - a.x0 - 160); e.y = a.y0 + 60 + rand(w) * (a.y1 - a.y0 - 120); emit(w, { type: 'appear', x: e.x, y: e.y }); }
        }
      } else if (e.state === 'recover') { if (e.stateT >= 0.6) setState(e, 'roam'); } else setState(e, 'roam');
      break;
    }
    case 'emboscada': {
      if (e.state === 'buried') {
        e.hidden = true;
        if (Math.hypot(p.x - e.x, p.y - e.y) < d.reach || (e.count > 0 && e.stateT >= 2.5) || e.stateT >= 7) { e.hidden = false; setState(e, 'reveal'); emit(w, { type: 'reveal', x: e.x, y: e.y }); }
      } else if (e.state === 'reveal') {
        face();
        if (e.stateT >= 0.4 * wm) {
          const L = lead(0.15), lx = L.x - e.x, ly = L.y - e.y, ld = Math.hypot(lx, ly) || 1;
          e.dirX = lx / ld; e.dirY = ly / ld;
          const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius, 270);
          e.ax = x2; e.ay = y2;
          e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: d.area * scale, t: 0, dur: d.windup * wm };
          setState(e, 'aim'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
        }
      } else if (e.state === 'aim' && e.tele) {
        e.tele.t = e.stateT;
        if (e.stateT >= e.tele.dur) { e.tele = null; e.flag = false; setState(e, 'dash'); emit(w, { type: 'bite', x: e.x, y: e.y }); }
      } else if (e.state === 'dash') {
        const left = moveToward(e, e.ax, e.ay, 720, dt);
        chargeContact(w, e, d.damage * e.dmg, 300);
        if (left < 10 || clampArena(w, e, e.radius)) setState(e, 'recover');
      } else if (e.state === 'recover') {
        if (e.stateT >= d.recover) {
          e.count++;
          if (e.count % 2 === 1) { setState(e, 'roam'); const a = w.arena; e.ax = a.x0 + 80 + rand(w) * (a.x1 - a.x0 - 160); e.ay = a.y0 + 60 + rand(w) * (a.y1 - a.y0 - 120); }
          else setState(e, 'reveal');
        }
      } else if (e.state === 'roam') {
        const left = moveToward(e, e.ax, e.ay, d.speed * sp, dt);
        if (Math.abs(e.ax - e.x) > 4) e.facing = e.ax >= e.x ? 1 : -1;
        if (left < 10 || e.stateT >= 1.6) { setState(e, 'buried'); e.hidden = true; emit(w, { type: 'vanish', x: e.x, y: e.y, kind: 'areia' }); }
      } else setState(e, 'roam');
      break;
    }
    case 'explosivo': {
      if (e.state === 'chase') {
        face();
        moveToward(e, T.x, T.y, d.speed * sp, dt);
        if (dist < d.reach) { setState(e, 'fuse'); e.tele = { shape: 'circle', x: e.x, y: e.y, r: d.area * scale, t: 0, dur: d.windup * wm }; emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
      } else if (e.state === 'fuse' && e.tele && e.tele.shape === 'circle') {
        moveToward(e, T.x, T.y, d.speed * sp * 0.3, dt);
        e.tele.x = e.x; e.tele.y = e.y; e.tele.t = e.stateT;
        if (e.stateT >= e.tele.dur) {
          emit(w, { type: 'explode', x: e.x, y: e.y, value: e.tele.r, kind: d.element ?? 'vazio' });
          strike(w, e.tele, d.damage * e.dmg, 340, { src: e });
          if (d.leaves === 'fogo') w.zones.push({ id: w.nextId++, kind: 'fire', x: e.x, y: e.y, r: e.tele.r * 0.8, t: 0, dur: 3, tick: 0.5, power: d.damage * e.dmg * 0.18, hostile: true });
          if (d.leaves === 'sombra') w.zones.push({ id: w.nextId++, kind: 'curse', x: e.x, y: e.y, r: e.tele.r * 0.85, t: 0, dur: 3.5, tick: 0.5, power: d.damage * e.dmg * 0.12, hostile: true });
          if (d.leaves === 'vazio') w.zones.push({ id: w.nextId++, kind: 'void', x: e.x, y: e.y, r: e.tele.r * 1.6, t: 0, dur: 1.4, tick: 0.5, power: d.damage * e.dmg * 0.1, hostile: true });
          e.tele = null; e.hp = 0;
          emit(w, { type: 'kill', x: e.x, y: e.y, kind: e.kind, id: e.id });
        }
      } else setState(e, 'chase');
      break;
    }
  }
  if (!e.hidden) clampArena(w, e, e.radius);
}

/** Um campeão protetor dá um tranco: mantido para o futuro. */
export function summonNear(w: World, kind: MonsterKind, x: number, y: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(w), pos = { x: x + Math.cos(a) * 120, y: y + Math.sin(a) * 100 };
    clampArena(w, pos, 20);
    spawnEnemy(w, { kind, x: pos.x, y: pos.y });
  }
}

export { hurtPlayer };
