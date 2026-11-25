/**
 * O Curupira (docs/gdd/05). Três fases, barra de postura, janela de punição e fúria.
 * Fase 1: Rastro Falso e Assobio. Fase 2: soma Mata Viva e Estouro. Fase 3: montado, investidas em série.
 */
import { fatan2, fcos, fhypot, fsin } from './fmath';
import { ENEMY } from '../data/balance';
import { addHazard, clampArena, emit, rand, rayExit, setState, spawnEnemy, targetOf } from './core';
import { chargeContact, moveToward } from './enemies';
import type { Enemy, World } from './types';

const PATTERNS = [['rastro', 'assobio'], ['rastro', 'mataViva', 'assobio', 'estouro'], ['investida', 'mataViva', 'investida', 'estouro']];

function thornVolley(w: World, from: Enemy, tx: number, ty: number, owner: number): void {
  const A = ENEMY.curupira.assobio, base = fatan2(ty - from.y, tx - from.x);
  for (let i = -1; i <= 1; i++) {
    const a = base + i * 0.22;
    w.projectiles.push({
      id: w.nextId++, kind: 'ethorn', x: from.x + fcos(a) * 20, y: from.y + fsin(a) * 20, vx: fcos(a) * A.thornSpeed, vy: fsin(a) * A.thornSpeed,
      dist: 0, range: 900, damage: A.thornDamage * from.dmg, pierce: false, hit: [], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner,
    });
  }
}

/** Comportamento de uma cópia ilusória: fica parada olhando para o herói até sumir. */
function updateClone(w: World, e: Enemy): void {
  const p = w.player;
  if (Math.abs(p.x - e.x) > 4) e.facing = p.x >= e.x ? 1 : -1;
  if (e.stateT >= ENEMY.curupira.assobio.life) e.hp = 0;
}

function startPattern(w: World, e: Enemy, T: { x: number; y: number }): void {
  const C = ENEMY.curupira, list = PATTERNS[e.phase];
  e.pattern = list[e.count % list.length];
  e.count++; e.flag = false; e.step = 0;
  if (e.pattern === 'rastro') {
    const a = rand(w) * Math.PI * 2, R = C.rastro;
    const appear = { x: T.x + fcos(a) * R.dist, y: T.y + fsin(a) * R.dist * 0.75 };
    clampArena(w, appear, e.radius + 6);
    // as pegadas saem na direção oposta ao lado de onde ele realmente vem
    const decoy = { x: T.x - fcos(a) * R.dist * 0.8, y: T.y - fsin(a) * R.dist * 0.6 };
    clampArena(w, decoy, 20);
    emit(w, { type: 'footprints', x: e.x, y: e.y, x2: decoy.x, y2: decoy.y });
    emit(w, { type: 'vanish', x: e.x, y: e.y });
    e.ax = appear.x; e.ay = appear.y; e.hidden = true; e.tele = null;
    setState(e, 'vanish');
  } else if (e.pattern === 'investida') {
    const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1;
    e.dirX = dx / d; e.dirY = dy / d;
    setState(e, 'aim');
    emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
  } else {
    setState(e, 'cast');
    if (e.pattern === 'assobio') emit(w, { type: 'whistle', x: e.x, y: e.y });
  }
}

export function updateCurupira(w: World, e: Enemy, dt: number): void {
  if (e.fake) { updateClone(w, e); return; }
  const C = ENEMY.curupira, P = C.posture, T = targetOf(w, e), p = w.player;
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };
  const slow = e.slowT > 0 ? 0.6 : 1;

  w.bossTime += dt;
  if (e.calls === 0 && w.bossTime >= C.enrageAt) { e.calls = 1; e.dmg *= C.enrageMult; emit(w, { type: 'enrage', x: e.x, y: e.y }); }
  if (e.sinceHit > P.decayAfter && e.state !== 'downed') e.posture = Math.max(0, e.posture - P.decay * dt);

  const calm = e.state === 'idle' || e.state === 'recover' || e.state === 'exposed' || e.state === 'stagger' || e.state === 'downed';
  if (e.phase < 2 && e.hp / e.maxHp <= C.phases[e.phase] && calm) {
    e.phase++; e.count = 0; e.tele = null; e.pattern = ''; e.posture = 0;
    for (const o of w.enemies) if (o.fake) o.hp = 0;
    setState(e, 'roar');
    emit(w, { type: 'phase', x: e.x, y: e.y, value: e.phase });
    if (e.phase === 2) {
      const a = w.arena, s = C.shrink;
      w.arena = { x0: a.x0 + s, y0: a.y0 + s * 0.6, x1: a.x1 - s, y1: a.y1 - s * 0.6 };
      clampArena(w, p, 16); clampArena(w, e, e.radius);
      if (w.pet) clampArena(w, w.pet, 12);
      emit(w, { type: 'shrink', x: 0, y: 0 });
    }
    return;
  }
  if (e.posture >= P.max && e.state !== 'roar' && e.state !== 'vanish' && e.state !== 'downed') {
    e.posture = 0; e.tele = null; e.hidden = false; e.pattern = '';
    for (const o of w.enemies) if (o.fake) o.hp = 0;
    setState(e, 'downed');
    emit(w, { type: 'downed', x: e.x, y: e.y });
    return;
  }

  switch (e.state) {
    case 'roar': if (e.stateT >= C.roar) setState(e, 'idle'); break;
    case 'downed': if (e.stateT >= P.downed) setState(e, 'idle'); break;
    case 'stagger': if (e.stateT >= C.assobio.stagger) setState(e, 'idle'); break;
    case 'exposed': if (e.stateT >= C.investida.exposed) setState(e, 'idle'); break;
    case 'recover': if (e.stateT >= C.rastro.recover) setState(e, 'idle'); break;
    case 'idle': {
      face();
      if (d > 260) moveToward(e, T.x, T.y, C.speed * slow, dt);
      else if (d < 150) moveToward(e, e.x - dx, e.y - dy, C.speed * slow, dt);
      clampArena(w, e, e.radius);
      if (e.stateT >= C.idle * (e.phase === 2 ? 0.75 : 1)) startPattern(w, e, T);
      break;
    }
    case 'vanish': {
      if (e.stateT >= C.rastro.vanish) {
        const R = C.rastro;
        e.x = e.ax; e.y = e.ay; e.hidden = false;
        const ddx = T.x - e.x, ddy = T.y - e.y, dd = fhypot(ddx, ddy) || 1;
        e.dirX = ddx / dd; e.dirY = ddy / dd; e.facing = ddx >= 0 ? 1 : -1;
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius, R.len);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: R.width, t: 0, dur: R.aim };
        setState(e, 'aim');
        emit(w, { type: 'appear', x: e.x, y: e.y });
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
      break;
    }
    case 'aim': {
      if (e.pattern === 'investida') {
        const I = C.investida;
        if (e.stateT < I.lockAt) { e.dirX = dx / d; e.dirY = dy / d; face(); }
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: I.width, t: e.stateT, dur: I.aim };
        if (e.stateT >= I.aim) { e.tele = null; e.flag = false; setState(e, 'charge'); emit(w, { type: 'charge', x: e.x, y: e.y }); }
      } else if (e.tele) {
        e.tele.t = e.stateT;
        if (e.stateT >= e.tele.dur) { e.tele = null; e.flag = false; setState(e, 'charge'); emit(w, { type: 'charge', x: e.x, y: e.y }); }
      } else setState(e, 'idle');
      break;
    }
    case 'charge': {
      const inv = e.pattern === 'investida', speed = inv ? C.investida.speed : C.rastro.speed, damage = (inv ? C.investida.damage : C.rastro.damage) * e.dmg;
      const left = moveToward(e, e.ax, e.ay, speed, dt);
      chargeContact(w, e, damage, 520);
      if (left < 12 || clampArena(w, e, e.radius)) {
        if (!inv) setState(e, 'recover');
        else if (++e.step < C.investida.count) { setState(e, 'aim'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
        else { setState(e, 'exposed'); emit(w, { type: 'crash', x: e.x, y: e.y, text: 'TROPEÇOU' }); }
      }
      break;
    }
    case 'cast': {
      face();
      if (e.pattern === 'assobio') {
        const A = C.assobio;
        if (e.stateT >= A.cast) {
          const base = fatan2(e.y - T.y, e.x - T.x);
          for (let i = 1; i <= A.clones; i++) {
            const a = base + (i * Math.PI * 2) / (A.clones + 1), pos = { x: T.x + fcos(a) * 250, y: T.y + fsin(a) * 190 };
            clampArena(w, pos, 30);
            const c = spawnEnemy(w, { kind: 'curupira', x: pos.x, y: pos.y }, { fake: true, quiet: true });
            c.state = 'clone'; c.dmg = e.dmg; c.phase = e.phase;
            emit(w, { type: 'appear', x: pos.x, y: pos.y });
          }
          e.flag = false; setState(e, 'volley');
        }
      } else if (e.pattern === 'mataViva') {
        const M = C.mataViva;
        if (e.stateT >= M.cast) {
          for (let i = 0; i < M.lines; i++) {
            const a = rand(w) * Math.PI, ox = T.x + (rand(w) - 0.5) * 150, oy = T.y + (rand(w) - 0.5) * 110;
            const [x1, y1] = rayExit(w, ox, oy, -fcos(a), -fsin(a), 0), [x2, y2] = rayExit(w, ox, oy, fcos(a), fsin(a), 0);
            addHazard(w, { kind: 'roots', tele: { shape: 'line', x: x1, y: y1, x2, y2, w: M.width, t: -i * 0.18, dur: M.delay }, damage: M.damage * e.dmg, slow: M.slow });
          }
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'mataViva' });
          setState(e, 'recover');
        }
      } else {
        const E = C.estouro, a = w.arena;
        if (e.stateT >= E.cast) {
          const slots = 5, h = (a.y1 - a.y0) / slots, mine = Math.max(0, Math.min(slots - 1, Math.floor((T.y - a.y0) / h)));
          const picks = new Set<number>([mine]);
          while (picks.size < Math.min(E.lanes, slots - 1)) picks.add(Math.floor(rand(w) * slots));
          let n = 0;
          for (const s of picks) {
            const y = a.y0 + h * (s + 0.5), left = n++ % 2 === 0;
            addHazard(w, { kind: 'lane', tele: { shape: 'line', x: left ? a.x0 : a.x1, y, x2: left ? a.x1 : a.x0, y2: y, w: E.width, t: 0, dur: E.delay }, damage: E.damage * e.dmg, slow: 0 });
          }
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'estouro' });
          setState(e, 'recover');
        }
      }
      break;
    }
    case 'volley': {
      face();
      const A = C.assobio;
      if (!e.flag && e.stateT >= A.volleyAt) {
        e.flag = true;
        thornVolley(w, e, T.x, T.y, e.id);
        for (const o of w.enemies) if (o.fake && o.hp > 0) thornVolley(w, o, T.x, T.y, e.id);
        emit(w, { type: 'spit', x: e.x, y: e.y });
      }
      if (e.stateT >= A.volleyAt + 0.7) { e.pattern = ''; setState(e, 'idle'); }
      break;
    }
    default: setState(e, 'idle');
  }
}
