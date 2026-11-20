/** Comportamento dos monstros comuns, dos elites e da Caipora. O Curupira fica em boss.ts. */
import { ENEMY, MOD, PLAYER } from '../data/balance';
import { SPELL_NUM } from '../data/content';
import { updateCurupira } from './boss';
import { CH2_START, updateChapter2 } from './enemies2';
import { clampArena, damageEnemy, emit, hurtPet, hurtPlayer, max0, rand, rayExit, setState, spawnEnemy, spellScale, strike, targetOf } from './core';
import type { Enemy, World } from './types';

export function moveToward(e: Enemy, tx: number, ty: number, speed: number, dt: number): number {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d < 2) { e.moving = false; return d; }
  e.x += (dx / d) * speed * dt; e.y += (dy / d) * speed * dt;
  e.walk += speed * dt * 0.11; e.moving = true;
  return d;
}

/** Contato de um inimigo em investida com o herói e o companheiro. Uma vez por investida. */
export function chargeContact(w: World, e: Enemy, damage: number, knock: number): void {
  const p = w.player, pet = w.pet;
  if (!e.flag && Math.hypot(p.x - e.x, p.y - e.y) < e.radius + PLAYER.radius + 4) {
    e.flag = true;
    hurtPlayer(w, damage, e.x - e.dirX * 20, e.y - e.dirY * 20, knock, { src: e, melee: true });
  }
  if (pet && pet.state !== 'down' && e.count >= 0 && Math.hypot(pet.x - e.x, pet.y - e.y) < e.radius + 14 && pet.flash <= 0) hurtPet(w, damage * 0.6);
}

/** Projétil em arco com a marca do ponto de queda no chão. */
export function lob(w: World, e: Enemy, kind: 'seed' | 'glob', tx: number, ty: number, flight: number, radius: number, damage: number): void {
  w.projectiles.push({
    id: w.nextId++, kind, x: e.x, y: e.y, vx: 0, vy: 0, dist: 0, range: 0, damage, pierce: false, hit: [], charged: false,
    sx: e.x, sy: e.y, tx, ty, t: 0, dur: flight,
    tele: { shape: 'circle', x: tx, y: ty, r: radius, t: 0, dur: flight }, owner: e.id,
  });
}

export function updateEnemy(w: World, e: Enemy, dt: number): void {
  e.flash = max0(e.flash - dt); e.cd = max0(e.cd - dt); e.stateT += dt; e.moving = false; e.sinceHit += dt;
  e.aggroPet = max0(e.aggroPet - dt); e.slowT = max0(e.slowT - dt);
  const decay = Math.exp(-9 * dt);
  e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= decay; e.ky *= decay;

  if (e.poisonT > 0) {
    const N = SPELL_NUM.dardo;
    e.poisonT -= dt; e.poisonTick -= dt;
    if (e.poisonTick <= 0) {
      e.poisonTick += N.poisonEvery;
      damageEnemy(w, e, N.poisonTick * spellScale(w) * w.stats.poisonMult, 'poison', 0);
      if (e.hp <= 0) return;
    }
  }
  if (e.mods.includes('regenerador') && e.hp > 0 && e.sinceHit > MOD.regenerador.after && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * MOD.regenerador.perSecond * dt);

  if (e.state === 'spawn') {
    if (e.stateT >= ENEMY.spawnTime) {
      if (e.kind === 'urutau') { e.hidden = true; setState(e, 'perched'); }
      else if (e.kind === 'arraia') { e.hidden = true; setState(e, 'buried'); }
      else if (CH2_START[e.kind]) setState(e, CH2_START[e.kind]!);
      else setState(e, e.kind === 'cuspidor' || e.kind === 'curupira' ? 'idle' : e.kind === 'queixada' || e.kind === 'caipora' ? 'roam' : 'chase');
    }
    return;
  }
  if (e.kind === 'curupira') { updateCurupira(w, e, dt); return; }
  if (w.current && !e.hidden && e.kind !== 'cuspidor' && e.kind !== 'jacare' && e.kind !== 'caramujo' && e.kind !== 'boto' && e.kind !== 'iara') e.x += w.current * 0.6 * dt;

  /* atordoado (aparada) ou preso (Cipó-Laço): não age */
  if (e.stunT > 0 || e.rootT > 0) {
    e.stunT = max0(e.stunT - dt); e.rootT = max0(e.rootT - dt);
    e.tele = null;
    if (e.state === 'windup' || e.state === 'aim' || e.state === 'fuse' || e.state === 'spit' || e.state === 'sting' || e.state === 'tail' || e.state === 'hop') setState(e, CH2_START[e.kind] && e.kind !== 'arraia' ? CH2_START[e.kind]! : e.kind === 'queixada' || e.kind === 'caipora' ? 'roam' : e.kind === 'cuspidor' ? 'idle' : e.kind === 'urutau' ? 'hover' : 'chase');
    clampArena(w, e, e.radius);
    return;
  }

  const T = targetOf(w, e);
  const dx = T.x - e.x, dy = T.y - e.y, d = Math.hypot(dx, dy) || 1;
  const sp = e.speedMult * (e.slowT > 0 ? 0.5 : 1), wm = e.windupMult;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };

  if (updateChapter2(w, e, dt)) return;
  if (e.kind === 'sauva') {
    const S = ENEMY.sauva;
    if (e.state === 'chase') {
      face();
      /* cerca o herói: cada saúva chega por um lado diferente e mira onde ele vai estar */
      const a = e.id * 2.4, pl = w.player, lead = T === pl ? 0.22 : 0;
      moveToward(e, T.x + pl.vx * lead + Math.cos(a) * 30, T.y + pl.vy * lead + Math.sin(a) * 30, S.speed * sp, dt);
      if (d < S.biteRange + (e.radius - S.radius) && e.cd <= 0) {
        const lx = T.x + pl.vx * lead * 0.8 - e.x, ly = T.y + pl.vy * lead * 0.8 - e.y, ld = Math.hypot(lx, ly) || 1, reach = S.biteOffset + S.lunge;
        setState(e, 'windup'); e.dirX = lx / ld; e.dirY = ly / ld;
        e.tele = { shape: 'circle', x: e.x + e.dirX * reach, y: e.y + e.dirY * reach, r: S.biteRadius * (e.radius / S.radius), t: 0, dur: S.windup * wm };
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
    } else if (e.state === 'windup' && e.tele) {
      e.tele.t = e.stateT;
      /* o bote: avança no fim do aviso */
      if (e.stateT >= e.tele.dur * 0.6) { const v = S.lunge / (e.tele.dur * 0.4); e.x += e.dirX * v * dt; e.y += e.dirY * v * dt; }
      if (e.stateT >= e.tele.dur) {
        emit(w, { type: 'bite', x: e.tele.x, y: e.tele.y });
        strike(w, e.tele, S.damage * e.dmg, 260, { src: e, melee: true });
        e.tele = null; setState(e, 'recover');
      }
    } else if (e.state === 'recover') {
      if (e.stateT >= S.recover) { setState(e, 'chase'); e.cd = 0.15 + rand(w) * 0.3; }
    } else if (e.state === 'stagger') {
      if (e.stateT >= 0.24) setState(e, 'chase');
    } else setState(e, 'chase');
    clampArena(w, e, e.radius);
  } else if (e.kind === 'queixada') {
    const Q = ENEMY.queixada;
    if (e.state === 'roam') {
      face();
      if (d < Q.minRange) moveToward(e, e.x - dx, e.y - dy, Q.speed * sp, dt);
      else if (d > 520) moveToward(e, T.x, T.y, Q.speed * sp, dt);
      if (e.cd <= 0) { setState(e, 'aim'); e.dirX = dx / d; e.dirY = dy / d; emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
      clampArena(w, e, e.radius);
    } else if (e.state === 'aim') {
      const aim = Q.aimTime * wm;
      if (e.stateT < Q.lockAt * wm) { e.dirX = dx / d; e.dirY = dy / d; face(); }
      const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius);
      e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: Q.lineWidth * (e.radius / Q.radius), t: e.stateT, dur: aim };
      if (e.stateT >= aim) { e.tele = null; e.flag = false; setState(e, 'charge'); emit(w, { type: 'charge', x: e.x, y: e.y }); }
    } else if (e.state === 'charge') {
      e.x += e.dirX * Q.chargeSpeed * dt; e.y += e.dirY * Q.chargeSpeed * dt;
      e.walk += Q.chargeSpeed * dt * 0.05; e.moving = true;
      chargeContact(w, e, Q.damage * e.dmg, 520);
      if (clampArena(w, e, e.radius)) { setState(e, 'stunned'); emit(w, { type: 'crash', x: e.x, y: e.y, text: 'TONTA' }); }
    } else if (e.state === 'stunned') {
      if (e.stateT >= Q.stun * Math.max(0.6, wm)) { setState(e, 'roam'); e.cd = Q.cooldown * wm; }
    } else setState(e, 'roam');
  } else if (e.kind === 'cuspidor') {
    const C = ENEMY.cuspidor;
    face();
    if (e.state === 'idle') {
      if (e.cd <= 0 && d < C.range) { setState(e, 'spit'); e.flag = false; }
    } else if (e.state === 'spit') {
      if (!e.flag && e.stateT >= 0.25 * wm) {
        e.flag = true; e.cd = C.interval * wm;
        const p = w.player, shots = w.cfg.level >= C.doubleFrom ? 2 : 1;
        for (let i = 0; i < shots; i++) {
          /* o primeiro vai onde o herói está indo; o segundo, onde ele está agora */
          const lead = T === p ? (i === 0 ? C.flight * 0.85 : 0) : 0;
          const t = { x: T.x + p.vx * lead, y: T.y + p.vy * lead };
          clampArena(w, t, PLAYER.radius);
          lob(w, e, 'seed', t.x, t.y, C.flight + i * 0.18, C.splash * (e.elite ? 1.3 : 1), C.damage * e.dmg);
        }
        emit(w, { type: 'spit', x: e.x, y: e.y });
      }
      if (e.stateT >= 0.55) setState(e, 'idle');
    } else setState(e, 'idle');
  } else if (e.kind === 'tronco') {
    const K = ENEMY.tronco, scale = e.radius / K.radius;
    if (e.state === 'chase') {
      face();
      moveToward(e, T.x, T.y, K.speed * sp, dt);
      if (d < K.slamRange * scale) {
        setState(e, 'windup'); e.dirX = dx / d; e.dirY = dy / d;
        e.tele = { shape: 'circle', x: e.x + e.dirX * K.slamOffset * scale, y: e.y + e.dirY * K.slamOffset * scale, r: K.slamRadius * scale, t: 0, dur: K.windup * wm };
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
    } else if (e.state === 'windup' && e.tele && e.tele.shape === 'circle') {
      e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) {
        emit(w, { type: 'slam', x: e.tele.x, y: e.tele.y, value: e.tele.r });
        strike(w, e.tele, K.damage * e.dmg, 560, { src: e, melee: true });
        e.tele = null; setState(e, 'exposed');
      }
    } else if (e.state === 'exposed') {
      if (e.stateT >= K.exposed) setState(e, 'chase');
    } else setState(e, 'chase');
    clampArena(w, e, e.radius);
  } else if (e.kind === 'urutau') {
    const U = ENEMY.urutau;
    if (e.state === 'perched') {
      if (Math.hypot(w.player.x - e.x, w.player.y - e.y) < U.revealRange) { e.hidden = false; setState(e, 'reveal'); emit(w, { type: 'reveal', x: e.x, y: e.y }); }
    } else if (e.state === 'reveal') {
      face();
      if (e.stateT >= U.revealTime) setState(e, 'hover');
    } else if (e.state === 'hover') {
      face();
      const a = e.id * 1.9 + w.time * 1.4;
      moveToward(e, T.x + Math.cos(a) * U.hoverDist, T.y + Math.sin(a) * U.hoverDist * 0.7, U.flySpeed * sp, dt);
      if (e.stateT >= U.hover) {
        setState(e, 'aim'); e.dirX = dx / d; e.dirY = dy / d;
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius, U.dashLen);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: U.lineWidth, t: 0, dur: U.aimTime * wm };
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
    } else if (e.state === 'aim' && e.tele) {
      e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) { e.tele = null; e.flag = false; setState(e, 'dash'); }
    } else if (e.state === 'dash') {
      const left = moveToward(e, e.ax, e.ay, U.dashSpeed, dt);
      chargeContact(w, e, U.damage * e.dmg, 280);
      if (left < 10 || clampArena(w, e, e.radius)) setState(e, 'recover');
    } else if (e.state === 'recover') {
      if (e.stateT >= U.recover) setState(e, 'hover');
    } else setState(e, 'hover');
    clampArena(w, e, e.radius);
  } else if (e.kind === 'cogumelo') {
    const M = ENEMY.cogumelo;
    if (e.state === 'chase') {
      face();
      moveToward(e, T.x, T.y, M.speed * sp, dt);
      if (d < M.fuseRange) {
        setState(e, 'fuse');
        e.tele = { shape: 'circle', x: e.x, y: e.y, r: M.blastRadius * (e.radius / M.radius), t: 0, dur: M.fuse * wm };
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
    } else if (e.state === 'fuse' && e.tele && e.tele.shape === 'circle') {
      moveToward(e, T.x, T.y, M.speed * sp * 0.3, dt);
      e.tele.x = e.x; e.tele.y = e.y; e.tele.t = e.stateT;
      if (e.stateT >= e.tele.dur) {
        emit(w, { type: 'explode', x: e.x, y: e.y, value: e.tele.r });
        strike(w, e.tele, M.damage * e.dmg, 340, { src: e, nature: true });
        w.zones.push({ id: w.nextId++, kind: 'cloud', x: e.x, y: e.y, r: e.tele.r * 0.85, t: 0, dur: M.cloud, tick: M.cloudEvery, power: M.cloudTick * e.dmg });
        e.tele = null; e.hp = 0;
        emit(w, { type: 'kill', x: e.x, y: e.y, kind: e.kind, id: e.id });
      }
    } else setState(e, 'chase');
    clampArena(w, e, e.radius);
  } else if (e.kind === 'caipora') {
    const K = ENEMY.caipora;
    if (e.state === 'roam') {
      face();
      if (d > 430) moveToward(e, T.x, T.y, K.speed * sp, dt);
      else if (d < 200) moveToward(e, e.x - dx, e.y - dy, K.speed * sp, dt);
      if (e.calls < K.callAt.length && e.hp / e.maxHp <= K.callAt[e.calls]) {
        e.calls++; setState(e, 'call'); emit(w, { type: 'call', x: e.x, y: e.y });
      } else if (e.cd <= 0) { e.count = 0; setState(e, 'aim'); e.dirX = dx / d; e.dirY = dy / d; emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
      clampArena(w, e, e.radius);
    } else if (e.state === 'call') {
      if (e.stateT >= K.callTime) {
        for (let i = 0; i < 3; i++) {
          const a = rand(w) * 6.283, pos = { x: e.x + Math.cos(a) * 110, y: e.y + Math.sin(a) * 90 };
          clampArena(w, pos, 20);
          spawnEnemy(w, { kind: 'sauva', x: pos.x, y: pos.y });
        }
        setState(e, 'roam'); e.cd = 0.8;
      }
    } else if (e.state === 'aim') {
      const aim = K.aimTime * (e.count > 0 ? 0.75 : 1);
      if (e.stateT < K.lockAt * (e.count > 0 ? 0.75 : 1)) { e.dirX = dx / d; e.dirY = dy / d; face(); }
      const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius);
      e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: K.lineWidth, t: e.stateT, dur: aim };
      if (e.stateT >= aim) { e.tele = null; e.flag = false; setState(e, 'charge'); emit(w, { type: 'charge', x: e.x, y: e.y }); }
    } else if (e.state === 'charge') {
      e.x += e.dirX * K.chargeSpeed * dt; e.y += e.dirY * K.chargeSpeed * dt;
      e.walk += K.chargeSpeed * dt * 0.05; e.moving = true;
      chargeContact(w, e, K.damage * e.dmg, 540);
      if (clampArena(w, e, e.radius)) {
        e.count++;
        if (e.count < 2) setState(e, 'skid');
        else { setState(e, 'tired'); emit(w, { type: 'crash', x: e.x, y: e.y, text: 'CANSADA' }); }
      }
    } else if (e.state === 'skid') {
      face();
      if (e.stateT >= K.skid) { setState(e, 'aim'); e.dirX = dx / d; e.dirY = dy / d; emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
    } else if (e.state === 'tired') {
      if (e.stateT >= K.tired) { setState(e, 'roam'); e.cd = K.cooldown; }
    } else setState(e, 'roam');
  }
}

/** Impede inimigos de ficarem um em cima do outro e do herói. */
export function separate(w: World): void {
  const es = w.enemies;
  const fixed = (e: Enemy) => e.kind === 'cuspidor' || e.state === 'charge' || e.state === 'dash' || e.state === 'leap' || e.state === 'hop' || e.state === 'spawn' || e.state === 'perched' || e.hidden || e.fake;
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = (a.radius + b.radius) * 0.9;
      if (d >= min) continue;
      const fa = fixed(a), fb = fixed(b);
      if (fa && fb) continue;
      const push = min - d, nx = dx / d, ny = dy / d;
      const heavy = (e: Enemy) => e.kind === 'tronco' || e.kind === 'caipora' || e.kind === 'curupira' || e.kind === 'jacare' || e.kind === 'caramujo' || e.kind === 'boto' || e.kind === 'iara';
      const wa = fa ? 0 : fb ? 1 : heavy(a) ? 0.15 : heavy(b) ? 0.85 : 0.5;
      a.x -= nx * push * wa; a.y -= ny * push * wa;
      b.x += nx * push * (1 - wa); b.y += ny * push * (1 - wa);
    }
  }
  const p = w.player;
  if (p.state === 'dodge' || p.state === 'dead') return;
  for (const e of es) {
    if (e.state === 'spawn' || e.state === 'charge' || e.state === 'dash' || e.state === 'leap' || e.state === 'hop' || e.hidden || e.fake) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 0.01, min = e.radius * 0.8 + PLAYER.radius;
    if (d >= min) continue;
    p.x += (dx / d) * (min - d); p.y += (dy / d) * (min - d);
  }
  clampArena(w, p, PLAYER.radius);
}
