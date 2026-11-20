/** Herói, feitiços, projéteis, efeitos no chão e companheiro. */
import { ENEMY, PLAYER, PUDDLE_SLOW } from '../data/balance';
import { COMPANIONS, SPELLS, SPELL_LEVEL_POWER, SPELL_NUM, SUPREMO_NUM, type SpellId } from '../data/content';
import {
  attackSpeed, brotar, chargeSupremo, clampArena, damageEnemy, emit, healPlayer, hurtPet, hurtPlayer, isBoss, levelScale, max0, rand, spellScale, strike, weaponBonus, wet, wrapAngle,
} from './core';
import type { Companion, Enemy, Input, Projectile, World } from './types';

const hittable = (e: Enemy): boolean => e.hp > 0 && !e.hidden && e.state !== 'spawn';

/** Poder extra do feitiço pelo nível dele: +10% por nível, e +25% no nível 10. */
export function spellLevelPower(lv: number): number {
  return (1 + SPELL_LEVEL_POWER * (lv - 1)) * (lv >= 10 ? 1.25 : 1);
}
export function spellCost(w: World, slot: number, id: SpellId): number {
  return SPELLS[id].cost * w.stats.manaCostMult * (w.stats.spellLevels[slot] >= 7 ? 0.8 : 1);
}

function shot(w: World, kind: Projectile['kind'], x: number, y: number, ang: number, speed: number, range: number, damage: number): Projectile {
  const pr: Projectile = {
    id: w.nextId++, kind, x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, dist: 0, range, damage,
    pierce: false, hit: [], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner: 0,
  };
  w.projectiles.push(pr);
  return pr;
}

/* ---------- ações do herói ---------- */

function startDodge(w: World, inp: Input): void {
  const p = w.player, len = Math.hypot(inp.mx, inp.my);
  if (len > 0.1) { p.dx = inp.mx / len; p.dy = inp.my / len; } else { p.dx = Math.cos(p.aim); p.dy = Math.sin(p.aim); }
  p.state = 'dodge'; p.stateT = 0; p.charge = 0; p.surf = 0;
  p.iframes = PLAYER.dodge.iframes; p.dodgeCharges--; p.perfectUsed = false; p.bufDodge = 0; p.rolled = [];
  emit(w, { type: 'dodge', x: p.x, y: p.y });
}

function startAttack(w: World, aim: number, combo: number): void {
  const p = w.player;
  p.state = 'attack'; p.stateT = 0; p.combo = combo; p.hitDone = false;
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1; p.bufAttack = 0;
  emit(w, { type: 'swing', x: p.x, y: p.y, ang: aim, value: combo });
}

function weaponDamage(w: World, mult: number): number {
  const p = w.player, s = w.stats;
  return s.weaponDamage * mult * s.damageMult * weaponBonus(w) * (p.perfectT > 0 ? s.perfectBonus : 1) * (p.contraT > 0 ? PLAYER.contragolpe : 1);
}

function meleeHit(w: World, a: (typeof PLAYER.combo)[number], last: boolean): void {
  const p = w.player, s = w.stats, dmg = weaponDamage(w, a.mult * (last ? s.thirdHitMult : 1));
  const range = a.range * s.reachMult, wide = last && s.comboWide;
  let hits = 0;
  for (const e of w.enemies) {
    if (!hittable(e)) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > range + e.radius) continue;
    if (!wide && Math.abs(wrapAngle(Math.atan2(dy, dx) - p.aim)) > a.arc && d > e.radius + 22) continue;
    damageEnemy(w, e, dmg, 'melee', wide ? Math.atan2(dy, dx) : p.aim);
    hits++;
  }
  if (hits > 0) {
    p.mana = Math.min(s.maxMana, p.mana + PLAYER.manaPerHit * s.manaPerHitMult * hits);
    p.perfectT = 0; p.contraT = 0;
  }
}

function fireArrow(w: World, aim: number, charge: number): void {
  const p = w.player, s = w.stats, B = PLAYER.bow, strong = charge >= 0.25;
  const n = 1 + s.projectiles + (s.doubleArrow && !strong ? 1 : 0);
  const dmg = weaponDamage(w, B.mult * (strong ? (1 + (B.chargeMult - 1) * charge) * s.thirdHitMult : 1));
  for (let i = 0; i < n; i++) {
    const a = aim + (i - (n - 1) / 2) * 0.085;
    const pr = shot(w, 'arrow', p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 22, a, B.speed * (strong ? 1.15 : 1), B.range, dmg);
    pr.pierce = charge >= 0.6 || s.pierce; pr.charged = strong;
  }
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
  p.shotCd = B.interval / attackSpeed(w); p.bufAttack = 0;
  p.perfectT = 0; p.contraT = 0;
  emit(w, { type: 'shoot', x: p.x, y: p.y, ang: aim, value: strong ? 1 : 0 });
}

function aimPoint(w: World, inp: Input, range: number): { x: number; y: number } {
  const p = w.player;
  let dx = inp.aimX - p.x, dy = inp.aimY - p.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d > range) { dx = (dx / d) * range; dy = (dy / d) * range; }
  const pos = { x: p.x + dx, y: p.y + dy };
  clampArena(w, pos, 10);
  return pos;
}

function castSpell(w: World, slot: number, id: SpellId, aim: number, inp: Input): void {
  const p = w.player, s = w.stats, def = SPELLS[id], lv = s.spellLevels[slot] ?? 1;
  const power = spellScale(w) * spellLevelPower(lv), area = s.spellArea, dur = s.durationMult;
  const free = s.freeCast > 0 && rand(w) < s.freeCast, echo = s.echo > 0 && rand(w) < s.echo;
  if (!free) p.mana -= spellCost(w, slot, id);
  p.cdMax[slot] = def.cooldown * s.cooldownMult * (lv >= 4 ? 0.85 : 1);
  p.cds[slot] = echo ? Math.min(0.5, p.cdMax[slot]) : p.cdMax[slot];
  if (free || echo) emit(w, { type: 'freecast', x: p.x, y: p.y, kind: echo ? 'eco' : 'fluxo' });
  p.bufSpell[slot] = 0;
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
  if (id === 'dardo') {
    const N = SPELL_NUM.dardo, n = N.count + s.projectiles;
    for (let i = 0; i < n; i++) {
      const a = aim + (i - (n - 1) / 2) * N.spread;
      shot(w, 'thorn', p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, a, N.speed, N.range, N.damage * power).pierce = s.pierce;
    }
  } else if (id === 'sementes') {
    const N = SPELL_NUM.sementes, pos = aimPoint(w, inp, N.range);
    w.zones.push({ id: w.nextId++, kind: 'sementes', x: pos.x, y: pos.y, r: N.radius * area, t: 0, dur: N.delay, tick: 0, power: N.damage * power });
  } else if (id === 'cipo') {
    const N = SPELL_NUM.cipo;
    shot(w, 'cipo', p.x + Math.cos(aim) * 24, p.y + Math.sin(aim) * 24, aim, N.speed, N.range, N.damage * power);
  } else if (id === 'casca') {
    p.cascaT = SPELL_NUM.casca.duration * dur * (1 + 0.05 * (lv - 1));
  } else if (id === 'broto') {
    const N = SPELL_NUM.broto;
    w.zones.push({ id: w.nextId++, kind: 'broto', x: p.x, y: p.y, r: N.radius * area, t: 0, dur: N.duration * dur, tick: 0.5, power: N.healPerSecond * spellLevelPower(lv) });
  } else if (id === 'jato') {
    const N = SPELL_NUM.jato;
    shot(w, 'jet', p.x + Math.cos(aim) * 26, p.y + Math.sin(aim) * 26, aim, N.speed, N.range, N.damage * power).pierce = true;
  } else if (id === 'onda') {
    const N = SPELL_NUM.onda, r = N.radius * area;
    for (const e of w.enemies) {
      if (!hittable(e)) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d > r + e.radius || (Math.abs(wrapAngle(Math.atan2(dy, dx) - aim)) > N.arc && d > e.radius + 30)) continue;
      damageEnemy(w, e, N.damage * power, 'spell', Math.atan2(dy, dx));
      if (e.hp > 0) {
        wet(w, e);
        const heavy = isBoss(e) || e.elite || e.kind === 'tronco' || e.kind === 'cuspidor' || e.kind === 'jacare' || e.kind === 'caramujo';
        if (!heavy) { e.kx = (dx / d) * N.knock; e.ky = (dy / d) * N.knock; e.tele = null; if (e.state === 'windup' || e.state === 'aim' || e.state === 'fuse') { e.state = 'stagger'; e.stateT = 0; } }
      }
    }
    emit(w, { type: 'onda', x: p.x, y: p.y, ang: aim, value: r });
  } else if (id === 'bolha') {
    const N = SPELL_NUM.bolha;
    shot(w, 'bubble', p.x + Math.cos(aim) * 26, p.y + Math.sin(aim) * 26, aim, N.speed, N.range, N.damage * power);
  } else if (id === 'correnteza') {
    const N = SPELL_NUM.correnteza;
    p.state = 'dodge'; p.stateT = 0; p.charge = 0; p.surf = N.damage * power;
    p.dx = Math.cos(aim); p.dy = Math.sin(aim); p.iframes = N.duration + 0.08; p.perfectUsed = true; p.rolled = [];
    emit(w, { type: 'correnteza', x: p.x, y: p.y, ang: aim });
  } else {
    const N = SPELL_NUM.chuva, pos = aimPoint(w, inp, N.range);
    w.zones.push({ id: w.nextId++, kind: 'chuva', x: pos.x, y: pos.y, r: N.radius * area, t: 0, dur: N.duration * dur, tick: 0, power: N.healPerSecond * spellLevelPower(lv) });
  }
  emit(w, { type: 'cast', x: p.x, y: p.y, ang: aim, kind: id });
}

/** Chama o Encantado libertado: um golpe na sala inteira. */
function castSupremo(w: World): void {
  const p = w.player, el = w.supremo!, scale = spellScale(w), cx = (w.arena.x0 + w.arena.x1) / 2, cy = (w.arena.y0 + w.arena.y1) / 2;
  p.iframes = Math.max(p.iframes, 1.3);
  emit(w, { type: 'supremo', x: p.x, y: p.y, kind: el });
  for (const e of w.enemies) if (e.fake) e.hp = 0;
  for (const e of w.enemies) {
    if (e.hp <= 0 || e.state === 'spawn') continue;
    if (e.hidden && e.kind === 'urutau') { e.hidden = false; e.state = 'hover'; e.stateT = 0; }
    if (e.hidden && e.kind === 'arraia') { e.hidden = false; e.state = 'chase'; e.stateT = 0; }
    if (e.hidden) continue;
    const boss = isBoss(e);
    if (el === 'natureza') {
      const N = SUPREMO_NUM.natureza;
      damageEnemy(w, e, N.damage * scale, 'spell', 0);
      if (e.hp > 0) { if (boss) e.slowT = N.root; else { e.rootT = N.root; e.tele = null; } }
    } else {
      const N = SUPREMO_NUM.agua;
      if (!boss && e.kind !== 'cuspidor') {
        const dx = e.x - cx, dy = e.y - cy, d = Math.hypot(dx, dy) || 1, to = Math.min(d, N.pullTo + (e.id % 5) * 14);
        e.x = cx + (dx / d) * to; e.y = cy + (dy / d) * to; e.kx = e.ky = 0; e.tele = null;
        if (e.state === 'windup' || e.state === 'aim' || e.state === 'fuse' || e.state === 'charge' || e.state === 'leap') { e.state = 'stagger'; e.stateT = 0; }
      }
      damageEnemy(w, e, N.damage * scale, 'spell', 0);
      if (e.hp > 0) { wet(w, e); e.slowT = N.slow; if (!boss) e.stunT = Math.max(e.stunT, 1.2); }
    }
  }
  p.supremo = 0;
}

export function updatePlayer(w: World, inp: Input, dt: number): void {
  const p = w.player, P = PLAYER, s = w.stats;
  if (p.state === 'dead') { p.stateT += dt; return; }
  p.iframes = max0(p.iframes - dt); p.hurtInv = max0(p.hurtInv - dt); p.perfectT = max0(p.perfectT - dt); p.comboT = max0(p.comboT - dt);
  p.contraT = max0(p.contraT - dt); p.presaT = max0(p.presaT - dt); p.cascaT = max0(p.cascaT - dt); p.slowT = max0(p.slowT - dt);
  p.potionCd = max0(p.potionCd - dt); p.shotCd = max0(p.shotCd - dt);
  if (p.stackT > 0) { p.stackT -= dt; if (p.stackT <= 0) p.stacks = 0; }
  for (let i = 0; i < 3; i++) p.cds[i] = max0(p.cds[i] - dt);
  if (p.dodgeCharges < s.dodgeCharges) {
    p.dodgeTimer += dt;
    if (p.dodgeTimer >= s.dodgeCooldown) { p.dodgeCharges++; p.dodgeTimer = 0; }
  } else p.dodgeTimer = 0;
  p.mana = Math.min(s.maxMana, p.mana + s.manaRegen * dt);
  p.bufAttack = inp.attackPressed ? P.inputBuffer : max0(p.bufAttack - dt);
  p.bufDodge = inp.dodgePressed ? P.inputBuffer : max0(p.bufDodge - dt);
  for (let i = 0; i < 3; i++) p.bufSpell[i] = inp.spell[i] ? P.inputBuffer : max0(p.bufSpell[i] - dt);

  const fighting = w.phase === 'fight' && w.enemies.length > 0;
  if (fighting) {
    if (s.regen > 0 && p.hp < s.maxHp) p.hp = Math.min(s.maxHp, p.hp + s.maxHp * s.regen * s.healMult * dt);
    chargeSupremo(w, SUPREMO_NUM.perSecond * dt);
    if (s.nova > 0) {
      p.novaT += dt;
      if (p.novaT >= 4) {
        p.novaT = 0;
        const N = SPELL_NUM.dardo, n = 8 * s.nova, off = rand(w) * 6.283;
        for (let i = 0; i < n; i++) { const a = off + (i * 6.283) / n; shot(w, 'thorn', p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20, a, N.speed, 360, N.damage * spellScale(w) * 0.9).pierce = s.pierce; }
        emit(w, { type: 'nova', x: p.x, y: p.y });
      }
    }
  }
  if (inp.supremoPressed && w.supremo && p.supremo >= 100 && fighting) castSupremo(w);

  const free = s.uniques.escamaDaIara;
  p.inPuddle = w.flooded || w.puddles.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < q.r);
  const decay = Math.exp(-10 * dt);
  p.x += p.kx * dt; p.y += p.ky * dt; p.kx *= decay; p.ky *= decay;
  if (w.current && !free && p.state !== 'dodge' && w.phase === 'fight') p.x += w.current * dt;
  const aim = Math.atan2(inp.aimY - p.y, inp.aimX - p.x);
  const len = Math.hypot(inp.mx, inp.my);
  const speed = s.moveSpeed * (p.slowT > 0 ? 0.5 : 1) * (p.inPuddle && !free ? PUDDLE_SLOW : 1);
  const as = attackSpeed(w);
  p.vx = 0; p.vy = 0; p.moving = false;
  const walkBy = (mult: number) => {
    if (len <= 0.1) return;
    p.moving = true;
    p.vx = (inp.mx / len) * speed * mult; p.vy = (inp.my / len) * speed * mult;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.walk += speed * mult * dt * 0.065;
  };

  if (inp.potionPressed && p.potions > 0 && p.potionCd <= 0 && p.hp < s.maxHp) {
    p.potions--; p.potionCd = P.potionCooldown;
    healPlayer(w, s.maxHp * s.potionHeal, true);
    emit(w, { type: 'potion', x: p.x, y: p.y, value: Math.round(s.maxHp * s.potionHeal * s.healMult) });
  }

  if (p.state === 'hurt') {
    p.stateT += dt;
    if (p.stateT >= P.hurtStun) p.state = 'idle';
  } else if (p.state === 'dodge') {
    p.stateT += dt;
    const surf = p.surf > 0, C = SPELL_NUM.correnteza, total = surf ? C.duration : P.dodge.duration;
    const k = surf ? 1 : (1 - 0.5 * (p.stateT / total)) * s.dodgeDistance;
    p.vx = p.dx * (surf ? C.speed : P.dodge.speed) * k; p.vy = p.dy * (surf ? C.speed : P.dodge.speed) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (surf || s.talents.rolamentoCortante) {
      for (const e of w.enemies) {
        if (!hittable(e) || p.rolled.includes(e.id) || Math.hypot(e.x - p.x, e.y - p.y) > e.radius + P.radius + (surf ? 22 : 8)) continue;
        p.rolled.push(e.id);
        if (surf) { damageEnemy(w, e, p.surf, 'spell', Math.atan2(p.dy, p.dx)); wet(w, e); }
        else damageEnemy(w, e, s.weaponDamage * s.damageMult * weaponBonus(w) * P.rolamentoMult, 'roll', Math.atan2(p.dy, p.dx));
      }
    }
    if (p.stateT >= total) { p.state = 'idle'; p.surf = 0; }
  } else if (p.state === 'attack') {
    const a = P.combo[p.combo], windup = a.windup / as, total = a.total / as;
    p.stateT += dt;
    if (p.stateT < windup + 0.08) { p.x += Math.cos(p.aim) * a.lunge * dt; p.y += Math.sin(p.aim) * a.lunge * dt; }
    if (!p.hitDone && p.stateT >= windup) { p.hitDone = true; meleeHit(w, a, p.combo === P.combo.length - 1); }
    if (p.hitDone && p.bufDodge > 0 && p.dodgeCharges > 0) startDodge(w, inp);
    else if (p.stateT >= total) {
      if ((p.bufAttack > 0 || inp.attackHeld) && p.combo < P.combo.length - 1) startAttack(w, aim, p.combo + 1);
      else { p.state = 'idle'; p.comboT = P.comboWindow; }
    }
  } else if (p.state === 'block') {
    p.blockT += dt; p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
    walkBy(P.shield.moveMult);
    if (p.bufDodge > 0 && p.dodgeCharges > 0) startDodge(w, inp);
    else if (!inp.altHeld) p.state = 'idle';
  } else if (p.state === 'charge') {
    p.charge = Math.min(1, p.charge + (dt / P.bow.chargeTime) * as);
    p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
    walkBy(P.bow.chargeMoveMult);
    if (p.bufDodge > 0 && p.dodgeCharges > 0) startDodge(w, inp);
    else if (!inp.altHeld) { fireArrow(w, aim, p.charge); p.charge = 0; p.state = 'idle'; }
  }

  if (p.state === 'idle') {
    const bow = s.weapon === 'arco', shooting = bow && (inp.attackHeld || p.bufAttack > 0);
    walkBy(shooting ? P.bow.shotSlow : 1);
    p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
    if (p.bufDodge > 0 && p.dodgeCharges > 0) startDodge(w, inp);
    else if (inp.altHeld && bow) { p.state = 'charge'; p.charge = 0; }
    else if (inp.altHeld && s.hasShield) { p.state = 'block'; p.blockT = 0; }
    else {
      let cast = false;
      for (let i = 0; i < 3 && !cast; i++) {
        const id = w.spells[i];
        if (!id || p.bufSpell[i] <= 0 || p.cds[i] > 0 || p.mana < spellCost(w, i, id)) continue;
        castSpell(w, i, id, aim, inp);
        cast = true;
      }
      if (cast) { /* o feitiço tem prioridade sobre o golpe segurado */ }
      else if (shooting) { if (p.shotCd <= 0) fireArrow(w, aim, 0); }
      else if (p.bufAttack > 0 || inp.attackHeld) startAttack(w, aim, p.comboT > 0 && p.combo < P.combo.length - 1 ? p.combo + 1 : 0);
    }
  }
  clampArena(w, p, P.radius);
}

/* ---------- projéteis ---------- */

export function updateProjectiles(w: World, dt: number): void {
  const p = w.player, pet = w.pet, a = w.arena, s = w.stats;
  w.projectiles = w.projectiles.filter((pr) => {
    if (pr.kind === 'seed' || pr.kind === 'glob') {
      pr.t += dt;
      const k = Math.min(1, pr.t / pr.dur);
      pr.x = pr.sx + (pr.tx - pr.sx) * k; pr.y = pr.sy + (pr.ty - pr.sy) * k;
      if (pr.tele) pr.tele.t = pr.t;
      if (pr.t < pr.dur) return true;
      const r = pr.tele && pr.tele.shape === 'circle' ? pr.tele.r : ENEMY.cuspidor.splash;
      emit(w, { type: pr.kind === 'glob' ? 'splash' : 'splat', x: pr.tx, y: pr.ty, value: r });
      if (pr.tele) strike(w, pr.tele, pr.damage, 220, pr.kind === 'glob' ? { water: true } : { nature: true });
      if (pr.kind === 'glob') w.zones.push({ id: w.nextId++, kind: 'puddle', x: pr.tx, y: pr.ty, r: r * 1.15, t: 0, dur: ENEMY.sapo.puddle, tick: 0, power: 0 });
      return false;
    }
    const sp = Math.hypot(pr.vx, pr.vy);
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.dist += sp * dt;
    const inside = pr.x > a.x0 - 80 && pr.x < a.x1 + 80 && pr.y > a.y0 - 80 && pr.y < a.y1 + 80;
    if (pr.dist >= pr.range || !inside) return false;

    if (pr.kind === 'wall') {
      /* onda da Iara: parede que atravessa a sala, com uma passagem em (sx ± sy) */
      const horizontal = Math.abs(pr.vx) > Math.abs(pr.vy);
      const along = horizontal ? p.x - pr.x : p.y - pr.y, across = horizontal ? p.y : p.x;
      if (!pr.hit.includes(-1) && Math.abs(along) < pr.t / 2 + PLAYER.radius * 0.4 && Math.abs(across - pr.sx) > pr.sy) {
        const src = w.enemies.find((e) => e.id === pr.owner) ?? null;
        if (hurtPlayer(w, pr.damage, pr.x - pr.vx * 0.1, pr.y - pr.vy * 0.1, 480, { src, water: true })) pr.hit.push(-1);
        else if (p.iframes <= 0 && p.hurtInv <= 0) pr.hit.push(-1);
      }
      return true;
    }
    if (pr.kind === 'ethorn' || pr.kind === 'stampede' || pr.kind === 'sting') {
      const r = pr.kind === 'stampede' ? 34 : 14;
      if (!pr.hit.includes(-1) && Math.hypot(p.x - pr.x, p.y - pr.y) < r + PLAYER.radius * 0.5) {
        pr.hit.push(-1);
        const src = w.enemies.find((e) => e.id === pr.owner) ?? null;
        hurtPlayer(w, pr.damage, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, pr.kind === 'stampede' ? 520 : 180, { src, nature: pr.kind === 'ethorn' });
        if (pr.kind !== 'stampede') return false;
      }
      if (pet && pet.state !== 'down' && !pr.hit.includes(-2) && Math.hypot(pet.x - pr.x, pet.y - pr.y) < r + 12) { pr.hit.push(-2); hurtPet(w, pr.damage); if (pr.kind !== 'stampede') return false; }
      return true;
    }

    for (const e of w.enemies) {
      if (!hittable(e) || pr.hit.includes(e.id) || Math.hypot(e.x - pr.x, e.y - pr.y) > e.radius + (pr.charged || pr.kind === 'bubble' ? 16 : 10)) continue;
      const ang = Math.atan2(pr.vy, pr.vx);
      if (pr.kind === 'thorn') {
        const N = SPELL_NUM.dardo, wasWet = e.wetT > 0;
        damageEnemy(w, e, pr.damage, 'spell', ang);
        if (e.hp > 0) { e.poisonT = N.poisonDuration * s.durationMult; e.poisonTick = N.poisonEvery; if (wasWet) brotar(w, e); }
        if (!pr.pierce) return false;
        pr.hit.push(e.id);
        continue;
      }
      if (pr.kind === 'cipo') {
        const N = SPELL_NUM.cipo, wasWet = e.wetT > 0;
        damageEnemy(w, e, pr.damage, 'spell', ang);
        if (e.hp > 0) {
          const heavy = isBoss(e) || e.elite || e.kind === 'tronco' || e.kind === 'cuspidor' || e.kind === 'jacare' || e.kind === 'caramujo';
          if (isBoss(e)) e.slowT = N.root * s.durationMult;
          else {
            e.rootT = N.root * s.durationMult; e.tele = null;
            if (!heavy) { const d = Math.hypot(e.x - p.x, e.y - p.y) || 1; e.x = p.x + ((e.x - p.x) / d) * N.pullTo; e.y = p.y + ((e.y - p.y) / d) * N.pullTo; e.kx = 0; e.ky = 0; }
          }
          emit(w, { type: 'cipo', x: p.x, y: p.y, x2: e.x, y2: e.y, id: e.id });
          if (wasWet) brotar(w, e);
        }
        return false;
      }
      if (pr.kind === 'jet') {
        damageEnemy(w, e, pr.damage, 'spell', ang);
        wet(w, e);
        pr.hit.push(e.id);
        continue;
      }
      if (pr.kind === 'bubble') {
        const N = SPELL_NUM.bolha;
        damageEnemy(w, e, pr.damage, 'spell', ang);
        if (e.hp > 0) {
          wet(w, e);
          if (isBoss(e) || e.elite) e.slowT = N.bossSlow * s.durationMult;
          else { e.rootT = N.trap * s.durationMult; e.bubbleT = e.rootT; e.tele = null; }
          emit(w, { type: 'bubble', x: e.x, y: e.y, id: e.id });
        }
        return false;
      }
      damageEnemy(w, e, pr.damage, 'arrow', ang);
      p.mana = Math.min(s.maxMana, p.mana + PLAYER.manaPerHit * 0.6 * s.manaPerHitMult);
      if (!pr.pierce) return false;
      pr.hit.push(e.id);
    }
    return true;
  });
}

/* ---------- efeitos no chão e golpes com atraso ---------- */

export function updateZones(w: World, dt: number): void {
  const p = w.player, pet = w.pet, s = w.stats;
  w.zones = w.zones.filter((z) => {
    z.t += dt;
    if (z.kind === 'sementes') {
      if (z.t < z.dur) return true;
      const N = SPELL_NUM.sementes;
      const inside = w.enemies.filter((e) => hittable(e) && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.radius * 0.5);
      for (const e of inside) {
        if (e.hp <= 0) continue;
        const wasWet = e.wetT > 0;
        damageEnemy(w, e, z.power, 'spell', Math.atan2(e.y - z.y, e.x - z.x));
        if (e.hp > 0) { e.slowT = N.slowDuration * s.durationMult; if (wasWet && e.wetT > 0) brotar(w, e); }
      }
      emit(w, { type: 'sementes', x: z.x, y: z.y, value: z.r });
      return false;
    }
    if (z.kind === 'pop') {
      if (z.t < z.dur) return true;
      for (const e of w.enemies) {
        if (!hittable(e) || Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.radius * 0.5) continue;
        damageEnemy(w, e, z.power, 'blast', Math.atan2(e.y - z.y, e.x - z.x));
      }
      emit(w, { type: 'pop', x: z.x, y: z.y, value: z.r });
      return false;
    }
    if (z.kind === 'whirl') {
      /* redemoinho da Iara: puxa o herói para o centro e fere quem fica dentro */
      const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (z.t > 0 && d < z.r * 2.4 && p.state !== 'dodge' && p.state !== 'dead' && !s.uniques.escamaDaIara) { const pull = ENEMY.iara.redemoinho.pull * (1 - d / (z.r * 2.4)); p.x += (dx / d) * pull * dt; p.y += (dy / d) * pull * dt; }
    }
    z.tick -= dt;
    if (z.tick <= 0 && z.t > 0) {
      z.tick += 0.5;
      const inP = Math.hypot(p.x - z.x, p.y - z.y) < z.r;
      if (z.kind === 'broto' || z.kind === 'chuva') {
        const heal = s.maxHp * z.power * 0.5 * Math.min(1.8, Math.sqrt(s.spellPower));
        if (inP) healPlayer(w, heal);
        if (pet && pet.state !== 'down' && Math.hypot(pet.x - z.x, pet.y - z.y) < z.r) pet.hp = Math.min(pet.maxHp, pet.hp + pet.maxHp * z.power * 0.5);
        if (z.kind === 'chuva') for (const e of w.enemies) if (hittable(e) && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.radius * 0.5) wet(w, e);
      } else if (z.kind === 'puddle') {
        if (inP && !s.uniques.escamaDaIara) p.slowT = Math.max(p.slowT, 0.55);
      } else if (inP) hurtPlayer(w, z.power, z.x, z.y, 0, { unblockable: true, nature: z.kind === 'cloud', water: z.kind === 'whirl', soft: true });
    }
    return z.t < z.dur;
  });
}

export function updateHazards(w: World, dt: number): void {
  w.hazards = w.hazards.filter((h) => {
    h.tele.t += dt;
    if (h.tele.t < h.tele.dur) return true;
    const t = h.tele;
    if (h.kind === 'lane' && t.shape === 'line') {
      const E = ENEMY.curupira.estouro, ang = Math.atan2(t.y2 - t.y, t.x2 - t.x), len = Math.hypot(t.x2 - t.x, t.y2 - t.y);
      const pr = shot(w, 'stampede', t.x, t.y, ang, E.speed, len, h.damage);
      pr.pierce = true;
    } else {
      const water = h.kind === 'jet' || h.kind === 'dive';
      if (strike(w, t, h.damage, 300, water ? { water: true } : { nature: true }) && h.slow > 0) w.player.slowT = h.slow;
    }
    emit(w, { type: 'hazard', kind: h.kind, x: t.x, y: t.y, x2: t.shape === 'line' ? t.x2 : t.x, y2: t.shape === 'line' ? t.y2 : t.y, value: t.shape === 'circle' ? t.r : t.w });
    return false;
  });
}

/* ---------- companheiro ---------- */

export function makePet(w: World): Companion | null {
  const id = w.stats.companion;
  if (!id) return null;
  const def = COMPANIONS[id], p = w.player;
  const hp = Math.round(def.hp * (1 + 0.3 * (w.stats.level - 1)) * w.stats.companionMult);
  return { id, x: p.x - 50, y: p.y + 18, hp, maxHp: hp, state: 'follow', stateT: 0, cd: 2, atkCd: 0, tauntT: 0, facing: 1, walk: 0, moving: false, target: 0, flash: 0, sx: 0, sy: 0 };
}

function petDamage(w: World, pet: Companion): number {
  return COMPANIONS[pet.id].damage * levelScale(w.stats.level) * w.stats.companionMult;
}

export function updatePet(w: World, inp: Input, dt: number): void {
  const pet = w.pet;
  if (!pet) return;
  const p = w.player, def = COMPANIONS[pet.id], s = w.stats, cooldown = def.cooldown * s.petCooldownMult;
  pet.cd = max0(pet.cd - dt); pet.atkCd = max0(pet.atkCd - dt); pet.tauntT = max0(pet.tauntT - dt); pet.flash = max0(pet.flash - dt);
  pet.stateT += dt; pet.moving = false;
  if (pet.state === 'down') {
    if (s.petFastRevive && pet.stateT >= 8) { pet.state = 'follow'; pet.hp = Math.round(pet.maxHp * 0.5); pet.x = p.x - 40; pet.y = p.y + 16; emit(w, { type: 'pet', x: pet.x, y: pet.y, kind: 'volta' }); }
    return;
  }
  const go = (tx: number, ty: number, speed: number, stop: number): number => {
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy);
    if (d > stop) {
      pet.x += (dx / d) * Math.min(speed * dt, d - stop + 0.1); pet.y += (dy / d) * Math.min(speed * dt, d - stop + 0.1);
      pet.walk += speed * dt * 0.09; pet.moving = true;
      if (Math.abs(dx) > 3) pet.facing = dx >= 0 ? 1 : -1;
    }
    return d;
  };
  const reach = pet.id === 'arara' ? 420 : 240;
  let near: Enemy | null = null, best = Infinity;
  for (const e of w.enemies) {
    if (!hittable(e) || e.fake) continue;
    const d = Math.hypot(e.x - pet.x, e.y - pet.y);
    if (d < best && Math.hypot(e.x - p.x, e.y - p.y) < 460) { best = d; near = e; }
  }

  if (pet.state === 'pounce') {
    const t = w.enemies.find((e) => e.id === pet.target), k = Math.min(1, pet.stateT / 0.28);
    if (!t || t.hp <= 0) { pet.state = 'follow'; return; }
    pet.x = pet.sx + (t.x - pet.sx) * k; pet.y = pet.sy + (t.y - pet.sy) * k; pet.facing = t.x >= pet.sx ? 1 : -1;
    if (k >= 1) { damageEnemy(w, t, petDamage(w, pet) * 5 * (s.petDouble ? 2 : 1), 'pet', Math.atan2(t.y - pet.sy, t.x - pet.sx), true); pet.state = 'follow'; pet.atkCd = 0.6; }
    return;
  }
  if (inp.petPressed && pet.cd <= 0 && w.phase === 'fight') {
    if (pet.id === 'capivara') {
      const dur = s.petDouble ? 8 : 4;
      pet.tauntT = dur; pet.cd = cooldown;
      for (const e of w.enemies) if (e.hp > 0 && !isBoss(e) && Math.hypot(e.x - pet.x, e.y - pet.y) < 320) e.aggroPet = dur;
      emit(w, { type: 'taunt', x: pet.x, y: pet.y });
    } else if (pet.id === 'arara') {
      let top: Enemy | null = null;
      for (const e of w.enemies) if (hittable(e) && !e.fake && (!top || e.maxHp > top.maxHp)) top = e;
      if (top) { top.markT = 6 * s.durationMult; pet.cd = cooldown; emit(w, { type: 'mark', x: top.x, y: top.y, id: top.id }); }
    } else if (near && best < 480) {
      pet.state = 'pounce'; pet.stateT = 0; pet.target = near.id; pet.sx = pet.x; pet.sy = pet.y; pet.cd = cooldown;
      emit(w, { type: 'pet', x: pet.x, y: pet.y, kind: 'bote' });
      return;
    }
  }
  if (pet.id === 'arara') {
    /* a arara voa em volta do herói e bica de longe */
    const a = w.time * 1.6;
    go(p.x + Math.cos(a) * 62, p.y - 46 + Math.sin(a) * 22, def.speed, 6);
    if (near && best < reach && pet.atkCd <= 0 && w.phase === 'fight') {
      pet.atkCd = 1.25; pet.facing = near.x >= pet.x ? 1 : -1;
      damageEnemy(w, near, petDamage(w, pet), 'pet', Math.atan2(near.y - pet.y, near.x - pet.x));
      emit(w, { type: 'pet', x: pet.x, y: pet.y, x2: near.x, y2: near.y, kind: 'bicada' });
    }
    return;
  }
  if (near && best < reach && w.phase === 'fight') {
    const d = go(near.x, near.y, def.speed, near.radius + 22);
    if (d <= near.radius + 30 && pet.atkCd <= 0) {
      pet.atkCd = 1.1;
      damageEnemy(w, near, petDamage(w, pet), 'pet', Math.atan2(near.y - pet.y, near.x - pet.x));
      emit(w, { type: 'pet', x: pet.x, y: pet.y, kind: 'golpe' });
    }
  } else go(p.x - 48 * p.facing, p.y + 18, def.speed * (Math.hypot(p.x - pet.x, p.y - pet.y) > 220 ? 1.6 : 1), 10);
  clampArena(w, pet, 12);
}
