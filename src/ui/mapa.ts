/** Mapa: o capítulo ilustrado em tela inteira, uma medalha por fase. Tudo o mais aparece no tooltip. */
import { paintChapterMap } from '../art/backdrops';
import { COMPANIONS, ELEMENTS } from '../data/content';
import { ITEM_TYPES, RARITIES, UNIQUES } from '../data/items';
import { stageGold, stageXp } from '../data/progression';
import { CHAPTERS, ENEMY_NAMES, MOD_NAMES, STAGES, stagesOf, type ChapterDef, type StageDef } from '../data/stages';
import { OMEN, cleanOmens, omenWeight } from '../data/omens';
import { isDreamUnlocked } from '../meta/dream';
import type { Profile } from '../meta/profile';
import { STAR_CHESTS, isChapterOpen, stageInfo, totalStars, type StageInfo, type StageTag } from '../meta/rewards';
import { MAIN_H, MAIN_W, markSeen, unseen, type Ctx } from './ctx';
import { backdrop, clock, h, num, pct, star, trimBackdrops, ui } from './dom';
import { omenRows } from './sonhoprep';
import { tip, type TipRow, type TipSpec } from './tip';

const TAG_COLOR: Record<StageTag, string> = { verde: '#5fcb6a', amarela: '#f2c14e', cinza: '#9aa39a', vermelha: '#ff6b55' };
/* a Terra Sem Nome não tem elemento: usa a cor do papel apagado e o livro das histórias */
const NAMELESS = { icon: 'credito', color: '#e9e1f2' };

function chapterIcon(ch: ChapterDef): string { return ch.element ?? NAMELESS.icon; }
function chapterColor(ch: ChapterDef): string { return ch.element ? ELEMENTS[ch.element].color : NAMELESS.color; }

/* ---------- cartão de história: aparece uma vez quando um capítulo abre ---------- */

/** Capítulo aberto cuja história o jogador ainda não viu (o mais adiantado), ou nulo. */
export function pendingStory(p: Profile): ChapterDef | null {
  const open = CHAPTERS.filter((ch) => isChapterOpen(p, ch.id));
  const fresh = unseen('capitulos', open.map((ch) => String(ch.id)));
  if (!fresh.length) return null;
  return CHAPTERS.find((ch) => ch.id === Number(fresh[fresh.length - 1])) ?? null;
}

/** Fecha o cartão: todos os capítulos abertos contam como vistos. */
export function dismissStory(p: Profile): void {
  markSeen('capitulos', CHAPTERS.filter((ch) => isChapterOpen(p, ch.id)).map((ch) => String(ch.id)));
}

function storyCard(c: Ctx, ch: ChapterDef): HTMLElement {
  const color = chapterColor(ch);
  const close = () => {
    dismissStory(c.p);
    const first = stagesOf(ch.id).map((s) => stageInfo(c.p, s)).find((i) => i.unlocked && !i.record.cleared);
    c.st.chapter = ch.id; c.st.mapSel = first?.stage.id ?? c.st.mapSel;
    c.redraw('jogar');
  };
  return h('div', { class: 'story-back', onclick: (e: Event) => { if (e.target === e.currentTarget) close(); } },
    h('div', { class: 'story', style: `--ec:${color}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': `Capítulo ${ch.id}: ${ch.name}` },
      h('div', 'story-medal', ui(chapterIcon(ch), 92)),
      h('div', 'story-num', `Capítulo ${ch.id}`),
      h('h1', 'story-name', ch.name),
      h('div', 'story-who', ui('supremo', 26), ch.encantado),
      h('p', 'story-text', ch.story),
      h('div', 'story-terrain', ui('mapa', 24), ch.terrain),
      h('button', { type: 'button', class: 'btn primary big', 'data-fk': 'story-ok', onclick: close }, ui('seta', 30), 'Vamos')));
}

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
const HUNT_RUNS = [1, 3, 5, 10];
const HUNT_SPEEDS = [1, 2, 3];

export function renderMapa(c: Ctx): HTMLElement {
  const p = c.p;
  const chapter = CHAPTERS.find((ch) => ch.id === c.st.chapter) ?? CHAPTERS[0];
  const stages = stagesOf(chapter.id), infos = stages.map((s) => stageInfo(p, s));
  const points = stages.map(pos);
  const next = infos.find((i) => i.unlocked && !i.record.cleared)?.stage.id ?? null;
  const sel = infos.find((i) => i.stage.id === c.st.mapSel && i.unlocked) ?? null;

  /* Presságios da campanha: só nas fases que já têm as 3 estrelas, depois que o Sonho abre */
  const omens = cleanOmens(c.st.omens, true), dreamOpen = isDreamUnlocked(p);
  const omenOk = (id: string) => dreamOpen && !!infos.find((i) => i.stage.id === id)?.record.stars.every(Boolean);
  const play = (id: string) => c.host.startStage(id, omenOk(id) && omenWeight(omens) > 0 ? { omens } : undefined);
  const hunt = (id: string) => c.host.startStage(id, { auto: { runs: c.st.huntRuns, speed: c.st.huntSpeed } });
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
      boss ? ui('caveira', 52) : !info.unlocked ? ui('cadeado', 32) : h('b', null, st.number)),
    st.final === 'elite' && h('span', 'node-badge tr', ui('elite', 26)),
    boss && h('span', 'node-badge tr num', info.unlocked ? st.number : ui('cadeado', 22)),
    cage && h('span', 'node-badge tl', ui('gaiola', 28)),
    info.unlocked && h('span', 'node-stars', info.record.stars.map((on) => star(on, 17)))),
    () => stageTip(p, info));
  });

  let playPop: HTMLElement | null = null;
  if (sel) {
    const pt = points[stages.indexOf(sel.stage)], r = sel.stage.final === 'chefao' ? 42 : 34;
    const below = pt.y + r + 26 + 52 <= MAIN_H - 6;
    /* Caçada automática: só em fase com as três estrelas, e nunca no chefão do capítulo */
    const st3 = sel.record.stars.every(Boolean), bossStage = sel.stage.number === 12, canHunt = sel.record.cleared && st3 && !bossStage;
    const cycle = <T,>(list: T[], cur: T): T => list[(list.indexOf(cur) + 1) % list.length];
    const peso = st3 && dreamOpen ? omenWeight(omens) : 0;
    const huntRow = sel.record.cleared ? h('div', `hunt${canHunt ? '' : ' off'}`,
      tip(h('button', { type: 'button', class: 'btn small hunt-go', disabled: !canHunt, 'data-fk': 'cacada', onclick: () => hunt(sel.stage.id) }, ui('auto', 24), 'Automático'), () => ({
        title: 'Caçada automática', icon: ui('auto', 36), color: canHunt ? '#f2c14e' : undefined,
        sub: canHunt ? `${c.st.huntRuns} ${c.st.huntRuns === 1 ? 'vez' : 'vezes'} seguidas, em ${c.st.huntSpeed}x` : bossStage ? 'O chefão é sempre na mão' : 'Abre com as 3 estrelas da fase', subColor: canHunt ? undefined : '#ff7b6b',
        rows: [
          { text: 'O herói luta sozinho, como alguém atento mas que erra. Rende o mesmo que jogar na mão.' },
          { text: 'Para se o herói cair ou a mochila encher. Esc pausa; V muda a velocidade.', tone: 'dim' },
        ],
      })),
      canHunt && tip(h('button', { type: 'button', class: 'chip hunt-chip', 'data-fk': 'cacada-vezes', 'aria-label': `Repetições: ${c.st.huntRuns}`, onclick: () => { c.st.huntRuns = cycle(HUNT_RUNS, c.st.huntRuns); c.redraw('cacada-vezes'); } }, `${c.st.huntRuns} ${c.st.huntRuns === 1 ? 'vez' : 'vezes'}`),
        { title: 'Repetições', rows: [{ text: 'Quantas vezes seguidas a fase é jogada. Clique para mudar.' }] }),
      canHunt && tip(h('button', { type: 'button', class: 'chip hunt-chip', 'data-fk': 'cacada-vel', 'aria-label': `Velocidade: ${c.st.huntSpeed}x`, onclick: () => { c.st.huntSpeed = cycle(HUNT_SPEEDS, c.st.huntSpeed); c.redraw('cacada-vel'); } }, `${c.st.huntSpeed}x`),
        { title: 'Velocidade', rows: [{ text: 'A velocidade da luta. Clique para mudar; na fase, a tecla V também muda.' }] }),
      st3 && dreamOpen && tip(h('button', { type: 'button', class: `chip hunt-chip omen-chip${peso ? ' on' : ''}`, 'data-fk': 'pressagios', 'aria-label': `Presságios: Peso ${peso}`, onclick: () => { c.st.omenOpen = true; c.redraw('omen-fechar'); } }, ui('olho', 20), peso ? `Peso ${peso}` : 'Presságios'),
        () => ({ title: 'Presságios', icon: ui('olho', 36), color: '#c8a8ff', sub: peso ? `+${pct(OMEN.rarityPerPoint * peso)} de chance de raridade maior, +${pct(OMEN.goldPerPoint * peso)} de ouro` : 'Deixe a fase mais difícil e melhore o saque', subColor: peso ? '#86e07a' : undefined,
          rows: [{ text: 'Valem só ao jogar na mão, nas fases que já têm as 3 estrelas.' }, sel.record.omen ? { icon: 'coroa', text: 'Maior Peso já vencido aqui', value: String(sel.record.omen) } : null] }))) : null;
    const tall = huntRow ? 100 : 52, left = Math.max(st3 && dreamOpen ? 200 : 126, Math.min(MAIN_W - (st3 && dreamOpen ? 200 : 126), pt.x));
    const under = pt.y + r + 26 + tall <= MAIN_H - 6;
    void below;
    playPop = h('div', { class: `play-pop${under ? '' : ' above'}`, style: `left:${left}px;top:${under ? pt.y + r + 26 : pt.y - r - 10 - tall}px` },
      h('button', { type: 'button', class: 'btn primary big play', 'data-fk': 'jogar', onclick: () => play(sel.stage.id) }, ui('dano', 30), 'Jogar'),
      huntRow);
  }

  const idx = CHAPTERS.indexOf(chapter);
  const arrow = (dir: -1 | 1) => {
    const to = CHAPTERS[idx + dir];
    return h('button', { type: 'button', class: `round-btn chap-arrow${dir < 0 ? ' prev' : ''}`, disabled: !to, 'aria-label': dir < 0 ? 'Capítulo anterior' : 'Próximo capítulo', onclick: () => to && goChapter(to.id) }, ui('seta', 26));
  };
  /* oito capítulos não cabem com nome: só o escolhido mostra nome e estrelas, os outros são medalhas */
  const chapters = h('div', 'chap-bar',
    arrow(-1),
    CHAPTERS.map((ch) => {
      const open = isChapterOpen(p, ch.id), max = stagesOf(ch.id).length * 3, got = totalStars(p, ch.id), on = ch.id === chapter.id;
      const prev = stagesOf(ch.id - 1), done = open && stagesOf(ch.id).every((s) => stageInfo(p, s).record.cleared);
      return tip(h('button', {
        type: 'button', class: `chap${on ? ' on' : ''}${open ? '' : ' locked'}${done ? ' done' : ''}`, style: `--ec:${chapterColor(ch)}`, 'aria-pressed': String(on),
        'aria-label': `Capítulo ${ch.id}, ${ch.name}${open ? '' : ', trancado'}`, 'data-fk': `cap-${ch.id}`, onclick: () => goChapter(ch.id),
      },
      h('span', 'chap-ico', ui(open ? chapterIcon(ch) : 'cadeado', on ? 30 : 28), !on && h('b', 'chap-n', ch.id)),
      on && h('span', 'chap-name', ch.name),
      on && open && h('span', 'chap-stars', star(true, 14), `${got}/${max}`)),
      () => ({
        title: `Capítulo ${ch.id} · ${ch.name}`, color: open ? chapterColor(ch) : undefined, icon: ui(chapterIcon(ch), 36),
        sub: open ? `Encantado: ${ch.encantado}` : 'Trancado', subColor: open ? undefined : '#ff7b6b',
        rows: [
          { icon: 'mapa', text: ch.terrain },
          'sep',
          open ? { node: star(true, 18), text: 'Estrelas', value: `${got} / ${max}`, tone: got === max ? 'gold' : undefined } : null,
          !open && prev.length ? { icon: 'cadeado', text: `Vença a fase ${prev[prev.length - 1].id}`, tone: 'bad' } : null,
        ],
        foot: [open && !on ? 'Clique: ver o capítulo' : null],
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

  const bg = backdrop(`mapa-${chapter.id}`, MAIN_W, MAIN_H, (g) => paintChapterMap(g, MAIN_W, MAIN_H, chapter.id, points), 2);
  trimBackdrops('mapa-', 3);
  const story = pendingStory(p);
  return h('div', 'mapa',
    bg,
    nodes,
    playPop,
    chapters,
    chest,
    story && storyCard(c, story),
    c.st.omenOpen && h('div', { class: 'omen-pop', onclick: (e: Event) => { if (e.target === e.currentTarget) { c.st.omenOpen = false; c.redraw('pressagios'); } } },
      h('div', { class: 'panel omen-pop-in', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Presságios da fase' },
        h('div', 'omen-pop-title', ui('olho', 34), 'Presságios', h('span', null, `Peso ${omenWeight(omens)} de ${OMEN.campaignMax}`)),
        h('div', 'omen-pop-bonus', omenWeight(omens) > 0 ? `+${pct(OMEN.rarityPerPoint * omenWeight(omens))} de chance de raridade maior em cada item  ·  +${pct(OMEN.goldPerPoint * omenWeight(omens))} de ouro` : 'Cada ponto de Peso melhora a raridade dos itens e o ouro da fase.'),
        h('div', 'omens-grid one', omenRows(omens, (next, fk) => { c.st.omens = next; c.redraw(fk); }, { combatOnly: true, cap: OMEN.campaignMax, toast: (t) => c.toast(t, 'bad') })),
        h('div', 'omen-pop-foot',
          omenWeight(omens) > 0 && h('button', { type: 'button', class: 'btn small', 'data-fk': 'omen-limpar', onclick: () => { c.st.omens = {}; c.redraw('omen-limpar'); } }, 'Limpar'),
          h('button', { type: 'button', class: 'btn primary', 'data-fk': 'omen-fechar', onclick: () => { c.st.omenOpen = false; c.redraw('pressagios'); } }, 'Pronto')))));
}
