/**
 * Os chefes dos capítulos 3 a 8 (docs/gdd/05). Todos usam o mesmo motor: fases por vida, padrões de ataque
 * em ordem, postura (Encantados), fúria por tempo e uma janela de punição. Cada padrão é uma pequena
 * linha do tempo dentro do estado `cast`; o truque de cada lenda está nos padrões dela.
 */
import { fatan2, fcos, fhypot, fsin } from './fmath';
import { BOSSES, BOSS_NUM, type BossKind, type MonsterKind } from '../data/bestiary';
import { ELEMENT_ORDER, type ElementId } from '../data/content';
import { addHazard, clampArena, emit, hurtPlayer, rand, rayExit, setState, spawnEnemy, strike, targetOf } from './core';
import { moveToward } from './enemies';
import type { Enemy, World } from './types';

const SWARM: Record<number, MonsterKind> = { 3: 'calango', 4: 'formiga', 5: 'morcego', 6: 'queroquero', 7: 'ariranha', 8: 'vulto' };
const ECHOES: string[][] = [['investida', 'chuva'], ['onda', 'leque'], ['chute', 'leque'], ['cuspe', 'anel'], ['pisao', 'patada'], ['salto', 'garras'], ['pocoes', 'ninar']];
const ECHO_ELEMENT: ElementId[] = ['natureza', 'agua', 'tempestade', 'fogo', 'terra', 'sombra', 'encanto'];
const TEX: Record<string, string> = { natureza: 'ethorn', agua: 'ejet', tempestade: 'e_espinho', fogo: 'e_pequi', terra: 'e_pedra', sombra: 'e_sombra', encanto: 'e_pocao', null: 'e_caco' };

export function bossDef(e: Enemy) { return BOSSES[e.kind as BossKind]; }

/** Elemento do chefe agora (o Eco muda de elemento a cada fase). */
function elOf(e: Enemy): ElementId | null {
  return e.kind === 'ecos' ? ECHO_ELEMENT[Math.min(6, e.phase)] : bossDef(e).element;
}

function dmg(w: World, e: Enemy, mult: number): number {
  return bossDef(e).damage * mult * e.dmg;
}

/** Leque de linhas que estouram depois de um aviso (jatos, sopro de fogo). */
function fan(w: World, e: Enemy, T: { x: number; y: number }, J: { lines: number; spread: number; delay: number; width: number; len: number; damage: number }, wait = 0): void {
  const base = fatan2(T.y - e.y, T.x - e.x);
  for (let i = 0; i < J.lines; i++) {
    const a = base + (i - (J.lines - 1) / 2) * J.spread, [x2, y2] = rayExit(w, e.x, e.y, fcos(a), fsin(a), 0, J.len);
    addHazard(w, { kind: elOf(e) === 'fogo' ? 'fire' : elOf(e) === 'agua' ? 'jet' : 'spell', element: elOf(e), tele: { shape: 'line', x: e.x, y: e.y, x2, y2, w: J.width, t: -wait, dur: J.delay }, damage: dmg(w, e, J.damage), slow: 0 });
  }
}

function circles(w: World, e: Enemy, T: { x: number; y: number }, n: number, r: number, delay: number, spread: number, mult: number, kind: 'spell' | 'bolt' | 'fire' | 'sleep' = 'spell', extra?: { sleep?: number }): void {
  for (let i = 0; i < n; i++) {
    const a = rand(w) * Math.PI * 2, d = i === 0 ? 0 : spread * (0.45 + rand(w) * 0.7), pos = { x: T.x + fcos(a) * d, y: T.y + fsin(a) * d };
    clampArena(w, pos, 20);
    addHazard(w, { kind, element: elOf(e), tele: { shape: 'circle', x: pos.x, y: pos.y, r, t: -i * 0.12, dur: delay }, damage: dmg(w, e, mult), slow: 0, extra });
  }
}

function ring(w: World, e: Enemy, n: number, speed: number, mult: number, offset: number): void {
  const el = elOf(e);
  for (let i = 0; i < n; i++) {
    const a = offset + (i / n) * Math.PI * 2;
    w.projectiles.push({ id: w.nextId++, kind: 'eproj', x: e.x + fcos(a) * 24, y: e.y + fsin(a) * 24, vx: fcos(a) * speed, vy: fsin(a) * speed, dist: 0, range: 900, damage: dmg(w, e, mult), pierce: false, hit: [], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner: e.id, element: el, tex: TEX[String(el)] });
  }
}

function lob(w: World, e: Enemy, x: number, y: number, r: number, flight: number, mult: number, el: ElementId | null): void {
  const t = { x, y };
  clampArena(w, t, 20);
  w.projectiles.push({ id: w.nextId++, kind: 'elob', x: e.x, y: e.y, vx: 0, vy: 0, dist: 0, range: 0, damage: dmg(w, e, mult), pierce: false, hit: [], charged: false, sx: e.x, sy: e.y, tx: t.x, ty: t.y, t: 0, dur: flight, tele: { shape: 'circle', x: t.x, y: t.y, r, t: 0, dur: flight }, owner: e.id, element: el, tex: el === 'fogo' ? 'e_pequi' : 'e_pocao' });
}

/** Golpe à frente: um círculo que segue o alvo até perto do fim do aviso. */
function frontal(w: World, e: Enemy, T: { x: number; y: number }, N: { aim: number; radius: number; offset: number; damage: number }, dt: number): boolean {
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1;
  if (e.stateT < N.aim * 0.65) { e.dirX = dx / d; e.dirY = dy / d; if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; if (d > N.offset + 40) moveToward(e, T.x, T.y, bossDef(e).speed * 0.6, dt); }
  e.tele = { shape: 'circle', x: e.x + e.dirX * N.offset, y: e.y + e.dirY * N.offset, r: N.radius, t: e.stateT, dur: N.aim };
  if (e.stateT >= N.aim) {
    emit(w, { type: 'slam', x: e.tele.x, y: e.tele.y, value: N.radius });
    strike(w, e.tele, dmg(w, e, N.damage), 420, { src: e, melee: true });
    e.tele = null;
    return true;
  }
  return false;
}

/** Um padrão em andamento. Devolve 'done', 'exposed' (abre a guarda) ou nada (continua). */
function run(w: World, e: Enemy, T: { x: number; y: number }, dt: number): 'done' | 'exposed' | 'down' | void {
  const p = w.player, D = bossDef(e), N = BOSS_NUM, t = e.stateT;
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1;
  switch (e.pattern) {
    case 'investida': {
      const I = N.investida, aim = I.aim * (e.kind === 'teiniagua' ? 0.9 : 1);
      if (!e.flag) {
        if (t < aim * (I.lockAt / I.aim)) { e.dirX = dx / d; e.dirY = dy / d; if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; }
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: I.width, t, dur: aim };
        if (t >= aim) { e.tele = null; e.flag = true; e.mem.hit = 0; e.stateT = 0; emit(w, { type: 'charge', x: e.x, y: e.y }); }
        return;
      }
      const left = moveToward(e, e.ax, e.ay, I.speed, dt);
      e.walk += I.speed * dt * 0.05;
      if (!e.mem.hit && fhypot(p.x - e.x, p.y - e.y) < e.radius + 20) { e.mem.hit = 1; hurtPlayer(w, dmg(w, e, I.damage), e.x - e.dirX * 20, e.y - e.dirY * 20, 520, { src: e, melee: true }); }
      if (e.kind === 'mula' && (e.mem.trail ?? 0) <= 0) { e.mem.trail = 0.06; w.zones.push({ id: w.nextId++, kind: 'fire', x: e.x, y: e.y, r: 44, t: 0, dur: 4, tick: 0.5, power: dmg(w, e, 0.15), hostile: true }); }
      e.mem.trail = (e.mem.trail ?? 0) - dt;
      if (left < 12) {
        e.step++; e.flag = false; e.stateT = 0;
        if (e.step >= I.count + (e.phase >= 1 && D.encantado ? 1 : 0)) { emit(w, { type: 'crash', x: e.x, y: e.y, text: 'TROPEÇOU' }); return 'exposed'; }
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
      return;
    }
    case 'leque': if (!e.flag && t >= N.leque.cast) { e.flag = true; fan(w, e, T, N.leque); if (e.phase >= 1) fan(w, e, T, { ...N.leque, lines: N.leque.lines - 1 }, 0.55); emit(w, { type: 'spit', x: e.x, y: e.y }); } return t >= N.leque.cast + N.leque.delay + 0.6 ? 'done' : undefined;
    case 'sopro': if (!e.flag && t >= N.sopro.cast) { e.flag = true; fan(w, e, T, N.sopro); emit(w, { type: 'spit', x: e.x, y: e.y }); } return t >= N.sopro.cast + N.sopro.delay + 0.2 ? 'done' : undefined;
    case 'chuva': if (!e.flag && t >= N.chuva.cast) { e.flag = true; circles(w, e, T, N.chuva.count + e.phase, N.chuva.radius, N.chuva.delay, N.chuva.spread, N.chuva.damage, elOf(e) === 'tempestade' ? 'bolt' : elOf(e) === 'fogo' ? 'fire' : 'spell'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'chuva' }); } return t >= N.chuva.cast + 0.5 ? 'done' : undefined;
    case 'cuspe': if (!e.flag && t >= N.cuspe.cast) { e.flag = true; for (let i = 0; i < N.cuspe.count + e.phase; i++) { const a = rand(w) * 6.283, r = i === 0 ? 0 : N.cuspe.spread * rand(w); lob(w, e, T.x + fcos(a) * r, T.y + fsin(a) * r, N.cuspe.radius, N.cuspe.delay, N.cuspe.damage, 'fogo'); } emit(w, { type: 'spit', x: e.x, y: e.y }); } return t >= N.cuspe.cast + 0.4 ? 'done' : undefined;
    case 'pocoes': if (!e.flag && t >= N.pocoes.cast) { e.flag = true; const els: ElementId[] = ['fogo', 'natureza', 'agua', 'sombra']; for (let i = 0; i < N.pocoes.count + e.phase; i++) { const a = rand(w) * 6.283, r = i === 0 ? 0 : N.pocoes.spread * (0.4 + rand(w)); lob(w, e, T.x + fcos(a) * r, T.y + fsin(a) * r, N.pocoes.radius, N.pocoes.flight, N.pocoes.damage, els[Math.floor(rand(w) * els.length)]); } emit(w, { type: 'spit', x: e.x, y: e.y }); } return t >= N.pocoes.cast + 0.5 ? 'done' : undefined;
    case 'anel': {
      const A = N.anel;
      if (t >= A.cast + e.step * 0.45 && e.step < A.waves + (e.phase >= 2 ? 1 : 0)) { ring(w, e, A.count, A.speed, A.damage, e.step * 0.2); e.step++; emit(w, { type: 'spit', x: e.x, y: e.y }); }
      return e.step >= A.waves + (e.phase >= 2 ? 1 : 0) && t >= A.cast + e.step * 0.45 + 0.3 ? 'done' : undefined;
    }
    case 'pisao': {
      const P = N.pisao;
      if (!e.flag && t >= P.cast) {
        e.flag = true;
        for (let k = 0; k < P.rings; k++) addHazard(w, { kind: 'quake', element: elOf(e), tele: { shape: 'circle', x: e.x, y: e.y, r: P.step * (k + 1) + e.radius, t: -k * P.gap, dur: P.delay }, damage: dmg(w, e, P.damage), slow: 0 });
        emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'pisao' });
      }
      return t >= P.cast + P.delay + P.rings * P.gap ? 'done' : undefined;
    }
    case 'salto': {
      const S = N.salto;
      if (!e.flag) {
        if (t < S.aim * 0.7) { e.ax = T.x; e.ay = T.y; }
        e.tele = { shape: 'circle', x: e.ax, y: e.ay, r: S.radius, t, dur: S.aim + S.air };
        if (t >= S.aim) { e.flag = true; e.mem.sx = e.x; e.mem.sy = e.y; e.stateT = 0; emit(w, { type: 'dodge', x: e.x, y: e.y }); }
        return;
      }
      const k = Math.min(1, t / S.air);
      e.x = e.mem.sx + (e.ax - e.mem.sx) * k; e.y = e.mem.sy + (e.ay - e.mem.sy) * k;
      if (e.tele) e.tele.t = S.aim + t;
      if (k >= 1) { if (e.tele) { emit(w, { type: 'slam', x: e.ax, y: e.ay, value: S.radius }); strike(w, e.tele, dmg(w, e, S.damage), 520, { src: e, melee: true }); } e.tele = null; return 'done'; }
      return;
    }
    case 'pisar': {
      const S = N.pisar;
      if (!e.flag) {
        if (t < S.aim * 0.75) { e.ax = p.x; e.ay = p.y; }
        e.hidden = t > S.aim * 0.4;
        e.tele = { shape: 'circle', x: e.ax, y: e.ay, r: S.radius, t, dur: S.aim + S.air };
        if (t >= S.aim) { e.flag = true; e.stateT = 0; }
        return;
      }
      if (e.tele) e.tele.t = S.aim + t;
      if (t >= S.air) {
        e.x = e.ax; e.y = e.ay; e.hidden = false;
        if (e.tele) { emit(w, { type: 'slam', x: e.x, y: e.y, value: S.radius }); strike(w, e.tele, dmg(w, e, S.damage), 300, { src: e, melee: true }); }
        e.tele = null; emit(w, { type: 'appear', x: e.x, y: e.y });
        return 'done';
      }
      return;
    }
    case 'agarrar': {
      const G = N.agarrar;
      if (!e.flag) {
        if (t < G.aim * 0.7) { e.dirX = dx / d; e.dirY = dy / d; if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; }
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius, G.len);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: G.width, t, dur: G.aim };
        if (t >= G.aim) { e.tele = null; e.flag = true; e.stateT = 0; e.mem.hit = 0; }
        return;
      }
      if (e.mem.hit) {
        if (p.heldT <= 0) return 'done';
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03 * dt);
        return;
      }
      const left = moveToward(e, e.ax, e.ay, G.speed, dt);
      if (fhypot(p.x - e.x, p.y - e.y) < e.radius + 22 && hurtPlayer(w, dmg(w, e, G.drain), e.x, e.y, 0, { src: e, melee: true })) {
        e.mem.hit = 1; p.heldT = G.hold; p.x = e.x + e.dirX * (e.radius + 10); p.y = e.y + e.dirY * (e.radius + 10);
        emit(w, { type: 'grab', x: p.x, y: p.y });
      }
      return left < 10 ? 'done' : undefined;
    }
    case 'enterrar': {
      const B = N.enterrar;
      if (!e.flag) {
        e.hidden = true; e.tele = null;
        if (t >= B.under) { e.flag = true; e.stateT = 0; e.ax = p.x; e.ay = p.y; addHazard(w, { kind: 'dive', element: elOf(e), tele: { shape: 'circle', x: p.x, y: p.y, r: B.radius, t: 0, dur: B.delay }, damage: dmg(w, e, B.damage), slow: 0 }); emit(w, { type: 'telegraph', x: p.x, y: p.y, kind: 'enterrar' }); }
        return;
      }
      if (t >= B.delay) { e.x = e.ax; e.y = e.ay; e.hidden = false; emit(w, { type: 'appear', x: e.x, y: e.y }); return 'done'; }
      return;
    }
    case 'chamado': case 'uivo': case 'risada': {
      const cast = e.pattern === 'uivo' ? N.uivo.cast : e.pattern === 'risada' ? N.risada.cast : N.chamado.cast;
      if (!e.flag && t >= cast) {
        e.flag = true;
        const n = e.pattern === 'uivo' ? N.uivo.summon : e.pattern === 'risada' ? N.risada.count : N.chamado.count;
        const kind = SWARM[D.chapter] ?? 'vulto';
        for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rand(w), pos = { x: e.x + fcos(a) * 150, y: e.y + fsin(a) * 120 }; clampArena(w, pos, 20); spawnEnemy(w, { kind, x: pos.x, y: pos.y }); }
        if (e.pattern === 'uivo') { const k = 380 / d; p.kx -= dx * k; p.ky -= dy * k; }
        emit(w, { type: 'call', x: e.x, y: e.y });
      }
      return t >= cast + 0.4 ? 'done' : undefined;
    }
    case 'chute': return frontal(w, e, T, { ...N.chute, aim: N.chute.aim }, dt) ? 'done' : undefined;
    case 'facada': return frontal(w, e, T, N.facada, dt) ? 'done' : undefined;
    case 'colherada': return frontal(w, e, T, N.colherada, dt) ? 'done' : undefined;
    case 'patada': return frontal(w, e, T, N.patada, dt) ? 'done' : undefined;
    case 'varrer': return frontal(w, e, T, { aim: N.varrer.aim, radius: N.varrer.radius * 0.7, offset: 140, damage: N.varrer.damage }, dt) ? 'done' : undefined;
    case 'garras': {
      const G = N.garras;
      if (e.step >= G.count) return 'done';
      if (frontal(w, e, T, { aim: G.aim, radius: G.radius, offset: G.offset, damage: G.damage }, dt)) { e.step++; e.stateT = -G.between; e.x += e.dirX * 40; e.y += e.dirY * 40; }
      return;
    }
    case 'roubo': {
      if (!e.flag && t >= N.roubo.cast) {
        e.flag = true;
        const slots = [0, 1, 2].filter((i) => w.spells[i] && p.erased[i] <= 0);
        if (slots.length && p.stolen < 0) { p.stolen = slots[Math.floor(rand(w) * slots.length)]; e.hits = 0; emit(w, { type: 'steal', x: p.x, y: p.y, value: p.stolen }); }
      }
      return t >= N.roubo.cast + 0.3 ? 'done' : undefined;
    }
    case 'redemoinho': {
      const R = N.redemoinho;
      moveToward(e, T.x, T.y, R.speed * (1 + 0.08 * e.phase), dt);
      e.tele = { shape: 'circle', x: e.x, y: e.y, r: R.radius + 10, t: 0.95, dur: 1 };
      if ((e.mem.cd ?? 0) <= 0 && fhypot(p.x - e.x, p.y - e.y) < R.radius + 16) { e.mem.cd = 0.9; hurtPlayer(w, dmg(w, e, R.damage), e.x, e.y, 520, { src: e }); }
      e.mem.cd = (e.mem.cd ?? 0) - dt;
      if (t >= R.duration) {
        for (let i = 0; i < R.devils; i++) w.devils.push({ id: w.nextId++, x: e.x, y: e.y, vx: fcos(i * 3.1 + t) * 180, vy: fsin(i * 3.1 + t) * 140, r: 54, t: 0, dur: 8 });
        emit(w, { type: 'devil', x: e.x, y: e.y });
        return 'down';
      }
      return;
    }
    case 'serpente': {
      const S = N.serpente;
      const a = t * 2.4, nx = -dy / d, ny = dx / d, wob = fsin(a) * 140;
      moveToward(e, T.x + nx * wob, T.y + ny * wob, S.speed * (1 + 0.15 * e.phase), dt);
      if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1;
      return t >= S.duration ? 'done' : undefined;
    }
    case 'cruzar': {
      const C = N.cruzar;
      if (!e.flag) {
        if (t < C.aim * 0.6) { e.dirX = dx / d; e.dirY = dy / d; }
        const [x2, y2] = rayExit(w, e.x, e.y, e.dirX, e.dirY, e.radius);
        e.ax = x2; e.ay = y2;
        e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: C.width, t, dur: C.aim };
        if (t >= C.aim) { e.flag = true; e.stateT = 0; e.tele = null; e.mem.hit = 0; emit(w, { type: 'charge', x: e.x, y: e.y }); }
        return;
      }
      const left = moveToward(e, e.ax, e.ay, C.speed, dt);
      if (!e.mem.hit && fhypot(p.x - e.x, p.y - e.y) < C.width / 2 + 10) { e.mem.hit = 1; hurtPlayer(w, dmg(w, e, C.damage), e.x - e.dirX * 20, e.y - e.dirY * 20, 520, { src: e, melee: true }); }
      if ((e.mem.trail ?? 0) <= 0) { e.mem.trail = 0.05; w.zones.push({ id: w.nextId++, kind: 'fire', x: e.x, y: e.y, r: 40, t: 0, dur: 3, tick: 0.5, power: dmg(w, e, 0.12), hostile: true }); }
      e.mem.trail = (e.mem.trail ?? 0) - dt;
      if (left < 12) { emit(w, { type: 'crash', x: e.x, y: e.y, text: 'TONTO' }); return 'exposed'; }
      return;
    }
    case 'rugido': {
      const R = N.rugido;
      if (!e.flag && t >= R.cast) {
        e.flag = true;
        p.kx = ((p.x - e.x) / d) * R.push; p.ky = ((p.y - e.y) / d) * R.push;
        if (d < 260) hurtPlayer(w, dmg(w, e, R.damage), e.x, e.y, R.push, { src: e, soft: true });
        emit(w, { type: 'roar', x: e.x, y: e.y });
      }
      return t >= R.cast + R.open ? 'done' : undefined;
    }
    case 'brilho': {
      const B = N.brilho;
      if (!e.flag) { e.tele = { shape: 'circle', x: e.x, y: e.y, r: B.radius, t, dur: B.cast }; if (t >= B.cast) { e.flag = true; strike(w, e.tele, dmg(w, e, B.damage), 400, { src: e }); emit(w, { type: 'explode', x: e.x, y: e.y, value: B.radius, kind: 'sombra' }); e.tele = null; } return; }
      return t >= B.cast + 0.4 ? 'done' : undefined;
    }
    case 'ninar': if (!e.flag && t >= N.ninar.cast) { e.flag = true; circles(w, e, T, N.ninar.count + e.phase, N.ninar.radius, N.ninar.delay, 150, 0.4, 'sleep', { sleep: N.ninar.sleep }); emit(w, { type: 'sing', x: e.x, y: e.y, value: 1 }); } return t >= N.ninar.cast + 0.5 ? 'done' : undefined;
    case 'sonho': {
      if (!e.flag && t >= N.sonho.cast) {
        e.flag = true;
        p.dreamT = N.sonho.duration;
        const r = rand(w);
        p.spellMap = r < 0.5 ? [1, 2, 0] : [2, 0, 1];
        emit(w, { type: 'dream', x: p.x, y: p.y, value: N.sonho.duration });
      }
      return t >= N.sonho.cast + 0.3 ? 'done' : undefined;
    }
    case 'onda': {
      const O = N.onda, a = w.arena, count = O.count + (e.phase >= 2 ? 1 : 0);
      if (t >= O.cast + e.step * O.between && e.step < count) {
        const fromLeft = (e.step + e.count) % 2 === 0, h = a.y1 - a.y0, gap = a.y0 + O.gap / 2 + 20 + rand(w) * (h - O.gap - 40);
        w.projectiles.push({ id: w.nextId++, kind: 'wall', x: fromLeft ? a.x0 - 70 : a.x1 + 70, y: (a.y0 + a.y1) / 2, vx: (fromLeft ? 1 : -1) * O.speed, vy: 0, dist: 0, range: a.x1 - a.x0 + 140, damage: dmg(w, e, O.damage), pierce: true, hit: [], charged: false, sx: gap, sy: O.gap / 2, tx: 0, ty: 0, t: O.width, dur: 0, tele: null, owner: e.id, element: elOf(e) });
        emit(w, { type: 'wave', x: fromLeft ? a.x0 : a.x1, y: gap, kind: 'onda' });
        e.step++;
      }
      return t >= O.cast + count * O.between ? 'done' : undefined;
    }
    case 'apagar': {
      if (!e.flag && t >= N.apagar.cast) {
        e.flag = true;
        const slots = [0, 1, 2].filter((i) => w.spells[i] && p.erased[i] <= 0 && p.stolen !== i);
        if (slots.length) { const i = slots[Math.floor(rand(w) * slots.length)]; p.erased[i] = N.apagar.duration; emit(w, { type: 'erase', x: p.x, y: p.y, value: i }); }
      }
      return t >= N.apagar.cast + 0.3 ? 'done' : undefined;
    }
    case 'vazio': {
      const V = N.vazio;
      if (t >= V.cast && t < V.cast + V.duration && p.state !== 'dodge' && p.state !== 'dead') {
        const pd = fhypot(e.x - p.x, e.y - p.y) || 1;
        if (pd > 50) { p.x += ((e.x - p.x) / pd) * V.pull * dt; p.y += ((e.y - p.y) / pd) * V.pull * dt; }
        e.tele = { shape: 'circle', x: e.x, y: e.y, r: 120, t: t - V.cast, dur: V.duration };
        if ((e.mem.cd ?? 0) <= 0 && pd < 120) { e.mem.cd = 0.5; hurtPlayer(w, dmg(w, e, V.damage), e.x, e.y, 0, { src: e, soft: true, unblockable: true }); }
        e.mem.cd = (e.mem.cd ?? 0) - dt;
      }
      if (t >= V.cast + V.duration) { e.tele = null; ring(w, e, V.ring, 380, 0.6, 0); return 'done'; }
      return;
    }
    default: return 'done';
  }
}

function startPattern(w: World, e: Enemy): void {
  const D = bossDef(e);
  let list = D.patterns[Math.min(e.phase, D.patterns.length - 1)];
  if (e.kind === 'ecos') list = ECHOES[Math.min(6, e.phase)];
  e.pattern = list[e.count++ % list.length];
  e.flag = false; e.step = 0; e.mem = {};
  setState(e, 'cast');
  emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: e.pattern });
}

/** Partes do corpo do Boitatá, da cabeça para a cauda, ao longo do rastro. */
export function boitataBody(w: World, e: Enemy): { x: number; y: number; a: number }[] {
  const S = BOSS_NUM.serpente, out: { x: number; y: number; a: number }[] = [];
  let acc = 0, prev = { x: e.x, y: e.y }, next = S.gap;
  for (let i = w.trail.length - 1; i >= 0 && out.length < S.segs; i--) {
    const q = w.trail[i], seg = fhypot(q.x - prev.x, q.y - prev.y);
    while (seg > 0 && acc + seg >= next && out.length < S.segs) {
      const k = (next - acc) / seg;
      out.push({ x: prev.x + (q.x - prev.x) * k, y: prev.y + (q.y - prev.y) * k, a: fatan2(prev.y - q.y, prev.x - q.x) });
      next += S.gap;
    }
    acc += seg; prev = q;
  }
  return out;
}

export function updateBoss(w: World, e: Enemy, dt: number): void {
  const D = bossDef(e), T = targetOf(w, e), p = w.player;
  const dx = T.x - e.x, dy = T.y - e.y, d = fhypot(dx, dy) || 1;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };

  w.bossTime += dt;
  if (e.calls === 0 && w.bossTime >= D.enrageAt) { e.calls = 1; e.dmg *= 1.5; emit(w, { type: 'enrage', x: e.x, y: e.y }); }
  if (D.posture && e.sinceHit > 3 && e.state !== 'downed') e.posture = Math.max(0, e.posture - 5 * dt);

  /* o Saci devolve o feitiço depois de apanhar */
  if (e.kind === 'saci' && p.stolen >= 0 && e.hits >= BOSS_NUM.roubo.hits) { emit(w, { type: 'restore', x: p.x, y: p.y, value: p.stolen }); p.stolen = -1; }
  /* Boitatá: o corpo segue o rastro e queima quem encosta */
  if (e.kind === 'boitata') {
    const last = w.trail[w.trail.length - 1];
    if (!last || fhypot(last.x - e.x, last.y - e.y) > 6) { w.trail.push({ x: e.x, y: e.y }); if (w.trail.length > 600) w.trail.shift(); }
    if (p.hurtInv <= 0 && p.iframes <= 0) for (const s of boitataBody(w, e).slice(2)) if (fhypot(p.x - s.x, p.y - s.y) < 30) { hurtPlayer(w, dmg(w, e, BOSS_NUM.serpente.damage), s.x, s.y, 420, { src: e }); p.hurtInv = Math.max(p.hurtInv, 1.0); break; }
  }
  /* Lobisomem: a lua enche com o tempo; cheia o bastante, ele vira lobo */
  if (e.kind === 'lobisomem') {
    w.moon = Math.min(1, w.bossTime / BOSS_NUM.lua.full);
    if (e.phase === 0 && w.moon >= 0.5 && (e.state === 'idle' || e.state === 'recover')) { e.phase = 1; e.count = 0; setState(e, 'roar'); emit(w, { type: 'transform', x: e.x, y: e.y }); return; }
  }
  /* Pisadeira: quem fica parado é pisado */
  if (e.kind === 'pisadeira' && e.state === 'idle') {
    e.mem.still = p.moving ? 0 : (e.mem.still ?? 0) + dt;
    if ((e.mem.still ?? 0) >= BOSS_NUM.pisar.still) { e.pattern = 'pisar'; e.flag = false; e.step = 0; e.mem = {}; setState(e, 'cast'); emit(w, { type: 'telegraph', x: e.x, y: e.y, kind: 'pisar' }); return; }
  }

  const calm = e.state === 'idle' || e.state === 'recover' || e.state === 'exposed' || e.state === 'downed';
  if (e.phase < D.phases.length && e.hp / e.maxHp <= D.phases[e.phase] && calm) {
    e.phase++; e.count = 0; e.tele = null; e.pattern = ''; e.posture = 0; e.hidden = false;
    setState(e, 'roar');
    emit(w, { type: 'phase', x: e.x, y: e.y, value: e.phase, kind: e.kind });
    if (e.kind === 'esquecimento') {
      const i = p.erased.findIndex((v) => v > 0);
      if (i >= 0) p.erased[i] = 0;
      if (w.supremo) p.supremo = Math.min(100, p.supremo + 50);
      emit(w, { type: 'help', x: p.x, y: p.y, value: e.phase, kind: (['natureza', 'agua', 'tempestade', 'fogo', 'terra', 'sombra', 'encanto'] as ElementId[])[(e.phase * 2 + 1) % 7] });
    }
    if (e.kind === 'lobisomem' && e.phase === 1) emit(w, { type: 'transform', x: e.x, y: e.y });
    return;
  }
  if (D.posture && e.posture >= D.posture.max && e.state !== 'roar' && e.state !== 'downed' && !e.hidden) {
    e.posture = 0; e.tele = null; e.pattern = '';
    setState(e, 'downed');
    emit(w, { type: 'downed', x: e.x, y: e.y });
    return;
  }

  const wolfFast = e.kind === 'lobisomem' ? 1 + w.moon * BOSS_NUM.lua.speedMax : 1;
  const slow = (e.slowT > 0 ? 0.6 : 1) * wolfFast;
  switch (e.state) {
    case 'roar': if (e.stateT >= 1.2) setState(e, 'idle'); break;
    case 'downed': if (e.stateT >= (D.posture?.downed ?? 3)) setState(e, 'idle'); break;
    case 'exposed': if (e.stateT >= BOSS_NUM.investida.exposed) setState(e, 'idle'); break;
    case 'tired': if (e.stateT >= 2.2) setState(e, 'idle'); break;
    case 'recover': if (e.stateT >= 0.55 / wolfFast) setState(e, 'idle'); break;
    case 'idle': {
      face();
      if (d > 300) moveToward(e, T.x, T.y, D.speed * slow, dt);
      else if (d < 150) moveToward(e, e.x - dx, e.y - dy, D.speed * slow * 0.7, dt);
      else moveToward(e, e.x - dy * 0.4, e.y + dx * 0.4, D.speed * slow * 0.4, dt);
      clampArena(w, e, e.radius);
      if (e.stateT >= D.idle / Math.max(1, wolfFast) * (e.phase >= 2 ? 0.75 : 1)) startPattern(w, e);
      break;
    }
    case 'cast': {
      const r = run(w, e, T, dt);
      if (r === 'done') { e.tele = null; e.hidden = false; setState(e, 'recover'); }
      else if (r === 'exposed') { e.tele = null; e.hidden = false; setState(e, 'exposed'); }
      else if (r === 'down') { e.tele = null; e.hidden = false; setState(e, 'tired'); emit(w, { type: 'crash', x: e.x, y: e.y, text: 'TONTO' }); }
      if (!e.hidden && e.pattern !== 'cruzar') clampArena(w, e, e.radius);
      break;
    }
    default: setState(e, 'idle');
  }
}

export { ELEMENT_ORDER };
