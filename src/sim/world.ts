/**
 * Simulação do combate. Não depende do Phaser nem do navegador: recebe comandos, avança um passo
 * fixo e devolve eventos. Isso permite testar as regras sem tela e, mais adiante, gravar partidas
 * e conferi-las no servidor.
 */
import { ARENA, ENEMY, PLAYER, WAVES, WAVE_DELAY, type EnemyKind, type SpawnDef } from '../data/balance';

export interface Input {
  /** Direção de movimento, de -1 a 1 em cada eixo. */
  mx: number;
  my: number;
  /** Ponto do mundo para onde o jogador mira. */
  aimX: number;
  aimY: number;
  attackPressed: boolean;
  attackHeld: boolean;
  dodgePressed: boolean;
  spellPressed: boolean;
}

export const NO_INPUT: Input = { mx: 0, my: 0, aimX: 0, aimY: 0, attackPressed: false, attackHeld: false, dodgePressed: false, spellPressed: false };

export type Telegraph =
  | { shape: 'circle'; x: number; y: number; r: number; t: number; dur: number }
  | { shape: 'line'; x: number; y: number; x2: number; y2: number; w: number; t: number; dur: number };

export type PlayerState = 'idle' | 'attack' | 'dodge' | 'hurt' | 'dead';

export interface Player {
  x: number; y: number;
  vx: number; vy: number;
  kx: number; ky: number;
  aim: number;
  facing: 1 | -1;
  hp: number; mana: number;
  state: PlayerState; stateT: number;
  combo: number; comboT: number; hitDone: boolean;
  dodgeCd: number; iframes: number; hurtInv: number; spellCd: number;
  perfectT: number; perfectUsed: boolean;
  dx: number; dy: number;
  moving: boolean; walk: number;
  bufAttack: number; bufDodge: number; bufSpell: number;
}

export type EnemyState = 'spawn' | 'chase' | 'windup' | 'recover' | 'stagger' | 'roam' | 'aim' | 'charge' | 'stunned' | 'idle' | 'spit' | 'exposed';

export interface Enemy {
  id: number; kind: EnemyKind; elite: boolean;
  x: number; y: number; kx: number; ky: number;
  hp: number; maxHp: number; radius: number;
  state: EnemyState; stateT: number;
  facing: 1 | -1; dirX: number; dirY: number;
  tele: Telegraph | null;
  cd: number; flag: boolean;
  flash: number; poisonT: number; poisonTick: number;
  walk: number; moving: boolean;
}

export interface Projectile {
  id: number; kind: 'thorn' | 'seed';
  x: number; y: number; vx: number; vy: number; dist: number;
  sx: number; sy: number; tx: number; ty: number; t: number; dur: number;
  tele: Telegraph | null;
}

export interface SimEvent {
  type: 'swing' | 'hit' | 'kill' | 'hurt' | 'death' | 'dodge' | 'perfect' | 'cast' | 'spawn' | 'wave' | 'win'
    | 'bite' | 'charge' | 'crash' | 'spit' | 'splat' | 'slam' | 'telegraph';
  x: number; y: number;
  value?: number; crit?: boolean; kind?: string; id?: number; ang?: number; armored?: boolean;
}

export interface World {
  time: number; tick: number;
  phase: 'fight' | 'cleared' | 'dead';
  player: Player; enemies: Enemy[]; projectiles: Projectile[];
  events: SimEvent[];
  wave: number; waveTimer: number;
  nextId: number; rng: number;
  kills: number; perfects: number; hitsTaken: number;
}

/* ---------- utilidades ---------- */

function rand(w: World): number {
  w.rng = (w.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(w.rng ^ (w.rng >>> 15), 1 | w.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const max0 = (v: number) => (v > 0 ? v : 0);
function wrapAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
function clampArena(o: { x: number; y: number }, r: number): boolean {
  let hit = false;
  if (o.x < ARENA.x0 + r) { o.x = ARENA.x0 + r; hit = true; }
  if (o.x > ARENA.x1 - r) { o.x = ARENA.x1 - r; hit = true; }
  if (o.y < ARENA.y0 + r) { o.y = ARENA.y0 + r; hit = true; }
  if (o.y > ARENA.y1 - r) { o.y = ARENA.y1 - r; hit = true; }
  return hit;
}
/** Ponto em que um raio saindo de (x, y) na direção (dx, dy) encontra a borda da arena. */
function rayExit(x: number, y: number, dx: number, dy: number, inset: number): [number, number] {
  const tx = dx > 0 ? (ARENA.x1 - inset - x) / dx : dx < 0 ? (ARENA.x0 + inset - x) / dx : Infinity;
  const ty = dy > 0 ? (ARENA.y1 - inset - y) / dy : dy < 0 ? (ARENA.y0 + inset - y) / dy : Infinity;
  const t = Math.max(0, Math.min(tx, ty));
  return [x + dx * t, y + dy * t];
}

/* ---------- criação ---------- */

export function createWorld(seed = 1): World {
  return {
    time: 0, tick: 0, phase: 'fight',
    player: {
      x: 380, y: 400, vx: 0, vy: 0, kx: 0, ky: 0, aim: 0, facing: 1,
      hp: PLAYER.maxHp, mana: PLAYER.maxMana,
      state: 'idle', stateT: 0, combo: 0, comboT: 0, hitDone: false,
      dodgeCd: 0, iframes: 0, hurtInv: 0, spellCd: 0, perfectT: 0, perfectUsed: false,
      dx: 1, dy: 0, moving: false, walk: 0, bufAttack: 0, bufDodge: 0, bufSpell: 0,
    },
    enemies: [], projectiles: [], events: [],
    wave: -1, waveTimer: WAVE_DELAY - 0.6,
    nextId: 1, rng: seed | 0, kills: 0, perfects: 0, hitsTaken: 0,
  };
}

export function spawnEnemy(w: World, def: SpawnDef): Enemy {
  const base = ENEMY[def.kind];
  const e: Enemy = {
    id: w.nextId++, kind: def.kind, elite: !!def.elite,
    x: def.x, y: def.y, kx: 0, ky: 0,
    hp: base.hp, maxHp: base.hp, radius: base.radius,
    state: 'spawn', stateT: 0, facing: -1, dirX: -1, dirY: 0,
    tele: null, cd: 0.4 + rand(w) * 0.8, flag: false,
    flash: 0, poisonT: 0, poisonTick: 0, walk: rand(w) * 6, moving: false,
  };
  w.enemies.push(e);
  w.events.push({ type: 'spawn', x: e.x, y: e.y, kind: e.kind, id: e.id });
  return e;
}

/* ---------- passo ---------- */

export function step(w: World, inp: Input, dt: number): void {
  w.tick++;
  if (w.phase === 'fight') w.time += dt;
  updatePlayer(w, inp, dt);
  if (w.phase === 'dead') return;
  for (const e of w.enemies) updateEnemy(w, e, dt);
  separate(w);
  updateProjectiles(w, dt);
  w.enemies = w.enemies.filter((e) => e.hp > 0);
  updateWaves(w, dt);
}

/* ---------- jogador ---------- */

function setState(e: Enemy, s: EnemyState): void {
  e.state = s;
  e.stateT = 0;
}

function startDodge(w: World, inp: Input): void {
  const p = w.player;
  const len = Math.hypot(inp.mx, inp.my);
  if (len > 0.1) { p.dx = inp.mx / len; p.dy = inp.my / len; } else { p.dx = Math.cos(p.aim); p.dy = Math.sin(p.aim); }
  p.state = 'dodge'; p.stateT = 0;
  p.iframes = PLAYER.dodge.iframes; p.dodgeCd = PLAYER.dodge.cooldown;
  p.perfectUsed = false; p.bufDodge = 0;
  w.events.push({ type: 'dodge', x: p.x, y: p.y });
}

function startAttack(w: World, aim: number, combo: number): void {
  const p = w.player;
  p.state = 'attack'; p.stateT = 0; p.combo = combo; p.hitDone = false;
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1; p.bufAttack = 0;
  w.events.push({ type: 'swing', x: p.x, y: p.y, ang: aim, value: combo });
}

function castSpell(w: World, aim: number): void {
  const p = w.player, s = PLAYER.spell;
  p.mana -= s.cost; p.spellCd = s.cooldown; p.bufSpell = 0;
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
  for (let i = 0; i < s.count; i++) {
    const a = aim + (i - (s.count - 1) / 2) * s.spread;
    w.projectiles.push({
      id: w.nextId++, kind: 'thorn',
      x: p.x + Math.cos(a) * 26, y: p.y + Math.sin(a) * 26, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, dist: 0,
      sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null,
    });
  }
  w.events.push({ type: 'cast', x: p.x, y: p.y, ang: aim });
}

function meleeHit(w: World, a: (typeof PLAYER.combo)[number]): void {
  const p = w.player;
  let hits = 0;
  for (const e of w.enemies) {
    if (e.state === 'spawn' || e.hp <= 0) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > a.range + e.radius) continue;
    const diff = Math.abs(wrapAngle(Math.atan2(dy, dx) - p.aim));
    if (diff > a.arc && d > e.radius + 22) continue;
    damageEnemy(w, e, a.damage * (p.perfectT > 0 ? PLAYER.perfectBonus : 1), 'melee', p.aim);
    hits++;
  }
  if (hits > 0) {
    p.mana = Math.min(PLAYER.maxMana, p.mana + PLAYER.manaPerHit * hits);
    p.perfectT = 0;
  }
}

function damageEnemy(w: World, e: Enemy, amount: number, source: 'melee' | 'spell' | 'poison', ang: number): void {
  let dmg = amount;
  let armored = false;
  if (e.kind === 'tronco' && e.state !== 'exposed') { dmg *= ENEMY.tronco.armor; armored = true; }
  if (e.kind === 'queixada' && e.state === 'stunned') dmg *= ENEMY.queixada.stunDamageMult;
  const crit = source !== 'poison' && rand(w) < PLAYER.critChance;
  if (crit) dmg *= PLAYER.critMult;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg;
  e.flash = 0.1;
  if (source === 'melee' && e.kind !== 'tronco' && e.kind !== 'cuspidor' && e.state !== 'charge') {
    e.kx = Math.cos(ang) * 170; e.ky = Math.sin(ang) * 170;
    if (e.kind === 'sauva' && e.state !== 'stagger') { e.tele = null; setState(e, 'stagger'); }
  }
  w.events.push({ type: 'hit', x: e.x, y: e.y, value: dmg, crit, kind: source, armored, id: e.id });
  if (e.hp <= 0) {
    w.kills++;
    e.tele = null;
    w.events.push({ type: 'kill', x: e.x, y: e.y, kind: e.kind, id: e.id });
  }
}

/** Tenta ferir o jogador. Devolve true se o dano entrou. */
function hurtPlayer(w: World, dmg: number, fromX: number, fromY: number, knock: number): boolean {
  const p = w.player;
  if (p.state === 'dead') return false;
  if (p.iframes > 0) {
    if (p.state === 'dodge' && p.stateT <= PLAYER.perfectWindow && !p.perfectUsed) {
      p.perfectUsed = true; p.perfectT = PLAYER.perfectDuration; p.dodgeCd = 0;
      w.perfects++;
      w.events.push({ type: 'perfect', x: p.x, y: p.y });
    }
    return false;
  }
  if (p.hurtInv > 0) return false;
  p.hp -= dmg; p.hurtInv = PLAYER.hurtInvuln; w.hitsTaken++;
  const dx = p.x - fromX, dy = p.y - fromY, d = Math.hypot(dx, dy) || 1;
  p.kx = (dx / d) * knock; p.ky = (dy / d) * knock;
  w.events.push({ type: 'hurt', x: p.x, y: p.y, value: dmg });
  if (p.hp <= 0) {
    p.hp = 0; p.state = 'dead'; p.stateT = 0; w.phase = 'dead';
    w.events.push({ type: 'death', x: p.x, y: p.y });
  } else {
    p.state = 'hurt'; p.stateT = 0;
  }
  return true;
}

function updatePlayer(w: World, inp: Input, dt: number): void {
  const p = w.player, P = PLAYER;
  if (p.state === 'dead') { p.stateT += dt; return; }
  p.dodgeCd = max0(p.dodgeCd - dt); p.iframes = max0(p.iframes - dt); p.hurtInv = max0(p.hurtInv - dt);
  p.spellCd = max0(p.spellCd - dt); p.perfectT = max0(p.perfectT - dt); p.comboT = max0(p.comboT - dt);
  p.mana = Math.min(P.maxMana, p.mana + P.manaRegen * dt);
  p.bufAttack = inp.attackPressed ? P.inputBuffer : max0(p.bufAttack - dt);
  p.bufDodge = inp.dodgePressed ? P.inputBuffer : max0(p.bufDodge - dt);
  p.bufSpell = inp.spellPressed ? P.inputBuffer : max0(p.bufSpell - dt);

  const decay = Math.exp(-10 * dt);
  p.x += p.kx * dt; p.y += p.ky * dt; p.kx *= decay; p.ky *= decay;
  const aim = Math.atan2(inp.aimY - p.y, inp.aimX - p.x);
  p.vx = 0; p.vy = 0; p.moving = false;

  if (p.state === 'hurt') {
    p.stateT += dt;
    if (p.stateT >= P.hurtStun) p.state = 'idle';
  } else if (p.state === 'dodge') {
    p.stateT += dt;
    const k = 1 - 0.5 * (p.stateT / P.dodge.duration);
    p.vx = p.dx * P.dodge.speed * k; p.vy = p.dy * P.dodge.speed * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.stateT >= P.dodge.duration) p.state = 'idle';
  } else if (p.state === 'attack') {
    const a = P.combo[p.combo];
    p.stateT += dt;
    if (p.stateT < a.windup + 0.08) { p.x += Math.cos(p.aim) * a.lunge * dt; p.y += Math.sin(p.aim) * a.lunge * dt; }
    if (!p.hitDone && p.stateT >= a.windup) { p.hitDone = true; meleeHit(w, a); }
    if (p.hitDone && p.bufDodge > 0 && p.dodgeCd <= 0) startDodge(w, inp);
    else if (p.stateT >= a.total) {
      if ((p.bufAttack > 0 || inp.attackHeld) && p.combo < P.combo.length - 1) startAttack(w, aim, p.combo + 1);
      else { p.state = 'idle'; p.comboT = P.comboWindow; }
    }
  }

  if (p.state === 'idle') {
    const len = Math.hypot(inp.mx, inp.my);
    if (len > 0.1) {
      p.moving = true;
      p.vx = (inp.mx / len) * P.speed; p.vy = (inp.my / len) * P.speed;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.walk += P.speed * dt * 0.065;
    }
    p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
    if (p.bufDodge > 0 && p.dodgeCd <= 0) startDodge(w, inp);
    else if (p.bufAttack > 0 || inp.attackHeld) startAttack(w, aim, p.comboT > 0 && p.combo < P.combo.length - 1 ? p.combo + 1 : 0);
    else if (p.bufSpell > 0 && p.spellCd <= 0 && p.mana >= P.spell.cost) castSpell(w, aim);
  }
  clampArena(p, P.radius);
}

/* ---------- inimigos ---------- */

function moveToward(e: Enemy, tx: number, ty: number, speed: number, dt: number): void {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d < 2) { e.moving = false; return; }
  e.x += (dx / d) * speed * dt; e.y += (dy / d) * speed * dt;
  e.walk += speed * dt * 0.11; e.moving = true;
}

function updateEnemy(w: World, e: Enemy, dt: number): void {
  const p = w.player;
  e.flash = max0(e.flash - dt); e.cd = max0(e.cd - dt); e.stateT += dt; e.moving = false;
  const decay = Math.exp(-9 * dt);
  e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= decay; e.ky *= decay;

  if (e.poisonT > 0) {
    e.poisonT -= dt; e.poisonTick -= dt;
    if (e.poisonTick <= 0) {
      e.poisonTick += PLAYER.spell.poisonEvery;
      damageEnemy(w, e, PLAYER.spell.poisonTick, 'poison', 0);
      if (e.hp <= 0) return;
    }
  }
  if (e.state === 'spawn') {
    if (e.stateT >= ENEMY.spawnTime) setState(e, e.kind === 'cuspidor' ? 'idle' : e.kind === 'queixada' ? 'roam' : 'chase');
    return;
  }
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  const face = () => { if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1; };

  if (e.kind === 'sauva') {
    const S = ENEMY.sauva;
    if (e.state === 'chase') {
      face();
      const a = e.id * 2.4;
      moveToward(e, p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, S.speed, dt);
      if (d < S.biteRange) {
        setState(e, 'windup'); e.dirX = dx / d; e.dirY = dy / d;
        e.tele = { shape: 'circle', x: e.x + e.dirX * S.biteOffset, y: e.y + e.dirY * S.biteOffset, r: S.biteRadius, t: 0, dur: S.windup };
        w.events.push({ type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
    } else if (e.state === 'windup' && e.tele && e.tele.shape === 'circle') {
      e.tele.t = e.stateT;
      if (e.stateT >= S.windup) {
        w.events.push({ type: 'bite', x: e.tele.x, y: e.tele.y });
        if (Math.hypot(p.x - e.tele.x, p.y - e.tele.y) < S.biteRadius + PLAYER.radius * 0.4) hurtPlayer(w, S.damage, e.x, e.y, 260);
        e.tele = null; setState(e, 'recover');
      }
    } else if (e.state === 'recover') {
      if (e.stateT >= S.recover) setState(e, 'chase');
    } else if (e.state === 'stagger') {
      if (e.stateT >= 0.28) setState(e, 'chase');
    } else setState(e, 'chase');
    clampArena(e, e.radius);
  } else if (e.kind === 'queixada') {
    const Q = ENEMY.queixada;
    if (e.state === 'roam') {
      face();
      if (d < Q.minRange) moveToward(e, e.x - dx, e.y - dy, Q.speed, dt);
      else if (d > 520) moveToward(e, p.x, p.y, Q.speed, dt);
      if (e.cd <= 0) { setState(e, 'aim'); e.dirX = dx / d; e.dirY = dy / d; w.events.push({ type: 'telegraph', x: e.x, y: e.y, kind: e.kind }); }
      clampArena(e, e.radius);
    } else if (e.state === 'aim') {
      if (e.stateT < Q.lockAt) { e.dirX = dx / d; e.dirY = dy / d; face(); }
      const [x2, y2] = rayExit(e.x, e.y, e.dirX, e.dirY, e.radius);
      e.tele = { shape: 'line', x: e.x, y: e.y, x2, y2, w: Q.lineWidth, t: e.stateT, dur: Q.aimTime };
      if (e.stateT >= Q.aimTime) { e.tele = null; e.flag = false; setState(e, 'charge'); w.events.push({ type: 'charge', x: e.x, y: e.y }); }
    } else if (e.state === 'charge') {
      e.x += e.dirX * Q.chargeSpeed * dt; e.y += e.dirY * Q.chargeSpeed * dt;
      e.walk += Q.chargeSpeed * dt * 0.05; e.moving = true;
      if (!e.flag && Math.hypot(p.x - e.x, p.y - e.y) < e.radius + PLAYER.radius + 4) {
        e.flag = true;
        hurtPlayer(w, Q.damage, e.x - e.dirX * 20, e.y - e.dirY * 20, 520);
      }
      if (clampArena(e, e.radius)) { setState(e, 'stunned'); w.events.push({ type: 'crash', x: e.x, y: e.y }); }
    } else if (e.state === 'stunned') {
      if (e.stateT >= Q.stun) { setState(e, 'roam'); e.cd = Q.cooldown; }
    } else setState(e, 'roam');
  } else if (e.kind === 'cuspidor') {
    const C = ENEMY.cuspidor;
    face();
    if (e.state === 'idle') {
      if (e.cd <= 0 && d < C.range) { setState(e, 'spit'); e.flag = false; }
    } else if (e.state === 'spit') {
      if (!e.flag && e.stateT >= 0.25) {
        e.flag = true; e.cd = C.interval;
        const t = { x: p.x + p.vx * C.lead, y: p.y + p.vy * C.lead };
        clampArena(t, PLAYER.radius);
        w.projectiles.push({
          id: w.nextId++, kind: 'seed', x: e.x, y: e.y, vx: 0, vy: 0, dist: 0,
          sx: e.x, sy: e.y, tx: t.x, ty: t.y, t: 0, dur: C.flight,
          tele: { shape: 'circle', x: t.x, y: t.y, r: C.splash, t: 0, dur: C.flight },
        });
        w.events.push({ type: 'spit', x: e.x, y: e.y });
      }
      if (e.stateT >= 0.55) setState(e, 'idle');
    } else setState(e, 'idle');
  } else {
    const T = ENEMY.tronco;
    if (e.state === 'chase') {
      face();
      moveToward(e, p.x, p.y, T.speed, dt);
      if (d < T.slamRange) {
        setState(e, 'windup'); e.dirX = dx / d; e.dirY = dy / d;
        e.tele = { shape: 'circle', x: e.x + e.dirX * T.slamOffset, y: e.y + e.dirY * T.slamOffset, r: T.slamRadius, t: 0, dur: T.windup };
        w.events.push({ type: 'telegraph', x: e.x, y: e.y, kind: e.kind });
      }
    } else if (e.state === 'windup' && e.tele && e.tele.shape === 'circle') {
      e.tele.t = e.stateT;
      if (e.stateT >= T.windup) {
        w.events.push({ type: 'slam', x: e.tele.x, y: e.tele.y, value: T.slamRadius });
        if (Math.hypot(p.x - e.tele.x, p.y - e.tele.y) < T.slamRadius + 6) hurtPlayer(w, T.damage, e.tele.x, e.tele.y, 560);
        e.tele = null; setState(e, 'exposed');
      }
    } else if (e.state === 'exposed') {
      if (e.stateT >= T.exposed) setState(e, 'chase');
    } else setState(e, 'chase');
    clampArena(e, e.radius);
  }
}

function separate(w: World): void {
  const es = w.enemies;
  const fixed = (e: Enemy) => e.kind === 'cuspidor' || e.state === 'charge' || e.state === 'spawn';
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = (a.radius + b.radius) * 0.9;
      if (d >= min) continue;
      const fa = fixed(a), fb = fixed(b);
      if (fa && fb) continue;
      const push = min - d, nx = dx / d, ny = dy / d;
      const wa = fa ? 0 : fb ? 1 : a.kind === 'tronco' ? 0.15 : b.kind === 'tronco' ? 0.85 : 0.5;
      a.x -= nx * push * wa; a.y -= ny * push * wa;
      b.x += nx * push * (1 - wa); b.y += ny * push * (1 - wa);
    }
  }
  const p = w.player;
  if (p.state === 'dodge' || p.state === 'dead') return;
  for (const e of es) {
    if (e.state === 'spawn' || e.state === 'charge') continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 0.01, min = e.radius * 0.8 + PLAYER.radius;
    if (d >= min) continue;
    p.x += (dx / d) * (min - d); p.y += (dy / d) * (min - d);
  }
  clampArena(p, PLAYER.radius);
}

/* ---------- projéteis e ondas ---------- */

function updateProjectiles(w: World, dt: number): void {
  const p = w.player, S = PLAYER.spell, C = ENEMY.cuspidor;
  w.projectiles = w.projectiles.filter((pr) => {
    if (pr.kind === 'thorn') {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.dist += S.speed * dt;
      for (const e of w.enemies) {
        if (e.state === 'spawn' || e.hp <= 0) continue;
        if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.radius + 10) {
          damageEnemy(w, e, S.damage, 'spell', Math.atan2(pr.vy, pr.vx));
          if (e.hp > 0) { e.poisonT = S.poisonDuration; e.poisonTick = S.poisonEvery; }
          return false;
        }
      }
      return pr.dist < S.range && pr.x > ARENA.x0 - 60 && pr.x < ARENA.x1 + 60 && pr.y > ARENA.y0 - 60 && pr.y < ARENA.y1 + 60;
    }
    pr.t += dt;
    const k = Math.min(1, pr.t / pr.dur);
    pr.x = pr.sx + (pr.tx - pr.sx) * k; pr.y = pr.sy + (pr.ty - pr.sy) * k;
    if (pr.tele) pr.tele.t = pr.t;
    if (pr.t >= pr.dur) {
      w.events.push({ type: 'splat', x: pr.tx, y: pr.ty, value: C.splash });
      if (Math.hypot(p.x - pr.tx, p.y - pr.ty) < C.splash + PLAYER.radius * 0.4) hurtPlayer(w, C.damage, pr.tx, pr.ty, 220);
      return false;
    }
    return true;
  });
}

function updateWaves(w: World, dt: number): void {
  if (w.phase !== 'fight' || w.enemies.length > 0) return;
  if (w.wave >= WAVES.length - 1) {
    w.phase = 'cleared';
    w.projectiles = [];
    w.events.push({ type: 'win', x: w.player.x, y: w.player.y, value: w.time });
    return;
  }
  w.waveTimer += dt;
  if (w.waveTimer >= WAVE_DELAY) {
    w.waveTimer = 0; w.wave++;
    for (const def of WAVES[w.wave]) spawnEnemy(w, def);
    w.events.push({ type: 'wave', x: 0, y: 0, value: w.wave });
  }
}

/** Resumo do estado, para comparar duas simulações nos testes. */
export function fingerprint(w: World): string {
  const r = (v: number) => Math.round(v * 100) / 100;
  return JSON.stringify([
    w.tick, w.phase, w.wave, r(w.player.x), r(w.player.y), w.player.hp, r(w.player.mana),
    w.enemies.map((e) => [e.id, e.kind, e.state, r(e.x), r(e.y), e.hp]),
    w.projectiles.length, w.rng,
  ]);
}
