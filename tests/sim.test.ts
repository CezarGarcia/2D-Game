import { describe, expect, it } from 'vitest';
import { ENEMY, PLAYER, TICK, WAVES } from '../src/data/balance';
import { goldMultiplier, levelCombatModifiers, stageLevel, xpMultiplier, xpNeeded } from '../src/data/progression';
import { createWorld, fingerprint, NO_INPUT, spawnEnemy, step, type Input, type World } from '../src/sim/world';

function run(w: World, seconds: number, input: (w: World, tick: number) => Input = () => NO_INPUT): void {
  const n = Math.round(seconds / TICK);
  for (let i = 0; i < n; i++) step(w, input(w, i), TICK);
}
const idleAt = (w: World): Input => ({ ...NO_INPUT, aimX: w.player.x + 100, aimY: w.player.y });
/** Mundo sem ondas automáticas, para testar um monstro de cada vez. */
function emptyWorld(): World {
  const w = createWorld(7);
  w.wave = WAVES.length - 1;
  return w;
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
    expect(xpMultiplier(12, 10)).toBe(1);
    expect(xpMultiplier(15, 10)).toBe(0.55);
    expect(xpMultiplier(30, 10)).toBe(0.1);
    expect(xpMultiplier(5, 10)).toBeCloseTo(1.3);
    expect(goldMultiplier(14, 10)).toBe(1);
    expect(goldMultiplier(16, 10)).toBeCloseTo(0.8);
    expect(goldMultiplier(40, 10)).toBe(0.3);
  });
  it('estar abaixo pesa mais do que estar acima ajuda', () => {
    expect(levelCombatModifiers(5, 10)).toEqual({ dealt: 0.8, taken: 1.2 });
    expect(levelCombatModifiers(1, 30).dealt).toBeCloseTo(0.6);
    expect(levelCombatModifiers(30, 10).dealt).toBeCloseTo(1.1);
  });
});

describe('combate', () => {
  it('a sequência de três golpes derruba uma saúva', () => {
    const w = emptyWorld();
    const e = spawnEnemy(w, { kind: 'sauva', x: w.player.x + 60, y: w.player.y });
    e.state = 'recover'; e.stateT = -10; // parada, fora do nascimento
    run(w, 1.4, (w) => ({ ...idleAt(w), attackHeld: true }));
    expect(w.enemies.length).toBe(0);
    expect(w.kills).toBe(1);
  });

  it('a mordida da saúva fere, e a esquiva no tempo certo evita e conta como perfeita', () => {
    const hit = emptyWorld();
    spawnEnemy(hit, { kind: 'sauva', x: hit.player.x + 50, y: hit.player.y });
    run(hit, ENEMY.spawnTime + ENEMY.sauva.windup + 0.2, idleAt);
    expect(hit.player.hp).toBe(PLAYER.maxHp - ENEMY.sauva.damage);

    const dodge = emptyWorld();
    spawnEnemy(dodge, { kind: 'sauva', x: dodge.player.x + 50, y: dodge.player.y });
    const biteAt = ENEMY.spawnTime + ENEMY.sauva.windup;
    run(dodge, biteAt + 0.3, (w, i) => ({ ...idleAt(w), mx: -1, my: 0, dodgePressed: Math.abs(i * TICK - (biteAt - 0.12)) < TICK / 2 }));
    expect(dodge.player.hp).toBe(PLAYER.maxHp);
  });

  it('esquiva perfeita: o golpe cai dentro da janela e libera o bônus', () => {
    const w = emptyWorld();
    const e = spawnEnemy(w, { kind: 'tronco', x: w.player.x + 90, y: w.player.y, elite: true });
    const slamAt = ENEMY.spawnTime + ENEMY.tronco.windup;
    // fica parado dentro da marca e esquiva no lugar 0,1 s antes do impacto
    run(w, slamAt + 0.1, (w, i) => ({ ...idleAt(w), dodgePressed: Math.abs(i * TICK - (slamAt - 0.1)) < TICK / 2, mx: 0, my: 0 }));
    expect(w.perfects).toBe(1);
    expect(w.player.hp).toBe(PLAYER.maxHp);
    expect(w.player.perfectT).toBeGreaterThan(0);
    expect(e.state).toBe('exposed');
  });

  it('o Tronco-Oco é blindado até ficar exposto depois do golpe', () => {
    const w = emptyWorld();
    const e = spawnEnemy(w, { kind: 'tronco', x: w.player.x + 70, y: w.player.y, elite: true });
    e.state = 'chase'; e.stateT = 0;
    const before = e.hp;
    run(w, 0.2, (w) => ({ ...idleAt(w), attackPressed: true }));
    const armored = before - e.hp;
    expect(armored).toBeGreaterThan(0);
    expect(armored).toBeLessThanOrEqual(Math.round(PLAYER.combo[0].damage * ENEMY.tronco.armor * PLAYER.critMult));
  });

  it('a queixada avança em linha reta e fica tonta ao bater na borda', () => {
    const w = emptyWorld();
    const q = spawnEnemy(w, { kind: 'queixada', x: 1000, y: 400 });
    q.cd = 0;
    let crashed = false;
    // o jogador espera a linha travar e só então sai dela andando
    run(w, 4, (w) => {
      if (w.events.some((e) => e.type === 'crash')) crashed = true;
      w.events.length = 0;
      const locked = q.state === 'charge' || (q.state === 'aim' && q.stateT >= ENEMY.queixada.lockAt);
      return { ...idleAt(w), mx: 0, my: locked ? -1 : 0 };
    });
    expect(crashed).toBe(true);
    expect(w.player.hp).toBe(PLAYER.maxHp);
  });

  it('o Dardo de Espinho gasta mana, causa dano e envenena', () => {
    const w = emptyWorld();
    const e = spawnEnemy(w, { kind: 'queixada', x: w.player.x + 200, y: w.player.y });
    e.state = 'stunned'; e.stateT = -10;
    run(w, 0.05, (w, i) => ({ ...idleAt(w), spellPressed: i === 0 }));
    expect(w.player.mana).toBeLessThan(PLAYER.maxMana - PLAYER.spell.cost + 1);
    run(w, 1.5, idleAt);
    expect(e.hp).toBeLessThan(ENEMY.queixada.hp - PLAYER.spell.damage);
  });
});

describe('simulação', () => {
  /** Jogador automático simples: persegue o inimigo mais próximo, ataca e esquiva das marcas. */
  function bot(w: World): Input {
    const p = w.player;
    let target = w.enemies[0];
    let best = Infinity;
    for (const e of w.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < best) { best = d; target = e; } }
    if (!target) return idleAt(w);
    let danger = false;
    for (const e of w.enemies) {
      const t = e.tele;
      if (!t || t.dur - t.t > 0.25) continue;
      if (t.shape === 'circle' ? Math.hypot(p.x - t.x, p.y - t.y) < t.r + 20 : true) danger = true;
    }
    for (const pr of w.projectiles) if (pr.tele && pr.tele.shape === 'circle' && pr.tele.dur - pr.tele.t < 0.25 && Math.hypot(p.x - pr.tele.x, p.y - pr.tele.y) < pr.tele.r + 20) danger = true;
    const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
    const near = d < target.radius + 70;
    return {
      mx: near ? -dy / d : dx / d, my: near ? dx / d : dy / d,
      aimX: target.x, aimY: target.y,
      attackPressed: false, attackHeld: near, dodgePressed: danger, spellPressed: !near,
    };
  }

  it('é determinística: mesma semente e mesmos comandos dão o mesmo resultado', () => {
    const a = createWorld(42), b = createWorld(42);
    for (let i = 0; i < 60 * 40; i++) { step(a, bot(a), TICK); a.events.length = 0; step(b, bot(b), TICK); b.events.length = 0; }
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('a sala termina (vitória ou derrota) e nenhum número vira NaN', () => {
    const w = createWorld(3);
    let waves = 0;
    for (let i = 0; i < 60 * 240 && w.phase === 'fight'; i++) {
      step(w, bot(w), TICK);
      waves += w.events.filter((e) => e.type === 'wave').length;
      w.events.length = 0;
    }
    expect(w.phase).not.toBe('fight');
    expect(waves).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(w.player.x + w.player.y + w.player.hp + w.player.mana)).toBe(true);
    for (const e of w.enemies) expect(Number.isFinite(e.x + e.y + e.hp)).toBe(true);
    console.log(`bot: ${w.phase} em ${w.time.toFixed(1)} s, onda ${w.wave + 1}/${WAVES.length}, vida ${w.player.hp}, perfeitas ${w.perfects}`);
  });
});
