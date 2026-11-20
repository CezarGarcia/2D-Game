/**
 * Torre dos Cem Andares: a torre pintada no fundo, um medalhão a cada dez andares subindo por ela,
 * os recordes em ícone + número e o botão de subir, que sempre parte do marco atual.
 */
import { paintTowerBackdrop } from '../art/backdrops';
import { COMPANIONS, ELEMENTS } from '../data/content';
import { CHAPTERS, ENEMY_NAMES } from '../data/stages';
import { FLOORS_PER_RUN, TOWER_FLOORS, towerChapter, towerLevel, towerRun } from '../data/tower';
import { weekKey, type Profile } from '../meta/profile';
import { isTowerUnlocked } from '../meta/rewards';
import { MAIN_H, MAIN_W, type Ctx } from './ctx';
import { backdrop, clock, h, hdCanvas, num, s, stat, ui } from './dom';
import { drawFigure } from './retratos';
import { tip, type TipRow, type TipSpec } from './tip';

const MICO_FLOOR = 50;
/* centro da torre no fundo pintado e a faixa vertical por onde os medalhões sobem */
const TX = 598, TOP = 40, BOTTOM = 628;

interface Run { start: number; end: number }

function runOf(start: number): Run { return { start, end: Math.min(TOWER_FLOORS, start + FLOORS_PER_RUN - 1) }; }

/** Chefe do décimo andar de uma subida. */
function bossName(start: number): string {
  const room = towerRun(start).rooms.find((r) => r.type === 'boss');
  const kind = room?.waves[0]?.[0]?.kind;
  return kind ? ENEMY_NAMES[kind] : '?';
}

function chapterOf(floor: number) { return CHAPTERS.find((ch) => ch.id === towerChapter(floor)) ?? CHAPTERS[0]; }
function chapterIcon(floor: number): string { return chapterOf(floor).element ?? 'credito'; }
function chapterColor(floor: number): string { const el = chapterOf(floor).element; return el ? ELEMENTS[el].color : '#e9e1f2'; }

/** Semana atual: fora dela o recorde semanal ainda não começou. */
function week(p: Profile): { best: number; time: number } {
  return p.tower.week === weekKey() ? { best: p.tower.weekBest, time: p.tower.weekTime } : { best: 0, time: 0 };
}

function runTip(p: Profile, run: Run, state: 'done' | 'now' | 'locked'): TipSpec {
  const ch = chapterOf(run.start), color = chapterColor(run.start), mico = run.start <= MICO_FLOOR && run.end >= MICO_FLOOR;
  const rows: TipRow[] = [
    { icon: 'xp', text: 'Nível dos monstros', value: `${towerLevel(run.start)}–${towerLevel(run.end)}` },
    { icon: chapterIcon(run.start), text: `Monstros: ${ch.name}`, color },
    { icon: 'caveira', text: `Chefe no ${run.end}º: ${bossName(run.start)}`, tone: 'bad' },
    { icon: 'altar', text: 'Altar depois do 5º andar', tone: 'dim' },
    { head: 'Recompensas' },
    { icon: 'ouro', text: 'Ouro a cada andar' },
    { icon: 'xp', text: 'Experiência a cada andar' },
    { icon: 'tomo', text: 'Tomo a cada 5 andares', value: '×2' },
    { icon: 'gema', text: `Gemas no ${run.end}º andar`, value: '×2' },
    { icon: 'item', text: `Item no ${run.end}º andar`, value: '×1' },
    mico && { icon: 'gaiola', text: `Resgate: ${COMPANIONS.mico.name}`, tone: p.companions.mico ? 'dim' : 'gold' },
    'sep',
    state === 'done' ? { icon: 'check', text: 'Vencidos', tone: 'ok' }
      : state === 'now' ? { icon: 'seta', text: 'A próxima subida começa aqui', tone: 'gold' }
        : { icon: 'cadeado', text: `Vença os andares ${run.start - FLOORS_PER_RUN}–${run.start - 1}`, tone: 'bad' },
  ];
  return { title: `Andares ${run.start}–${run.end}`, tag: `Nv ${towerLevel(run.end)}`, color: state === 'locked' ? '#b9b2a3' : '#f2c14e', icon: ui('torre', 36), rows };
}

export function renderTorre(c: Ctx): HTMLElement {
  const p = c.p;
  const bg = backdrop('torre', MAIN_W, MAIN_H, (g) => paintTowerBackdrop(g, MAIN_W, MAIN_H));
  if (!isTowerUnlocked(p)) {
    return h('div', 'torre locked', bg,
      tip(h('div', { class: 'big-lock', tabindex: 0 }, ui('cadeado', 96), h('span', 'plate', 'Fase 1-12')),
        { title: 'Torre trancada', color: '#ff7b6b', icon: ui('torre', 36), rows: [{ icon: 'mapa', text: 'Liberte o Curupira, na fase 1-12, para abrir.' }] }));
  }

  const t = p.tower, cur = runOf(t.checkpoint), wk = week(p);
  const marks = Array.from({ length: TOWER_FLOORS / FLOORS_PER_RUN }, (_, i) => runOf(i * FLOORS_PER_RUN + 1));
  const n = marks.length, step = (BOTTOM - TOP) / (n - 1);
  const at = (i: number) => ({ x: TX + (i % 2 === 0 ? -34 : 34) * (i === 0 ? 0.4 : 1), y: BOTTOM - i * step });

  /* trilha pontilhada entre os medalhões; acesa até o marco atual */
  const curIdx = marks.findIndex((m) => m.start === cur.start);
  const pts = marks.map((_, i) => at(i));
  const path = (list: { x: number; y: number }[]) => list.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  const trail = s('svg', { class: 'tower-trail', width: MAIN_W, height: MAIN_H, viewBox: `0 0 ${MAIN_W} ${MAIN_H}`, 'aria-hidden': 'true' },
    s('path', { class: 'tt-all', d: path(pts) }),
    curIdx > 0 && s('path', { class: 'tt-done', d: path(pts.slice(0, curIdx + 1)) }));

  const medals = marks.map((run, i) => {
    const { x, y } = pts[i];
    const state: 'done' | 'now' | 'locked' = t.best >= run.end ? 'done' : run.start === cur.start ? 'now' : 'locked';
    const inRun = state === 'now' ? Math.max(0, Math.min(FLOORS_PER_RUN, t.best - run.start + 1)) : 0;
    const mico = run.start <= MICO_FLOOR && run.end >= MICO_FLOOR;
    let micoPic: HTMLElement | null = null;
    if (mico) {
      const { cv, g } = hdCanvas(40, 40, 'tm-mico-cv');
      if (g) drawFigure(g, 'mico', { x: 0, y: 0, w: 40, h: 40 }, 0.2, 0.95, '#f2a531');
      micoPic = h('span', `tm-badge mico${p.companions.mico ? ' freed' : ''}`, p.companions.mico ? cv : [cv, h('span', 'tm-cage', ui('gaiola', 24))]);
    }
    return tip(h('div', {
      class: `tmedal ${state}${run.end === TOWER_FLOORS ? ' top' : ''}`, tabindex: 0, style: `left:${x}px;top:${y}px;--ec:${chapterColor(run.start)};--prog:${inRun / FLOORS_PER_RUN}`,
      'aria-label': `Andares ${run.start} a ${run.end}${state === 'done' ? ', vencidos' : state === 'now' ? ', próxima subida' : ', trancados'}`,
    },
    h('span', 'tm-face', state === 'locked' ? ui('cadeado', 24) : h('b', null, run.end)),
    state !== 'locked' && h('span', 'tm-el', ui(chapterIcon(run.start), 20)),
    run.end === TOWER_FLOORS && h('span', 'tm-badge crown', ui('coroa', 26)),
    micoPic),
    () => runTip(c.p, run, state));
  });

  /* ---------- recordes ---------- */
  const records = h('div', 'tower-records',
    tip(h('div', { class: 'trec big', tabindex: 0 }, ui('torre', 52), h('span', 'trec-nums', h('b', null, num(t.best)), h('i', null, `/ ${TOWER_FLOORS}`))), {
      title: 'Recorde', tag: `${t.best}/${TOWER_FLOORS}`, color: '#f2c14e', icon: ui('torre', 36),
      rows: [{ icon: 'torre', text: 'Andar mais alto vencido', value: num(t.best) }, t.best >= MICO_FLOOR ? null : { icon: 'gaiola', text: `O ${COMPANIONS.mico.name} espera no andar ${MICO_FLOOR}`, tone: 'gold' }],
    }),
    tip(h('div', { class: 'trec', tabindex: 0 }, ui('relogio', 40), h('span', 'trec-nums', h('b', null, num(wk.best)), wk.best > 0 && h('i', null, clock(wk.time)))), {
      title: 'Recorde da semana', tag: num(wk.best), icon: ui('relogio', 36),
      rows: [
        { icon: 'torre', text: 'Andar mais alto nesta semana', value: num(wk.best) },
        wk.best > 0 ? { icon: 'relogio', text: 'Tempo da subida', value: clock(wk.time) } : null,
        { text: 'Recomeça toda segunda-feira. Empate desempata pelo tempo.', tone: 'dim' },
      ],
    }));

  /* ---------- próxima subida ---------- */
  const go = () => c.host.startStage(`torre-${t.checkpoint}`);
  const reward = (icon: string, value: string | null, title: string) => tip(h('span', { class: 'trew', tabindex: 0 }, ui(icon, 30), value && h('b', null, value)), { title, icon: ui(icon, 36) });
  const climb = h('div', 'tower-climb',
    tip(h('div', { class: 'tc-head', tabindex: 0 }, h('b', null, `${cur.start}–${cur.end}`)), () => runTip(c.p, cur, 'now')),
    h('div', 'tc-row',
      tip(stat('xp', `Nv ${towerLevel(cur.start)}–${towerLevel(cur.end)}`, { size: 26 }), { title: 'Nível dos monstros', icon: ui('xp', 36), rows: [{ icon: 'poder', text: 'Sobe um pouco a cada andar.', tone: 'dim' }] }),
      tip(h('span', { class: 'stat', tabindex: 0, style: `color:${chapterColor(cur.start)}` }, ui(chapterIcon(cur.start), 26), h('b', null, chapterOf(cur.start).id)),
        { title: `Monstros: ${chapterOf(cur.start).name}`, color: chapterColor(cur.start), icon: ui(chapterIcon(cur.start), 36), rows: [{ icon: 'mapa', text: chapterOf(cur.start).terrain }] }),
      tip(h('span', { class: 'stat', tabindex: 0 }, ui('caveira', 26), h('b', null, cur.end)), { title: `Chefe: ${bossName(cur.start)}`, color: '#ff7b6b', icon: ui('caveira', 36), rows: [{ text: `No ${cur.end}º andar.`, tone: 'dim' }] })),
    h('div', 'tc-rewards',
      reward('ouro', null, 'Ouro a cada andar'), reward('xp', null, 'Experiência a cada andar'),
      reward('tomo', '×2', 'Tomo a cada 5 andares'), reward('gema', '×2', `Gemas no ${cur.end}º andar`), reward('item', '×1', `Item no ${cur.end}º andar`),
      cur.start <= MICO_FLOOR && cur.end >= MICO_FLOOR && !p.companions.mico && reward('gaiola', null, `Resgate do ${COMPANIONS.mico.name} no andar ${MICO_FLOOR}`)),
    tip(h('button', { type: 'button', class: 'btn primary big climb', 'data-fk': 'subir', onclick: go }, ui('torre', 40), 'Subir'), {
      title: `Subir: andares ${cur.start}–${cur.end}`, color: '#f2c14e',
      rows: [{ text: 'Cair encerra a subida, mas os andares vencidos ficam. Vencendo os dez, o próximo marco abre.', tone: 'dim' }],
    }));

  return h('div', 'torre', bg, trail, medals, records, climb);
}
