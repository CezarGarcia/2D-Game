/**
 * Jogadores automáticos para testar e calibrar as fases sem tela.
 * `makeBot` aceita um atraso de reação e uma chance de perceber cada aviso, para imitar uma pessoa:
 * com reação 0 e percepção 1 ele esquiva de tudo; com 0,27 s e 0,72 joga como alguém atento mas falível.
 */
import { deriveStats } from '../src/meta/stats';
import type { Profile } from '../src/meta/profile';
import { TICK } from '../src/data/balance';
import { STAGES } from '../src/data/stages';
import { chooseBlessing, createWorld, exitZone, NO_INPUT, step, type Enemy, type Input, type Telegraph, type World } from '../src/sim/world';

export interface BotOpts { react: number; notice: number; seed: number }
export const PERFECT: BotOpts = { react: 0, notice: 1, seed: 1 };
export const HUMAN: BotOpts = { react: 0.27, notice: 0.72, seed: 1 };

export const idleAt = (w: World): Input => ({ ...NO_INPUT, spell: [false, false, false], aimX: w.player.x + 100, aimY: w.player.y });

export function makeBot(profile: Profile, o: BotOpts = PERFECT): (w: World) => Input {
  let rng = o.seed * 2654435761 >>> 0;
  const next = () => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; };
  const seen = new Map<string, { at: number; noticed: boolean }>();
  const aware = (w: World, key: string): boolean => {
    let s = seen.get(key);
    if (!s) { s = { at: w.time, noticed: next() < o.notice }; seen.set(key, s); if (seen.size > 400) seen.delete(seen.keys().next().value!); }
    return s.noticed && w.time - s.at >= o.react;
  };
  const inside = (w: World, t: Telegraph | null, pad: number): boolean => {
    if (!t || t.t < 0) return false;
    const p = w.player;
    if (t.shape === 'circle') return Math.hypot(p.x - t.x, p.y - t.y) < t.r + pad;
    const dx = t.x2 - t.x, dy = t.y2 - t.y, k = Math.max(0, Math.min(1, ((p.x - t.x) * dx + (p.y - t.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p.x - (t.x + dx * k), p.y - (t.y + dy * k)) < t.w / 2 + pad;
  };
  return (w: World): Input => {
    const p = w.player;
    if (w.phase === 'altar') { chooseBlessing(w, 0, (b) => deriveStats(profile, b)); return idleAt(w); }
    if (w.phase === 'cleared') { const z = exitZone(w); return { ...idleAt(w), mx: 1, my: Math.abs(z.y - p.y) > 8 ? Math.sign(z.y - p.y) : 0 }; }
    let target: Enemy | null = null, best = Infinity;
    for (const e of w.enemies) { if (e.hidden || e.fake || e.state === 'spawn') continue; const d = Math.hypot(e.x - p.x, e.y - p.y) - (e.kind === 'caramujo' ? 200 : 0); if (d < best) { best = d; target = e; } }
    if (!target) {
      const hid = w.enemies.find((e) => e.hidden && e.kind !== 'boto' && e.kind !== 'iara');
      return hid ? { ...idleAt(w), mx: Math.sign(hid.x - p.x), my: Math.sign(hid.y - p.y) } : { ...idleAt(w), mx: Math.sin(w.time * 3), my: Math.cos(w.time * 3) };
    }
    /* perigo: marcas prestes a estourar em cima do herói, que o jogador percebeu a tempo */
    let danger = false, away: { x: number; y: number } | null = null;
    const check = (key: string, t: Telegraph | null) => {
      if (!inside(w, t, 22) || !t || !aware(w, key)) return;
      if (t.dur - t.t <= 0.3) danger = true;
      if (t.shape === 'circle') away = { x: t.x, y: t.y };
    };
    for (const e of w.enemies) check(`e${e.id}${e.state}${e.count}${e.step}`, e.tele);
    for (const pr of w.projectiles) check(`p${pr.id}`, pr.tele);
    for (const h of w.hazards) check(`h${h.id}`, h.tele);
    for (const e of w.enemies) if ((e.state === 'charge' || e.state === 'dash' || e.state === 'leap') && Math.hypot(e.x - p.x, e.y - p.y) < 150 && aware(w, `c${e.id}${e.state}${e.count}${e.step}`)) danger = true;
    for (const pr of w.projectiles) if ((pr.kind === 'ethorn' || pr.kind === 'sting' || pr.kind === 'stampede') && Math.hypot(pr.x - p.x, pr.y - p.y) < 90 && aware(w, `s${pr.id}`)) danger = true;

    const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
    const bow = w.stats.weapon === 'arco', want = bow ? 300 : target.radius + 70, close = d < want;
    let mx = close ? -dy / d : dx / d, my = close ? dx / d : dy / d;
    const av = away as { x: number; y: number } | null;
    if (av) { const ax = p.x - av.x, ay = p.y - av.y, ad = Math.hypot(ax, ay) || 1; mx = ax / ad; my = ay / ad; }
    /* parede d'água: corre para a passagem */
    const wall = w.projectiles.find((pr) => pr.kind === 'wall' && !pr.hit.includes(-1) && aware(w, `w${pr.id}`));
    if (wall && Math.abs(p.y - wall.sx) > wall.sy - 26) { mx = 0; my = Math.sign(wall.sx - p.y); if (Math.abs(wall.x - p.x) < 70) danger = true; }
    const zone = w.zones.find((z) => (z.kind === 'whirl' || z.kind === 'cloud') && Math.hypot(p.x - z.x, p.y - z.y) < z.r + 30);
    if (zone && !av) { const ax = p.x - zone.x, ay = p.y - zone.y, ad = Math.hypot(ax, ay) || 1; mx = ax / ad; my = ay / ad; }
    const singer = w.enemies.find((e) => e.state === 'sing');
    if (singer) { const ax = p.x - singer.x, ay = p.y - singer.y, ad = Math.hypot(ax, ay) || 1; mx = ax / ad; my = ay / ad; }
    return {
      mx, my, aimX: target.x, aimY: target.y,
      attackPressed: false, attackHeld: bow ? d < 600 : close, altHeld: false, dodgePressed: danger,
      spell: [!close || bow, d < 400, d < 400], petPressed: true, potionPressed: p.hp < w.stats.maxHp * 0.4, supremoPressed: w.enemies.length >= 3 || !!w.enemies.find((e) => e.kind === 'boto' || e.kind === 'iara' || e.kind === 'curupira' || e.kind === 'caipora'),
    };
  };
}

export function playStage(index: number, profile: Profile, seed: number, opts: BotOpts = PERFECT, maxSeconds = 600): World {
  const s = STAGES[index], w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(profile), seed });
  const bot = makeBot(profile, { ...opts, seed: opts.seed + seed });
  for (let i = 0; i < 60 * maxSeconds && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w), TICK); w.events.length = 0; }
  return w;
}
