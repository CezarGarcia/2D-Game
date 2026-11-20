import { describe, expect, it } from 'vitest';
import { ENEMY, PLAYER, TICK, type SpawnDef } from '../src/data/balance';
import { makeItem } from '../src/data/items';
import { goldMultiplier, levelCombatModifiers, stageLevel, xpMultiplier, xpNeeded } from '../src/data/progression';
import { makeRng } from '../src/data/rng';
import { STAGES, type RoomDef } from '../src/data/stages';
import { newProfile, type Profile } from '../src/meta/profile';
import { damageReduction, deriveStats, referenceProfile } from '../src/meta/stats';
import { HUMAN, PERFECT, idleAt, playStage } from './bot';
import { chooseBlessing, createWorld, exitZone, fingerprint, spawnEnemy, step, type Input, type World } from '../src/sim/world';


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
    expect(stageLevel(11)).toBe(12);
    expect(stageLevel(23)).toBe(23);
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
  it('é determinística: mesma semente e mesmos comandos dão o mesmo resultado', () => {
    const p = referenceProfile(3);
    expect(fingerprint(playStage(2, p, 42, PERFECT, 40))).toBe(fingerprint(playStage(2, p, 42, PERFECT, 40)));
  });

  it('todas as fases dos dois capítulos terminam e nenhum número vira NaN', () => {
    const lines: string[] = [];
    for (const s of STAGES) {
      const profile = referenceProfile(s.level), w = playStage(s.index, profile, 100 + s.index, HUMAN);
      expect(w.phase === 'won' || w.phase === 'lost', `fase ${s.id} não terminou (sala ${w.room + 1}, ${w.enemies.map((e) => e.kind + ':' + e.state).join(',')})`).toBe(true);
      expect(Number.isFinite(w.player.x + w.player.y + w.player.hp + w.player.mana + w.player.supremo)).toBe(true);
      for (const e of w.enemies) expect(Number.isFinite(e.x + e.y + e.hp)).toBe(true);
      lines.push(`${s.id} nv${s.level} ${s.rooms.length} salas: ${w.phase === 'won' ? 'venceu' : 'caiu na sala ' + (w.room + 1)} em ${w.time.toFixed(0)}s (alvo ${s.starTime}s), vida ${Math.round(w.player.hp)}/${w.stats.maxHp}, quedas ${w.deaths}, golpes ${w.hitsTaken}`);
    }
    console.log('jogador automático que erra como gente, com o personagem de referência:\n' + lines.join('\n'));
  }, 60000);

  it('quem chega três níveis abaixo não passa do fim do capítulo', () => {
    for (const index of [9, 11]) {
      const s = STAGES[index];
      let wins = 0;
      for (let k = 0; k < 3; k++) if (playStage(index, referenceProfile(s.level - 3), 300 + k, { ...HUMAN, seed: k + 1 }).phase === 'won') wins++;
      expect(wins, `fase ${s.id}`).toBe(0);
    }
  }, 60000);
});

describe('dificuldade e bênçãos', () => {
  it('a onda seguinte entra antes de a atual acabar', () => {
    const wave = (n: number): SpawnDef[] => Array.from({ length: n }, (_, i) => ({ kind: 'sauva' as const, x: 700 + i * 40, y: 300 + (i % 2) * 80 }));
    const w = arena(referenceProfile(1), 1, [{ type: 'combat', waves: [wave(4), wave(4)], bg: 0 }]);
    run(w, 2.2);
    expect(w.wave).toBe(0);
    w.enemies[0].hp = 0; w.enemies[1].hp = 0;
    run(w, 1.4);
    expect(w.wave).toBe(1);
    expect(w.enemies.length).toBeGreaterThanOrEqual(5);
  });

  it('monstros de fase alta têm mais vida, andam mais rápido e avisam por menos tempo', () => {
    const lo = arena(newProfile(7), 1), hi = arena(newProfile(7), 12);
    const a = put(lo, { kind: 'sauva', x: 800, y: 400 }), b = put(hi, { kind: 'sauva', x: 800, y: 400 });
    expect(b.maxHp).toBeGreaterThan(a.maxHp * 5);
    expect(b.speedMult).toBeGreaterThan(a.speedMult);
    expect(b.windupMult).toBeLessThan(a.windupMult);
    const champ = put(hi, { kind: 'sauva', x: 820, y: 420, champion: true, mods: ['veloz'] });
    expect(champ.maxHp).toBeGreaterThan(b.maxHp * 2);
  });

  it('o altar oferece 3 bênçãos, 4 com o talento Bênção Farta, e elas acumulam', () => {
    const rooms: RoomDef[] = [{ type: 'altar', waves: [], bg: 0 }, { type: 'combat', waves: [[]], bg: 0 }];
    const p = newProfile(7);
    expect(arena(p, 1, rooms).altar!.length).toBe(3);
    p.talents = { raizEspirito: 1, fonte: 5, mare: 1, curaMaior: 5, bencaoFarta: 1 };
    expect(arena(p, 1, rooms).altar!.length).toBe(4);
    const base = deriveStats(p), twice = deriveStats(p, ['furia', 'furia', 'projetil', 'agilidade']);
    expect(twice.damageMult).toBeCloseTo(base.damageMult + 0.3 * (1 + 0.012 * base.attrs.forca), 5);
    expect(twice.projectiles).toBe(1);
    expect(twice.attrs.agilidade).toBe(base.attrs.agilidade + 6);
  });

  it('+1 projétil: o Dardo solta um espinho a mais e o arco uma flecha a mais', () => {
    const p = newProfile(7);
    const w = createWorld({ stageId: 't', level: 1, rooms: [{ type: 'combat', waves: [[]], bg: 0 }], stats: deriveStats(p, ['projetil']), seed: 7 });
    w.waveTimer = -1e9;
    step(w, { ...idleAt(w), spell: [true, false, false] }, TICK);
    expect(w.projectiles.filter((x) => x.kind === 'thorn').length).toBe(4);
  });

  it('Amparo anula o primeiro golpe de cada sala', () => {
    const p = newProfile(7);
    const w = createWorld({ stageId: 't', level: 1, rooms: [{ type: 'combat', waves: [[]], bg: 0 }], stats: deriveStats(p, ['amparo']), seed: 7 });
    w.waveTimer = -1e9;
    put(w, { kind: 'sauva', x: w.player.x + 50, y: w.player.y });
    run(w, ENEMY.spawnTime + 1.2);
    expect(w.player.hp).toBe(w.stats.maxHp);
    expect(w.player.shield).toBe(false);
  });
});

describe('água, reação e Supremo', () => {
  const mage = (): Profile => { const p = referenceProfile(14); p.loadout = ['jato', 'dardo', 'onda']; return p; };

  it('o Jato molha e a Natureza em cima faz brotar', () => {
    const w = arena(mage(), 14);
    const e = put(w, { kind: 'jacare', x: w.player.x + 200, y: w.player.y });
    e.state = 'recover'; e.stateT = -99;
    const aim = (spell: [boolean, boolean, boolean]): Input => ({ ...idleAt(w), aimX: e.x, aimY: e.y, spell });
    step(w, aim([true, false, false]), TICK);
    run(w, 0.5, () => aim([false, false, false]));
    expect(e.wetT).toBeGreaterThan(0);
    const events: string[] = [];
    step(w, aim([false, true, false]), TICK);
    for (let i = 0; i < 40; i++) { step(w, aim([false, false, false]), TICK); for (const ev of w.events) events.push(ev.type); w.events.length = 0; }
    expect(events).toContain('brotar');
    expect(e.wetT).toBe(0);
    expect(e.rootT).toBeGreaterThan(0);
  });

  it('o Supremo carrega com a luta e atinge a sala toda', () => {
    const p = mage(); p.supremos = ['natureza']; p.supremo = 'natureza';
    const w = arena(p, 14);
    const es = [put(w, { kind: 'sapo', x: 900, y: 300 }), put(w, { kind: 'sapo', x: 1000, y: 500 })];
    run(w, 1);
    expect(w.player.supremo).toBeGreaterThan(0);
    w.player.supremo = 100;
    step(w, { ...idleAt(w), supremoPressed: true }, TICK);
    expect(w.player.supremo).toBe(0);
    for (const e of es) expect(e.hp).toBeLessThan(e.maxHp);
  });
});

describe('Capítulo 2', () => {
  it('a piranha avisa em linha e morde no salto', () => {
    const w = arena(referenceProfile(13), 13);
    put(w, { kind: 'piranha', x: w.player.x + 120, y: w.player.y });
    run(w, ENEMY.spawnTime + 1.6);
    expect(w.player.hp).toBeLessThan(w.stats.maxHp);
  });

  it('a arraia fica enterrada até o herói chegar perto, e então atira', () => {
    const solo = referenceProfile(13); solo.companion = null;
    const w = arena(solo, 13);
    const e = put(w, { kind: 'arraia', x: w.player.x + 500, y: w.player.y });
    run(w, ENEMY.spawnTime + 0.5);
    expect(e.hidden).toBe(true);
    e.x = w.player.x + 100;
    run(w, 1.6);
    expect(e.hidden).toBe(false);
    expect(w.projectiles.some((x) => x.kind === 'sting') || w.player.hp < w.stats.maxHp).toBe(true);
  });

  it('o caramujo protege quem está perto dele', () => {
    const w = arena(referenceProfile(13), 13);
    put(w, { kind: 'caramujo', x: 800, y: 400 });
    const near = put(w, { kind: 'sapo', x: 860, y: 400 }), far = put(w, { kind: 'sapo', x: 300, y: 200 });
    run(w, ENEMY.spawnTime + 0.2);
    expect(near.guarded).toBe(true);
    expect(far.guarded).toBe(false);
  });

  it('o sapo cospe e deixa uma poça; poças molham os inimigos', () => {
    const rooms: RoomDef[] = [{ type: 'combat', waves: [[]], bg: 0, puddles: [{ x: 800, y: 400, r: 90 }] }];
    const w = arena(referenceProfile(13), 13, rooms);
    w.waveTimer = -1e9;
    const sapo = put(w, { kind: 'sapo', x: 800, y: 400 });
    run(w, ENEMY.spawnTime + 3.2, (w) => ({ ...idleAt(w), mx: 0, my: 0 }));
    expect(sapo.wetT).toBeGreaterThan(0);
    expect(w.zones.some((z) => z.kind === 'puddle') || w.projectiles.some((x) => x.kind === 'glob')).toBe(true);
  });

  it('o Boto mergulha, sai debaixo do herói e fica sem fôlego', () => {
    const w = arena(referenceProfile(22), 22);
    const b = put(w, { kind: 'boto', x: 800, y: 400, elite: true });
    const states = new Set<string>();
    for (let i = 0; i < 60 * 9; i++) { step(w, idleAt(w), TICK); states.add(b.state); w.events.length = 0; }
    expect(states.has('vanish')).toBe(true);
    expect(states.has('tired')).toBe(true);
  });

  it('a Iara canta e puxa o herói; na última fase o chão alaga', () => {
    const w = arena(referenceProfile(23), 23);
    const iara = put(w, { kind: 'iara', x: 900, y: 400, elite: true });
    let sang = false, pulled = 0;
    for (let i = 0; i < 60 * 14; i++) {
      const before = Math.hypot(iara.x - w.player.x, iara.y - w.player.y);
      w.player.hp = w.stats.maxHp;
      step(w, idleAt(w), TICK);
      if (iara.state === 'sing') { sang = true; pulled += before - Math.hypot(iara.x - w.player.x, iara.y - w.player.y); }
      w.events.length = 0;
    }
    expect(sang).toBe(true);
    expect(pulled).toBeGreaterThan(50);
    iara.hp = iara.maxHp * 0.3;
    for (let i = 0; i < 60 * 8; i++) { w.player.hp = w.stats.maxHp; step(w, idleAt(w), TICK); w.events.length = 0; }
    expect(iara.phase).toBe(2);
    expect(w.flooded).toBe(true);
  });
});
