/**
 * Capítulo 2, Rios do Norte: Piranha-Cinza, Sapo-Cururu, Arraia de Areia, Caramujo-Concha,
 * Jacaré de Lodo, e os chefes Boto e Iara (docs/gdd/05).
 */
import { fatan2, fcos, fhypot, fsin } from './fmath';
import { ENEMY, PLAYER, type EnemyKind } from '../data/balance';
import { addHazard, clampArena, emit, hurtPlayer, max0, rand, rayExit, setState, spawnEnemy, strike, targetOf, wrapAngle } from './core';
import { chargeContact, lob, moveToward } from './enemies';
import type { Enemy, EnemyState, World } from './types';

/** Estado em que cada bicho do capítulo começa depois de surgir. */
export const CH2_START: Partial<Record<EnemyKind, EnemyState>> = {
  piranha: 'chase', sapo: 'idle', arraia: 'buried', caramujo: 'chase', jacare: 'chase', boto: 'idle', iara: 'idle',
};

interface Fan { lines: number; spread: number; delay: number; width: number; len: number; damage: number }

/** Leque de jatos d'água a partir do inimigo, na direção do alvo. */
function fan(w: World, e: Enemy, T: { x: number; y: number }, J: Fan, offset = 0, wait = 0): void {
  const base = fatan2(T.y - e.y, T.x - e.x) + offset;
  for (let i = 0; i < J.lines; i++) {
    const a = base + (i - (J.lines - 1) / 2) * J.spread;
    const [x2, y2] = rayExit(w, e.x, e.y, fcos(a), fsin(a), 0, J.len);
    addHazard(w, { kind: 'jet', tele: { shape: 'line', x: e.x, y: e.y, x2, y2, w: J.width, t: -wait, dur: J.delay }, damage: J.damage * e.dmg, slow: 0 });
  }
}

/** Mergulhos em série: o chefe some e sai debaixo do herói. Devolve true quando a série acabou. */
function diveLoop(w: World, e: Enemy, M: { aim: number; radius: number; damage: number; count: number; between: number }, dt: number): boolean {
  const p = w.player;
  e.cd = max0(e.cd - dt);
  if (!e.flag) {
    /* marca o próximo ponto, um pouco à frente de onde o herói vai */
    const pos = { x: p.x + p.vx * 0.25, y: p.y + p.vy * 0.25 };
    clampArena(w, pos, e.radius + 4);
    e.x = pos.x; e.y = pos.y; e.flag = true; e.stateT = 0;
    addHazard(w, { kind: 'dive', tele: { shape: 'circle', x: pos.x, y: pos.y, r: M.radius, t: 0, dur: M.aim }, damage: M.damage * e.dmg, slow: 0 });
    emit(w, { type: 'telegraph', x: pos.x, y: pos.y, kind: 'mergulho' });
  } else if (e.stateT >= M.aim + M.between) {
    e.step++; e.flag = false;
    if (e.step >= M.count) return true;
  }
  return false;
}

function updateBoto(w: World, e: Enemy, dt: number): void {
  const B = ENEMY.boto, T = targetOf(w, e);
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1, slow = e.slowT > 0 ? 0.6 : 1;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };
  switch (e.state) {
    case 'idle': {
      face();
      if (d > 300) moveToward(e, T.x, T.y, B.speed * slow, dt);
      else if (d < 170) moveToward(e, e.x - dx, e.y - dy, B.speed * slow, dt);
      else moveToward(e, e.x - dy, e.y + dx, B.speed * 0.6 * slow, dt);
      clampArena(w, e, e.radius);
      if (e.calls < B.callAt.length && e.hp / e.maxHp <= B.callAt[e.calls]) { e.calls++; setState(e, 'call'); emit(w, { type: 'call', x: e.x, y: e.y }); break; }
      if (e.stateT >= B.idle * (e.calls >= 2 ? 0.7 : 1)) {
        e.pattern = e.count++ % 2 === 0 ? 'mergulho' : 'jatos'; e.step = 0; e.flag = false;
        if (e.pattern === 'mergulho') { setState(e, 'dive'); emit(w, { type: 'dive', x: e.x, y: e.y }); }
        else { setState(e, 'cast'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'jatos' }); }
      }
      break;
    }
    case 'call':
      if (e.stateT >= B.callTime) {
        for (let i = 0; i < B.callCount; i++) {
          const a = (i / B.callCount) * 6.283 + rand(w), pos = { x: e.x + fcos(a) * 150, y: e.y + fsin(a) * 120 };
          clampArena(w, pos, 20);
          spawnEnemy(w, { kind: 'piranha', x: pos.x, y: pos.y });
        }
        setState(e, 'idle');
      }
      break;
    case 'dive':
      if (e.stateT >= B.mergulho.dive) { e.hidden = true; e.tele = null; e.flag = false; e.step = 0; setState(e, 'vanish'); }
      break;
    case 'vanish':
      if (diveLoop(w, e, B.mergulho, dt)) {
        e.hidden = false; setState(e, 'tired');
        emit(w, { type: 'appear', x: e.x, y: e.y });
        emit(w, { type: 'crash', x: e.x, y: e.y, text: 'SEM FÔLEGO' });
      }
      break;
    case 'tired': if (e.stateT >= B.mergulho.tired) setState(e, 'idle'); break;
    case 'cast':
      face();
      if (!e.flag && e.stateT >= B.jatos.cast) { e.flag = true; fan(w, e, T, B.jatos); if (e.calls >= 1) fan(w, e, T, { ...B.jatos, lines: B.jatos.lines - 1 }, 0, 0.55); emit(w, { type: 'spit', x: e.x, y: e.y }); }
      if (e.stateT >= B.jatos.cast + B.jatos.delay + (e.calls >= 1 ? 0.6 : 0.1)) setState(e, 'recover');
      break;
    case 'recover': if (e.stateT >= 0.7) setState(e, 'idle'); break;
    case 'stagger': if (e.stateT >= 0.4) setState(e, 'idle'); break;
    default: setState(e, 'idle');
  }
}

const IARA_PATTERNS = [['jatos', 'canto', 'redemoinho'], ['onda', 'jatos', 'canto', 'mergulho'], ['onda', 'redemoinho', 'mergulho', 'jatos', 'canto']];

function updateIara(w: World, e: Enemy, dt: number): void {
  const I = ENEMY.iara, P = I.posture, T = targetOf(w, e), p = w.player, a = w.arena;
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1, slow = e.slowT > 0 ? 0.6 : 1;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };

  w.bossTime += dt;
  if (e.calls === 0 && w.bossTime >= I.enrageAt) { e.calls = 1; e.dmg *= I.enrageMult; emit(w, { type: 'enrage', x: e.x, y: e.y }); }
  if (e.sinceHit > P.decayAfter && e.state !== 'downed') e.posture = Math.max(0, e.posture - P.decay * dt);

  const calm = e.state === 'idle' || e.state === 'recover' || e.state === 'exposed' || e.state === 'downed';
  if (e.phase < 2 && e.hp / e.maxHp <= I.phases[e.phase] && calm) {
    e.phase++; e.count = 0; e.tele = null; e.pattern = ''; e.posture = 0;
    setState(e, 'roar');
    emit(w, { type: 'phase', x: e.x, y: e.y, value: e.phase });
    if (e.phase === 2) { w.flooded = true; emit(w, { type: 'shrink', x: 0, y: 0, kind: 'cheia' }); }
    return;
  }
  if (e.posture >= P.max && e.state !== 'roar' && e.state !== 'vanish' && e.state !== 'dive' && e.state !== 'downed') {
    e.posture = 0; e.tele = null; e.hidden = false; e.pattern = '';
    setState(e, 'downed');
    emit(w, { type: 'downed', x: e.x, y: e.y });
    return;
  }

  switch (e.state) {
    case 'roar': if (e.stateT >= I.roar) setState(e, 'idle'); break;
    case 'downed': if (e.stateT >= P.downed) setState(e, 'idle'); break;
    case 'exposed': if (e.stateT >= I.canto.exposed) setState(e, 'idle'); break;
    case 'recover': if (e.stateT >= 0.8) setState(e, 'idle'); break;
    case 'idle': {
      face();
      if (d > 330) moveToward(e, T.x, T.y, I.speed * slow, dt);
      else if (d < 190) moveToward(e, e.x - dx, e.y - dy, I.speed * slow, dt);
      clampArena(w, e, e.radius);
      if (e.stateT >= I.idle * (e.phase === 2 ? 0.7 : 1)) {
        const list = IARA_PATTERNS[e.phase];
        e.pattern = list[e.count++ % list.length]; e.flag = false; e.step = 0;
        if (e.pattern === 'mergulho') { setState(e, 'dive'); emit(w, { type: 'dive', x: e.x, y: e.y }); }
        else { setState(e, 'cast'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.pattern }); }
      }
      break;
    }
    case 'dive':
      if (e.stateT >= I.mergulho.dive) { e.hidden = true; e.flag = false; e.step = 0; setState(e, 'vanish'); }
      break;
    case 'vanish':
      if (diveLoop(w, e, I.mergulho, dt)) { e.hidden = false; setState(e, 'recover'); emit(w, { type: 'appear', x: e.x, y: e.y }); }
      break;
    case 'cast': {
      face();
      if (e.pattern === 'jatos') {
        const J = I.jatos;
        if (!e.flag && e.stateT >= J.cast) { e.flag = true; fan(w, e, T, J); if (e.phase >= 1) fan(w, e, T, { ...J, lines: J.lines - 1 }, 0, 0.6); emit(w, { type: 'spit', x: e.x, y: e.y }); }
        if (e.stateT >= J.cast + J.delay + (e.phase >= 1 ? 0.6 : 0)) setState(e, 'recover');
      } else if (e.pattern === 'canto') {
        if (e.stateT >= I.canto.cast) { setState(e, 'sing'); e.cd = I.canto.tick; emit(w, { type: 'sing', x: e.x, y: e.y, value: I.canto.duration }); }
      } else if (e.pattern === 'redemoinho') {
        const R = I.redemoinho;
        if (e.stateT >= R.cast) {
          for (let i = 0; i < R.count + (e.phase === 2 ? 1 : 0); i++) {
            const pos = i === 0 ? { x: p.x, y: p.y } : { x: a.x0 + 90 + rand(w) * (a.x1 - a.x0 - 180), y: a.y0 + 70 + rand(w) * (a.y1 - a.y0 - 140) };
            w.zones.push({ id: w.nextId++, kind: 'whirl', x: pos.x, y: pos.y, r: R.radius, t: -R.delay, dur: R.duration, tick: 0, power: R.damage * e.dmg });
          }
          setState(e, 'recover');
        }
      } else {
        const O = I.onda;
        if (e.stateT >= O.cast + e.step * O.between && e.step < O.count + (e.phase === 2 ? 1 : 0)) {
          const fromLeft = (e.step + e.count) % 2 === 0, h = a.y1 - a.y0;
          const gap = a.y0 + O.gap / 2 + 20 + rand(w) * (h - O.gap - 40);
          w.projectiles.push({
            id: w.nextId++, kind: 'wall', x: fromLeft ? a.x0 - 70 : a.x1 + 70, y: (a.y0 + a.y1) / 2, vx: (fromLeft ? 1 : -1) * O.speed, vy: 0, dist: 0, range: a.x1 - a.x0 + 140,
            damage: O.damage * e.dmg, pierce: true, hit: [], charged: false, sx: gap, sy: O.gap / 2, tx: 0, ty: 0, t: O.width, dur: 0, tele: null, owner: e.id,
          });
          emit(w, { type: 'wave', x: fromLeft ? a.x0 : a.x1, y: gap, kind: 'onda' });
          e.step++;
        }
        if (e.stateT >= O.cast + (O.count + (e.phase === 2 ? 1 : 0)) * O.between) setState(e, 'recover');
      }
      break;
    }
    case 'sing': {
      /* o canto puxa o herói; chegar perto dela dói. Quem resiste até o fim ganha uma janela */
      const C = I.canto;
      if (p.state !== 'dodge' && p.state !== 'dead' && !w.stats.uniques.escamaDaIara) {
        const px = e.x - p.x, py = e.y - p.y, pd = fhypot(px, py) || 1;
        if (pd > 40) { p.x += (px / pd) * C.pull * dt; p.y += (py / pd) * C.pull * dt; }
      }
      e.cd = max0(e.cd - dt);
      if (e.cd <= 0) {
        e.cd = C.tick;
        if (fhypot(p.x - e.x, p.y - e.y) < C.aura) hurtPlayer(w, C.damage * e.dmg, e.x, e.y, 0, { src: e, unblockable: true, water: true, soft: true });
      }
      e.tele = { shape: 'circle', x: e.x, y: e.y, r: C.aura, t: C.duration, dur: C.duration };
      if (e.stateT >= C.duration) { e.tele = null; setState(e, 'exposed'); emit(w, { type: 'crash', x: e.x, y: e.y, text: 'SEM VOZ' }); }
      break;
    }
    default: setState(e, 'idle');
  }
}

/** Devolve true se o inimigo é do Capítulo 2 e já foi atualizado. */
export function updateChapter2(w: World, e: Enemy, dt: number): boolean {
  const k = e.kind;
  if (k === 'boto') { updateBoto(w, e, dt); return true; }
  if (k === 'iara') { updateIara(w, e, dt); return true; }
  if (k !== 'piranha' && k !== 'sapo' && k !== 'arraia' && k !== 'caramujo' && k !== 'jacare') return false;

  const T = targetOf(w, e), p = w.player;
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1;
  const sp = e.speedMult * (e.slowT > 0 ? 0.5 : 1), wm = e.windupMult, scale = e.radius / ENEMY[k].radius;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };

  if (k === 'piranha') {
    const S = ENEMY.piranha;
    if (e.state === 'chase') {
      face();
      /* nada em zigue-zague, o que dificulta acertar de longe */
      const wob = fsin(w.time * 7 + e.id * 1.7) * 46, nx = -dy / d, ny = dx / d;
      moveToward(e, T.x + nx * wob, T.y + ny * wob, S.speed * sp, dt);
      if (d < S.leapRange && e.cd <= 0) {
        const lead = T === p ? 0.18 : 0, lx = T.x + p.vx * lead - e.x, ly = T.y + p.vy * lead - e.y, ld = fhypot(lx, ly) || 1;
        e.dirX = lx / ld; e.dirY = ly / ld;
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius, S.leapLen);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: S.lineWidth * scale, t: 0, dur: S.windup * wm };
        setState(e, 'windup');
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: k });
      }
    } else if (e.state === 'windup' && e.tele) {
      e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) { e.tele = null; e.flag = false; setState(e, 'leap'); emit(w, { type: 'bite', x: e.x, y: e.y }); }
    } else if (e.state === 'leap') {
      const left = moveToward(e, e.ax, e.ay, S.leapSpeed, dt);
      chargeContact(w, e, S.damage * e.dmg, 240);
      if (left < 8 || clampArena(w, e, e.radius)) setState(e, 'recover');
    } else if (e.state === 'recover') {
      if (e.stateT >= S.recover) { setState(e, 'chase'); e.cd = 0.35 + rand(w) * 0.5; }
    } else if (e.state === 'stagger') {
      if (e.stateT >= 0.22) setState(e, 'chase');
    } else setState(e, 'chase');
    clampArena(w, e, e.radius);
  } else if (k === 'sapo') {
    const S = ENEMY.sapo;
    face();
    if (e.state === 'idle') {
      if (e.cd <= 0 && d < S.range) { setState(e, 'spit'); e.flag = false; }
      else if (e.stateT >= S.hopEvery / sp) {
        /* pula para longe se o herói chega perto; senão, muda de lugar para não ser alvo parado */
        const away = d < S.keepAway, a = away ? fatan2(-dy, -dx) + (rand(w) - 0.5) * 1.2 : rand(w) * 6.283;
        e.dirX = fcos(a); e.dirY = fsin(a);
        setState(e, 'hop');
      }
    } else if (e.state === 'hop') {
      e.x += e.dirX * S.hopSpeed * sp * dt; e.y += e.dirY * S.hopSpeed * sp * dt; e.moving = true;
      if (e.stateT >= S.hopTime || clampArena(w, e, e.radius)) setState(e, 'idle');
    } else if (e.state === 'spit') {
      if (!e.flag && e.stateT >= 0.3 * wm) {
        e.flag = true; e.cd = S.interval * wm;
        const lead = T === p ? S.lead : 0, t = { x: T.x + p.vx * lead, y: T.y + p.vy * lead };
        clampArena(w, t, PLAYER.radius);
        lob(w, e, 'glob', t.x, t.y, S.flight, S.splash * scale, S.damage * e.dmg);
        emit(w, { type: 'spit', x: e.x, y: e.y });
      }
      if (e.stateT >= 0.6) setState(e, 'idle');
    } else setState(e, 'idle');
    clampArena(w, e, e.radius);
  } else if (k === 'arraia') {
    const S = ENEMY.arraia;
    if (e.state === 'buried') {
      e.hidden = true;
      const near = fhypot(p.x - e.x, p.y - e.y) < S.revealRange;
      if (near || (e.count > 0 && e.stateT >= S.buried) || (e.count === 0 && e.stateT >= S.buried * 2.5)) { e.hidden = false; setState(e, 'reveal'); emit(w, { type: 'reveal', x: e.x, y: e.y }); }
    } else if (e.state === 'reveal') {
      face();
      if (e.stateT >= S.revealTime * wm) { e.step = 0; setState(e, 'aim'); }
    } else if (e.state === 'aim') {
      face();
      const dur = S.aimTime * wm;
      if (e.stateT < dur * 0.7) { const lead = T === p ? 0.2 : 0, lx = T.x + p.vx * lead - e.x, ly = T.y + p.vy * lead - e.y, ld = fhypot(lx, ly) || 1; e.dirX = lx / ld; e.dirY = ly / ld; }
      const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, 0, S.stingRange);
      e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: 20, t: e.stateT, dur };
      if (e.stateT >= dur) {
        e.tele = null;
        w.projectiles.push({
          id: w.nextId++, kind: 'sting', x: e.x + e.dirX * 18, y: e.y + e.dirY * 18, vx: e.dirX * S.stingSpeed, vy: e.dirY * S.stingSpeed, dist: 0, range: S.stingRange,
          damage: S.damage * e.dmg, pierce: false, hit: [], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner: e.id,
        });
        emit(w, { type: 'spit', x: e.x, y: e.y });
        e.step++;
        const done = e.step >= S.shots + (e.elite ? 1 : 0);
        setState(e, done ? 'roam' : 'recover');
        if (done) { e.ax = w.arena.x0 + 80 + rand(w) * (w.arena.x1 - w.arena.x0 - 160); e.ay = w.arena.y0 + 60 + rand(w) * (w.arena.y1 - w.arena.y0 - 120); }
      }
    } else if (e.state === 'recover') {
      if (e.stateT >= S.between * wm) setState(e, 'aim');
    } else if (e.state === 'roam') {
      const left = moveToward(e, e.ax, e.ay, S.moveSpeed * sp, dt);
      if (Math.abs(e.ax - e.x) > 4) e.facing = e.ax >= e.x ? 1 : -1;
      if (left < 8 || e.stateT >= 1.5) { e.count++; setState(e, 'buried'); e.hidden = true; emit(w, { type: 'vanish', x: e.x, y: e.y, kind: 'areia' }); }
    } else setState(e, 'roam');
    clampArena(w, e, e.radius);
  } else if (k === 'caramujo') {
    const S = ENEMY.caramujo;
    if (e.state === 'chase') {
      face();
      /* fica no meio dos outros, para a concha cobrir o máximo deles */
      let cx = 0, cy = 0, n = 0;
      for (const o of w.enemies) if (o !== e && o.hp > 0 && !o.hidden && o.kind !== 'caramujo') { cx += o.x; cy += o.y; n++; }
      if (n > 0) moveToward(e, cx / n, cy / n, S.speed * sp, dt); else moveToward(e, T.x, T.y, S.speed * sp, dt);
      if (d < 115 * scale && e.cd <= 0) {
        e.tele = { shape: 'circle', x: e.x, y: e.y, r: 105 * scale, t: 0, dur: 0.95 * wm };
        setState(e, 'windup');
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: k });
      }
    } else if (e.state === 'windup' && e.tele) {
      e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) { emit(w, { type: 'slam', x: e.x, y: e.y, value: e.tele.shape === 'circle' ? e.tele.r : 0 }); strike(w, e.tele, 22 * e.dmg, 420, { src: e, melee: true }); e.tele = null; setState(e, 'recover'); }
    } else if (e.state === 'recover') {
      if (e.stateT >= 1.1) { setState(e, 'chase'); e.cd = 1.6; }
    } else setState(e, 'chase');
    clampArena(w, e, e.radius);
  } else {
    const J = ENEMY.jacare;
    if (e.state === 'chase') {
      /* vira devagar: dá para dar a volta nele, mas aí vem a rabada */
      const want = fatan2(dy, dx), cur = fatan2(e.dirY, e.dirX), turn = 2.3 * sp * dt;
      const diff = wrapAngle(want - cur), na = cur + Math.max(-turn, Math.min(turn, diff));
      e.dirX = fcos(na); e.dirY = fsin(na);
      if (Math.abs(e.dirX) > 0.15) e.facing = e.dirX >= 0 ? 1 : -1;
      if (d > J.biteRange * 0.6 * scale) { e.x += e.dirX * J.speed * sp * dt; e.y += e.dirY * J.speed * sp * dt; e.walk += J.speed * sp * dt * 0.07; e.moving = true; }
      if (e.cd <= 0) {
        if (d < J.tailRange * scale && Math.abs(diff) > 1.0) {
          e.tele = { shape: 'circle', x: e.x, y: e.y, r: J.tailRadius * scale, t: 0, dur: J.tailWindup * wm };
          setState(e, 'tail');
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'rabada' });
        } else if (d < J.biteRange * scale && Math.abs(diff) < 0.3) {
          const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius, J.lungeLen * scale + e.radius);
          e.ax = x2; e.ay = y2;
          e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: J.lineWidth * scale, t: 0, dur: J.windup * wm };
          setState(e, 'windup');
          emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: k });
        }
      }
    } else if (e.state === 'windup' && e.tele) {
      e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) { e.tele = null; e.flag = false; setState(e, 'charge'); emit(w, { type: 'bite', x: e.x, y: e.y }); }
    } else if (e.state === 'charge') {
      const left = moveToward(e, e.ax, e.ay, J.lungeSpeed, dt);
      chargeContact(w, e, J.damage * e.dmg, 520);
      if (left < 10 || clampArena(w, e, e.radius)) setState(e, 'recover');
    } else if (e.state === 'tail' && e.tele) {
      e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) { emit(w, { type: 'slam', x: e.x, y: e.y, value: e.tele.shape === 'circle' ? e.tele.r : 0 }); strike(w, e.tele, J.tailDamage * e.dmg, 560, { src: e, melee: true }); e.tele = null; setState(e, 'recover'); }
    } else if (e.state === 'recover') {
      if (e.stateT >= J.recover) { setState(e, 'chase'); e.cd = 0.5 * wm; }
    } else setState(e, 'chase');
    clampArena(w, e, e.radius);
  }
  return true;
}
