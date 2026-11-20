/** Funções compartilhadas da simulação: sorteio, geometria, dano e criação de inimigos. */
import { CHAMPION, ELITE, ENEMY, MOD, PLAYER, enemyDamageMult, enemyHpMult, enemySpeedMult, enemyWindupMult, type EnemyKind, type SpawnDef } from '../data/balance';
import { BROTAR, SUPREMO_NUM, WET_DURATION } from '../data/content';
import { damageReduction } from '../meta/stats';
import type { Enemy, EnemyState, Hazard, SimEvent, Telegraph, World } from './types';

export function rand(w: World): number {
  w.rng = (w.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(w.rng ^ (w.rng >>> 15), 1 | w.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const max0 = (v: number): number => (v > 0 ? v : 0);
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
export function emit(w: World, e: SimEvent): void {
  w.events.push(e);
}

/** Mantém o ponto dentro da arena. Devolve true se encostou na borda. */
export function clampArena(w: World, o: { x: number; y: number }, r: number): boolean {
  const a = w.arena;
  let hit = false;
  if (o.x < a.x0 + r) { o.x = a.x0 + r; hit = true; }
  if (o.x > a.x1 - r) { o.x = a.x1 - r; hit = true; }
  if (o.y < a.y0 + r) { o.y = a.y0 + r; hit = true; }
  if (o.y > a.y1 - r) { o.y = a.y1 - r; hit = true; }
  return hit;
}

/** Ponto em que um raio saindo de (x, y) na direção (dx, dy) encontra a borda da arena. */
export function rayExit(w: World, x: number, y: number, dx: number, dy: number, inset: number, maxLen = Infinity): [number, number] {
  const a = w.arena;
  const tx = dx > 0 ? (a.x1 - inset - x) / dx : dx < 0 ? (a.x0 + inset - x) / dx : Infinity;
  const ty = dy > 0 ? (a.y1 - inset - y) / dy : dy < 0 ? (a.y0 + inset - y) / dy : Infinity;
  const t = Math.max(0, Math.min(tx, ty, maxLen));
  return [x + dx * t, y + dy * t];
}

/** O ponto (x, y) está dentro da marca, com uma folga `pad`? */
export function inTele(t: Telegraph, x: number, y: number, pad: number): boolean {
  if (t.shape === 'circle') return Math.hypot(x - t.x, y - t.y) < t.r + pad;
  const dx = t.x2 - t.x, dy = t.y2 - t.y, len2 = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((x - t.x) * dx + (y - t.y) * dy) / len2));
  return Math.hypot(x - (t.x + dx * k), y - (t.y + dy * k)) < t.w / 2 + pad;
}

export function setState(e: Enemy, s: EnemyState): void {
  e.state = s;
  e.stateT = 0;
}

/** Alvo atual do inimigo: o companheiro, enquanto ele chama a atenção, ou o herói. */
export function targetOf(w: World, e: Enemy): { x: number; y: number } {
  const pet = w.pet;
  return e.aggroPet > 0 && pet && pet.state !== 'down' ? pet : w.player;
}

const BOSSES: EnemyKind[] = ['curupira', 'caipora', 'boto', 'iara'];
export function isBoss(e: Enemy): boolean {
  return BOSSES.includes(e.kind);
}

/** Crescimento por nível do que não vem de arma (feitiços, companheiro), para acompanhar a vida dos monstros. */
export function levelScale(level: number): number {
  return 1 + 0.3 * (level - 1) + 0.014 * (level - 1) ** 2;
}

/** Dano de feitiço cresce com o nível do herói. */
export function spellScale(w: World): number {
  return w.stats.spellPower * levelScale(w.stats.level);
}

export function chargeSupremo(w: World, amount: number): void {
  if (w.supremo) w.player.supremo = Math.min(100, w.player.supremo + amount);
}

export function wet(w: World, e: Enemy): void {
  if (e.hp <= 0 || e.fake) return;
  e.wetT = WET_DURATION * w.stats.durationMult;
}

/** Reação Natureza + Água: vinhas brotam do inimigo molhado, ferem em volta, prendem e curam um pouco o herói. */
export function brotar(w: World, e: Enemy): void {
  e.wetT = 0;
  const dmg = BROTAR.damage * spellScale(w) * w.stats.reactionMult, r = BROTAR.radius * w.stats.spellArea;
  emit(w, { type: 'brotar', x: e.x, y: e.y, value: r });
  for (const o of w.enemies) {
    if (o.hp <= 0 || o.hidden || o.fake || o.state === 'spawn' || Math.hypot(o.x - e.x, o.y - e.y) > r + o.radius * 0.5) continue;
    damageEnemy(w, o, dmg, 'reaction', Math.atan2(o.y - e.y, o.x - e.x));
    if (o.hp > 0) { if (isBoss(o)) o.slowT = Math.max(o.slowT, BROTAR.root); else { o.rootT = Math.max(o.rootT, BROTAR.root * w.stats.durationMult); o.tele = null; } }
  }
  healPlayer(w, w.stats.maxHp * BROTAR.heal);
}

export function spawnEnemy(w: World, def: SpawnDef, opts: { fake?: boolean; quiet?: boolean } = {}): Enemy {
  const base = ENEMY[def.kind], level = w.cfg.level, mods = def.mods ?? [];
  const boss = BOSSES.includes(def.kind);
  const elite = !!def.elite && !boss, champion = !!def.champion && !elite && !boss;
  const hp = opts.fake ? 1 : Math.round(base.hp * enemyHpMult(level) * (elite ? ELITE.hp : champion ? CHAMPION.hp : 1));
  const e: Enemy = {
    id: w.nextId++, kind: def.kind, elite: !!def.elite, champion, mods,
    x: def.x, y: def.y, kx: 0, ky: 0, hp, maxHp: hp, radius: base.radius * (elite ? ELITE.scale : champion ? CHAMPION.scale : 1),
    dmg: enemyDamageMult(level) * (elite ? ELITE.damage : champion ? CHAMPION.damage : 1),
    speedMult: (boss ? 1 : enemySpeedMult(level)) * (mods.includes('veloz') ? MOD.veloz.speed : 1),
    windupMult: (boss ? 1 : enemyWindupMult(level)) * (mods.includes('veloz') ? MOD.veloz.windup : 1),
    state: 'spawn', stateT: 0, facing: -1, dirX: -1, dirY: 0, tele: null,
    cd: 0.4 + rand(w) * 0.8, flag: false, count: 0, flash: 0, sinceHit: 9,
    poisonT: 0, poisonTick: 0, slowT: 0, rootT: 0, stunT: 0, wetT: 0, markT: 0, bubbleT: 0, guarded: false, walk: rand(w) * 6, moving: false,
    aggroPet: 0, hidden: false, fake: !!opts.fake,
    phase: 0, posture: 0, pattern: '', step: 0, calls: 0, ax: def.x, ay: def.y,
  };
  if ((def.kind === 'tronco' || def.kind === 'caramujo') && !mods.includes('blindado')) e.mods = [...mods, 'blindado'];
  w.enemies.push(e);
  if (!opts.quiet) emit(w, { type: 'spawn', x: e.x, y: e.y, kind: e.kind, id: e.id });
  return e;
}

export function addHazard(w: World, h: Omit<Hazard, 'id'>): Hazard {
  const hz = { id: w.nextId++, ...h };
  w.hazards.push(hz);
  return hz;
}

export function healPlayer(w: World, amount: number, quiet = false): void {
  const p = w.player;
  if (p.state === 'dead' || amount <= 0) return;
  const before = p.hp;
  p.hp = Math.min(w.stats.maxHp, p.hp + amount * w.stats.healMult);
  if (!quiet && p.hp - before >= 1) emit(w, { type: 'heal', x: p.x, y: p.y, value: Math.round(p.hp - before) });
}

export type DamageSource = 'melee' | 'arrow' | 'spell' | 'poison' | 'reflect' | 'pet' | 'roll' | 'reaction' | 'blast';

/** Aplica dano a um inimigo, com blindagem, fraquezas, crítico e efeitos de morte. Devolve o dano causado. */
export function damageEnemy(w: World, e: Enemy, amount: number, source: DamageSource, ang: number, forceCrit = false): number {
  if (e.hp <= 0 || e.hidden || e.state === 'spawn' || e.state === 'roar') return 0;
  const p = w.player, s = w.stats, C = ENEMY.curupira;
  if (e.fake) {
    e.hp = 0;
    addHazard(w, { kind: 'burst', tele: { shape: 'circle', x: e.x, y: e.y, r: C.assobio.burstRadius, t: 0, dur: C.assobio.burstDelay }, damage: C.assobio.burstDamage * e.dmg, slow: 0 });
    emit(w, { type: 'cloneBurst', x: e.x, y: e.y });
    return 0;
  }
  let dmg = amount * w.dealt, armored = false;
  const open = e.state === 'exposed' || e.state === 'stunned' || e.state === 'tired' || e.state === 'downed' || e.rootT > 0 || e.stunT > 0;
  const weapon = source === 'melee' || source === 'arrow' || source === 'roll';
  if (e.mods.includes('blindado') && !open && !(weapon && s.ignoreArmor)) { dmg *= e.kind === 'caramujo' ? ENEMY.caramujo.armor : ENEMY.tronco.armor; armored = true; }
  if (e.guarded && e.kind !== 'caramujo') { dmg *= 1 - ENEMY.caramujo.protect; armored = true; }
  if (e.markT > 0) dmg *= s.petDouble ? 1.5 : 1.25;
  if (e.elite || isBoss(e)) dmg *= s.eliteDamage;
  if (e.kind === 'boto' && e.state === 'tired') dmg *= ENEMY.boto.mergulho.tiredMult;
  if (e.kind === 'iara' && e.state === 'exposed') dmg *= ENEMY.iara.canto.exposedMult;
  if (e.kind === 'iara' && e.state === 'downed') dmg *= ENEMY.iara.posture.downedMult;
  if (e.kind === 'queixada' && e.state === 'stunned') dmg *= ENEMY.queixada.stunDamageMult;
  if (e.kind === 'caipora' && e.state === 'tired') dmg *= ENEMY.caipora.tiredDamageMult;
  if (e.kind === 'curupira' && e.state === 'exposed') dmg *= C.investida.exposedMult;
  if (e.kind === 'curupira' && e.state === 'downed') dmg *= C.posture.downedMult;
  if (s.uniques.coroaDeCipo && (e.rootT > 0 || e.slowT > 0)) dmg *= 1 + PLAYER.coroaBonus;

  let crit = forceCrit;
  if (!crit && (source === 'melee' || source === 'arrow' || source === 'roll')) {
    crit = rand(w) < s.critChance || (s.talents.execucao && e.hp / e.maxHp < PLAYER.execucaoBelow);
    if (crit) dmg *= s.critMult;
  } else if (!crit && source === 'spell') {
    crit = rand(w) < s.spellCrit;
    if (crit) dmg *= s.spellCritMult;
  } else if (crit) dmg *= s.critMult;

  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg;
  e.flash = 0.1; e.sinceHit = 0;

  if (crit && weapon) {
    if (s.critHaste) { if (p.dodgeCharges < s.dodgeCharges) p.dodgeTimer += 0.5; for (let i = 0; i < 3; i++) p.cds[i] = max0(p.cds[i] - 0.3); }
    if (s.uniques.denteDoBoto) wet(w, e);
  }
  if (weapon || source === 'spell') chargeSupremo(w, SUPREMO_NUM.perHit);
  const light = e.kind === 'sauva' || e.kind === 'cogumelo' || e.kind === 'piranha' || (e.kind === 'urutau' && e.state !== 'dash');
  if (source === 'melee' && light && !e.elite && !e.champion) {
    e.kx = Math.cos(ang) * 170; e.ky = Math.sin(ang) * 170;
    if ((e.kind === 'sauva' || e.kind === 'piranha') && e.state !== 'stagger' && e.state !== 'leap') { e.tele = null; setState(e, 'stagger'); }
  }
  if (e.kind === 'iara' && e.state !== 'downed') {
    const P = ENEMY.iara.posture;
    e.posture = Math.min(P.max, e.posture + (source === 'spell' ? P.spell : source === 'melee' || source === 'arrow' ? P.hit : 0));
  }
  if (e.kind === 'curupira') {
    const P = C.posture;
    if (e.state !== 'downed') e.posture = Math.min(P.max, e.posture + (source === 'spell' ? P.spell : source === 'melee' || source === 'arrow' ? P.hit : 0));
    if (e.state === 'volley' || e.pattern === 'assobio') {
      // acertar o verdadeiro desfaz as cópias
      for (const o of w.enemies) if (o.fake) o.hp = 0;
      if (e.state === 'volley' || e.state === 'cast') { e.tele = null; setState(e, 'stagger'); e.pattern = ''; }
    }
  }
  if ((source === 'melee' || source === 'arrow') && s.lifesteal > 0) healPlayer(w, dmg * s.lifesteal, true);
  if ((source === 'melee' || source === 'arrow') && e.hp > 0) {
    if (s.onHitPoison || (s.uniques.mandibulaDaRainha && rand(w) < PLAYER.mandibulaChance)) { e.poisonT = 3 * s.durationMult; e.poisonTick = Math.min(e.poisonTick > 0 ? e.poisonTick : 0.5, 0.5); }
    if (s.uniques.ferraoDeArraia && !isBoss(e) && rand(w) < 0.15) { e.rootT = Math.max(e.rootT, 1); e.tele = null; }
  }

  emit(w, { type: 'hit', x: e.x, y: e.y, value: dmg, crit, kind: source, armored, id: e.id });
  if (e.hp <= 0) {
    e.tele = null;
    w.kills++;
    if (s.manaOnKill) p.mana = Math.min(s.maxMana, p.mana + s.manaOnKill);
    if (s.manaOnElite && (e.elite || isBoss(e))) p.mana = s.maxMana;
    if (s.onKillExplode && source !== 'blast') w.zones.push({ id: w.nextId++, kind: 'pop', x: e.x, y: e.y, r: 105 * s.spellArea, t: 0, dur: 0.14, tick: 0, power: Math.max(e.maxHp * 0.3, s.weaponDamage * s.damageMult * 1.2) });
    if (s.talents.sedeDeBriga) { p.stacks = Math.min(PLAYER.sedeDeBriga.max, p.stacks + 1); p.stackT = PLAYER.sedeDeBriga.duration; emit(w, { type: 'stack', x: p.x, y: p.y, value: p.stacks }); }
    if (e.mods.includes('explosivo')) {
      addHazard(w, { kind: 'blast', tele: { shape: 'circle', x: e.x, y: e.y, r: MOD.explosivo.radius, t: 0, dur: MOD.explosivo.delay }, damage: MOD.explosivo.damage * e.dmg, slow: 0 });
    }
    emit(w, { type: 'kill', x: e.x, y: e.y, kind: e.kind, id: e.id });
  }
  return dmg;
}

/** Bônus multiplicativo de dano de arma vindo de efeitos temporários. */
export function weaponBonus(w: World): number {
  const p = w.player, s = w.stats;
  let m = 1 + p.stacks * PLAYER.sedeDeBriga.perStack;
  if (s.talents.sangueQuente && p.hp / s.maxHp < PLAYER.sangueQuente.below) m *= 1 + PLAYER.sangueQuente.bonus;
  return m;
}

export function attackSpeed(w: World): number {
  const p = w.player, s = w.stats;
  let v = s.attackSpeed;
  if (p.presaT > 0) v += PLAYER.presa.bonus;
  if (s.talents.sangueQuente && p.hp / s.maxHp < PLAYER.sangueQuente.below) v *= 1 + PLAYER.sangueQuente.bonus;
  return v;
}

export interface HurtOpts {
  src?: Enemy | null; unblockable?: boolean; melee?: boolean; nature?: boolean; water?: boolean;
  /** Dano contínuo (nuvem de esporos): ignora a invulnerabilidade de quem acabou de apanhar e não interrompe o herói. */
  soft?: boolean;
}

/** Tenta ferir o herói. Devolve true se o dano entrou. */
export function hurtPlayer(w: World, base: number, fromX: number, fromY: number, knock: number, o: HurtOpts = {}): boolean {
  const p = w.player, s = w.stats, src = o.src ?? null;
  if (p.state === 'dead' || w.phase === 'won' || w.phase === 'lost') return false;
  if (p.iframes > 0) {
    if (p.state === 'dodge' && p.stateT <= s.perfectWindow && !p.perfectUsed) {
      p.perfectUsed = true; p.perfectT = PLAYER.perfectDuration;
      p.dodgeCharges = Math.min(s.dodgeCharges, p.dodgeCharges + 1); p.dodgeTimer = 0;
      if (s.uniques.presaDaCaipora) p.presaT = PLAYER.presa.duration;
      if (src && (src.kind === 'curupira' || src.kind === 'iara') && src.state !== 'downed') src.posture = Math.min(ENEMY[src.kind].posture.max, src.posture + ENEMY[src.kind].posture.perfect);
      w.perfects++;
      emit(w, { type: 'perfect', x: p.x, y: p.y });
    }
    return false;
  }
  if (p.hurtInv > 0 && !o.soft) return false;
  if (p.shield && !o.soft) {
    p.shield = false; p.hurtInv = PLAYER.hurtInvuln;
    emit(w, { type: 'shield', x: p.x, y: p.y });
    return false;
  }

  let dmg = base * w.taken;
  if (p.state === 'block' && !o.unblockable) {
    if (p.blockT <= PLAYER.shield.parryWindow) {
      if (src) {
        if (src.kind === 'curupira' || src.kind === 'iara') { if (src.state !== 'downed') src.posture = Math.min(ENEMY[src.kind].posture.max, src.posture + ENEMY[src.kind].posture.parry); }
        else if (o.melee && !isBoss(src)) src.stunT = PLAYER.shield.parryStun;
      }
      if (s.talents.contragolpe) p.contraT = 4;
      p.hurtInv = 0.25;
      emit(w, { type: 'parry', x: p.x, y: p.y });
      return false;
    }
    dmg *= 1 - PLAYER.shield.blockReduce;
    emit(w, { type: 'block', x: p.x, y: p.y });
  }
  dmg *= (1 - damageReduction(s.defense, w.cfg.level)) * s.damageTaken;
  if (o.nature) dmg *= 1 - s.res.natureza;
  if (o.water) dmg *= 1 - s.res.agua;
  if (p.cascaT > 0) {
    if (src && src.hp > 0) damageEnemy(w, src, dmg * 0.5, 'reflect', 0);
    dmg *= 1 - 0.45;
  }
  if (s.thorns > 0 && o.melee && src && src.hp > 0) damageEnemy(w, src, dmg * s.thorns, 'reflect', 0);
  dmg = Math.max(1, Math.round(dmg));

  if (dmg >= p.hp && s.talents.cascaDeJabuti && !p.jabutiUsed) {
    p.jabutiUsed = true; p.hp = 1; p.iframes = PLAYER.jabutiInvuln; p.hurtInv = PLAYER.jabutiInvuln;
    emit(w, { type: 'jabuti', x: p.x, y: p.y });
    return true;
  }
  p.hp -= dmg;
  if (!o.soft) { p.hurtInv = PLAYER.hurtInvuln; w.hitsTaken++; chargeSupremo(w, SUPREMO_NUM.perHurt); }
  if (src && src.mods.includes('vampirico') && src.hp > 0) src.hp = Math.min(src.maxHp, src.hp + src.maxHp * MOD.vampirico.heal);
  const dx = p.x - fromX, dy = p.y - fromY, d = Math.hypot(dx, dy) || 1;
  p.kx = (dx / d) * knock; p.ky = (dy / d) * knock;
  emit(w, { type: 'hurt', x: p.x, y: p.y, value: dmg, kind: o.soft ? 'soft' : undefined });
  if (p.hp <= 0) {
    p.hp = 0; p.state = 'dead'; p.stateT = 0; p.charge = 0;
    w.phase = 'dead'; w.deadT = 0; w.deaths++;
    emit(w, { type: 'death', x: p.x, y: p.y });
  } else if (p.state !== 'block' && !o.soft) {
    p.state = 'hurt'; p.stateT = 0; p.charge = 0;
  }
  return true;
}

export function hurtPet(w: World, base: number): void {
  const pet = w.pet;
  if (!pet || pet.state === 'down') return;
  let dmg = base * w.taken * (pet.tauntT > 0 ? 0.5 : 1);
  dmg = Math.max(1, Math.round(dmg));
  pet.hp -= dmg; pet.flash = 0.12;
  emit(w, { type: 'petHurt', x: pet.x, y: pet.y, value: dmg });
  if (pet.hp <= 0) { pet.hp = 0; pet.state = 'down'; pet.stateT = 0; pet.tauntT = 0; emit(w, { type: 'petDown', x: pet.x, y: pet.y }); }
}

/** Golpe em área de um inimigo: fere o herói e o companheiro que estiverem dentro da marca. */
export function strike(w: World, t: Telegraph, base: number, knock: number, o: HurtOpts = {}): boolean {
  const p = w.player, pet = w.pet;
  const cx = t.shape === 'circle' ? t.x : (t.x + t.x2) / 2, cy = t.shape === 'circle' ? t.y : (t.y + t.y2) / 2;
  let hit = false;
  if (inTele(t, p.x, p.y, PLAYER.radius * 0.4)) hit = hurtPlayer(w, base, cx, cy, knock, o);
  if (pet && pet.state !== 'down' && inTele(t, pet.x, pet.y, 8)) hurtPet(w, base);
  return hit;
}
