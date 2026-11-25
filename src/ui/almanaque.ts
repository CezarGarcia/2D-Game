/**
 * Almanaque do Folclore (docs/gdd/09): as conquistas, o bestiário com o texto de cada lenda e os itens com nome.
 * Tudo aqui é leitura do perfil; a única ação é pegar o prêmio de uma conquista.
 */
import { paintHeroBackdrop } from '../art/backdrops';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, type AchievementDef, type AchievementGroup, type AchievementReward } from '../data/achievements';
import type { EnemyKind } from '../data/balance';
import { COMPANION_ORDER, ELEMENTS } from '../data/content';
import { ITEM_TYPES, RARITIES, UNIQUES } from '../data/items';
import { BESTIARY, BESTIARY_KINDS, ENEMY_LORE, type BestiaryEntry } from '../data/lore';
import { CHAPTERS, ENEMY_HINT, ENEMY_NAMES, STAGES } from '../data/stages';
import { achievementProgress, claimAchievement, claimAllAchievements, claimableAchievements } from '../meta/achievements';
import { KNOWLEDGE, killsOf, knowledgeBonus, knowledgeNext } from '../meta/life';
import type { Profile } from '../meta/profile';
import { isChapterOpen } from '../meta/rewards';
import { MAIN_H, MAIN_W, type AlmTab, type Ctx } from './ctx';
import { backdrop, h, hdCanvas, itemIcon, num, pct, stat, ui } from './dom';
import { drawFigure, enemyFigure } from './retratos';
import { tip, type TipRow } from './tip';

const ROLE_LABEL = { comum: 'Comum', elite: 'Grande elite', chefe: 'Encantado' } as const;

/* ---------- quanto do Almanaque já foi preenchido ---------- */

export function almanacCounts(p: Profile): { done: number; total: number; ach: [number, number]; beasts: [number, number]; uniques: [number, number] } {
  const ach: [number, number] = [ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length, ACHIEVEMENTS.length];
  const beasts: [number, number] = [BESTIARY_KINDS.filter((k) => killsOf(p.life, k) > 0).length, BESTIARY_KINDS.length];
  const uniques: [number, number] = [Object.keys(UNIQUES).filter((u) => p.uniquesFound.includes(u)).length, Object.keys(UNIQUES).length];
  const comp = COMPANION_ORDER.filter((id) => p.companions[id]).length;
  return { done: ach[0] + beasts[0] + uniques[0] + comp, total: ach[1] + beasts[1] + uniques[1] + COMPANION_ORDER.length, ach, beasts, uniques };
}

/* ---------- conquistas ---------- */

function rewardStats(r: AchievementReward, size = 20): HTMLElement {
  return h('span', 'alm-rew',
    stat('ouro', num(r.gold), { size, cls: 'gold' }),
    r.mata ? stat('resina', num(r.mata), { size }) : null,
    r.po ? stat('po', num(r.po), { size }) : null,
    r.tomo ? stat('tomo', num(r.tomo), { size }) : null,
    r.lagrima ? stat('lagrima', num(r.lagrima), { size }) : null);
}

function rewardText(r: Required<AchievementReward> | AchievementReward): string {
  return [`+${num(r.gold)} de ouro`, r.mata ? `+${num(r.mata)} de resina` : '', r.po ? `+${r.po} de pó` : '', r.tomo ? `+${r.tomo} ${r.tomo === 1 ? 'tomo' : 'tomos'}` : '', r.lagrima ? `+${r.lagrima} ${r.lagrima === 1 ? 'lágrima' : 'lágrimas'}` : '']
    .filter(Boolean).join(', ');
}

function rewardRows(r: AchievementReward): TipRow[] {
  return [
    { icon: 'ouro', text: 'Ouro', value: `+${num(r.gold)}`, tone: 'ok' },
    r.mata ? { icon: 'resina', text: 'Resina', value: `+${num(r.mata)}`, tone: 'ok' } : null,
    r.po ? { icon: 'po', text: 'Pó de Assombro', value: `+${num(r.po)}`, tone: 'ok' } : null,
    r.tomo ? { icon: 'tomo', text: 'Tomo', value: `+${num(r.tomo)}`, tone: 'ok' } : null,
    r.lagrima ? { icon: 'lagrima', text: 'Lágrima de Encantado', value: `+${num(r.lagrima)}`, tone: 'ok' } : null,
  ];
}

function achCard(c: Ctx, a: AchievementDef): HTMLElement {
  const p = c.p, rec = p.achievements[a.id], got = !!rec, ready = got && !rec.claimed, secret = !!a.hidden && !got;
  const prog = achievementProgress(p, a), frac = got ? 1 : prog / a.target;
  const claim = () => {
    const r = claimAchievement(c.p, a.id);
    if (!r) return;
    c.toast(rewardText(r));
    c.commit(`conq-${a.id}`);
  };
  const state = ready ? 'ready' : got ? 'done' : 'open';
  return tip(h('div', { class: `ach ${state}${secret ? ' secret' : ''}`, tabindex: 0 },
    h('span', 'ach-ico', ui(secret ? 'cadeado' : a.icon, 40)),
    h('div', 'ach-mid',
      h('div', 'ach-name', secret ? '???' : a.name),
      h('div', 'ach-desc', secret ? 'Conquista secreta' : a.desc),
      h('div', 'ach-prog',
        h('span', 'bar ach-bar', h('i', { style: `width:${Math.min(100, frac * 100)}%` })),
        !secret && a.target > 1 && h('b', null, `${num(got ? a.target : prog)}/${num(a.target)}`))),
    h('div', 'ach-side',
      rewardStats(a.reward, 18),
      ready
        ? h('button', { type: 'button', class: 'btn primary small ach-claim', 'data-fk': `conq-${a.id}`, onclick: claim }, 'Pegar')
        : got ? h('span', 'ach-done', ui('check', 22)) : null)),
  () => ({
    title: secret ? 'Conquista secreta' : a.name, color: got ? '#f2c14e' : undefined, icon: ui(secret ? 'cadeado' : a.icon, 36),
    sub: ready ? 'Alcançada: pegue o prêmio' : got ? `Alcançada em ${rec.day.split('-').reverse().join('/')}` : 'Em andamento', subColor: ready ? '#86e07a' : got ? '#b9b2a3' : undefined,
    tag: secret ? undefined : `${num(got ? a.target : prog)}/${num(a.target)}`,
    rows: [{ text: secret ? 'Aparece quando você a alcançar.' : a.desc }, { head: 'Prêmio' }, ...rewardRows(a.reward)],
    foot: [ready ? 'Clique em Pegar' : null],
  }));
}

function achievementsView(c: Ctx): HTMLElement {
  const p = c.p, st = c.st.alm, pending = claimableAchievements(p);
  const order = (a: AchievementDef) => (p.achievements[a.id] ? (p.achievements[a.id].claimed ? 2 : 0) : 1);
  const list = ACHIEVEMENTS.filter((a) => !st.group || a.group === st.group)
    .map((a, i) => ({ a, i, o: order(a), f: achievementProgress(p, a) / a.target }))
    .sort((x, y) => x.o - y.o || (x.o === 1 ? y.f - x.f : 0) || x.i - y.i).map((x) => x.a);
  const chip = (g: { id: AchievementGroup; name: string; icon: string } | null) => {
    const on = st.group === (g?.id ?? null), all = ACHIEVEMENTS.filter((a) => !g || a.group === g.id), got = all.filter((a) => p.achievements[a.id]).length;
    const wait = all.filter((a) => p.achievements[a.id] && !p.achievements[a.id].claimed).length;
    return h('button', {
      type: 'button', class: `alm-group${on ? ' on' : ''}`, 'aria-pressed': String(on), 'data-fk': `grupo-${g?.id ?? 'todas'}`,
      onclick: () => { st.group = g?.id ?? null; c.redraw(`grupo-${g?.id ?? 'todas'}`); },
    }, ui(g?.icon ?? 'conquista', 26), h('span', null, g?.name ?? 'Todas'), h('b', null, `${got}/${all.length}`), wait > 0 && h('i', 'alm-dot', wait));
  };
  return h('div', 'alm-body',
    h('div', 'alm-side', chip(null), ACHIEVEMENT_GROUPS.map((g) => chip(g)),
      h('div', 'alm-side-gap'),
      tip(h('button', {
        type: 'button', class: 'btn primary alm-all', disabled: !pending.length, 'data-fk': 'pegar-tudo',
        onclick: () => { const r = claimAllAchievements(c.p); if (r.count) { c.toast(rewardText(r.reward)); c.commit('pegar-tudo'); } },
      }, ui('bau', 26), pending.length ? `Pegar ${pending.length}` : 'Pegar tudo'),
      { title: 'Pegar tudo', rows: [{ text: pending.length ? `${pending.length} ${pending.length === 1 ? 'prêmio espera' : 'prêmios esperam'} por você.` : 'Nenhum prêmio à espera.', tone: pending.length ? undefined : 'dim' }] })),
    h('div', { class: 'alm-list', role: 'list' }, list.map((a) => achCard(c, a))));
}

/* ---------- bestiário ---------- */

const PW = 128, PH = 118;

function beastPortrait(c: Ctx, kind: EnemyKind, seen: boolean, live: boolean, color: string): HTMLCanvasElement {
  const { cv } = hdCanvas(PW, PH, 'beast-cv');
  const draw = (g: CanvasRenderingContext2D, t: number) => {
    g.clearRect(0, 0, PW, PH);
    g.save(); g.fillStyle = 'rgba(8,14,8,.4)'; g.beginPath(); g.ellipse(PW / 2, PH - 12, 42, 7, 0, 0, Math.PI * 2); g.fill(); g.restore();
    drawFigure(g, enemyFigure(kind), { x: 4, y: 2, w: PW - 8, h: PH - 8 }, t, 0.92, color);
    if (!seen) { g.save(); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#0d1410'; g.fillRect(0, 0, PW, PH); g.restore(); }
  };
  if (seen && live) c.animate(cv, draw);
  else { const g = cv.getContext('2d'); if (g) { try { draw(g, 0.4); } catch { /* sem retrato */ } } }
  return cv;
}

function beastCard(c: Ctx, b: BestiaryEntry, color: string): HTMLElement {
  const p = c.p, kills = killsOf(p.life, b.kind), seen = kills > 0, sel = c.st.alm.kind === b.kind;
  const bonus = knowledgeBonus(kills), next = knowledgeNext(kills), top = KNOWLEDGE[KNOWLEDGE.length - 1].kills;
  return h('button', {
    type: 'button', class: `beast ${b.role}${seen ? '' : ' unseen'}${sel ? ' sel' : ''}`, style: `--ec:${color}`, 'aria-pressed': String(sel), 'data-fk': `bicho-${b.kind}`,
    'aria-label': seen ? `${ENEMY_NAMES[b.kind]}, ${num(kills)} derrotados` : 'Ainda não encontrado',
    onclick: () => { c.st.alm.kind = b.kind; c.redraw(`bicho-${b.kind}`); },
  },
  h('span', 'beast-pic', beastPortrait(c, b.kind, seen, sel, color),
    b.role !== 'comum' && h('span', 'beast-role', ui(b.role === 'chefe' ? 'coroa' : 'elite', 22)),
    bonus > 0 && h('span', 'beast-know', `+${pct(bonus)}`)),
  h('span', 'beast-name', seen ? ENEMY_NAMES[b.kind] : '???'),
  h('span', 'beast-kills', ui('caveira', 20), h('b', null, seen ? num(kills) : '—')),
  h('span', 'bar beast-bar', h('i', { style: `width:${Math.min(100, (kills / (next?.kills ?? top)) * 100)}%` })));
}

function beastDetail(c: Ctx, b: BestiaryEntry, color: string): HTMLElement {
  const p = c.p, kills = killsOf(p.life, b.kind), seen = kills > 0, bonus = knowledgeBonus(kills), next = knowledgeNext(kills);
  if (!seen) {
    return h('div', 'beast-detail unseen',
      h('div', 'bd-head', h('span', 'bd-name', '???'), h('span', 'bd-tag', ROLE_LABEL[b.role])),
      h('p', 'bd-lore', 'Você ainda não derrotou este. Encontre-o nas fases do capítulo para conhecer a história dele.'));
  }
  return h('div', { class: 'beast-detail', style: `--ec:${color}` },
    h('div', 'bd-head', h('span', 'bd-name', ENEMY_NAMES[b.kind]), h('span', 'bd-tag', ROLE_LABEL[b.role])),
    h('p', 'bd-lore', ENEMY_LORE[b.kind] ?? ''),
    h('div', 'bd-rows',
      h('div', 'bd-row', ui('dano', 26), h('span', null, h('b', null, 'Como luta'), ENEMY_HINT[b.kind])),
      h('div', 'bd-row', ui('caveira', 26), h('span', null, h('b', null, 'Derrotados'), num(kills))),
      tip(h('div', { class: 'bd-row', tabindex: 0 }, ui('execucao', 26), h('span', null, h('b', null, 'Conhecer o inimigo'),
        bonus > 0 ? h('em', 'ok', `+${pct(bonus)} de dano contra ele`) : 'Sem bônus ainda',
        next ? `. Faltam ${num(next.kills - kills)} para +${pct(next.bonus)}` : '. No máximo')),
      { title: 'Conhecer o inimigo', icon: ui('execucao', 36), rows: [...KNOWLEDGE.map((k) => ({ icon: 'caveira', text: `${num(k.kills)} derrotados`, value: `+${pct(k.bonus)} de dano`, tone: kills >= k.kills ? 'ok' as const : undefined })), 'sep' as const, { text: 'Não vale na Torre, por causa do ranking.', tone: 'dim' as const }] })));
}

function bestiaryView(c: Ctx): HTMLElement {
  const p = c.p, st = c.st.alm;
  const chapter = CHAPTERS.find((ch) => ch.id === st.chapter) ?? CHAPTERS[0];
  const color = chapter.element ? ELEMENTS[chapter.element].color : '#e9e1f2';
  const list = BESTIARY.filter((b) => b.chapter === chapter.id);
  if (!st.kind || !list.some((b) => b.kind === st.kind)) st.kind = (list.find((b) => killsOf(p.life, b.kind) > 0) ?? list[0]).kind;
  const sel = list.find((b) => b.kind === st.kind) ?? list[0];
  const chips = CHAPTERS.map((ch) => {
    const all = BESTIARY.filter((b) => b.chapter === ch.id), got = all.filter((b) => killsOf(p.life, b.kind) > 0).length, on = ch.id === chapter.id, open = isChapterOpen(p, ch.id);
    const col = ch.element ? ELEMENTS[ch.element].color : '#e9e1f2';
    return tip(h('button', {
      type: 'button', class: `comp-chip${on ? ' on' : ''}${open ? '' : ' shut'}`, style: `--ec:${col}`, 'aria-pressed': String(on), 'data-fk': `cap-${ch.id}`,
      'aria-label': `Capítulo ${ch.id}, ${ch.name}`, onclick: () => { st.chapter = ch.id; st.kind = null; c.redraw(`cap-${ch.id}`); },
    }, ui(open ? ch.element ?? 'credito' : 'cadeado', 26), h('b', null, `${got}/${all.length}`)),
    { title: `Capítulo ${ch.id} · ${ch.name}`, color: col, rows: [{ icon: 'caveira', text: 'Bichos conhecidos', value: `${got} / ${all.length}` }] });
  });
  return h('div', 'alm-body beasts',
    h('div', { class: 'beast-chapters', role: 'group', 'aria-label': 'Capítulo' }, chips),
    h('div', 'beast-row', list.map((b) => beastCard(c, b, color))),
    beastDetail(c, sel, color));
}

/* ---------- itens com nome ---------- */

function uniquesView(c: Ctx): HTMLElement {
  const p = c.p;
  const where = new Map<string, string>();
  for (const s of STAGES) if (s.named) where.set(s.named.unique, s.id);
  const cards = Object.keys(UNIQUES).map((id) => {
    const u = UNIQUES[id], found = p.uniquesFound.includes(id), rar = RARITIES[u.rarity], at = where.get(id);
    return tip(h('div', { class: `uniq${found ? '' : ' unseen'}`, style: `--rar:${rar.color}`, tabindex: 0 },
      h('span', 'uniq-ico', itemIcon(u.type, 52)),
      h('span', 'uniq-mid',
        h('span', 'uniq-name', found ? u.name : '???'),
        h('span', 'uniq-sub', found ? `${ITEM_TYPES[u.type].label} · ${rar.label}` : at ? `Cai na fase ${at}` : 'Ainda não encontrado'))),
    () => ({
      title: found ? u.name : 'Item com nome', color: found ? rar.color : undefined, icon: itemIcon(u.type, 36),
      sub: found ? `${ITEM_TYPES[u.type].label} · ${rar.label}` : 'Ainda não encontrado', subColor: found ? undefined : '#ff7b6b',
      rows: [found ? { icon: 'estrela', text: u.effect, tone: 'gold' as const } : { text: 'O efeito aparece quando você encontrar o item.', tone: 'dim' as const }, at ? { icon: 'mapa', text: 'Só cai na fase', value: at } : null],
    }));
  });
  return h('div', 'alm-body uniques', h('div', 'uniq-grid', cards));
}

/* ---------- a tela ---------- */

const TABS: { id: AlmTab; label: string; icon: string }[] = [
  { id: 'conquistas', label: 'Conquistas', icon: 'conquista' },
  { id: 'bestiario', label: 'Bestiário', icon: 'caveira' },
  { id: 'itens', label: 'Itens com nome', icon: 'estrela' },
];

export function renderAlmanaque(c: Ctx): HTMLElement {
  const p = c.p, st = c.st.alm, n = almanacCounts(p), wait = claimableAchievements(p).length;
  const count: Record<AlmTab, [number, number]> = { conquistas: n.ach, bestiario: n.beasts, itens: n.uniques };
  return h('div', 'almanaque',
    backdrop('companheiros', MAIN_W, MAIN_H, (g) => paintHeroBackdrop(g, MAIN_W, MAIN_H)),
    h('div', 'alm-shade'),
    h('div', 'alm-top',
      h('div', { class: 'alm-tabs', role: 'tablist' }, TABS.map((t) => h('button', {
        type: 'button', class: `alm-tab${st.tab === t.id ? ' on' : ''}`, role: 'tab', 'aria-selected': String(st.tab === t.id), 'data-fk': `alm-${t.id}`,
        onclick: () => { st.tab = t.id; c.redraw(`alm-${t.id}`); },
      }, ui(t.icon, 30), h('span', null, t.label), h('b', null, `${count[t.id][0]}/${count[t.id][1]}`), t.id === 'conquistas' && wait > 0 && h('i', 'alm-dot', wait)))),
      tip(h('div', { class: 'alm-total', tabindex: 0 }, ui('almanaque', 34), h('span', 'alm-total-mid', h('b', null, pct(n.done / n.total)), h('span', 'bar', h('i', { style: `width:${(n.done / n.total) * 100}%` })))),
        { title: 'Almanaque do Folclore', icon: ui('almanaque', 36), tag: pct(n.done / n.total), rows: [
          { icon: 'conquista', text: 'Conquistas', value: `${n.ach[0]} / ${n.ach[1]}` },
          { icon: 'caveira', text: 'Bichos conhecidos', value: `${n.beasts[0]} / ${n.beasts[1]}` },
          { icon: 'estrela', text: 'Itens com nome', value: `${n.uniques[0]} / ${n.uniques[1]}` },
          { icon: 'companheiros', text: 'Companheiros', value: `${COMPANION_ORDER.filter((id) => p.companions[id]).length} / ${COMPANION_ORDER.length}` },
        ] })),
    st.tab === 'bestiario' ? bestiaryView(c) : st.tab === 'itens' ? uniquesView(c) : achievementsView(c));
}
