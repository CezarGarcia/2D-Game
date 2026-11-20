/** Mapa: o capítulo ilustrado em tela inteira, uma medalha por fase. Tudo o mais aparece no tooltip. */
import { paintChapterMap } from '../art/backdrops';
import { COMPANIONS } from '../data/content';
import { ITEM_TYPES, RARITIES, UNIQUES } from '../data/items';
import { stageGold, stageXp } from '../data/progression';
import { CHAPTERS, ENEMY_NAMES, MOD_NAMES, STAGES, stagesOf, type StageDef } from '../data/stages';
import type { Profile } from '../meta/profile';
import { STAR_CHESTS, isChapterOpen, stageInfo, totalStars, type StageInfo, type StageTag } from '../meta/rewards';
import { MAIN_H, MAIN_W, type Ctx } from './ctx';
import { backdrop, clock, h, num, pct, star, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

const TAG_COLOR: Record<StageTag, string> = { verde: '#5fcb6a', amarela: '#f2c14e', cinza: '#9aa39a', vermelha: '#ff6b55' };

/** Primeira fase liberada que ainda não foi vencida; se todas foram, a última. */
export function defaultStage(p: Profile): StageDef {
  for (const st of STAGES) { const i = stageInfo(p, st); if (i.unlocked && !i.record.cleared) return st; }
  return STAGES[STAGES.length - 1];
}

function pos(stage: StageDef): { x: number; y: number } {
  return { x: Math.round(stage.map.x * MAIN_W), y: Math.round(34 + stage.map.y * (MAIN_H - 60)) };
}

/** Elite ou chefão que fecha a fase, se houver. */
function finalFoe(stage: StageDef): { name: string; mods: string } | null {
  const room = stage.rooms.find((r) => r.type === 'elite' || r.type === 'boss');
  const foe = room?.waves[0]?.[0];
  if (!foe) return null;
  return { name: ENEMY_NAMES[foe.kind], mods: (foe.mods ?? []).map((m) => MOD_NAMES[m]).join(', ') };
}

function mult(v: number): { value: string; tone: 'ok' | 'warn' | 'dim' } {
  return { value: pct(v), tone: v >= 1 ? 'ok' : v >= 0.5 ? 'warn' : 'dim' };
}

function stageTip(p: Profile, info: StageInfo): TipSpec {
  const st = info.stage, rec = info.record, foe = finalFoe(st), color = TAG_COLOR[info.tag];
  const common = st.kinds.filter((k) => !foe || ENEMY_NAMES[k] !== foe.name || st.final === 'normal').map((k) => ENEMY_NAMES[k]);
  const unique = st.named ? UNIQUES[st.named.unique] : null;
  const xm = mult(info.xpMult), gm = mult(info.goldMult);
  const strong = info.power >= info.recommended;
  const rows: TipRow[] = [
    { text: st.intro, tone: 'dim' },
    'sep',
    { icon: 'poder', text: 'Poder: seu / pedido', value: [h('span', strong ? 'ok' : 'bad', num(info.power)), ` / ${num(info.recommended)}`] },
    { head: 'Monstros' },
    { icon: 'dano', text: common.join(', ') },
    foe && st.final === 'elite' && { icon: 'elite', text: `Elite: ${foe.name}${foe.mods ? ` (${foe.mods})` : ''}`, tone: 'warn' },
    foe && st.final === 'chefao' && { icon: 'caveira', text: `Chefão: ${foe.name}`, tone: 'bad' },
    { head: 'Recompensas' },
    { icon: 'xp', text: `${num(Math.round(stageXp(st.level) * info.xpMult))} de experiência`, value: xm.value, tone: xm.tone },
    { icon: 'ouro', text: `${num(Math.round(stageGold(st.level) * info.goldMult))} de ouro`, value: gm.value, tone: gm.tone },
    unique && { icon: 'estrela', text: unique.name, value: `${num(info.namedChance, 1)}%`, color: RARITIES[unique.rarity].color },
    !rec.cleared && st.firstClear?.length ? { icon: 'bau', text: `1ª vitória: ${st.firstClear.map((t) => ITEM_TYPES[t].label).join(' e ')}`, tone: 'gold' } : null,
    st.rescue && !p.companions[st.rescue] ? { icon: 'gaiola', text: `Resgate: ${COMPANIONS[st.rescue].name}${st.rescue === 'onca' ? ' (sem cair)' : ''}`, tone: 'gold' } : null,
    { head: 'Estrelas' },
    { node: star(rec.stars[0], 18), text: 'Vencer', tone: rec.stars[0] ? 'gold' : undefined },
    { node: star(rec.stars[1], 18), text: 'Sem cair', tone: rec.stars[1] ? 'gold' : undefined },
    { node: star(rec.stars[2], 18), text: `Em até ${clock(st.starTime)}`, tone: rec.stars[2] ? 'gold' : undefined },
    rec.bestTime != null && { icon: 'relogio', text: 'Melhor tempo', value: clock(rec.bestTime) },
  ];
  return {
    title: `${st.id} · ${st.name}`, tag: `Nv ${st.level}`, color: info.unlocked ? color : '#b9b2a3',
    sub: info.unlocked ? info.tagText : 'Trancada', subColor: info.unlocked ? color : '#ff7b6b',
    rows,
    foot: info.unlocked ? ['Clique: escolher', 'Duplo clique: jogar'] : ['Vença a fase anterior'],
  };
}

let lastClick = { id: '', at: 0 };

export function renderMapa(c: Ctx): HTMLElement {
  const p = c.p;
  const chapter = CHAPTERS.find((ch) => ch.id === c.st.chapter) ?? CHAPTERS[0];
  const stages = stagesOf(chapter.id), infos = stages.map((s) => stageInfo(p, s));
  const points = stages.map(pos);
  const next = infos.find((i) => i.unlocked && !i.record.cleared)?.stage.id ?? null;
  const sel = infos.find((i) => i.stage.id === c.st.mapSel && i.unlocked) ?? null;

  const play = (id: string) => c.host.startStage(id);
  const pick = (info: StageInfo) => {
    if (!info.unlocked) { c.toast('Vença a fase anterior', 'bad'); return; }
    const now = performance.now(), id = info.stage.id;
    if (lastClick.id === id && now - lastClick.at < 450) { lastClick = { id: '', at: 0 }; play(id); return; }
    lastClick = { id, at: now };
    c.st.mapSel = id;
    c.redraw('jogar');
  };
  const goChapter = (id: number) => {
    c.st.chapter = id;
    const first = stagesOf(id).map((s) => stageInfo(p, s)).find((i) => i.unlocked && !i.record.cleared);
    c.st.mapSel = first?.stage.id ?? null;
    c.redraw(`cap-${id}`);
  };

  const nodes = infos.map((info, i) => {
    const st = info.stage, { x, y } = points[i], boss = st.final === 'chefao';
    const state = !info.unlocked ? 'locked' : info.record.cleared ? 'cleared' : 'open';
    const cage = st.rescue && !p.companions[st.rescue];
    const starCount = info.record.stars.filter(Boolean).length;
    return tip(h('button', {
      type: 'button',
      class: `node ${state} ${st.final}${st.id === next ? ' next' : ''}${sel?.stage.id === st.id ? ' sel' : ''}`,
      style: `left:${x}px;top:${y}px;--ring:${info.unlocked ? TAG_COLOR[info.tag] : '#5b5a55'}`,
      'aria-label': `Fase ${st.id}, ${st.name}${!info.unlocked ? ', trancada' : info.record.cleared ? `, ${starCount} de 3 estrelas` : ''}`,
      'aria-disabled': info.unlocked ? null : 'true',
      'data-fk': `fase-${st.id}`,
      onclick: () => pick(info),
      onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' && sel?.stage.id === st.id) { e.preventDefault(); play(st.id); } },
    },
    h('span', 'node-face',
      !info.unlocked ? ui('cadeado', boss ? 40 : 32) : boss ? ui('caveira', 52) : h('b', null, st.number)),
    st.final === 'elite' && h('span', 'node-badge tr', ui('elite', 26)),
    boss && info.unlocked && h('span', 'node-badge tr num', st.number),
    cage && h('span', 'node-badge tl', ui('gaiola', 28)),
    info.unlocked && h('span', 'node-stars', info.record.stars.map((on) => star(on, 17)))),
    () => stageTip(p, info));
  });

  let playPop: HTMLElement | null = null;
  if (sel) {
    const pt = points[stages.indexOf(sel.stage)], r = sel.stage.final === 'chefao' ? 42 : 34;
    const below = pt.y + r + 26 + 52 <= MAIN_H - 6;
    playPop = h('div', { class: `play-pop${below ? '' : ' above'}`, style: `left:${pt.x}px;top:${below ? pt.y + r + 26 : pt.y - r - 62}px` },
      h('button', { type: 'button', class: 'btn primary big play', 'data-fk': 'jogar', onclick: () => play(sel.stage.id) }, ui('dano', 30), 'Jogar'));
  }

  const idx = CHAPTERS.indexOf(chapter);
  const arrow = (dir: -1 | 1) => {
    const to = CHAPTERS[idx + dir];
    return h('button', { type: 'button', class: `round-btn chap-arrow${dir < 0 ? ' prev' : ''}`, disabled: !to, 'aria-label': dir < 0 ? 'Capítulo anterior' : 'Próximo capítulo', onclick: () => to && goChapter(to.id) }, ui('seta', 26));
  };
  const chapters = h('div', 'chap-bar',
    arrow(-1),
    CHAPTERS.map((ch) => {
      const open = isChapterOpen(p, ch.id), max = stagesOf(ch.id).length * 3, got = totalStars(p, ch.id);
      const prev = stagesOf(ch.id - 1);
      return tip(h('button', {
        type: 'button', class: `chap${ch.id === chapter.id ? ' on' : ''}${open ? '' : ' locked'}`, 'aria-pressed': String(ch.id === chapter.id),
        'data-fk': `cap-${ch.id}`, onclick: () => goChapter(ch.id),
      },
      ui(open ? ch.element : 'cadeado', 30),
      h('span', 'chap-name', ch.name),
      open && h('span', 'chap-stars', star(true, 14), `${got}/${max}`)),
      () => ({
        title: `Capítulo ${ch.id} · ${ch.name}`, sub: open ? `Encantado: ${ch.encantado}` : 'Trancado', subColor: open ? undefined : '#ff7b6b',
        rows: [
          open ? { node: star(true, 18), text: 'Estrelas', value: `${got} / ${max}` } : null,
          !open && prev.length ? { icon: 'cadeado', text: `Vença a fase ${prev[prev.length - 1].id}`, tone: 'bad' } : null,
        ],
      }));
    }),
    arrow(1));

  const stars = totalStars(p), goal = STAR_CHESTS[p.starChests] as number | undefined, from = p.starChests > 0 ? STAR_CHESTS[p.starChests - 1] : 0;
  const chest = tip(h('div', 'star-chest',
    ui('bau', 44),
    h('div', 'chest-info',
      h('span', 'chest-n', star(true, 16), goal != null ? `${stars}/${goal}` : `${stars}`),
      h('span', 'bar', h('i', { style: `width:${goal != null ? Math.max(0, Math.min(100, ((stars - from) / (goal - from)) * 100)) : 100}%` })))),
  () => ({
    title: 'Baú de estrelas', color: '#f2c14e', icon: ui('bau', 36),
    rows: [
      { node: star(true, 18), text: 'Estrelas', value: goal != null ? `${stars} / ${goal}` : num(stars) },
      { icon: 'bau', text: 'Baús abertos', value: `${p.starChests} / ${STAR_CHESTS.length}` },
      'sep',
      { text: 'Abre sozinho ao juntar as estrelas. Dá ouro e resina; alguns dão um ponto de talento.', tone: 'dim' },
    ],
  }));

  return h('div', 'mapa',
    backdrop(`mapa-${chapter.id}`, MAIN_W, MAIN_H, (g) => paintChapterMap(g, MAIN_W, MAIN_H, chapter.id, points), 2),
    nodes,
    playPop,
    chapters,
    chest);
}
