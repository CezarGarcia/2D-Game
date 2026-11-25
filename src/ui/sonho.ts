/**
 * O Sonho (docs/gdd/09): as telas do modo de sessão curta.
 * - sem noite em andamento: escolher arma, feitiços, companheiro e Supremo, e gastar Lembranças na Aldeia;
 * - com noite em andamento: o mapa do trecho, com o que o herói carrega embaixo;
 * - por cima do mapa, as telas dos nós que não são sala: Feira, Fonte, Causo e as escolhas de amuleto e de bênção;
 * - ao acordar: o resumo da noite.
 * As regras estão todas em src/meta/dream.ts; aqui só se lê a noite e se chamam aquelas funções.
 */
import { paintDreamBackdrop } from '../art/sonho';
import { AMULETS, AMULET_RARITY, type AmuletId } from '../data/amulets';
import { CAUSOS } from '../data/causos';
import {
  BLESSINGS, BLESSING_TIER_COLOR, BLESSING_TIER_LABEL, COMPANIONS, ELEMENTS, ELEMENT_ORDER, PATRONS, PATRON_STEPS, PATRON_TIERS, SPELLS, SUPREMOS, blessingCounts, patronCounts, patronTier,
  type BlessingId, type SpellId,
} from '../data/content';
import { DREAM, NODE_INFO, TRIAL_INFO, type DreamNode } from '../data/dream';
import { ITEM_TYPES, type WeaponKind } from '../data/items';
import { CHAPTERS, ENEMY_NAMES } from '../data/stages';
import { BUILDINGS, BUILDING_ORDER } from '../data/village';
import {
  abandonNight, buildCost, buyAmulet, buyBlessing, buyHeal, causoAffordable, chooseAmulet, chooseBlessingOffer, chooseCauso, currentNode, currentStageId, currentTrecho, defaultChoice,
  dreamChapters, enterNode, feiraPrice, fountainHeal, isDreamUnlocked, leaveNode, memoryBonus, nightOptions, reachable, removeBlessing, rerollFeira, runStats, startNight, upgradable, useFountain, validChoice,
  breath, equippedCordeis, forgottenSlot, isLate, startWeeklyNight, weeklyNight, weeklyRecord,
  type DreamRun, type NightChoice, type NightEnd, type Resolved,
} from '../meta/dream';
import { OMENS, OMEN_ORDER, HURRY_SECONDS, omenGrade, omenMemories, omenWeight } from '../data/omens';
import { CORDEIS, cordelCost, type CordelId } from '../data/cordeis';
import { MAIN_H, MAIN_W, type Ctx } from './ctx';
import { renderAldeia } from './aldeia';
import { saveNightSummary } from './resumo';
import { rodaPanel } from './roda';
import { aspectPicks, cordeisView, omensView } from './sonhoprep';
import { backdrop, clock, h, hdCanvas, itemIcon, num, pct, s, signed, stat, ui, type Child } from './dom';
import { FREED, drawFigure } from './retratos';
import { tip, type TipRow, type TipSpec } from './tip';

const sky = () => backdrop('sonho', MAIN_W, MAIN_H, (g) => paintDreamBackdrop(g, MAIN_W, MAIN_H));
const plural = (n: number, one: string, many: string) => `${num(n)} ${n === 1 ? one : many}`;

/* ---------- peças: bênção e amuleto ---------- */

function blessTip(id: BlessingId, n = 0): TipSpec {
  const b = BLESSINGS[id];
  return {
    title: b.name, color: BLESSING_TIER_COLOR[b.tier], icon: ui(b.icon, 36), tag: n > 0 && b.max > 1 && b.max < 9 ? `${n}/${b.max}` : undefined,
    sub: b.kind === 'desperta' ? `Despertar de ${BLESSINGS[b.awakens!].name}` : b.pair ? `Compadrio: ${PATRONS[b.pair[0]].name} e ${PATRONS[b.pair[1]].name}` : `${BLESSING_TIER_LABEL[b.tier]}${b.patron ? ` · ${PATRONS[b.patron].name}` : ''}`,
    rows: [{ text: b.desc }],
  };
}

function amuletTip(id: AmuletId): TipSpec {
  const a = AMULETS[id], r = AMULET_RARITY[a.rarity];
  return { title: a.name, color: r.color, icon: ui(a.icon, 36), sub: `Amuleto · ${r.label}`, rows: [{ text: a.desc }, 'sep', { text: a.lore, tone: 'dim' }] };
}

/** Medalha pequena de uma bênção que o herói já tem. */
export function blessChip(id: BlessingId, n: number, onClick?: () => void): HTMLElement {
  const b = BLESSINGS[id];
  return tip(h(onClick ? 'button' : 'span', { type: onClick ? 'button' : null, class: `bchip t${b.tier}`, style: `--tc:${BLESSING_TIER_COLOR[b.tier]}`, tabindex: onClick ? null : 0, onclick: onClick ?? null },
    ui(b.icon, 26), n > 1 && h('b', null, n)), () => blessTip(id, n));
}

function amuletChip(id: AmuletId, size = 44): HTMLElement {
  const a = AMULETS[id];
  return tip(h('span', { class: `amu ${a.rarity}`, style: `--ac:${a.color};--rc:${AMULET_RARITY[a.rarity].color};width:${size}px;height:${size}px`, tabindex: 0 }, ui(a.icon, Math.round(size * 0.6))), () => amuletTip(id));
}

/** Carta de bênção, como a do altar da fase. `foot` é o que vai embaixo (preço e botão). */
function blessCard(id: BlessingId, have: number, foot: Child, onClick: (() => void) | null, fk?: string, off = false): HTMLElement {
  const b = BLESSINGS[id], color = BLESSING_TIER_COLOR[b.tier];
  const band = b.patron ? `${BLESSING_TIER_LABEL[b.tier]} · ${PATRONS[b.patron].name}` : BLESSING_TIER_LABEL[b.tier];
  return h(onClick ? 'button' : 'div', { type: onClick ? 'button' : null, class: `bcard${off ? ' off' : ''}`, style: `--tc:${color}`, disabled: onClick && off ? true : null, 'data-fk': fk ?? null, onclick: onClick },
    h('span', 'bcard-band', band),
    h('span', 'bcard-medal', ui(b.icon, 52), b.patron && h('i', { class: 'bcard-seal', style: `--ec:${ELEMENTS[b.patron].color}` }, ui(b.patron, 20))),
    b.max > 1 && b.max < 9 && h('span', 'bcard-pips', Array.from({ length: b.max }, (_, i) => h('i', i < have ? 'on' : null))),
    h('span', 'bcard-name', b.name),
    h('span', 'bcard-desc', b.desc),
    foot);
}

function amuletCard(id: AmuletId, foot: Child, onClick: (() => void) | null, fk?: string, off = false): HTMLElement {
  const a = AMULETS[id], r = AMULET_RARITY[a.rarity];
  return h(onClick ? 'button' : 'div', { type: onClick ? 'button' : null, class: `bcard amulet${off ? ' off' : ''}`, style: `--tc:${r.color};--ac:${a.color}`, disabled: onClick && off ? true : null, 'data-fk': fk ?? null, onclick: onClick },
    h('span', 'bcard-band', `Amuleto · ${r.label}`),
    h('span', 'bcard-medal amu-medal', ui(a.icon, 46)),
    h('span', 'bcard-name', a.name),
    h('span', 'bcard-desc', a.desc),
    foot);
}

const price = (n: number, can: boolean) => h('span', `bcard-price${can ? '' : ' short'}`, ui('vintem', 22), h('b', null, num(n)));

/* ---------- ainda trancado ---------- */

function lockedScreen(): HTMLElement {
  return h('div', 'sonho', sky(),
    h('div', 'sonho-locked panel',
      ui('sonho', 96),
      h('h1', null, 'O Sonho'),
      h('p', null, 'Quando o andarilho dorme, o Esquecimento o puxa para um sonho feito das lembranças que está apagando.'),
      h('div', 'sonho-lock', ui('cadeado', 28), `Abre ao libertar a Iara (fase ${DREAM.unlock})`)));
}

/* ---------- preparar a noite ---------- */

const PREP_TABS: { id: 'heroi' | 'cordeis' | 'pressagios'; label: string; icon: string }[] = [
  { id: 'heroi', label: 'Quem vai sonhar', icon: 'sonho' }, { id: 'cordeis', label: 'Cordéis', icon: 'cordel' }, { id: 'pressagios', label: 'Presságios', icon: 'olho' },
];

function prepScreen(c: Ctx): HTMLElement {
  const p = c.p, o = nightOptions(p), st = c.st.dream;
  let ch: NightChoice = st.choice ?? defaultChoice(p);
  if (!o.weapons.includes(ch.weapon)) ch = { ...ch, weapon: 'facao' };
  if (!ch.spells.some(Boolean)) ch = { ...ch, spells: [o.spells[0] ?? null, null, null] };
  st.choice = ch;
  const set = (patch: Partial<NightChoice>, fk?: string) => { st.choice = { ...ch, ...patch }; c.redraw(fk); };
  const ok = validChoice(p, ch), short = p.dream.nights === 0;
  const chapters = dreamChapters(p);
  const worn = equippedCordeis(p), wornCost = cordelCost(worn), weight = short ? 0 : omenWeight(st.omens), bonus = short ? 0 : omenMemories(st.omens);

  const weapons = (['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'] as WeaponKind[]).map((w) => {
    const has = o.weapons.includes(w), on = ch.weapon === w, won = p.dream.weaponsWon.includes(w);
    return tip(h('button', { type: 'button', class: `pick${on ? ' on' : ''}${has ? '' : ' locked'}`, disabled: !has, 'aria-pressed': String(on), 'data-fk': `arma-${w}`, onclick: () => set({ weapon: w }, `arma-${w}`) },
      itemIcon(w, 44), won && h('i', 'pick-won', ui('check', 14))),
    { title: ITEM_TYPES[w].label, sub: has ? (won ? 'Já venceu uma noite com ela' : 'Primeira vitória com ela: +1 ponto de talento') : 'Você ainda não tem esta arma', subColor: has ? (won ? undefined : '#f2c14e') : '#ff7b6b', rows: [{ text: 'O herói do Sonho usa uma arma do nível dele, igual para todos. A sua, da campanha, fica no acampamento.', tone: 'dim' }] });
  });
  const chosen = ch.spells.filter(Boolean) as SpellId[];
  const toggle = (id: SpellId) => {
    const at = ch.spells.indexOf(id), next = ch.spells.slice();
    if (at >= 0) next[at] = null; else { const free = next.indexOf(null); if (free < 0) { c.toast('Só cabem três feitiços', 'bad'); return; } next[free] = id; }
    set({ spells: next }, `feitico-${id}`);
  };
  const spells = o.spells.map((id) => {
    const sp = SPELLS[id], on = chosen.includes(id);
    return tip(h('button', { type: 'button', class: `pick small${on ? ' on' : ''}`, style: `--ec:${ELEMENTS[sp.element].color}`, 'aria-pressed': String(on), 'data-fk': `feitico-${id}`, onclick: () => toggle(id) }, ui(id, 34), on && h('b', 'pick-n', ch.spells.indexOf(id) + 1)),
      { title: sp.name, color: ELEMENTS[sp.element].color, sub: `${sp.role} · ${ELEMENTS[sp.element].name}`, rows: [{ text: sp.desc }] });
  });
  const comps = [null, ...o.companions].map((id) => {
    const on = ch.companion === id;
    return tip(h('button', { type: 'button', class: `pick small${on ? ' on' : ''}`, 'aria-pressed': String(on), 'data-fk': `comp-${id ?? 'nenhum'}`, style: id ? `--ec:${ELEMENTS[COMPANIONS[id].element].color}` : null, onclick: () => set({ companion: id }, `comp-${id ?? 'nenhum'}`) },
      id ? ui(COMPANIONS[id].element, 30) : ui('fechar', 26), id && h('span', 'pick-tag', COMPANIONS[id].name.split(/[ -]/)[0])),
    id ? { title: COMPANIONS[id].name, color: ELEMENTS[COMPANIONS[id].element].color, sub: `${ELEMENTS[COMPANIONS[id].element].name}: conta como uma bênção ${PATRONS[COMPANIONS[id].element].of}`, rows: [{ icon: 'companheiro', text: COMPANIONS[id].passive, tone: 'ok' }, { text: COMPANIONS[id].active }] } : { title: 'Sem companheiro' });
  });
  const sups = o.supremos.map((el) => {
    const on = ch.supremo === el;
    return tip(h('button', { type: 'button', class: `pick small${on ? ' on' : ''}`, style: `--ec:${ELEMENTS[el].color}`, 'aria-pressed': String(on), 'data-fk': `sup-${el}`, onclick: () => set({ supremo: el }, `sup-${el}`) }, ui(el, 32)),
      { title: SUPREMOS[el].name, color: ELEMENTS[el].color, sub: 'Supremo (tecla T)', rows: [{ text: SUPREMOS[el].desc }] });
  });

  const start = () => {
    if (!startNight(c.p, { ...ch, omens: st.omens })) { c.toast('Escolha a arma e pelo menos um feitiço', 'bad'); return; }
    c.commit();
  };
  const villageTotal = BUILDING_ORDER.reduce((n, id) => n + BUILDINGS[id].levels.length, 0), villageHave = BUILDING_ORDER.reduce((n, id) => n + (p.village[id] ?? 0), 0);
  const villageCan = BUILDING_ORDER.some((id) => { const cost = buildCost(p, id); return cost != null && p.dream.memories >= cost; });

  return h('div', 'sonho', sky(),
    h('section', { class: 'panel sonho-prep', 'aria-label': 'Antes de dormir' },
      h('div', { class: 'sp-tabs', role: 'tablist' }, PREP_TABS.map((t) => h('button', { type: 'button', class: `sp-tab${st.tab === t.id ? ' on' : ''}`, role: 'tab', 'aria-selected': String(st.tab === t.id), 'data-fk': `prep-${t.id}`, onclick: () => { st.tab = t.id; c.redraw(`prep-${t.id}`); } },
        ui(t.icon, 26), t.label, t.id === 'cordeis' && h('b', null, `${wornCost}/${breath(p)}`), t.id === 'pressagios' && weight > 0 && h('b', null, weight)))),
      st.tab === 'cordeis' ? cordeisView(c) : st.tab === 'pressagios' ? omensView(c) : [
        h('div', 'sp-row', h('span', 'sp-label', 'Arma'), h('div', 'sp-picks', weapons)),
        h('div', 'sp-row', h('span', 'sp-label', 'Aspecto'), h('div', 'sp-picks', aspectPicks(c, ch.weapon))),
        h('div', 'sp-row tall', h('span', 'sp-label', 'Feitiços', h('em', null, `${chosen.length}/3`)), h('div', 'sp-picks wrap', spells)),
        h('div', 'sp-row', h('span', 'sp-label', 'Companheiro'), h('div', 'sp-picks wrap', comps)),
        sups.length > 0 && h('div', 'sp-row', h('span', 'sp-label', 'Supremo'), h('div', 'sp-picks', sups)),
        h('div', 'sp-note', ui('heroi', 22), `O herói do Sonho tem o seu nível (${p.level}) e o equipamento desse nível. Seus itens da campanha não entram.`),
      ]),
    h('section', { class: 'panel sonho-side', 'aria-label': 'A noite' },
      h('div', 'ss-head',
        h('div', 'ss-name', 'O Sonho'),
        tip(h('span', 'ss-mem', ui('lembranca', 34), h('b', null, num(p.dream.memories))), { title: 'Lembranças', color: '#cdb8ff', icon: ui('lembranca', 36), rows: [{ text: 'O que você traz do Sonho ao acordar, vencendo ou não. Paga as melhorias da Aldeia.' }, { icon: 'lembranca', text: 'Já trazidas, no total', value: num(p.dream.total) }] })),
      h('div', 'ss-facts',
        tip(h('span', 'ss-fact', ui('sonho', 24), h('b', null, `${num(p.dream.wins)}/${num(p.dream.nights)}`)), { title: 'Noites vencidas', rows: [{ icon: 'sonho', text: 'Noites dormidas', value: num(p.dream.nights) }, { icon: 'coroa', text: 'Trecho mais fundo', value: `${p.dream.bestTrecho} de ${DREAM.trechos}` }] }),
        tip(h('span', 'ss-fact', ui('mapa', 24), h('b', null, short ? '1 trecho' : `${DREAM.trechos} trechos`)), { title: short ? 'Primeira noite' : 'Uma noite', rows: [{ text: short ? 'A primeira noite é curta: um trecho só, para conhecer o caminho.' : 'Três trechos, cada um num capítulo que você já venceu, com um chefe no fim.' }, { icon: 'mapa', text: chapters.map((n) => CHAPTERS[n - 1].name).join(', '), tone: 'dim' }] }),
        tip(h('button', { type: 'button', class: `ss-fact btnlike${weight ? ' hot' : ''}`, 'data-fk': 'fato-peso', onclick: () => { st.tab = 'pressagios'; c.redraw('prep-pressagios'); } }, ui('olho', 24), h('b', null, `Peso ${weight}`)),
          { title: 'Presságios', icon: ui('olho', 36), sub: weight ? `+${pct(bonus)} de Lembranças` : 'Nenhum ligado', subColor: weight ? '#86e07a' : undefined, rows: weight ? OMEN_ORDER.filter((id) => omenGrade(st.omens, id) > 0).map((id) => ({ icon: OMENS[id].icon, text: OMENS[id].desc(omenGrade(st.omens, id)), tone: 'bad' as const })) : [{ text: short ? 'Abrem depois da primeira noite.' : 'Deixe a noite mais difícil e traga mais Lembranças.', tone: 'dim' as const }] }),
        tip(h('button', { type: 'button', class: 'ss-fact btnlike', 'data-fk': 'fato-cordeis', onclick: () => { st.tab = 'cordeis'; c.redraw('prep-cordeis'); } }, ui('cordel', 24), h('b', null, `${worn.length} ${worn.length === 1 ? 'cordel' : 'cordéis'}`)),
          { title: 'Cordéis equipados', icon: ui('cordel', 36), tag: `${wornCost}/${breath(p)}`, rows: worn.length ? worn.map((id: CordelId) => ({ icon: CORDEIS[id].icon, text: `${CORDEIS[id].name}: ${CORDEIS[id].desc(CORDEIS[id].values[(p.cordeis.levels[id] ?? 1) - 1])}` })) : [{ text: 'Nenhum folheto equipado.', tone: 'dim' as const }] }),
        h('span', 'ss-patrons', p.supremos.map((el) => tip(h('i', { style: `--ec:${ELEMENTS[el].color}`, tabindex: 0 }, ui(el, 22)), { title: `Padrinho: ${PATRONS[el].name}`, color: ELEMENTS[el].color, sub: PATRONS[el].style, rows: [{ text: 'Os altares do Sonho só trazem bênçãos dos Encantados que você já libertou.', tone: 'dim' }] })))),
      h('button', { type: 'button', class: 'btn primary big sonho-go', disabled: !ok, 'data-fk': 'dormir', onclick: start }, ui('sonho', 34), 'Dormir'),
      weeklyCard(c, ch),
      tip(h('button', { type: 'button', class: 'aldeia-card', 'data-fk': 'aldeia-abrir', onclick: () => { st.village = true; c.redraw('aldeia-voltar'); } },
        h('span', 'aldeia-card-ico', ui('descanso', 40)),
        h('span', 'aldeia-card-mid', h('b', null, 'Aldeia'), h('span', null, `${villageHave} de ${villageTotal} melhorias${villageCan ? ' · dá para construir' : ''}`)),
        villageCan && h('i', 'aldeia-card-up', ui('mais', 18)), ui('seta', 26)),
      { title: 'Aldeia', icon: ui('descanso', 36), rows: [{ text: 'As construções que as Lembranças pagam, o Viveiro com as Andanças e os companheiros.' }, ...BUILDING_ORDER.map((id) => ({ icon: BUILDINGS[id].icon, text: BUILDINGS[id].name, value: `${p.village[id] ?? 0}/${BUILDINGS[id].levels.length}` }))] })));
}

/** O cartão da Noite da Semana: os Presságios dela, o recorde e o botão de entrar. */
function weeklyCard(c: Ctx, ch: NightChoice): HTMLElement | null {
  const p = c.p;
  if (p.dream.nights === 0) return null;
  const w = weeklyNight(), rec = weeklyRecord(p), ok = validChoice(p, ch), weight = omenWeight(w.omens);
  const go = () => { if (startWeeklyNight(c.p, ch)) c.commit(); else c.toast('Escolha a arma e pelo menos um feitiço', 'bad'); };
  return tip(h('div', 'weekly',
    h('div', 'weekly-top', ui('lua', 28), h('b', null, 'Noite da Semana'), h('span', 'weekly-peso', ui('olho', 18), `Peso ${weight}`)),
    h('div', 'weekly-omens', OMEN_ORDER.filter((id) => omenGrade(w.omens, id) > 0).map((id) => h('span', 'weekly-omen', ui(OMENS[id].icon, 20), OMENS[id].name))),
    h('div', 'weekly-foot',
      h('span', 'weekly-rec', rec.tries ? (rec.won ? `Vencida em ${clock(rec.time)}` : `Melhor: ${rec.trechos} ${rec.trechos === 1 ? 'trecho' : 'trechos'}`) : 'Ainda não tentou'),
      h('button', { type: 'button', class: 'btn small primary', disabled: !ok, 'data-fk': 'noite-semana', onclick: go }, 'Entrar'))),
  { title: 'Noite da Semana', icon: ui('lua', 36), sub: `+${pct(omenMemories(w.omens))} de Lembranças`, subColor: '#86e07a', rows: [
    { text: 'O mesmo mapa e os mesmos Presságios para todo mundo, até segunda-feira. O herói é o seu. Pode tentar quantas vezes quiser; vale o melhor resultado.' },
    ...OMEN_ORDER.filter((id) => omenGrade(w.omens, id) > 0).map((id) => ({ icon: OMENS[id].icon, text: OMENS[id].desc(omenGrade(w.omens, id)), tone: 'bad' as const })),
    rec.tries ? { icon: 'coroa', text: 'Tentativas nesta semana', value: String(rec.tries) } : null,
  ] });
}

/* ---------- o mapa do trecho ---------- */

const MAP = { x0: 96, x1: MAIN_W - 96, y0: 190, gap: 118 };

function nodePos(n: DreamNode): { x: number; y: number } {
  return { x: MAP.x0 + (n.step / (DREAM.steps - 1)) * (MAP.x1 - MAP.x0), y: MAP.y0 + n.row * MAP.gap };
}

function nodeTip(run: DreamRun, n: DreamNode, state: string): TipSpec {
  const info = NODE_INFO[n.kind], rows: TipRow[] = [{ text: info.desc }];
  const mem = DREAM.memories[n.kind], coin = DREAM.vintem[n.kind];
  if (n.kind === 'altar' && n.patron) rows.push({ icon: n.patron, text: `Bênçãos ${PATRONS[n.patron].of}: ${PATRONS[n.patron].style.toLowerCase()}`, color: ELEMENTS[n.patron].color });
  if (n.kind === 'provacao' && n.trial) rows.push({ icon: 'caveira', text: `${TRIAL_INFO[n.trial].name}: ${TRIAL_INFO[n.trial].desc}`, tone: 'warn' });
  if (n.kind === 'chefe' && n.boss) rows.push({ icon: 'coroa', text: ENEMY_NAMES[n.boss], tone: 'bad' });
  if (n.kind === 'fonte') rows.push({ icon: 'cura', text: 'Beber cura', value: pct(fountainHeal(run)), tone: fountainHeal(run) > 0 ? 'ok' : 'bad' });
  if (coin || mem) rows.push('sep');
  if (coin) rows.push({ icon: 'vintem', text: 'Vinténs', value: `+${coin}`, tone: 'gold' });
  if (mem) rows.push({ icon: 'lembranca', text: 'Lembranças', value: `+${mem}`, tone: 'ok' });
  if (n.kind === 'elite' || n.kind === 'chefe' || n.kind === 'provacao') rows.push({ icon: 'amuleto', text: 'Escolhe um amuleto', tone: 'gold' });
  return {
    title: n.kind === 'altar' && n.patron ? `Altar ${PATRONS[n.patron].of}` : info.name, icon: ui(n.kind === 'altar' && n.patron ? n.patron : info.icon, 36),
    color: n.kind === 'altar' && n.patron ? ELEMENTS[n.patron].color : n.kind === 'chefe' || n.kind === 'provacao' ? '#ff7b6b' : undefined,
    sub: state === 'here' ? 'Você está aqui' : state === 'done' ? 'Já passou' : state === 'open' ? 'Ao alcance' : undefined, subColor: state === 'open' ? '#86e07a' : undefined,
    rows, foot: [state === 'open' ? 'Clique: ir' : state === 'again' ? 'Clique: entrar de novo' : null],
  };
}

function nightMap(c: Ctx, run: DreamRun): HTMLElement {
  const t = currentTrecho(run), open = reachable(run), visited = run.path[run.trecho] ?? [];
  /* nó em que o jogo foi fechado no meio da sala: dá para entrar de novo */
  const again = run.at != null && !run.done && !run.pending && currentStageId(run) ? run.at : null;
  const go = (id: number) => {
    if (again === id) { c.host.startDreamNode(); return; }
    const res = enterNode(c.p, id);
    if (!res) return;
    c.host.save();
    if ('stage' in res) c.host.startDreamNode(); else c.redraw();
  };
  const lines: SVGElement[] = [];
  for (const n of t.nodes) for (const to of n.next) {
    const a = nodePos(n), b = nodePos(t.nodes[to]), mx = (a.x + b.x) / 2;
    const walked = visited.includes(n.id) && visited.includes(to) && visited.indexOf(to) === visited.indexOf(n.id) + 1;
    const ahead = n.id === run.at && run.done && open.includes(to);
    lines.push(s('path', { d: `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`, class: `link${walked ? ' walked' : ''}${ahead ? ' ahead' : ''}` }));
  }
  const nodes = t.nodes.map((n) => {
    const { x, y } = nodePos(n), here = n.id === run.at, was = visited.includes(n.id) && !here;
    const state = again === n.id ? 'again' : open.includes(n.id) ? 'open' : here ? 'here' : was ? 'done' : 'far';
    const icon = n.kind === 'altar' && n.patron ? n.patron : NODE_INFO[n.kind].icon, can = state === 'open' || state === 'again';
    return tip(h('button', {
      type: 'button', class: `dnode k-${n.kind} ${state}`, style: `left:${x}px;top:${y}px${n.kind === 'altar' && n.patron ? `;--ec:${ELEMENTS[n.patron].color}` : ''}`,
      'aria-label': `${NODE_INFO[n.kind].name}${can ? ', ao alcance' : ''}`, 'aria-disabled': can ? null : 'true', 'data-fk': `no-${n.id}`, onclick: can ? () => go(n.id) : null,
    }, h('span', 'dnode-face', ui(icon, n.kind === 'chefe' ? 46 : 34)), was && h('i', 'dnode-check', ui('check', 14)), h('span', 'dnode-label', NODE_INFO[n.kind].name)),
    () => nodeTip(run, n, state));
  });
  return h('div', 'dmap', s('svg', { class: 'dmap-links', width: MAIN_W, height: MAIN_H, viewBox: `0 0 ${MAIN_W} ${MAIN_H}`, 'aria-hidden': 'true' }, lines), nodes);
}

function heroBar(c: Ctx, run: DreamRun): HTMLElement {
  const stats = runStats(run), t = currentTrecho(run), chapter = CHAPTERS[t.chapter - 1], hp = Math.round(stats.maxHp * run.hpFrac);
  const cursed = run.curse.hp > 0 || run.curse.damage > 0;
  const peso = omenWeight(run.omens), hurry = omenGrade(run.omens, 'pressa'), late = isLate(run), lost = forgottenSlot(run);
  return h('header', 'dbar',
    tip(h('div', 'dbar-where', ui(chapter.element ?? 'credito', 30), h('span', null, h('b', null, `Trecho ${run.trecho + 1} de ${run.map.trechos.length}`), h('em', null, chapter.name))),
      { title: chapter.name, color: chapter.element ? ELEMENTS[chapter.element].color : undefined, sub: `Monstros de nível ${t.level}`, rows: [{ icon: 'mapa', text: chapter.terrain }] }),
    tip(h('div', `dbar-hp${run.hpFrac < 0.3 ? ' low' : ''}`, ui('vida', 26), h('span', 'bar', h('i', { style: `width:${Math.max(2, run.hpFrac * 100)}%` })), h('b', null, `${num(hp)} / ${num(stats.maxHp)}`)),
      { title: 'Vida', icon: ui('vida', 36), rows: [{ text: 'A vida não volta sozinha de uma sala para a outra. Fonte, Feira, poção e alguns causos curam.' }] }),
    tip(stat('pocao', `${run.potions}/${stats.potions}`, { size: 28 }), { title: 'Poções', rows: [{ text: 'As poções que sobram seguem com você. A Fonte devolve todas.' }] }),
    tip(stat('vintem', num(run.vintem), { size: 28, cls: 'gold' }), { title: 'Vinténs', color: '#f2c14e', icon: ui('vintem', 36), rows: [{ text: 'A moeda da noite. Paga a Feira e alguns causos, e some ao acordar.' }] }),
    tip(stat('lembranca', num(run.earned), { size: 28 }), { title: 'Lembranças desta noite', color: '#cdb8ff', icon: ui('lembranca', 36), rows: [{ text: 'Você leva todas ao acordar, mesmo se cair.' }, memoryBonus(c.p, run) > 1 ? { icon: 'lembranca', text: 'Bônus ao acordar', value: `+${pct(memoryBonus(c.p, run) - 1)}`, tone: 'ok' } : null] }),
    cursed && tip(h('span', 'dbar-curse', ui('st_amaldicoado', 26), 'Maldição'), { title: 'Maldição', color: '#c8a8ff', sub: 'Até o fim deste trecho', rows: [run.curse.hp > 0 ? { icon: 'vida', text: 'Vida dos monstros', value: `+${pct(run.curse.hp)}`, tone: 'bad' } : null, run.curse.damage > 0 ? { icon: 'dano', text: 'Dano dos monstros', value: `+${pct(run.curse.damage)}`, tone: 'bad' } : null] }),
    peso > 0 && tip(h('span', `dbar-omen${late ? ' late' : ''}`, ui('olho', 24), h('b', null, peso), hurry > 0 && h('em', null, clock(Math.max(0, HURRY_SECONDS[hurry] - (run.clock ?? 0))))),
      { title: `Presságios · Peso ${peso}`, color: '#c8a8ff', icon: ui('olho', 36), sub: `+${pct(omenMemories(run.omens))} de Lembranças`, subColor: '#86e07a', rows: [
        ...OMEN_ORDER.filter((id) => omenGrade(run.omens, id) > 0).map((id) => ({ icon: OMENS[id].icon, text: OMENS[id].desc(omenGrade(run.omens, id)), tone: 'bad' as const })),
        lost >= 0 && run.spells[lost] ? { icon: run.spells[lost]!, text: `Esquecido neste trecho: ${SPELLS[run.spells[lost]!].name}`, tone: 'warn' as const } : null,
        hurry > 0 ? { icon: 'relogio', text: late ? 'O tempo do trecho acabou: os monstros batem 50% mais forte' : 'Tempo de luta que resta neste trecho', value: late ? undefined : clock(HURRY_SECONDS[hurry] - (run.clock ?? 0)), tone: late ? 'bad' as const : undefined } : null,
      ] }),
    h('span', 'dbar-gap'),
    h('button', { type: 'button', class: 'btn small', 'data-fk': 'acordar', onclick: () => c.confirm({ title: 'Acordar agora?', text: `A noite acaba aqui. Você leva as ${num(Math.round(run.earned * memoryBonus(c.p, run)))} Lembranças que juntou.`, icon: 'sonho', ok: 'Acordar', danger: true, run: () => { const end = abandonNight(c.p); if (end) { c.st.dream.end = end; c.host.save(); } } }) }, ui('seta', 20), 'Acordar'));
}

function carried(run: DreamRun, onBless?: (id: BlessingId) => void): HTMLElement {
  const counts = blessingCounts(run.blessings), woke = new Set(run.blessings.map((id) => BLESSINGS[id].awakens).filter(Boolean) as BlessingId[]);
  const ids = (Object.keys(counts) as BlessingId[]).filter((id) => !woke.has(id));
  const pat = patronCounts(run.blessings, run.companion ? COMPANIONS[run.companion].element : null);
  const syn = ELEMENT_ORDER.filter((el) => pat[el] > 0).sort((a, b) => pat[b] - pat[a]).map((el) => {
    const n = pat[el], tier = patronTier(n);
    return tip(h('span', { class: `syn${tier > 0 ? ' lit' : ''}`, style: `--ec:${ELEMENTS[el].color}`, tabindex: 0 }, ui(el, 26), h('b', null, n), h('span', 'syn-pips', PATRON_STEPS.map((need) => h('i', n >= need ? 'on' : null)))),
      { title: `Sinergia ${PATRONS[el].of}`, color: ELEMENTS[el].color, tag: String(n), sub: PATRONS[el].style, rows: PATRON_STEPS.map((need, i) => ({ icon: n >= need ? 'check' : 'cadeado', text: PATRON_TIERS[el][i], value: String(need), tone: n >= need ? 'ok' as const : 'dim' as const })) });
  });
  return h('footer', 'dcarry',
    h('div', 'cr-group', h('span', 'cr-label', ui('altar', 22), plural(run.blessings.length, 'bênção', 'bênçãos')), h('div', 'cr-list', ids.length ? ids.map((id) => blessChip(id, counts[id]!, onBless && BLESSINGS[id].kind === 'normal' ? () => onBless(id) : undefined)) : h('em', null, 'Nenhuma ainda'))),
    syn.length > 0 && h('div', 'cr-group', h('span', 'cr-label', ui('supremo', 22), 'Padrinhos'), h('div', 'cr-list', syn)),
    h('div', 'cr-group', h('span', 'cr-label', ui('amuleto', 22), plural(run.amulets.length, 'amuleto', 'amuletos')), h('div', 'cr-list', run.amulets.length ? run.amulets.map((a) => amuletChip(a, 40)) : h('em', null, 'Nenhum ainda'))));
}

/* ---------- telas por cima do mapa ---------- */

function overlay(cls: string, title: Child, body: Child[], foot: Child): HTMLElement {
  return h('div', 'dover', h('div', { class: `dpanel ${cls}`, role: 'dialog', 'aria-modal': 'true' }, h('div', 'dp-title', title), body, h('div', 'dp-foot', foot)));
}

function amuletPick(c: Ctx, options: AmuletId[]): HTMLElement {
  const take = (i: number) => { const a = chooseAmulet(c.p, i); if (a) c.toast(`${AMULETS[a].name} agora é seu`); c.commit(); };
  return overlay('choose', [ui('amuleto', 34), 'Escolha um amuleto'],
    [h('div', 'dp-cards', options.map((id, i) => amuletCard(id, h('span', 'bcard-take', 'Levar'), () => take(i), `amu-${i}`)))],
    h('button', { type: 'button', class: 'btn small', 'data-fk': 'amu-nenhum', onclick: () => take(-1) }, 'Não levar nenhum'));
}

function blessPick(c: Ctx, run: DreamRun, options: BlessingId[]): HTMLElement {
  const have = blessingCounts(run.blessings);
  const take = (i: number) => {
    const b = chooseBlessingOffer(c.p, i);
    if (b && BLESSINGS[b].kind !== 'normal') c.st.dream.moment = { title: BLESSINGS[b].name, sub: BLESSINGS[b].kind === 'desperta' ? 'Despertar' : 'Compadrio', color: BLESSING_TIER_COLOR[BLESSINGS[b].tier] };
    else if (b) c.toast(`${BLESSINGS[b].name}`);
    c.commit();
  };
  return overlay('choose', [ui('altar', 34), 'O Rancho te abençoa: escolha uma'],
    [h('div', 'dp-cards', options.map((id, i) => blessCard(id, have[id] ?? 0, h('span', 'bcard-take', 'Escolher'), () => take(i), `ben-${i}`)))], null);
}

function feiraPanel(c: Ctx, run: DreamRun, f: Extract<NonNullable<DreamRun['pending']>, { kind: 'feira' }>): HTMLElement {
  const have = blessingCounts(run.blessings), st = c.st.dream;
  const did = (ok: boolean, text: string, fk?: string) => { if (ok) { c.toast(text); c.commit(fk); } else c.toast('Faltam vinténs', 'bad'); };
  const bless = f.blessings.map((id, i) => {
    if (!id) return h('div', 'bcard sold', h('span', 'bcard-soldout', ui('check', 30), 'Levada'));
    const cost = feiraPrice(run, 'bencao', id), can = run.vintem >= cost;
    return blessCard(id, have[id] ?? 0, price(cost, can), () => did(buyBlessing(c.p, i), BLESSINGS[id].name, 'sair'), `feira-b${i}`, !can);
  });
  const amus = f.amulets.map((id, i) => {
    if (!id) return h('div', 'bcard amulet sold', h('span', 'bcard-soldout', ui('check', 30), 'Levado'));
    const cost = feiraPrice(run, 'amuleto', id), can = run.vintem >= cost;
    return amuletCard(id, price(cost, can), () => did(buyAmulet(c.p, i), AMULETS[id].name, 'sair'), `feira-a${i}`, !can);
  });
  const healCost = feiraPrice(run, 'cura'), rerollCost = feiraPrice(run, 'trocar'), removeCost = feiraPrice(run, 'tirar');
  const removable = (Object.keys(have) as BlessingId[]).filter((id) => BLESSINGS[id].kind === 'normal');
  const services = h('div', 'feira-serv',
    tip(h('button', { type: 'button', class: 'btn small', disabled: f.healed || run.hpFrac >= 1 || run.vintem < healCost, 'data-fk': 'feira-cura', onclick: () => did(buyHeal(c.p), `+${pct(DREAM.feiraHeal)} de vida`, 'sair') }, ui('cura', 22), 'Garrafada', price(healCost, run.vintem >= healCost)),
      { title: 'Garrafada', icon: ui('cura', 36), rows: [{ text: `Cura ${pct(DREAM.feiraHeal)} da vida. Uma por visita.` }, f.healed ? { text: 'Já tomou a desta Feira.', tone: 'dim' } : null] }),
    tip(h('button', { type: 'button', class: 'btn small', disabled: run.vintem < rerollCost, 'data-fk': 'feira-trocar', onclick: () => did(rerollFeira(c.p), 'A banca mudou', 'feira-trocar') }, ui('trocar', 22), 'Outra banca', price(rerollCost, run.vintem >= rerollCost)),
      { title: 'Outra banca', icon: ui('trocar', 36), rows: [{ text: 'Troca tudo o que está à venda. Cada troca na mesma Feira custa mais.' }] }),
    tip(h('button', { type: 'button', class: `btn small${st.removing ? ' primary' : ''}`, disabled: !removable.length || run.vintem < removeCost, 'data-fk': 'feira-tirar', onclick: () => { st.removing = !st.removing; c.redraw('feira-tirar'); } }, ui('fechar', 22), 'Tirar uma bênção', price(removeCost, run.vintem >= removeCost)),
      { title: 'Tirar uma bênção', icon: ui('fechar', 36), rows: [{ text: 'Você deixa uma bênção para trás, com todos os níveis dela. Serve para abrir caminho para outro padrinho.' }] }));
  const remove = st.removing ? h('div', 'feira-remove', h('span', null, 'Qual fica para trás?'), removable.map((id) => blessChip(id, have[id]!, () => { if (removeBlessing(c.p, id)) { st.removing = false; c.toast(`${BLESSINGS[id].name} ficou para trás`); c.commit('sair'); } }))) : null;
  return overlay('feira', [ui('vender', 34), 'Feira', h('span', 'dp-purse', ui('vintem', 26), h('b', null, num(run.vintem)))],
    [h('div', 'dp-cards', bless, amus), services, remove],
    h('button', { type: 'button', class: 'btn primary', 'data-fk': 'sair', onclick: () => { st.removing = false; leaveNode(c.p); c.commit(); } }, 'Seguir viagem', ui('seta', 24)));
}

function fontePanel(c: Ctx, run: DreamRun): HTMLElement {
  const stats = runStats(run), healFrac = fountainHeal(run), up = upgradable(run), have = blessingCounts(run.blessings);
  const after = Math.min(1, run.hpFrac + healFrac);
  return overlay('fonte', [ui('cura', 34), 'Fonte'],
    [h('div', 'fonte-two',
      h('button', { type: 'button', class: 'fonte-opt', 'data-fk': 'fonte-beber', onclick: () => { useFountain(c.p, 'beber'); c.toast(healFrac > 0 ? 'Você bebeu da fonte' : 'A fonte está seca para você, mas as poções voltaram'); c.commit(); } },
        ui('cura', 64), h('b', null, 'Beber'),
        h('span', null, healFrac > 0 ? `Cura ${pct(healFrac)} da vida e devolve as poções` : 'A Figa Torta secou a fonte: só as poções voltam'),
        h('em', null, `Vida: ${num(Math.round(stats.maxHp * run.hpFrac))} → ${num(Math.round(stats.maxHp * after))}   ·   Poções: ${run.potions} → ${stats.potions}`)),
      h('div', `fonte-opt list${up.length ? '' : ' off'}`,
        ui('altar', 64), h('b', null, 'Fortalecer'),
        h('span', null, up.length ? 'Uma bênção sua sobe um nível. Escolha qual:' : 'Nenhuma bênção sua pode subir de nível agora'),
        h('div', 'fonte-ups', up.map((id) => tip(h('button', { type: 'button', class: 'fonte-up', style: `--tc:${BLESSING_TIER_COLOR[BLESSINGS[id].tier]}`, 'data-fk': `fonte-${id}`, onclick: () => { if (useFountain(c.p, 'subir', id)) { c.toast(`${BLESSINGS[id].name} subiu de nível`); c.commit(); } } },
          ui(BLESSINGS[id].icon, 30), h('span', null, BLESSINGS[id].name), h('b', null, `${have[id]} → ${have[id]! + 1}`)), () => blessTip(id, have[id])))))),
    ], null);
}

/** Uma linha dizendo o que um efeito de causo faz, já com o que foi sorteado. */
function effectLine(o: Resolved): { text: string; tone: 'ok' | 'bad' | 'gold' } | null {
  const e = o.effect;
  switch (e.t) {
    case 'vintem': return { text: `${signed(e.n)} vinténs`, tone: e.n >= 0 ? 'gold' : 'bad' };
    case 'vida': return { text: e.frac >= 1 ? 'Cura toda a vida' : `${e.frac >= 0 ? '+' : '−'}${pct(Math.abs(e.frac))} da vida`, tone: e.frac >= 0 ? 'ok' : 'bad' };
    case 'pocao': return { text: `${signed(e.n)} ${Math.abs(e.n) === 1 ? 'poção' : 'poções'}`, tone: e.n >= 0 ? 'ok' : 'bad' };
    case 'bencao': return o.blessing ? { text: `Bênção: ${BLESSINGS[o.blessing].name}`, tone: 'ok' } : null;
    case 'subir': return o.blessing ? { text: `${BLESSINGS[o.blessing].name} sobe um nível`, tone: 'ok' } : { text: 'Nenhuma bênção para subir', tone: 'bad' };
    case 'esquecer': return o.blessing ? { text: `Perde um nível de ${BLESSINGS[o.blessing].name}`, tone: 'bad' } : { text: 'Você não tem bênção para trocar', tone: 'bad' };
    case 'amuleto': return o.amulet ? { text: `Amuleto: ${AMULETS[o.amulet].name}`, tone: 'gold' } : null;
    case 'maldicao': return { text: `Maldição até o fim do trecho: monstros com ${[e.hp ? `+${pct(e.hp)} de vida` : '', e.damage ? `+${pct(e.damage)} de dano` : ''].filter(Boolean).join(' e ')}`, tone: 'bad' };
    case 'lembrancas': return { text: `+${e.n} Lembranças`, tone: 'ok' };
  }
}

function causoPanel(c: Ctx, run: DreamRun, pend: Extract<NonNullable<DreamRun['pending']>, { kind: 'causo' }>): HTMLElement {
  const def = CAUSOS[pend.id], W = 300, H = 330;
  const { cv } = hdCanvas(W, H, 'causo-cv');
  c.animate(cv, (g, t) => {
    g.clearRect(0, 0, W, H);
    /* luar atrás da figura */
    const q = g.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, 150);
    q.addColorStop(0, def.color); q.addColorStop(0.55, `${def.color}55`); q.addColorStop(1, `${def.color}00`);
    g.fillStyle = q; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(8,6,24,.5)'; g.beginPath(); g.ellipse(W / 2, H - 34, 96, 14, 0, 0, Math.PI * 2); g.fill();
    drawFigure(g, def.figure, { x: 20, y: 16, w: W - 40, h: H - 56 }, t, 0.94, def.color);
  });
  const choices = def.choices.map((ch, i) => {
    const outcomes = pend.outcomes[i], can = causoAffordable(run, outcomes), lines = outcomes.map(effectLine).filter(Boolean) as { text: string; tone: string }[];
    const tips: TipRow[] = outcomes.flatMap((o) => (o.blessing && o.effect.t !== 'esquecer' ? [{ icon: BLESSINGS[o.blessing].icon, text: `${BLESSINGS[o.blessing].name}: ${BLESSINGS[o.blessing].desc}` }] : o.amulet ? [{ icon: AMULETS[o.amulet].icon, text: `${AMULETS[o.amulet].name}: ${AMULETS[o.amulet].desc}` }] : []));
    const btn = h('button', { type: 'button', class: 'causo-opt', disabled: !can, 'data-fk': `causo-${i}`, onclick: () => { if (chooseCauso(c.p, i)) c.commit(); } },
      h('b', null, ch.label), ch.note && h('em', null, ch.note),
      h('span', 'causo-fx', lines.length ? lines.map((l) => h('i', l.tone, l.text)) : h('i', 'dim', 'Nada acontece')),
      !can && h('span', 'causo-cant', 'Você não tem como pagar'));
    return tips.length ? tip(btn, { title: ch.label, rows: tips }) : btn;
  });
  return h('div', 'dover', h('div', { class: 'dpanel causo', role: 'dialog', 'aria-modal': 'true', style: `--ec:${def.color}` },
    h('div', 'causo-pic', cv),
    h('div', 'causo-body', h('div', 'causo-kicker', 'Causo'), h('h1', null, def.title), h('p', null, def.text), h('div', 'causo-opts', choices))));
}

/* ---------- a noite em andamento ---------- */

function nightScreen(c: Ctx, run: DreamRun): HTMLElement {
  const pend = run.pending, here = currentNode(run);
  const panel = pend?.kind === 'amuleto' ? amuletPick(c, pend.options) : pend?.kind === 'bencao' ? blessPick(c, run, pend.options)
    : pend?.kind === 'feira' ? feiraPanel(c, run, pend) : pend?.kind === 'fonte' ? fontePanel(c, run) : pend?.kind === 'causo' ? causoPanel(c, run, pend) : pend?.kind === 'roda' ? rodaPanel(c, run, pend) : null;
  const hint = pend ? null : run.at == null ? 'A noite começa. Escolha por onde entrar.' : !run.done && here ? 'Você saiu no meio desta sala. Clique nela para entrar de novo.' : 'Escolha o próximo passo.';
  return h('div', 'sonho night', sky(), h('div', 'sonho-dim'),
    h('div', { class: 'night-in', inert: !!panel }, heroBar(c, run), nightMap(c, run), hint && h('div', 'dhint', hint), carried(run)),
    panel, momentOverlay(c));
}

/* ---------- acordar ---------- */

function endScreen(c: Ctx, e: NightEnd): HTMLElement {
  const counts = blessingCounts(e.blessings), woke = new Set(e.blessings.map((id) => BLESSINGS[id].awakens).filter(Boolean) as BlessingId[]);
  const ids = (Object.keys(counts) as BlessingId[]).filter((id) => !woke.has(id));
  const title = e.won ? 'Noite vencida!' : e.how === 'caiu' ? 'Você acordou' : 'Você acordou cedo';
  const sub = e.won ? 'O Esquecimento perdeu esta noite. As lembranças voltam com você.' : e.how === 'caiu' ? 'Cair no sonho é só acordar. O que você lembrou fica.' : 'Você deixou o sonho pelo meio. O que lembrou fica.';
  const fact = (icon: string, value: Child, label: string) => h('div', 'end-fact', ui(icon, 30), h('b', null, value), h('span', null, label));
  const close = (tab: 'sonho' | 'mapa') => { c.st.dream.end = null; c.st.dream.choice = null; c.go(tab); };
  return h('div', 'sonho end', sky(),
    h('div', `end-card${e.won ? ' won' : ''}${e.fala || e.weekly ? ' compact' : ''}`,
      h('div', 'end-ribbon', title),
      !(e.fala || e.weekly) && h('p', 'end-sub', sub),
      h('div', 'end-facts',
        fact('coroa', `${e.trechos}/${e.of}`, e.of === 1 ? 'trecho' : 'trechos'), fact('dano', num(e.tally.rooms), 'salas'), fact('elite', num(e.tally.elites), 'elites'),
        e.weight > 0 ? fact('olho', String(e.weight), 'de Peso') : fact('caveira', num(e.tally.trials), 'provações'), fact('execucao', num(e.tally.kills), 'monstros'), fact('relogio', clock(e.tally.time), 'de luta')),
      h('div', 'end-gains',
        h('div', 'end-gain big', ui('lembranca', 54), h('b', null, `+${num(e.memories)}`), h('span', null, 'Lembranças')),
        e.xp > 0 && h('div', 'end-gain', ui('xp', 40), h('b', null, `+${num(e.xp)}`), h('span', null, 'experiência')),
        e.gold > 0 && h('div', 'end-gain', ui('ouro', 40), h('b', null, `+${num(e.gold)}`), h('span', null, 'ouro')),
        e.levels > 0 && h('div', 'end-gain gold', ui('xp', 40), h('b', null, `Nível ${c.p.level}!`), h('span', null, 'na campanha')),
        e.talent && h('div', 'end-gain gold', ui('talentos', 40), h('b', null, '+1 talento'), h('span', null, `1ª vitória: ${ITEM_TYPES[e.weapon].label}`))),
      h('div', 'end-build',
        h('div', 'cr-list', ids.length ? ids.map((id) => blessChip(id, counts[id]!)) : h('em', null, 'Sem bênçãos nesta noite')),
        e.amulets.length > 0 && h('div', 'cr-list', e.amulets.map((a) => amuletChip(a, 40)))),
      e.weekly && h('div', `end-weekly${e.weekly.best ? ' best' : ''}`, ui('lua', 24), e.weekly.best ? 'Noite da Semana: novo recorde seu!' : 'Noite da Semana: o seu recorde continua de pé.'),
      e.fala && falaBox(c, e.fala),
      h('div', 'end-actions',
        tip(h('button', { type: 'button', class: 'btn big', 'data-fk': 'fim-imagem', onclick: () => { saveNightSummary(e, e.level); c.toast('Imagem salva'); } }, ui('item', 28), 'Salvar imagem'), { title: 'Salvar imagem', rows: [{ text: 'Guarda o resumo desta noite como uma imagem, pronta para mostrar a alguém.' }] }),
        h('button', { type: 'button', class: 'btn big', 'data-fk': 'fim-mapa', onclick: () => close('mapa') }, ui('mapa', 30), 'Mapa'),
        h('button', { type: 'button', class: 'btn big primary', 'data-fk': 'res-principal', onclick: () => close('sonho') }, ui('sonho', 30), 'Voltar ao Sonho'))));
}

/** A fala de um Encantado ao acordar, com o retrato dele. */
function falaBox(c: Ctx, f: NonNullable<NightEnd['fala']>): HTMLElement {
  const W = 84, H = 92, { cv } = hdCanvas(W, H, 'fala-cv');
  c.animate(cv, (g, t) => { g.clearRect(0, 0, W, H); drawFigure(g, FREED[ELEMENT_ORDER.indexOf(f.who)], { x: 0, y: 0, w: W, h: H }, t, 0.98, ELEMENTS[f.who].color); });
  return h('div', { class: 'fala', style: `--ec:${ELEMENTS[f.who].color}` }, cv, h('div', 'fala-text', h('b', null, PATRONS[f.who].name), h('span', null, `“${f.text}”`)));
}

/** Momento de exagero (sorte grande, Despertar): a tela escurece, uma luz desce e o nome aparece grande. Some sozinho, ou com um clique. */
export function momentOverlay(c: Ctx): HTMLElement | null {
  const m = c.st.dream.moment;
  if (!m) return null;
  c.st.dream.moment = null;
  return h('div', { class: 'moment', style: `--mc:${m.color}`, onclick: (e: Event) => (e.currentTarget as HTMLElement).remove(), 'aria-live': 'polite' }, h('div', 'moment-beam'), h('div', 'moment-text', h('b', null, m.title), h('span', null, m.sub)));
}

export function renderSonho(c: Ctx): HTMLElement {
  const p = c.p, st = c.st.dream;
  if (st.end) return endScreen(c, st.end);
  if (!isDreamUnlocked(p)) return lockedScreen();
  if (st.village && !p.dream.run) return renderAldeia(c);
  if (!p.dream.run) return prepScreen(c);
  return nightScreen(c, p.dream.run);
}
