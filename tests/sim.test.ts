import { describe, expect, it } from 'vitest';
import { ENEMY, PLAYER, TICK, type SpawnDef } from '../src/data/balance';
import { makeItem } from '../src/data/items';
import { goldMultiplier, levelCombatModifiers, stageLevel, xpMultiplier, xpNeeded } from '../src/data/progression';
import { makeRng } from '../src/data/rng';
import { STAGES, type RoomDef } from '../src/data/stages';
import { newProfile, type Profile } from '../src/meta/profile';
import { damageReduction, deriveStats } from '../src/meta/stats';
import { chooseBlessing, createWorld, exitZone, fingerprint, NO_INPUT, spawnEnemy, step, type Input, type World } from '../src/sim/world';

const idleAt = (w: World): Input => ({ ...NO_INPUT, spell: [false, false, false], aimX: w.player.x + 100, aimY: w.player.y });

function run(w: World, seconds: number, input: (w: World, tick: number) => Input = idleAt): void {
  const n = Math.round(seconds / TICK);
  for (let i = 0; i < n; i++) step(w, input(w, i), TICK);
}

/** Mundo de uma sala sem ondas automáticas, para testar um monstro de cada vez. */
function arena(profile: Profile = newProfile(7), level = 1, rooms?: RoomDef[]): World {
  const w = createWorld({ stageId: 'teste', level, rooms: rooms ?? [{ type: 'combat', waves: [[]], bg: 0 }], stats: deriveStats(profile), seed: 7 });
  if (!rooms) w.waveTimer = -1e9;
  return w;
}
function put(w: World, def: SpawnDef) {
  return spawnEnemy(w, def);
}

/** Personagem de referência para o nível: pontos em Força e Vitalidade, itens Incomuns do nível. */
function refProfile(level: number, bow = false): Profile {
  const p = newProfile(11), rng = makeRng(level * 13 + 5);
  p.level = level;
  const pts = (level - 1) * 3;
  if (bow) { p.attrs.agilidade = Math.ceil(pts / 2); p.attrs.vitalidade = Math.floor(pts / 2); } else { p.attrs.forca = Math.ceil(pts / 2); p.attrs.vitalidade = Math.floor(pts / 2); }
  const gear: [keyof Profile['equipped'], Parameters<typeof makeItem>[4]][] = [['arma', bow ? 'arco' : 'facao'], ['mao', bow ? 'aljava' : 'escudo'], ['cabeca', 'chapeu'], ['peito', 'gibao'], ['maos', 'luvas'], ['pes', 'alpercatas']];
  for (const [slot, type] of gear) { const it = makeItem(p.nextItemId++, rng, level, level > 1 ? 1 : 0, type); it.plus = Math.min(4, Math.floor(level / 2)); p.equipped[slot] = it; }
  p.loadout = ['dardo', level >= 3 ? 'sementes' : null, level >= 4 ? 'cipo' : null];
  p.companions.capivara = { level: 1 }; p.companion = level >= 3 ? 'capivara' : null;
  return p;
}

describe('progressão (documento de design 01)', () => {
  it('reproduz a tabela de XP por nível', () => {
    expect(xpNeeded(1)).toBe(15);
    expect(xpNeeded(10)).toBe(250);
    expect(xpNeeded(30)).toBe(2085);
    expect(xpNeeded(59)).toBe(8580);
  });
  it('fases vão do nível 1 ao 60', () => {
    expect(stageLevel(0)).toBe(1);
    expect(stageLevel(95)).toBe(60);
    expect(stageLevel(36)).toBe(23);
  });
  it('reduz XP e ouro em fase fácil', () => {
    expect(xpMultiplier(10, 10)).toBe(1);
    expect(xpMultiplier(15, 10)).toBe(0.55);
    expect(xpMultiplier(30, 10)).toBe(0.1);
    expect(xpMultiplier(5, 10)).toBeCloseTo(1.3);
    expect(goldMultiplier(16, 10)).toBeCloseTo(0.8);
    expect(goldMultiplier(40, 10)).toBe(0.3);
  });
  it('estar abaixo pesa mais do que estar acima ajuda', () => {
    expect(levelCombatModifiers(5, 10)).toEqual({ dealt: 0.8, taken: 1.2 });
    expect(levelCombatModifiers(30, 10).dealt).toBeCloseTo(1.1);
  });
});

describe('combate', () => {
  it('a sequência de três golpes derruba uma saúva', () => {
    const w = arena();
    const e = put(w, { kind: 'sauva', x: w.player.x + 60, y: w.player.y });
    e.state = 'recover'; e.stateT = -10;
    run(w, 1.4, (w) => ({ ...idleAt(w), attackHeld: true }));
    expect(w.enemies.length).toBe(0);
    expect(w.kills).toBe(1);
  });

  it('a mordida fere descontando a defesa, e a esquiva no tempo certo evita', () => {
    const hit = arena();
    put(hit, { kind: 'sauva', x: hit.player.x + 50, y: hit.player.y });
    run(hit, ENEMY.spawnTime + ENEMY.sauva.windup + 0.2);
    const expected = Math.round(ENEMY.sauva.damage * (1 - damageReduction(hit.stats.defense, 1)));
    expect(hit.player.hp).toBe(hit.stats.maxHp - expected);

    const dodge = arena();
    put(dodge, { kind: 'sauva', x: dodge.player.x + 50, y: dodge.player.y });
    const biteAt = ENEMY.spawnTime + ENEMY.sauva.windup;
    run(dodge, biteAt + 0.3, (w, i) => ({ ...idleAt(w), mx: -1, my: 0, dodgePressed: Math.abs(i * TICK - (biteAt - 0.12)) < TICK / 2 }));
    expect(dodge.player.hp).toBe(dodge.stats.maxHp);
  });

  it('esquiva perfeita: o golpe cai dentro da janela e libera o bônus', () => {
    const w = arena();
    const e = put(w, { kind: 'tronco', x: w.player.x + 90, y: w.player.y, elite: true });
    const slamAt = ENEMY.spawnTime + ENEMY.tronco.windup;
    run(w, slamAt + 0.1, (w, i) => ({ ...idleAt(w), dodgePressed: Math.abs(i * TICK - (slamAt - 0.1)) < TICK / 2 }));
    expect(w.perfects).toBe(1);
    expect(w.player.hp).toBe(w.stats.maxHp);
    expect(w.player.perfectT).toBeGreaterThan(0);
    expect(e.state).toBe('exposed');
  });

  it('o Tronco-Oco é blindado até ficar exposto', () => {
    const w = arena();
    const e = put(w, { kind: 'tronco', x: w.player.x + 70, y: w.player.y, elite: true });
    e.state = 'chase'; e.stateT = 0;
    const before = e.hp;
    run(w, 0.2, (w) => ({ ...idleAt(w), attackPressed: true }));
    const full = w.stats.weaponDamage * w.stats.damageMult;
    expect(before - e.hp).toBeGreaterThan(0);
    expect(before - e.hp).toBeLessThanOrEqual(Math.round(full * ENEMY.tronco.armor * w.stats.critMult));
  });

  it('a queixada avança em linha reta e fica tonta ao bater na borda', () => {
    const w = arena();
    const q = put(w, { kind: 'queixada', x: 1000, y: 400 });
    q.cd = 0;
    let crashed = false;
    run(w, 4, (w) => {
      if (w.events.some((e) => e.type === 'crash')) crashed = true;
      w.events.length = 0;
      const locked = q.state === 'charge' || (q.state === 'aim' && q.stateT >= ENEMY.queixada.lockAt);
      return { ...idleAt(w), mx: 0, my: locked ? -1 : 0 };
    });
    expect(crashed).toBe(true);
    expect(w.player.hp).toBe(w.stats.maxHp);
  });

  it('o Dardo de Espinho gasta mana, causa dano e envenena', () => {
    const w = arena();
    const e = put(w, { kind: 'queixada', x: w.player.x + 200, y: w.player.y });
    e.state = 'stunned'; e.stateT = -10;
    run(w, 0.05, (w, i) => ({ ...idleAt(w), spell: [i === 0, false, false] }));
    expect(w.player.mana).toBeLessThan(w.stats.maxMana - 11);
    run(w, 1.5);
    expect(e.hp).toBeLessThan(e.maxHp - 10);
  });

  it('o arco acerta de longe e o tiro carregado atravessa', () => {
    const w = arena(refProfile(1, true));
    expect(w.stats.weapon).toBe('arco');
    const a = put(w, { kind: 'queixada', x: w.player.x + 300, y: w.player.y }), b = put(w, { kind: 'queixada', x: w.player.x + 420, y: w.player.y });
    for (const e of [a, b]) { e.state = 'stunned'; e.stateT = -10; }
    run(w, 1.2, (w, i) => ({ ...idleAt(w), altHeld: i * TICK < 1 }));
    run(w, 0.6);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
  });

  it('aparar com o escudo anula o golpe e atordoa quem bateu', () => {
    const w = arena(refProfile(2));
    expect(w.stats.hasShield).toBe(true);
    const e = put(w, { kind: 'sauva', x: w.player.x + 50, y: w.player.y });
    const biteAt = ENEMY.spawnTime + ENEMY.sauva.windup;
    run(w, biteAt + 0.05, (w, i) => ({ ...idleAt(w), altHeld: i * TICK >= biteAt - 0.1 }));
    expect(w.player.hp).toBe(w.stats.maxHp);
    expect(e.stunT).toBeGreaterThan(0);
  });

  it('o cogumelo explode e deixa uma nuvem', () => {
    const w = arena();
    put(w, { kind: 'cogumelo', x: w.player.x + 60, y: w.player.y });
    run(w, ENEMY.spawnTime + ENEMY.cogumelo.fuse + 0.3);
    expect(w.player.hp).toBeLessThan(w.stats.maxHp);
    expect(w.zones.some((z) => z.kind === 'cloud')).toBe(true);
    expect(w.enemies.length).toBe(0);
  });

  it('o urutau fica camuflado até o herói chegar perto', () => {
    const w = arena();
    const u = put(w, { kind: 'urutau', x: w.player.x + 500, y: w.player.y });
    run(w, 1.2);
    expect(u.hidden).toBe(true);
    u.x = w.player.x + 120;
    run(w, 0.2);
    expect(u.hidden).toBe(false);
  });
});

describe('fase', () => {
  const twoRooms: RoomDef[] = [
    { type: 'combat', waves: [[{ kind: 'sauva', x: 700, y: 400 }]], bg: 0 },
    { type: 'altar', waves: [], bg: 1 },
    { type: 'combat', waves: [[{ kind: 'sauva', x: 700, y: 400 }]], bg: 2 },
  ];
  const killAll = (w: World) => { for (const e of w.enemies) e.hp = 0; };
  const toExit = (w: World): Input => { const z = exitZone(w); return { ...idleAt(w), mx: z.x + 20 > w.player.x ? 1 : 0, my: Math.sign(z.y - w.player.y) * (Math.abs(z.y - w.player.y) > 8 ? 1 : 0) }; };

  it('limpa a sala, atravessa a saída, escolhe a bênção e vence', () => {
    const p = newProfile(7), w = arena(p, 1, twoRooms);
    run(w, 2); killAll(w); run(w, 0.1);
    expect(w.phase).toBe('cleared');
    run(w, 6, toExit);
    expect(w.room).toBe(1);
    expect(w.phase).toBe('altar');
    expect(w.altar).toHaveLength(3);
    const first = w.altar![0];
    expect(chooseBlessing(w, 0, (b) => deriveStats(p, b))).toBe(true);
    expect(w.blessings).toEqual([first]);
    run(w, 6, toExit);
    expect(w.room).toBe(2);
    run(w, 2); killAll(w); run(w, 0.1);
    expect(w.phase).toBe('won');
    expect(w.roomsCleared).toBe(3);
  });

  it('a primeira queda recomeça a sala com metade da vida; a segunda encerra a fase', () => {
    const w = arena(newProfile(7), 1, twoRooms);
    run(w, 1);
    w.player.hp = 1; put(w, { kind: 'sauva', x: w.player.x + 50, y: w.player.y });
    run(w, 4);
    expect(w.deaths).toBe(1);
    expect(w.phase).toBe('fight');
    expect(w.player.hp).toBe(Math.round(w.stats.maxHp * PLAYER.reviveHp));
    w.player.hp = 1; put(w, { kind: 'sauva', x: w.player.x + 50, y: w.player.y });
    run(w, 5);
    expect(w.phase).toBe('lost');
  });
});

describe('simulação', () => {
  /** Jogador automático simples: persegue o inimigo mais próximo, ataca, esquiva das marcas e segue pelas salas. */
  function bot(w: World, profile: Profile): Input {
    const p = w.player;
    if (w.phase === 'altar') { chooseBlessing(w, 0, (b) => deriveStats(profile, b)); return idleAt(w); }
    if (w.phase === 'cleared') { const z = exitZone(w); return { ...idleAt(w), mx: 1, my: Math.abs(z.y - p.y) > 8 ? Math.sign(z.y - p.y) : 0 }; }
    let target = null as World['enemies'][number] | null, best = Infinity;
    for (const e of w.enemies) { if (e.hidden || e.fake) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < best) { best = d; target = e; } }
    if (!target) {
      const hid = w.enemies.find((e) => e.hidden);
      return hid ? { ...idleAt(w), mx: Math.sign(hid.x - p.x), my: Math.sign(hid.y - p.y) } : idleAt(w);
    }
    let danger = false;
    const near = (t: World['enemies'][number]['tele']) => {
      if (!t || t.dur - t.t > 0.28 || t.t < 0) return false;
      if (t.shape === 'circle') return Math.hypot(p.x - t.x, p.y - t.y) < t.r + 24;
      const dx = t.x2 - t.x, dy = t.y2 - t.y, k = Math.max(0, Math.min(1, ((p.x - t.x) * dx + (p.y - t.y) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(p.x - (t.x + dx * k), p.y - (t.y + dy * k)) < t.w / 2 + 24;
    };
    for (const e of w.enemies) if (near(e.tele)) danger = true;
    for (const pr of w.projectiles) if (near(pr.tele)) danger = true;
    for (const h of w.hazards) if (near(h.tele)) danger = true;
    const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
    const bow = w.stats.weapon === 'arco', want = bow ? 300 : target.radius + 70, close = d < want;
    return {
      mx: close ? -dy / d : dx / d, my: close ? dx / d : dy / d,
      aimX: target.x, aimY: target.y,
      attackPressed: false, attackHeld: bow ? d < 600 : close, altHeld: false, dodgePressed: danger,
      spell: [!close || bow, d < 400, d < 400], petPressed: true, potionPressed: p.hp < w.stats.maxHp * 0.45,
    };
  }
  function playStage(index: number, profile: Profile, seed: number, maxSeconds = 600): World {
    const s = STAGES[index], w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(profile), seed });
    for (let i = 0; i < 60 * maxSeconds && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w, profile), TICK); w.events.length = 0; }
    return w;
  }

  it('é determinística: mesma semente e mesmos comandos dão o mesmo resultado', () => {
    const p = refProfile(3);
    expect(fingerprint(playStage(2, p, 42, 40))).toBe(fingerprint(playStage(2, p, 42, 40)));
  });

  it('todas as 12 fases terminam e nenhum número vira NaN', () => {
    const lines: string[] = [];
    for (const s of STAGES) {
      const profile = refProfile(s.level), w = playStage(s.index, profile, 100 + s.index);
      expect(w.phase === 'won' || w.phase === 'lost', `fase ${s.id} não terminou (sala ${w.room + 1}, ${w.enemies.map((e) => e.kind + ':' + e.state).join(',')})`).toBe(true);
      expect(Number.isFinite(w.player.x + w.player.y + w.player.hp + w.player.mana)).toBe(true);
      for (const e of w.enemies) expect(Number.isFinite(e.x + e.y + e.hp)).toBe(true);
      lines.push(`${s.id} nv${s.level} ${s.rooms.length} salas: ${w.phase === 'won' ? 'venceu' : 'caiu na sala ' + (w.room + 1)} em ${w.time.toFixed(0)}s (alvo ${s.starTime}s), vida ${Math.round(w.player.hp)}/${w.stats.maxHp}, quedas ${w.deaths}, golpes ${w.hitsTaken}`);
    }
    console.log('jogador automático com equipamento de referência:\n' + lines.join('\n'));
  });
});
