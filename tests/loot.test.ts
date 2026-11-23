import { describe, expect, it } from 'vitest';
import { TICK } from '../src/data/balance';
import { BLESSINGS } from '../src/data/content';
import { BUFFS, CHESTS, FLUSH_BONUS } from '../src/data/loot';
import { stageGold } from '../src/data/progression';
import { STAGES, type RoomDef } from '../src/data/stages';
import { towerRun } from '../src/data/tower';
import { newProfile, type Profile } from '../src/meta/profile';
import { applyOutcome } from '../src/meta/rewards';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { damageEnemy } from '../src/sim/core';
import { addBuff, dropChest, lootHit } from '../src/sim/loot';
import { chooseOffer, createWorld, exitZone, fingerprint, spawnEnemy, step, type Input, type SimEvent, type World } from '../src/sim/world';
import { HUMAN, PERFECT, idleAt, makeBot, playStage } from './bot';

const EMPTY: RoomDef[] = [{ type: 'combat', waves: [[]], bg: 0 }];

function arena(p: Profile = referenceProfile(10), level = 10, rooms: RoomDef[] = EMPTY, seed = 7): World {
  const w = createWorld({ stageId: 't', level, rooms, stats: deriveStats(p), seed });
  w.waveTimer = -1e9;
  w.pots = []; w.challenge = null;
  return w;
}
const run = (w: World, s: number, inp: (w: World) => Input = idleAt) => { for (let i = 0; i < Math.round(s / TICK); i++) step(w, inp(w), TICK); };
const toward = (x: number, y: number) => (w: World): Input => ({ ...idleAt(w), mx: Math.abs(x - w.player.x) > 4 ? Math.sign(x - w.player.x) : 0, my: Math.abs(y - w.player.y) > 4 ? Math.sign(y - w.player.y) : 0 });

/** Mata `n` monstros comuns, um de cada vez, e devolve os baús que caíram. */
function killMany(w: World, n: number): string[] {
  const tiers: string[] = [];
  for (let i = 0; i < n; i++) {
    const e = spawnEnemy(w, { kind: 'sauva', x: 700, y: 400 }, { quiet: true });
    e.state = 'chase';
    damageEnemy(w, e, 1e6, 'spell', 0);
    for (const ev of w.events) if (ev.type === 'chest') tiers.push(ev.kind!);
    w.events.length = 0;
    w.enemies = [];
    w.chests = [];
  }
  return tiers;
}

describe('baús', () => {
  it('caem com a mesma semente sempre iguais, e a sorte dos baús não mexe na do combate', () => {
    const a = killMany(arena(), 400), b = killMany(arena(), 400);
    expect(a).toEqual(b);
    /* monstro comum: poucos, quase todos de madeira ou bronze */
    expect(a.length).toBeGreaterThan(3);
    expect(a.length).toBeLessThan(30);
    expect(a.every((t) => t === 'madeira' || t === 'bronze')).toBe(true);
    /* outra semente, outros baús */
    expect(killMany(arena(undefined, 10, EMPTY, 99), 400)).not.toEqual(a);
    /* a semente do combate só anda com o combate */
    const w1 = arena(), w2 = arena();
    killMany(w1, 50); killMany(w2, 50);
    expect(w1.rng).toBe(w2.rng);
  });

  it('uma fase jogada duas vezes com a mesma semente dá os mesmos achados', () => {
    const p = referenceProfile(5);
    const a = playStage(4, p, 77, HUMAN), b = playStage(4, p, 77, HUMAN);
    expect(fingerprint(a)).toBe(fingerprint(b));
    expect(a.loot.gold).toBe(b.loot.gold);
    expect(a.loot.chests).toBe(b.loot.chests);
  });

  it('chefão da sala final sempre deixa baú encantado, que abre sozinho na vitória', () => {
    const rooms: RoomDef[] = [{ type: 'boss', waves: [[{ kind: 'caipora', x: 900, y: 400, elite: true }]], bg: 0 }];
    const w = createWorld({ stageId: 't', level: 11, rooms, stats: deriveStats(referenceProfile(11)), seed: 3 });
    run(w, 1.5);
    const boss = w.enemies.find((e) => e.kind === 'caipora')!;
    boss.state = 'recover';
    damageEnemy(w, boss, 1e9, 'spell', 0);
    const events: SimEvent[] = [...w.events];
    run(w, 0.2);
    events.push(...w.events);
    expect(events.find((e) => e.type === 'chest')?.kind).toBe('encantado');
    expect(w.phase).toBe('won');
    expect(events.some((e) => e.type === 'chestOpen' && e.text === 'auto')).toBe(true);
    expect(w.loot.chests).toBe(1);
    expect(w.loot.gold).toBeGreaterThanOrEqual(stageGold(11) * CHESTS.encantado.gold * (1 + FLUSH_BONUS.oferenda) - 1);
  });

  it('abrir o baú solta moedas que correm para o herói e vão para a bolsa', () => {
    const w = arena();
    const p = w.player, gold = Math.round(stageGold(w.level) * CHESTS.madeira.gold);
    const c = dropChest(w, 'madeira', p.x + 30, p.y);
    c.x = p.x + 30; c.y = p.y;
    run(w, 0.4);
    expect(c.open).toBe(-1);
    run(w, 0.3);
    expect(c.open).toBeGreaterThanOrEqual(0);
    expect(w.loot.chests).toBe(1);
    expect(w.pickups.filter((k) => k.kind === 'moeda').length).toBeGreaterThan(0);
    run(w, 3);
    expect(w.pickups.filter((k) => k.kind === 'moeda')).toHaveLength(0);
    expect(w.loot.gold).toBeGreaterThanOrEqual(gold - 1);
    expect(w.chests).toHaveLength(0);
  });

  it('o ouro achado entra no resultado, mesmo na derrota', () => {
    const p = newProfile(3), before = p.gold;
    const r = applyOutcome(p, { stageId: '1-1', won: false, time: 30, deaths: 2, roomsCleared: 0, kills: 3, perfects: 0, hitsTaken: 9, foundGold: 40, chests: 2 });
    expect(r.found?.chests).toBe(2);
    expect(r.found!.gold).toBeGreaterThanOrEqual(40);
    expect(r.gold).toBeGreaterThanOrEqual(r.found!.gold);
    expect(p.gold - before).toBe(r.gold);
    const t = applyOutcome(newProfile(3), { stageId: 'torre-1', won: false, time: 30, deaths: 2, roomsCleared: 0, kills: 3, perfects: 0, hitsTaken: 9, foundGold: 40, chests: 1 });
    expect(t.found!.gold).toBeGreaterThanOrEqual(40);
    expect(t.gold).toBe(t.found!.gold);
  });

  it('baú esquecido abre sozinho ao trocar de sala; o prêmio vira ouro', () => {
    const rooms: RoomDef[] = [{ type: 'combat', waves: [[{ kind: 'sauva', x: 700, y: 400 }]], bg: 0 }, { type: 'combat', waves: [[{ kind: 'sauva', x: 700, y: 400 }]], bg: 1 }];
    const w = createWorld({ stageId: 't', level: 5, rooms, stats: deriveStats(referenceProfile(5)), seed: 7 });
    run(w, 2);
    for (const e of w.enemies) e.hp = 0;
    run(w, 0.1);
    expect(w.phase).toBe('cleared');
    const c = dropChest(w, 'bronze', 300, 600);
    c.x = 300; c.y = 600;
    const z = exitZone(w);
    run(w, 8, (w) => ({ ...idleAt(w), mx: w.player.x < z.x + 20 ? 1 : 0, my: Math.abs(z.y - w.player.y) > 8 ? Math.sign(z.y - w.player.y) : 0 }));
    expect(w.room).toBe(1);
    expect(w.chests).toHaveLength(0);
    expect(w.loot.chests).toBe(1);
    expect(w.loot.gold).toBeGreaterThanOrEqual(stageGold(5) * CHESTS.bronze.gold - 1);
  });
});

describe('efeitos de baú', () => {
  it('Fúria da Onça aumenta o dano e acaba depois do tempo de luta', () => {
    const hit = (buff: boolean) => {
      const w = arena();
      const e = spawnEnemy(w, { kind: 'tronco', x: 800, y: 400, elite: true });
      e.state = 'recover';
      if (buff) addBuff(w, 'furia');
      return { w, dmg: damageEnemy(w, e, 1000, 'spell', 0) };
    };
    const a = hit(false).dmg, { w, dmg: b } = hit(true);
    expect(b / a).toBeCloseTo(1 + BUFFS.furia.power, 1);
    /* o relógio só anda com luta: sala vazia em luta conta */
    w.enemies = [];
    run(w, BUFFS.furia.duration - 1);
    expect(w.buffs.some((x) => x.id === 'furia')).toBe(true);
    run(w, 1.2);
    expect(w.buffs.some((x) => x.id === 'furia')).toBe(false);
  });

  it('o tempo dos efeitos para enquanto a sala está limpa', () => {
    const w = arena();
    addBuff(w, 'vento');
    w.phase = 'cleared';
    run(w, BUFFS.vento.duration + 5);
    expect(w.buffs).toHaveLength(1);
  });

  it('Pés de Vento deixa o herói mais rápido', () => {
    const dist = (buff: boolean) => {
      const w = arena();
      if (buff) addBuff(w, 'vento');
      const x0 = w.player.x;
      run(w, 0.5, (w) => ({ ...idleAt(w), mx: 1 }));
      return w.player.x - x0;
    };
    expect(dist(true) / dist(false)).toBeCloseTo(1 + BUFFS.vento.power, 1);
  });

  it('Carapaça de Jabuti absorve o dano até quebrar', () => {
    const w = arena();
    const b = addBuff(w, 'jabuti'), cap = b.value, hp = w.player.hp;
    expect(cap).toBe(Math.round(w.stats.maxHp * BUFFS.jabuti.power));
    spawnEnemy(w, { kind: 'sauva', x: w.player.x + 40, y: w.player.y });
    for (let i = 0; i < 600 && w.hitsTaken === 0; i++) step(w, idleAt(w), TICK);
    expect(w.hitsTaken).toBe(1);
    expect(b.value).toBeLessThan(cap);
    expect(w.player.hp).toBe(hp);
    /* gasta a carapaça toda: o golpe seguinte já fere */
    b.value = 1;
    const hits = w.hitsTaken;
    for (let i = 0; i < 600 && w.hitsTaken === hits; i++) step(w, idleAt(w), TICK);
    expect(w.player.hp).toBeLessThan(hp);
    run(w, 0.1);
    expect(w.buffs.some((x) => x.id === 'jabuti')).toBe(false);
  });

  it('Chuva de Mana barateia os feitiços e o Golpe Elemental sorteia um elemento', () => {
    const w = arena();
    const m = addBuff(w, 'mana'), el = addBuff(w, 'elemento');
    expect(m.id).toBe('mana');
    expect(el.el).toBeDefined();
    expect(w.buffs.map((x) => x.id).sort()).toEqual(['elemento', 'mana']);
    /* pegar de novo renova o tempo, sem duplicar */
    run(w, 3);
    addBuff(w, 'mana');
    expect(w.buffs.filter((x) => x.id === 'mana')).toHaveLength(1);
    expect(w.buffs.find((x) => x.id === 'mana')!.t).toBe(0);
  });
});

describe('oferenda do baú', () => {
  it('o baú encantado oferece bênçãos; a luta espera a escolha, e a escolhida vale até o fim da fase', () => {
    const prof = referenceProfile(10), w = arena(prof);
    const p = w.player, c = dropChest(w, 'encantado', p.x, p.y);
    c.x = p.x + 10; c.y = p.y;
    run(w, 0.6);
    expect(w.offer).not.toBeNull();
    const offer = w.offer!;
    expect(offer).toHaveLength(CHESTS.encantado.offer);
    expect(offer.every((id) => BLESSINGS[id].tier <= CHESTS.encantado.offerTier && id !== 'cura')).toBe(true);
    /* congelada: o tempo não anda */
    const t = w.time;
    run(w, 1);
    expect(w.time).toBe(t);
    expect(chooseOffer(w, 5, (b) => deriveStats(prof, b))).toBe(false);
    expect(chooseOffer(w, 1, (b) => deriveStats(prof, b))).toBe(true);
    expect(w.blessings).toEqual([offer[1]]);
    expect(w.offer).toBeNull();
    run(w, 1);
    expect(w.time).toBeGreaterThan(t);
  });
});

describe('potes, Mãe-do-Ouro e desafio', () => {
  it('o pote quebra com um golpe e solta moedas', () => {
    const w = arena();
    w.pots = [{ id: 999, x: w.player.x + 60, y: w.player.y }];
    run(w, 0.5, (w) => ({ ...idleAt(w), aimX: w.player.x + 60, aimY: w.player.y, attackPressed: true }));
    expect(w.pots).toHaveLength(0);
    run(w, 3);
    expect(w.loot.gold).toBeGreaterThan(0);
  });

  it('a Mãe-do-Ouro foge; quem acerta quatro vezes ganha um baú dourado', () => {
    const w = arena();
    w.wisp = { id: 500, x: 900, y: 400, vx: 0, vy: 0, t: 0, dur: 9, hits: 0, need: 4, cd: 0, flash: 0 };
    const x0 = w.wisp.x;
    w.player.x = 800; w.player.y = 400;
    run(w, 0.5);
    expect(w.wisp!.x).toBeGreaterThan(x0);
    for (let i = 0; i < 4; i++) { w.wisp!.cd = 0; lootHit(w, () => true); }
    expect(w.wisp).toBeNull();
    expect(w.chests.some((c) => c.tier === 'dourado')).toBe(true);
    /* sem ninguém para pegar, ela some quando o tempo acaba */
    w.wisp = { id: 501, x: 900, y: 400, vx: 0, vy: 0, t: 0, dur: 2, hits: 0, need: 4, cd: 0, flash: 0 };
    run(w, 2.1);
    expect(w.wisp).toBeNull();
  });

  it('desafio intocado: vencer a sala sem passar do limite de golpes dá baú dourado; passar perde', () => {
    const rooms: RoomDef[] = [{ type: 'combat', waves: [[{ kind: 'sauva', x: 900, y: 400 }]], bg: 0 }];
    const make = () => {
      const w = createWorld({ stageId: 't', level: 5, rooms: [...rooms, ...rooms], stats: deriveStats(referenceProfile(5)), seed: 7 });
      w.challenge = { kind: 'intocado', limit: 2, hits0: w.hitsTaken, t0: w.time, state: 'ativo', x: 640, y: 190 };
      return w;
    };
    const ok = make();
    run(ok, 2);
    for (const e of ok.enemies) e.hp = 0;
    run(ok, 0.1);
    expect(ok.challenge!.state).toBe('vencido');
    expect(ok.chests.some((c) => c.tier === 'dourado')).toBe(true);
    const bad = make();
    bad.hitsTaken += 3;
    run(bad, 0.2);
    expect(bad.challenge!.state).toBe('perdido');
  });

  it('potes, desafios e a Mãe-do-Ouro aparecem de vez em quando, e nunca há desafio na primeira sala', () => {
    let pots = 0;
    const seen: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      const s = STAGES[i], prof = referenceProfile(s.level), w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(prof), seed: 11 + i });
      pots += w.pots.length;
      expect(w.challenge).toBeNull();
      const bot = makeBot(prof, PERFECT);
      for (let k = 0; k < 60 * 400 && w.phase !== 'won' && w.phase !== 'lost'; k++) {
        step(w, bot(w), TICK);
        for (const e of w.events) if ((e.type === 'challenge' || e.type === 'wisp') && e.kind) seen[e.type + ':' + e.kind] = (seen[e.type + ':' + e.kind] ?? 0) + 1;
        w.events.length = 0;
      }
      expect(w.loot.challenges).toBeLessThanOrEqual(1);
      expect(w.loot.wisps).toBeLessThanOrEqual(1);
    }
    expect(pots).toBeGreaterThan(10);
    expect(seen['challenge:start']).toBeGreaterThan(2);
    expect(seen['wisp:appear']).toBeGreaterThan(0);
  }, 60000);
});

describe('fases com achados', () => {
  it('o jogador automático termina fases e a Torre com baús, moedas e oferendas, sem números quebrados', () => {
    let chests = 0;
    for (const i of [0, 13, 30, 50, 70, 90]) {
      const s = STAGES[i], w = playStage(i, referenceProfile(s.level), 400 + i, PERFECT);
      expect(w.phase === 'won' || w.phase === 'lost', s.id).toBe(true);
      expect(Number.isFinite(w.loot.gold) && w.loot.gold >= 0).toBe(true);
      expect(w.chests).toHaveLength(0);
      chests += w.loot.chests;
    }
    expect(chests).toBeGreaterThan(3);
    const run1 = towerRun(1), prof = referenceProfile(10);
    const w = createWorld({ stageId: run1.id, level: run1.level, rooms: run1.rooms, stats: deriveStats(prof), seed: 5 });
    const bot = makeBot(prof, PERFECT);
    for (let i = 0; i < 60 * 600 && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w), TICK); w.events.length = 0; }
    expect(w.phase === 'won' || w.phase === 'lost').toBe(true);
    expect(w.loot.gold).toBeGreaterThan(0);
  }, 60000);

  it('o herói busca o baú com a sala limpa', () => {
    const w = arena();
    w.phase = 'cleared';
    const c = dropChest(w, 'madeira', 500, 300);
    c.x = 500; c.y = 300;
    run(w, 4, toward(500, 300));
    expect(c.open).toBeGreaterThanOrEqual(0);
  });
});
