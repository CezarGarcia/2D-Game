/**
 * Diário: as três missões do dia com o baú, o descanso guardado e as expedições de hoje.
 * Tudo vira à meia-noite (hora local); o relógio no canto mostra quanto falta.
 */
import { paintHeroBackdrop } from '../art/backdrops';
import { ELEMENTS, type ElementId } from '../data/content';
import { EXP_MODS, EXP_REWARDED_RUNS, EXP_SLOTS, MISSIONS, REST_MAX_DAYS, expeditionBase, type MissionKind } from '../data/daily';
import { CHAPTERS, ENEMY_NAMES } from '../data/stages';
import {
  chestPreview, chestReady, claimChest, claimMission, expeditionRunsLeft, expeditionsToday, expeditionsUnlocked, missionDone, missionHint,
  missionText, msToMidnight, canReroll, rerollMission, rerollsLeft, restInfo, type ExpeditionInfo, type Reward,
} from '../meta/daily';
import type { MissionState, Profile } from '../meta/profile';
import { MAIN_H, MAIN_W, type Ctx } from './ctx';
import { backdrop, gemIcon, h, itemIcon, num, stat, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

function chapterLook(id: number): { icon: string; color: string; name: string } {
  const ch = CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
  return { icon: ch.element ?? 'credito', color: ch.element ? ELEMENTS[ch.element].color : '#e9e1f2', name: ch.name };
}

/** Tempo até a meia-noite: "5h 12min". */
function untilMidnight(): string {
  const min = Math.max(1, Math.ceil(msToMidnight() / 60000)), hrs = Math.floor(min / 60);
  return hrs > 0 ? `${hrs}h ${String(min % 60).padStart(2, '0')}min` : `${min}min`;
}

function missionIcon(m: MissionState, size: number): HTMLCanvasElement {
  const kind = m.kind as MissionKind;
  if (kind === 'elemento') return ui(String(m.param), size);
  if (kind === 'capitulo') return ui(chapterLook(Number(m.param)).icon, size);
  if (kind === 'arma') return itemIcon(String(m.param), size);
  return ui(MISSIONS[kind]?.icon ?? 'estrela', size);
}

function missionColor(m: MissionState): string | undefined {
  if (m.kind === 'elemento') return ELEMENTS[m.param as ElementId]?.color;
  if (m.kind === 'capitulo') return chapterLook(Number(m.param)).color;
  return undefined;
}

/** Recompensa em ícone + número. */
function rewardRow(r: Reward, size = 24): HTMLElement {
  return h('div', 'dia-rew',
    stat('ouro', num(r.gold), { size, cls: 'gold' }),
    stat('resina', num(r.mata), { size }),
    r.po > 0 && stat('po', num(r.po), { size }),
    r.tomo > 0 && stat('tomo', num(r.tomo), { size }),
    r.gem && h('span', 'stat', gemIcon(r.gem.el, size), h('b', null, `Nv ${r.gem.lvl}`)));
}

function rewardRows(r: Reward): TipRow[] {
  return [
    { icon: 'ouro', text: 'Ouro', value: `+${num(r.gold)}`, tone: 'ok' },
    { icon: 'resina', text: 'Resina', value: `+${num(r.mata)}`, tone: 'ok' },
    r.po > 0 ? { icon: 'po', text: 'Pó de Assombro', value: `+${num(r.po)}`, tone: 'ok' } : null,
    r.tomo > 0 ? { icon: 'tomo', text: 'Tomo', value: `+${num(r.tomo)}`, tone: 'ok' } : null,
    r.gem ? { icon: 'gema', text: 'Gema de elemento sorteado', value: `Nv ${r.gem.lvl}`, tone: 'ok' } : null,
  ];
}

function rewardToast(r: Reward): string {
  return [`+${num(r.gold)} de ouro`, `+${num(r.mata)} de resina`, r.po > 0 && `+${r.po} de pó`, r.tomo > 0 && `+${r.tomo} ${r.tomo === 1 ? 'tomo' : 'tomos'}`, r.gem && 'uma gema']
    .filter(Boolean).join(', ');
}

/* ---------- missões ---------- */

function missionCard(c: Ctx, m: MissionState, i: number): HTMLElement {
  const done = missionDone(m), color = missionColor(m), frac = Math.min(1, m.progress / m.target);
  const claim = () => {
    const r = claimMission(c.p, i);
    if (!r) return;
    c.toast(rewardToast(r));
    c.commit(`missao-${i}`);
  };
  const state = m.claimed ? 'claimed' : done ? 'ready' : 'open';
  return tip(h('div', { class: `dia-mission ${state}`, style: color ? `--mc:${color}` : null, tabindex: 0 },
    h('span', 'dm-ico', missionIcon(m, 46)),
    h('div', 'dm-mid',
      h('div', 'dm-text', missionText(m)),
      h('div', 'dm-prog',
        h('span', 'bar dm-bar', h('i', { style: `width:${frac * 100}%` })),
        h('b', null, `${num(Math.min(m.progress, m.target))}/${num(m.target)}`)),
      rewardRow(m.reward, 22)),
    m.claimed
      ? h('span', 'dm-done', ui('check', 34))
      : !done && canReroll(c.p, i)
        ? tip(h('button', { type: 'button', class: 'btn dm-claim dm-swap', 'data-fk': `missao-${i}`, onclick: (e: Event) => { e.stopPropagation(); const fresh = rerollMission(c.p, i); if (fresh) { c.toast(`Nova missão: ${missionText(fresh)}`); c.commit(`missao-${i}`); } } }, ui('trocar', 26), 'Trocar'),
          { title: 'Trocar de missão', icon: ui('trocar', 36), tag: `${rerollsLeft(c.p)} hoje`, rows: [{ text: 'Sorteia outra missão no lugar desta. O progresso dela se perde.' }, { text: 'Uma troca grátis por dia.', tone: 'dim' }] })
        : h('button', { type: 'button', class: `btn ${done ? 'primary' : ''} dm-claim`, disabled: !done, 'data-fk': `missao-${i}`, onclick: claim }, done ? 'Pegar' : ui('cadeado', 24))),
  () => ({
    title: missionText(m), color: color ?? '#f2c14e', icon: missionIcon(m, 36), tag: `${num(Math.min(m.progress, m.target))}/${num(m.target)}`,
    sub: m.claimed ? 'Recompensa recebida' : done ? 'Pronta: pegue a recompensa' : 'Em andamento', subColor: m.claimed ? '#b9b2a3' : done ? '#86e07a' : undefined,
    rows: [{ text: missionHint(m), tone: 'dim' }, { head: 'Recompensa' }, ...rewardRows(m.reward)],
    foot: [done && !m.claimed ? 'Clique em Pegar' : null],
  }));
}

function chestRow(c: Ctx): HTMLElement {
  const p = c.p, d = p.daily, ready = chestReady(p), prev = chestPreview(p), n = d.missions.filter(missionDone).length;
  const open = () => {
    const r = claimChest(c.p);
    if (!r) return;
    c.toast(`Baú: ${rewardToast(r)}`);
    c.commit('bau-diario');
  };
  return tip(h('div', { class: `dia-chest${ready ? ' ready' : ''}${d.chest ? ' open' : ''}`, tabindex: 0 },
    h('span', 'dc-ico', ui('bau', 54)),
    h('div', 'dc-mid',
      h('div', 'dc-pips', d.missions.map((m) => h('span', `dc-pip${missionDone(m) ? ' on' : ''}`, missionDone(m) ? ui('check', 18) : null)), h('span', 'dc-label', 'Baú das três')),
      rewardRow(prev, 22)),
    d.chest ? h('span', 'dm-done', ui('check', 34))
      : h('button', { type: 'button', class: `btn ${ready ? 'primary' : ''} dm-claim`, disabled: !ready, 'data-fk': 'bau-diario', onclick: open }, ready ? 'Abrir' : `${n}/${d.missions.length}`)),
  () => ({
    title: 'Baú das três missões', color: '#f2c14e', icon: ui('bau', 36), tag: `${n}/${d.missions.length}`,
    sub: d.chest ? 'Aberto hoje' : ready ? 'Pronto para abrir' : 'Cumpra as três missões', subColor: ready ? '#86e07a' : undefined,
    rows: [{ head: 'Recompensa' }, ...rewardRows(prev)],
  }));
}

/* ---------- descanso ---------- */

function restPanel(p: Profile): HTMLElement {
  const r = restInfo(p), on = r.pool > 0;
  return tip(h('div', { class: `dia-rest${on ? ' on' : ''}`, tabindex: 0 },
    h('span', 'dr-ico', ui('descanso', 64)),
    h('div', 'dr-mid',
      h('div', 'dr-head', h('b', null, 'Descanso'), on && h('span', 'dr-x2', 'XP x2')),
      on
        ? [h('span', 'bar dr-bar', h('i', { style: `width:${Math.min(100, (r.pool / r.cap) * 100)}%` })),
          h('div', 'dr-text', `${num(r.pool)} de experiência em dobro`)]
        : h('div', 'dr-text dim', 'Passe um dia fora e volte com experiência em dobro.'))),
  {
    title: 'Bônus de descanso', color: '#cdb8ff', icon: ui('descanso', 36), tag: on ? 'XP x2' : undefined,
    rows: [
      on ? { icon: 'xp', text: 'Experiência em dobro guardada', value: num(r.pool), tone: 'ok' } : null,
      on && r.days > 0 ? { icon: 'relogio', text: `Você ficou ${r.days} ${r.days === 1 ? 'dia' : 'dias'} fora` } : null,
      'sep',
      { icon: 'descanso', text: 'Por dia inteiro fora', value: `+${num(r.perDay)}` },
      { icon: 'mais', text: `Acumula até ${REST_MAX_DAYS} dias`, value: num(r.cap) },
      { text: 'Fases, Torre e expedições: a experiência ganha vem de novo, até o descanso acabar.', tone: 'dim' },
    ],
  });
}

/* ---------- expedições ---------- */

function expTip(p: Profile, e: ExpeditionInfo): () => TipSpec {
  return () => {
    const look = chapterLook(e.chapter), mod = EXP_MODS[e.mod], base = expeditionBase(e.level, e.slot, e.mod), left = expeditionRunsLeft(p);
    const kinds = Array.from(new Set(e.stage.rooms.filter((r) => r.type === 'combat').flatMap((r) => r.waves.flat().map((s) => s.kind))));
    const elite = e.stage.rooms.find((r) => r.type === 'elite')?.waves[0]?.[0];
    return {
      title: e.stage.name, tag: `Nv ${e.level}`, color: look.color, icon: ui(look.icon, 36),
      sub: `${e.stage.rooms.length} salas${elite ? ', elite no fim' : ''}`,
      rows: [
        { icon: mod.icon, text: mod.name, tone: 'warn' },
        { text: mod.desc, tone: 'dim' },
        { head: 'Monstros' },
        { icon: 'dano', text: kinds.map((k) => ENEMY_NAMES[k]).join(', ') },
        elite ? { icon: 'elite', text: `Elite: ${ENEMY_NAMES[elite.kind]}`, tone: 'warn' } : null,
        { head: 'Recompensas' },
        { icon: 'xp', text: 'Experiência', value: num(base.xp) },
        { icon: 'ouro', text: 'Ouro', value: num(base.gold) },
        { icon: 'resina', text: 'Resina', value: num(base.mata) },
        { icon: 'po', text: 'Pó de Assombro', value: num(base.po) },
        !e.firstDone ? { icon: 'novo', text: '1ª vitória do dia: resina em dobro, tomo e item', tone: 'gold' } : null,
        left <= 0 ? { icon: 'cadeado', text: 'Recompensas de hoje esgotadas: só experiência', tone: 'bad' } : null,
      ],
      foot: ['Clique em Partir'],
    };
  };
}

function expCard(c: Ctx, e: ExpeditionInfo): HTMLElement {
  const look = chapterLook(e.chapter), mod = EXP_MODS[e.mod], base = expeditionBase(e.level, e.slot, e.mod), slot = EXP_SLOTS[e.slot];
  return tip(h('div', { class: `dia-exp${e.firstDone ? ' done' : ''}`, style: `--ec:${look.color}`, tabindex: 0 },
    h('div', 'de-top',
      h('span', 'de-medal', ui(look.icon, 40)),
      h('div', 'de-name', h('b', null, slot.name, h('i', 'de-lv', `Nv ${e.level}`)), h('span', null, look.name)),
      h('button', { type: 'button', class: 'btn primary de-go', 'data-fk': `exp-${e.slot}`, onclick: () => c.host.startStage(e.id) }, ui('expedicao', 28), 'Partir')),
    h('div', 'de-mod', ui(mod.icon, 30), h('div', null, h('b', null, mod.name), h('span', null, mod.desc))),
    h('div', 'dia-rew',
      stat('xp', num(base.xp), { size: 22 }),
      stat('ouro', num(base.gold), { size: 22, cls: 'gold' }),
      stat('resina', num(base.mata), { size: 22 }),
      stat('po', num(base.po), { size: 22 }),
      !e.firstDone && h('span', 'de-first', ui('novo', 20), '1ª vitória x2'))),
  expTip(c.p, e));
}

export function renderDiario(c: Ctx): HTMLElement {
  const p = c.p, d = p.daily;
  const bg = backdrop('diario', MAIN_W, MAIN_H, (g) => paintHeroBackdrop(g, MAIN_W, MAIN_H));
  const exps = expeditionsToday(p), left = expeditionRunsLeft(p);

  const missions = h('section', 'dia-panel dia-missions',
    h('header', 'dia-head',
      h('span', 'plate', ui('diario', 30), 'Missões do dia'),
      tip(h('span', { class: 'dia-clock', tabindex: 0 }, ui('relogio', 24), untilMidnight()), {
        title: 'Novas missões', icon: ui('relogio', 36), rows: [{ text: 'Missões, baú e expedições mudam à meia-noite.', tone: 'dim' }, { icon: 'relogio', text: 'Falta', value: untilMidnight() }],
      })),
    h('div', 'dia-list', d.missions.map((m, i) => missionCard(c, m, i))),
    d.missions.length > 0 && chestRow(c));

  const expBody = !expeditionsUnlocked(p)
    ? h('div', 'dia-locked', ui('cadeado', 64), h('span', 'plate', 'Fase 1-2'), h('p', null, 'Abrem com o ferreiro: vença a fase 1-2.'))
    : exps.length
      ? h('div', 'dia-exps', exps.map((e) => expCard(c, e)))
      : h('div', 'dia-locked', ui('mapa', 56), h('p', null, 'Vença mais fases para abrir as expedições.'));
  const expeditions = h('section', 'dia-panel dia-exp-panel',
    h('header', 'dia-head',
      h('span', 'plate', ui('expedicao', 30), 'Expedições'),
      expeditionsUnlocked(p) && tip(h('span', { class: `dia-runs${left > 0 ? '' : ' out'}`, tabindex: 0 }, ui('bau', 26), h('b', null, `${left}/${EXP_REWARDED_RUNS}`)), {
        title: 'Vitórias que pagam hoje', tag: `${left}/${EXP_REWARDED_RUNS}`, icon: ui('bau', 36),
        rows: [{ text: `As ${EXP_REWARDED_RUNS} primeiras vitórias do dia em expedição pagam ouro e material. Depois, só experiência.`, tone: 'dim' }, { icon: 'novo', text: 'A primeira vitória em cada expedição paga resina em dobro, um tomo e um item.', tone: 'gold' }],
      })),
    expBody);

  return h('div', 'diario', bg, h('div', 'dia-shade'), missions, restPanel(p), expeditions);
}
