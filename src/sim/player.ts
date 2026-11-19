/** Herói, feitiços, projéteis, efeitos no chão e companheiro. */
import { ENEMY, PLAYER } from '../data/balance';
import { COMPANIONS, MAX_POTIONS, POTION_HEAL, SPELLS, SPELL_NUM, type SpellId } from '../data/content';
import { attackSpeed, clampArena, damageEnemy, emit, healPlayer, hurtPet, hurtPlayer, isBoss, max0, strike, weaponBonus, wrapAngle } from './core';
import type { Companion, Enemy, Input, Projectile, World } from './types';

const hittable = (e: Enemy): boolean => e.hp > 0 && !e.hidden && e.state !== 'spawn';

/** Dano de feitiço cresce com o nível do herói, para acompanhar a vida dos monstros. */
function spellScale(w: World): number {
  return w.stats.spellPower * (1 + 0.16 * (w.stats.level - 1));
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
  p.state = 'dodge'; p.stateT = 0; p.charge = 0;
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
  return s.weaponDamage * mult * s.damageMult * weaponBonus(w) * (p.perfectT > 0 ? PLAYER.perfectBonus : 1) * (p.contraT > 0 ? PLAYER.contragolpe : 1);
}

function meleeHit(w: World, a: (typeof PLAYER.combo)[number]): void {
  const p = w.player, dmg = weaponDamage(w, a.mult);
  let hits = 0;
  for (const e of w.enemies) {
    if (!hittable(e)) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > a.range + e.radius) continue;
    if (Math.abs(wrapAngle(Math.atan2(dy, dx) - p.aim)) > a.arc && d > e.radius + 22) continue;
    damageEnemy(w, e, dmg, 'melee', p.aim);
    hits++;
  }
  if (hits > 0) {
    p.mana = Math.min(w.stats.maxMana, p.mana + PLAYER.manaPerHit * hits);
    p.perfectT = 0; p.contraT = 0;
  }
}

function fireArrow(w: World, aim: number, charge: number): void {
  const p = w.player, B = PLAYER.bow, strong = charge >= 0.25;
  const pr = shot(w, 'arrow', p.x + Math.cos(aim) * 22, p.y + Math.sin(aim) * 22, aim, B.speed * (strong ? 1.15 : 1), B.range, weaponDamage(w, B.mult * (strong ? 1 + (B.chargeMult - 1) * charge : 1)));
  pr.pierce = charge >= 0.6; pr.charged = strong;
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
  p.shotCd = B.interval / attackSpeed(w); p.bufAttack = 0;
  p.perfectT = 0; p.contraT = 0;
  emit(w, { type: 'shoot', x: p.x, y: p.y, ang: aim, value: strong ? 1 : 0 });
}

function castSpell(w: World, slot: number, id: SpellId, aim: number, inp: Input): void {
  const p = w.player, s = w.stats, def = SPELLS[id], scale = spellScale(w);
  p.mana -= def.cost * s.manaCostMult;
  p.cds[slot] = p.cdMax[slot] = def.cooldown * s.cooldownMult;
  p.bufSpell[slot] = 0;
  p.aim = aim; p.facing = Math.cos(aim) >= 0 ? 1 : -1;
  if (id === 'dardo') {
    const N = SPELL_NUM.dardo;
    for (let i = 0; i < N.count; i++) {
      const a = aim + (i - (N.count - 1) / 2) * N.spread;
      shot(w, 'thorn', p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, a, N.speed, N.range, N.damage * scale);
    }
  } else if (id === 'sementes') {
    const N = SPELL_NUM.sementes;
    let dx = inp.aimX - p.x, dy = inp.aimY - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > N.range) { dx = (dx / d) * N.range; dy = (dy / d) * N.range; }
    const pos = { x: p.x + dx, y: p.y + dy };
    clampArena(w, pos, 10);
    w.zones.push({ id: w.nextId++, kind: 'sementes', x: pos.x, y: pos.y, r: N.radius, t: 0, dur: N.delay, tick: 0, power: N.damage * scale });
  } else if (id === 'cipo') {
    const N = SPELL_NUM.cipo;
    shot(w, 'cipo', p.x + Math.cos(aim) * 24, p.y + Math.sin(aim) * 24, aim, N.speed, N.range, N.damage * scale);
  } else if (id === 'casca') {
    p.cascaT = SPELL_NUM.casca.duration;
  } else {
    const N = SPELL_NUM.broto;
    w.zones.push({ id: w.nextId++, kind: 'broto', x: p.x, y: p.y, r: N.radius, t: 0, dur: N.duration, tick: 0.5, power: N.healPerSecond });
  }
  emit(w, { type: 'cast', x: p.x, y: p.y, ang: aim, kind: id });
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

  const decay = Math.exp(-10 * dt);
  p.x += p.kx * dt; p.y += p.ky * dt; p.kx *= decay; p.ky *= decay;
  const aim = Math.atan2(inp.aimY - p.y, inp.aimX - p.x);
  const len = Math.hypot(inp.mx, inp.my);
  const speed = s.moveSpeed * (p.slowT > 0 ? 0.5 : 1);
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
    healPlayer(w, s.maxHp * POTION_HEAL, true);
    emit(w, { type: 'potion', x: p.x, y: p.y, value: Math.round(s.maxHp * POTION_HEAL) });
  }

  if (p.state === 'hurt') {
    p.stateT += dt;
    if (p.stateT >= P.hurtStun) p.state = 'idle';
  } else if (p.state === 'dodge') {
    p.stateT += dt;
    const k = (1 - 0.5 * (p.stateT / P.dodge.duration)) * s.dodgeDistance;
    p.vx = p.dx * P.dodge.speed * k; p.vy = p.dy * P.dodge.speed * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (s.talents.rolamentoCortante) {
      for (const e of w.enemies) {
        if (!hittable(e) || p.rolled.includes(e.id) || Math.hypot(e.x - p.x, e.y - p.y) > e.radius + P.radius + 8) continue;
        p.rolled.push(e.id);
        damageEnemy(w, e, s.weaponDamage * s.damageMult * weaponBonus(w) * P.rolamentoMult, 'roll', Math.atan2(p.dy, p.dx));
      }
    }
    if (p.stateT >= P.dodge.duration) p.state = 'idle';
  } else if (p.state === 'attack') {
    const a = P.combo[p.combo], windup = a.windup / as, total = a.total / as;
    p.stateT += dt;
    if (p.stateT < windup + 0.08) { p.x += Math.cos(p.aim) * a.lunge * dt; p.y += Math.sin(p.aim) * a.lunge * dt; }
    if (!p.hitDone && p.stateT >= windup) { p.hitDone = true; meleeHit(w, a); }
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
    else if (shooting) { if (p.shotCd <= 0) fireArrow(w, aim, 0); }
    else if (p.bufAttack > 0 || inp.attackHeld) startAttack(w, aim, p.comboT > 0 && p.combo < P.combo.length - 1 ? p.combo + 1 : 0);
    else {
      for (let i = 0; i < 3; i++) {
        const id = w.spells[i];
        if (!id || p.bufSpell[i] <= 0 || p.cds[i] > 0 || p.mana < SPELLS[id].cost * s.manaCostMult) continue;
        castSpell(w, i, id, aim, inp);
        break;
      }
    }
  }
  clampArena(w, p, P.radius);
}

/* ---------- projéteis ---------- */

export function updateProjectiles(w: World, dt: number): void {
  const p = w.player, pet = w.pet, a = w.arena;
  w.projectiles = w.projectiles.filter((pr) => {
    if (pr.kind === 'seed') {
      pr.t += dt;
      const k = Math.min(1, pr.t / pr.dur);
      pr.x = pr.sx + (pr.tx - pr.sx) * k; pr.y = pr.sy + (pr.ty - pr.sy) * k;
      if (pr.tele) pr.tele.t = pr.t;
      if (pr.t < pr.dur) return true;
      emit(w, { type: 'splat', x: pr.tx, y: pr.ty, value: ENEMY.cuspidor.splash });
      if (pr.tele) strike(w, pr.tele, pr.damage, 220, { nature: true });
      return false;
    }
    const sp = Math.hypot(pr.vx, pr.vy);
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.dist += sp * dt;
    const inside = pr.x > a.x0 - 80 && pr.x < a.x1 + 80 && pr.y > a.y0 - 80 && pr.y < a.y1 + 80;
    if (pr.dist >= pr.range || !inside) return false;

    if (pr.kind === 'ethorn' || pr.kind === 'stampede') {
      const r = pr.kind === 'stampede' ? 34 : 14;
      if (!pr.hit.includes(-1) && Math.hypot(p.x - pr.x, p.y - pr.y) < r + PLAYER.radius * 0.5) {
        pr.hit.push(-1);
        const src = w.enemies.find((e) => e.id === pr.owner) ?? null;
        hurtPlayer(w, pr.damage, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, pr.kind === 'stampede' ? 520 : 180, { src, nature: pr.kind === 'ethorn' });
        if (pr.kind === 'ethorn') return false;
      }
      if (pet && pet.state !== 'down' && !pr.hit.includes(-2) && Math.hypot(pet.x - pr.x, pet.y - pr.y) < r + 12) { pr.hit.push(-2); hurtPet(w, pr.damage); if (pr.kind === 'ethorn') return false; }
      return true;
    }

    for (const e of w.enemies) {
      if (!hittable(e) || pr.hit.includes(e.id) || Math.hypot(e.x - pr.x, e.y - pr.y) > e.radius + (pr.charged ? 16 : 10)) continue;
      const ang = Math.atan2(pr.vy, pr.vx);
      if (pr.kind === 'thorn') {
        const N = SPELL_NUM.dardo;
        damageEnemy(w, e, pr.damage, 'spell', ang);
        if (e.hp > 0) { e.poisonT = N.poisonDuration; e.poisonTick = N.poisonEvery; }
        return false;
      }
      if (pr.kind === 'cipo') {
        const N = SPELL_NUM.cipo;
        damageEnemy(w, e, pr.damage, 'spell', ang);
        if (e.hp > 0) {
          const heavy = isBoss(e) || e.elite || e.kind === 'tronco' || e.kind === 'cuspidor';
          if (isBoss(e)) e.slowT = N.root;
          else {
            e.rootT = N.root; e.tele = null;
            if (!heavy) { const d = Math.hypot(e.x - p.x, e.y - p.y) || 1; e.x = p.x + ((e.x - p.x) / d) * N.pullTo; e.y = p.y + ((e.y - p.y) / d) * N.pullTo; e.kx = 0; e.ky = 0; }
          }
          emit(w, { type: 'cipo', x: p.x, y: p.y, x2: e.x, y2: e.y, id: e.id });
        }
        return false;
      }
      damageEnemy(w, e, pr.damage, 'arrow', ang);
      p.mana = Math.min(w.stats.maxMana, p.mana + PLAYER.manaPerHit * 0.6);
      if (!pr.pierce) return false;
      pr.hit.push(e.id);
    }
    return true;
  });
}

/* ---------- efeitos no chão e golpes com atraso ---------- */

export function updateZones(w: World, dt: number): void {
  const p = w.player, pet = w.pet;
  w.zones = w.zones.filter((z) => {
    z.t += dt;
    if (z.kind === 'sementes') {
      if (z.t < z.dur) return true;
      const N = SPELL_NUM.sementes;
      for (const e of w.enemies) {
        if (!hittable(e) || Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.radius * 0.5) continue;
        damageEnemy(w, e, z.power, 'spell', Math.atan2(e.y - z.y, e.x - z.x));
        if (e.hp > 0) e.slowT = N.slowDuration;
      }
      emit(w, { type: 'sementes', x: z.x, y: z.y, value: z.r });
      return false;
    }
    z.tick -= dt;
    if (z.tick <= 0) {
      z.tick += 0.5;
      if (z.kind === 'broto') {
        if (Math.hypot(p.x - z.x, p.y - z.y) < z.r) healPlayer(w, w.stats.maxHp * z.power * 0.5);
        if (pet && pet.state !== 'down' && Math.hypot(pet.x - z.x, pet.y - z.y) < z.r) pet.hp = Math.min(pet.maxHp, pet.hp + pet.maxHp * z.power * 0.5);
      } else if (Math.hypot(p.x - z.x, p.y - z.y) < z.r) hurtPlayer(w, z.power, z.x, z.y, 0, { unblockable: true, nature: true, soft: true });
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
    } else if (strike(w, t, h.damage, 300, { nature: true }) && h.slow > 0) w.player.slowT = h.slow;
    emit(w, { type: 'hazard', kind: h.kind, x: t.x, y: t.y, x2: t.shape === 'line' ? t.x2 : t.x, y2: t.shape === 'line' ? t.y2 : t.y, value: t.shape === 'circle' ? t.r : t.w });
    return false;
  });
}

/* ---------- companheiro ---------- */

export function makePet(w: World): Companion | null {
  const id = w.stats.companion;
  if (!id) return null;
  const def = COMPANIONS[id], p = w.player;
  const hp = Math.round(def.hp * (1 + 0.15 * (w.stats.level - 1)) * w.stats.companionMult);
  return { id, x: p.x - 50, y: p.y + 18, hp, maxHp: hp, state: 'follow', stateT: 0, cd: 2, atkCd: 0, tauntT: 0, facing: 1, walk: 0, moving: false, target: 0, flash: 0, sx: 0, sy: 0 };
}

function petDamage(w: World, pet: Companion): number {
  return COMPANIONS[pet.id].damage * (1 + 0.14 * (w.stats.level - 1)) * w.stats.companionMult;
}

export function updatePet(w: World, inp: Input, dt: number): void {
  const pet = w.pet;
  if (!pet) return;
  const p = w.player, def = COMPANIONS[pet.id];
  pet.cd = max0(pet.cd - dt); pet.atkCd = max0(pet.atkCd - dt); pet.tauntT = max0(pet.tauntT - dt); pet.flash = max0(pet.flash - dt);
  pet.stateT += dt; pet.moving = false;
  if (pet.state === 'down') return;
  const go = (tx: number, ty: number, speed: number, stop: number): number => {
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy);
    if (d > stop) {
      pet.x += (dx / d) * Math.min(speed * dt, d - stop + 0.1); pet.y += (dy / d) * Math.min(speed * dt, d - stop + 0.1);
      pet.walk += speed * dt * 0.09; pet.moving = true;
      if (Math.abs(dx) > 3) pet.facing = dx >= 0 ? 1 : -1;
    }
    return d;
  };
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
    if (k >= 1) { damageEnemy(w, t, petDamage(w, pet) * 5, 'pet', Math.atan2(t.y - pet.sy, t.x - pet.sx), true); pet.state = 'follow'; pet.atkCd = 0.6; }
    return;
  }
  if (inp.petPressed && pet.cd <= 0 && w.phase === 'fight') {
    if (pet.id === 'capivara') {
      pet.tauntT = 4; pet.cd = def.cooldown;
      for (const e of w.enemies) if (e.hp > 0 && !isBoss(e) && Math.hypot(e.x - pet.x, e.y - pet.y) < 300) e.aggroPet = 4;
      emit(w, { type: 'taunt', x: pet.x, y: pet.y });
    } else if (near && best < 480) {
      pet.state = 'pounce'; pet.stateT = 0; pet.target = near.id; pet.sx = pet.x; pet.sy = pet.y; pet.cd = def.cooldown;
      emit(w, { type: 'pet', x: pet.x, y: pet.y, kind: 'bote' });
      return;
    }
  }
  if (near && best < 240 && w.phase === 'fight') {
    const d = go(near.x, near.y, def.speed, near.radius + 22);
    if (d <= near.radius + 30 && pet.atkCd <= 0) {
      pet.atkCd = 1.1;
      damageEnemy(w, near, petDamage(w, pet), 'pet', Math.atan2(near.y - pet.y, near.x - pet.x));
      emit(w, { type: 'pet', x: pet.x, y: pet.y, kind: 'golpe' });
    }
  } else go(p.x - 48 * p.facing, p.y + 18, def.speed * (Math.hypot(p.x - pet.x, p.y - pet.y) > 220 ? 1.6 : 1), 10);
  clampArena(w, pet, 12);
}

export { MAX_POTIONS };
