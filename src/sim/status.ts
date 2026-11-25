/**
 * Efeitos de elemento nos inimigos e as reações entre elementos (docs/gdd/03).
 * Um elemento em quem já tem o efeito de outro consome esse efeito e causa a reação; senão, aplica o seu.
 */
import { BROTAR, ELEMENTS, REACTION_NUM, STATUS, reactionOf, type ElementId, type ReactionId } from '../data/content';
import { addHazard, damageEnemy, emit, healPlayer, isBoss, max0, rand, setState, spellScale } from './core';
import type { Enemy, World } from './types';

const FIELD: Record<ElementId, keyof Enemy> = {
  natureza: 'poisonT', agua: 'wetT', tempestade: 'chargeT', fogo: 'burnT', terra: 'crackT', sombra: 'curseT', encanto: 'confuseT',
};
const ORDER: ElementId[] = ['agua', 'natureza', 'tempestade', 'fogo', 'terra', 'sombra', 'encanto'];

function setStatus(w: World, e: Enemy, el: ElementId): void {
  const d = w.stats.statusDuration * w.stats.durationMult;
  switch (el) {
    case 'natureza': e.poisonT = Math.max(e.poisonT, STATUS.poison * d); if (e.poisonTick <= 0) e.poisonTick = 0.5; break;
    case 'agua': e.wetT = Math.max(e.wetT, STATUS.wet * d); break;
    case 'tempestade': e.chargeT = Math.max(e.chargeT, STATUS.charge * d); break;
    case 'fogo': e.burnT = Math.max(e.burnT, STATUS.burn * d); if (e.burnTick <= 0) e.burnTick = STATUS.burnTick; break;
    case 'terra': e.crackT = Math.max(e.crackT, STATUS.crack * d); break;
    case 'sombra': e.curseT = Math.max(e.curseT, STATUS.curse * d); if (!e.curseBonus) e.curseBonus = STATUS.curseBonus; break;
    case 'encanto': e.confuseT = Math.max(e.confuseT, (isBoss(e) ? 1.2 : STATUS.confuse) * d); break;
  }
}

/** Aplica um elemento a um inimigo: reação, se houver, ou o efeito do elemento. Devolve a reação causada. */
export function applyElement(w: World, e: Enemy, el: ElementId): ReactionId | null {
  if (e.hp <= 0 || e.fake || e.illusion) return null;
  for (const other of ORDER) {
    if (other === el || (e[FIELD[other]] as number) <= 0) continue;
    const r = reactionOf(other, el);
    if (!r) continue;
    (e[FIELD[other]] as number) = 0;
    if (other === 'sombra') e.curseBonus = 0;
    w.reacting = [other, el];
    react(w, e, r.id);
    w.reacting = null;
    return r.id;
  }
  setStatus(w, e, el);
  return null;
}

function reactionPower(w: World): number {
  const s = w.stats;
  return spellScale(w) * s.reactionMult * (1 + s.passives.reactionBonus);
}

function around(w: World, x: number, y: number, r: number, fn: (o: Enemy) => void): void {
  for (const o of w.enemies) if (o.hp > 0 && !o.hidden && !o.fake && o.state !== 'spawn' && Math.hypot(o.x - x, o.y - y) < r + o.radius * 0.5) fn(o);
}

function react(w: World, e: Enemy, id: ReactionId): void {
  const pw = reactionPower(w), s = w.stats, p = w.player;
  emit(w, { type: 'reaction', x: e.x, y: e.y, kind: id });
  if (s.passives.reactionBonus) for (let i = 0; i < 3; i++) p.cds[i] = max0(p.cds[i] - 1);
  switch (id) {
    case 'brotar': {
      const dmg = BROTAR.damage * pw, r = BROTAR.radius * s.spellArea;
      emit(w, { type: 'brotar', x: e.x, y: e.y, value: r });
      around(w, e.x, e.y, r, (o) => {
        damageEnemy(w, o, dmg, 'reaction', Math.atan2(o.y - e.y, o.x - e.x));
        if (o.hp > 0) { if (isBoss(o)) o.slowT = Math.max(o.slowT, BROTAR.root); else { o.rootT = Math.max(o.rootT, BROTAR.root * s.durationMult); o.tele = null; } }
      });
      healPlayer(w, s.maxHp * BROTAR.heal);
      break;
    }
    case 'eletrocutar': {
      const N = REACTION_NUM.eletrocutar;
      const wet = w.enemies.filter((o) => o.hp > 0 && !o.hidden && !o.fake && (o === e || o.wetT > 0));
      for (const o of wet) { o.wetT = 0; damageEnemy(w, o, N.damage * pw, 'reaction', 0); if (o.hp > 0 && !isBoss(o)) o.stunT = Math.max(o.stunT, 0.6); emit(w, { type: 'spark', x: e.x, y: e.y, x2: o.x, y2: o.y }); }
      break;
    }
    case 'queimada': {
      const N = REACTION_NUM.queimada;
      around(w, e.x, e.y, N.radius * s.spellArea, (o) => { damageEnemy(w, o, N.damage * pw, 'reaction', Math.atan2(o.y - e.y, o.x - e.x)); if (o.hp > 0) setStatus(w, o, 'fogo'); });
      for (const o of w.enemies) if (o.hp > 0 && o.poisonT > 0) { o.poisonT = 0; setStatus(w, o, 'fogo'); }
      emit(w, { type: 'pop', x: e.x, y: e.y, value: N.radius * s.spellArea, kind: 'fogo' });
      break;
    }
    case 'lama': {
      if (isBoss(e)) e.slowT = Math.max(e.slowT, 2.5); else { e.rootT = Math.max(e.rootT, REACTION_NUM.lama.root * s.durationMult); e.tele = null; }
      break;
    }
    case 'vapor': {
      const N = REACTION_NUM.vapor;
      w.zones.push({ id: w.nextId++, kind: 'vapor', x: e.x, y: e.y, r: N.radius * s.spellArea, t: 0, dur: N.blind, tick: 0.5, power: s.bless.vaporBurn ? N.burn * pw : 0 });
      break;
    }
    case 'redemoinhoFogo': {
      const N = REACTION_NUM.redemoinhoFogo;
      w.zones.push({ id: w.nextId++, kind: 'redemoinho', x: e.x, y: e.y, r: N.radius * s.spellArea, t: 0, dur: 2, tick: 0, power: N.damage * pw * 0.25, x2: 1 });
      around(w, e.x, e.y, N.radius * s.spellArea, (o) => { damageEnemy(w, o, N.damage * pw, 'reaction', 0); if (o.hp > 0) setStatus(w, o, 'fogo'); });
      break;
    }
    case 'estilhaco': {
      const N = REACTION_NUM.estilhaco;
      for (let i = 0; i < N.shards; i++) {
        const a = (i / N.shards) * Math.PI * 2;
        w.projectiles.push({ id: w.nextId++, kind: 'spell', spell: 'pedrada', element: null, x: e.x, y: e.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, dist: 0, range: 300, damage: N.damage * pw, pierce: true, hit: [e.id], charged: false, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, dur: 0, tele: null, owner: 0, tex: 'p_pedra' });
      }
      break;
    }
    case 'pesadelo': {
      const N = REACTION_NUM.pesadelo;
      around(w, e.x, e.y, N.radius * s.spellArea, (o) => { if (!isBoss(o)) { o.charmT = Math.max(o.charmT, N.charm * s.durationMult); o.tele = null; } else o.confuseT = Math.max(o.confuseT, 1.5); });
      break;
    }
    case 'fogoFatuo': {
      damageEnemy(w, e, REACTION_NUM.fogoFatuo.damage * pw, 'reaction', 0);
      if (e.hp > 0) { e.wisp = true; e.curseT = Math.max(e.curseT, 6); e.curseBonus = STATUS.curseBonus; setStatus(w, e, 'fogo'); }
      break;
    }
    case 'estatua': {
      const N = REACTION_NUM.estatua;
      if (isBoss(e)) e.slowT = Math.max(e.slowT, N.stun); else { e.stunT = Math.max(e.stunT, N.stun * s.durationMult); e.tele = null; }
      e.stone = true;
      break;
    }
  }
}

/** Golpe recebido: acorda quem dorme, e quem está Carregado solta faíscas nos vizinhos. */
export function wakeAndCharge(w: World, e: Enemy, source: string): void {
  if (e.sleepT > 0) e.sleepT = 0;
  if (e.chargeT > 0 && source !== 'spark' && source !== 'reaction' && source !== 'poison' && source !== 'burn') {
    e.chargeT = 0;
    const pw = spellScale(w) * STATUS.chargeSpark * 20;
    let n = 0;
    for (const o of w.enemies) {
      if (o === e || o.hp <= 0 || o.hidden || o.fake || n >= 3 || Math.hypot(o.x - e.x, o.y - e.y) > STATUS.chargeRange) continue;
      n++;
      emit(w, { type: 'spark', x: e.x, y: e.y, x2: o.x, y2: o.y });
      damageEnemy(w, o, pw, 'spark', 0);
    }
  }
}

/** Passa o tempo dos efeitos do inimigo. Devolve true se o inimigo caiu (queimadura). */
export function tickStatuses(w: World, e: Enemy, dt: number): boolean {
  e.chargeT = max0(e.chargeT - dt); e.crackT = max0(e.crackT - dt); e.confuseT = max0(e.confuseT - dt);
  e.charmT = max0(e.charmT - dt); e.blindT = max0(e.blindT - dt); e.fearT = max0(e.fearT - dt); e.silenceT = max0(e.silenceT - dt);
  e.frogT = max0(e.frogT - dt); e.sleepT = max0(e.sleepT - dt);
  if (e.curseT > 0) { e.curseT -= dt; if (e.curseT <= 0) { e.curseT = 0; e.curseBonus = 0; } }
  if (e.burnT > 0) {
    e.burnT -= dt; e.burnTick -= dt;
    if (e.burnTick <= 0) {
      e.burnTick += STATUS.burnTick;
      damageEnemy(w, e, STATUS.burnDamage * spellScale(w), 'burn', 0, false, 'fogo');
      if (e.hp <= 0) return true;
    }
  }
  return false;
}

/** O inimigo está impedido de agir (dormindo, atordoado, preso, enfeitiçado sem alvo, sapo). */
export function disabled(e: Enemy): boolean {
  return e.sleepT > 0 || e.stunT > 0 || e.rootT > 0;
}

/** Medo e sapo: o inimigo foge do herói ou pula à toa, sem atacar. Devolve true se tratou o movimento. */
export function wander(w: World, e: Enemy, dt: number, speed: number): boolean {
  if (e.fearT <= 0 && e.frogT <= 0 && e.blindT <= 0) return false;
  const p = w.player;
  e.tele = null;
  if (e.fearT > 0) {
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * speed * dt; e.y += (dy / d) * speed * dt; e.moving = true;
    if (Math.abs(dx) > 4) e.facing = dx >= 0 ? 1 : -1;
  } else {
    if (e.stateT > 0.6 || e.state !== 'roam') { setState(e, 'roam'); const a = rand(w) * Math.PI * 2; e.dirX = Math.cos(a); e.dirY = Math.sin(a); }
    const v = speed * (e.frogT > 0 ? 0.4 : 0.6);
    e.x += e.dirX * v * dt; e.y += e.dirY * v * dt; e.moving = true;
  }
  return true;
}

export { addHazard, ELEMENTS };
