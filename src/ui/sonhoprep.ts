/**
 * O que se arruma antes de dormir, além do herói (docs/gdd/09): Cordéis, Presságios e Aspectos de arma.
 * As regras estão em src/meta/dream.ts; os dados, em src/data/cordeis.ts, omens.ts e aspects.ts.
 */
import { ASPECTS, aspectsOf, type AspectId } from '../data/aspects';
import { ELEMENTS } from '../data/content';
import { CORDEIS, CORDEL, CORDEL_ORDER, cordelCost, isFullCordel, type CordelId } from '../data/cordeis';
import { ITEM_TYPES, type WeaponKind } from '../data/items';
import { OMEN, OMENS, OMEN_ORDER, omenGrade, omenMemories, omenWeight, type OmenId, type OmenPick } from '../data/omens';
import { breath, buyAspect, buyCordel, cordelNext, equipAspect, equippedCordeis, toggleCordel } from '../meta/dream';
import type { Ctx } from './ctx';
import { h, itemIcon, num, pct, ui, type Child } from './dom';
import { tip, type TipRow } from './tip';

/* ---------- Aspectos ---------- */

/** A linha de Aspectos da arma escolhida: o jeito padrão e os dois que se compram com Lembranças. */
export function aspectPicks(c: Ctx, weapon: WeaponKind): HTMLElement[] {
  const p = c.p, on = p.aspects.equipped[weapon] && p.aspects.owned.includes(p.aspects.equipped[weapon]!) ? p.aspects.equipped[weapon]! : null;
  const std = tip(h('button', { type: 'button', class: `pick small${on ? '' : ' on'}`, 'aria-pressed': String(!on), 'data-fk': 'aspecto-padrao', onclick: () => { equipAspect(c.p, weapon, null); c.commit('aspecto-padrao'); } }, itemIcon(weapon, 32)),
    { title: `${ITEM_TYPES[weapon].label} padrão`, rows: [{ text: 'O jeito de sempre, sem Aspecto.' }] });
  const others = aspectsOf(weapon).map((id: AspectId) => {
    const a = ASPECTS[id], owned = p.aspects.owned.includes(id), can = p.dream.memories >= a.cost, color = a.element ? ELEMENTS[a.element].color : '#f2c14e';
    const act = () => {
      if (owned) { equipAspect(c.p, weapon, id); c.commit(`aspecto-${id}`); return; }
      if (!can) { c.toast(`Faltam ${num(a.cost - p.dream.memories)} Lembranças`, 'bad'); return; }
      c.confirm({ title: `${ITEM_TYPES[weapon].label} ${a.name}`, text: `${a.desc} Custa ${num(a.cost)} Lembranças e fica para sempre.`, icon: 'lembranca', ok: 'Comprar', run: () => { if (buyAspect(c.p, id)) { c.toast(`${ITEM_TYPES[weapon].label} ${a.name}: seu`); c.host.save(); } } });
    };
    return tip(h('button', { type: 'button', class: `pick small aspect${on === id ? ' on' : ''}${owned ? '' : ' shop'}`, style: `--ec:${color}`, 'aria-pressed': String(on === id), 'data-fk': `aspecto-${id}`, onclick: act },
      itemIcon(weapon, 30), a.element && h('i', 'pick-seal', ui(a.element, 15)), !owned && h('span', `pick-cost${can ? '' : ' short'}`, ui('lembranca', 13), num(a.cost))),
    { title: `${ITEM_TYPES[weapon].label} ${a.name}`, color, sub: owned ? (on === id ? 'Em uso' : 'Comprado') : `${num(a.cost)} Lembranças`, subColor: owned ? '#86e07a' : can ? '#f2c14e' : '#ff7b6b',
      rows: [{ text: a.desc }, 'sep', { text: 'Aspectos valem no Sonho e na campanha.', tone: 'dim' }], foot: [owned ? 'Clique: usar' : 'Clique: comprar'] });
  });
  return [std, ...others];
}

/* ---------- Cordéis ---------- */

export function cordeisView(c: Ctx): HTMLElement {
  const p = c.p, worn = equippedCordeis(p), max = breath(p), used = cordelCost(worn), full = isFullCordel(worn);
  const cards = CORDEL_ORDER.map((id: CordelId) => {
    const d = CORDEIS[id], lv = p.cordeis.levels[id] ?? 0, on = worn.includes(id), next = cordelNext(p, id), can = next != null && p.dream.memories >= next, fits = on || used + d.cost <= max;
    const toggle = () => {
      if (!lv) { c.toast('Compre o folheto primeiro', 'bad'); return; }
      if (!toggleCordel(c.p, id)) { c.toast(`Não cabe: faltam ${used + d.cost - max} de Fôlego`, 'bad'); return; }
      c.commit(`cordel-${id}`);
    };
    const buy = (e: Event) => { e.stopPropagation(); if (buyCordel(c.p, id)) { c.toast(lv ? `${d.name}: nível ${lv + 1}` : `${d.name}: seu`); c.commit(`cordel-buy-${id}`); } else c.toast('Faltam Lembranças', 'bad'); };
    const rows: TipRow[] = d.values.map((v, i) => ({ icon: i < lv ? 'check' : 'cordel', text: d.desc(v), tone: i + 1 === lv ? 'ok' as const : i < lv ? 'dim' as const : undefined }));
    return tip(h('div', { class: `cordel${on ? ' on' : ''}${lv ? '' : ' unowned'}${lv && !fits ? ' nofit' : ''}`, role: 'button', tabindex: 0, 'aria-pressed': String(on), 'data-fk': `cordel-${id}`, onclick: toggle, onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } } },
      h('span', 'cordel-cost', d.cost),
      h('span', 'cordel-ico', ui(d.icon, 30)),
      h('span', 'cordel-name', d.name),
      h('span', 'cordel-foot',
        h('span', 'cordel-pips', [1, 2, 3].map((n) => h('i', n <= lv ? 'on' : null))),
        next != null && h('button', { type: 'button', class: `cordel-buy${can ? '' : ' short'}`, 'data-fk': `cordel-buy-${id}`, 'aria-label': lv ? 'Subir de nível' : 'Comprar', onclick: buy }, ui('lembranca', 15), num(next)))),
    () => ({ title: d.name, icon: ui(d.icon, 36), tag: `Fôlego ${d.cost}`, sub: !lv ? 'Ainda não comprado' : on ? `Equipado · nível ${lv}` : `Nível ${lv}`, subColor: !lv ? '#ff7b6b' : on ? '#86e07a' : undefined,
      rows, foot: [lv ? (on ? 'Clique: tirar' : 'Clique: equipar') : null, next != null ? `${lv ? 'Subir' : 'Comprar'}: ${num(next)} Lembranças` : null] }));
  });
  return h('div', 'cordeis',
    h('div', 'cordeis-head',
      tip(h('div', 'folego', ui('cordel', 28), h('b', null, `Fôlego ${used}/${max}`), h('span', 'folego-pips', Array.from({ length: max }, (_, i) => h('i', i < used ? 'on' : null)))),
        { title: 'Fôlego', icon: ui('cordel', 36), rows: [{ text: 'Cada folheto ocupa de 1 a 5 de Fôlego. A soma dos equipados não pode passar do seu Fôlego.' }, { icon: 'descanso', text: 'A Casa de Cordel, na Aldeia, aumenta o Fôlego até 20.', tone: 'dim' }] }),
      tip(h('div', `cordel-full${full ? ' on' : ''}`, ui('estrela', 22), 'Cordel Completo', h('span', 'cordel-full-n', [1, 2, 3, 4, 5].map((n) => h('i', worn.some((id) => CORDEIS[id].cost === n) ? 'on' : null, n)))),
        { title: 'Cordel Completo', color: '#f2c14e', sub: full ? 'Completo' : 'Falta folheto de algum custo', subColor: full ? '#86e07a' : undefined, rows: [{ text: `Equipe ao mesmo tempo um folheto de cada custo, de 1 a 5, e ganhe +${pct(CORDEL.fullBonus)} de Lembranças.` }, { text: 'Pede Fôlego 15.', tone: 'dim' }] })),
    h('div', 'cordeis-grid', cards));
}

/* ---------- Presságios ---------- */

/**
 * As linhas dos Presságios, com os graus para marcar. `cap` limita o Peso (a campanha aceita até 10)
 * e `combatOnly` mostra só os que mexem nos monstros.
 */
export function omenRows(pick: OmenPick, set: (next: OmenPick, fk: string) => void, o: { combatOnly?: boolean; cap?: number; toast?: (text: string) => void } = {}): HTMLElement[] {
  const weight = omenWeight(pick);
  return OMEN_ORDER.filter((id) => !o.combatOnly || OMENS[id].combat).map((id: OmenId) => {
    const d = OMENS[id], g = omenGrade(pick, id);
    const put = (n: number) => {
      const to = n === g ? n - 1 : n, next = { ...pick, [id]: to };
      if (o.cap != null && to > g && weight + (to - g) * d.weight > o.cap) { o.toast?.(`O Peso não pode passar de ${o.cap}`); return; }
      set(next, `omen-${id}-${n}`);
    };
    return tip(h('div', `omen${g ? ' on' : ''}`,
      h('span', 'omen-ico', ui(d.icon, 28)),
      h('div', 'omen-mid', h('b', null, d.name), h('span', null, d.desc(Math.max(1, g)))),
      h('div', { class: 'omen-grades', role: 'group', 'aria-label': `Graus de ${d.name}` }, Array.from({ length: d.grades }, (_, i) => h('button', { type: 'button', class: `omen-g${i < g ? ' on' : ''}`, 'aria-pressed': String(i < g), 'aria-label': `Grau ${i + 1}`, 'data-fk': `omen-${id}-${i + 1}`, onclick: () => put(i + 1) }, d.weight)))),
    { title: d.name, icon: ui(d.icon, 36), tag: g ? `Peso ${g * d.weight}` : undefined, sub: `${d.weight} de Peso por grau`, rows: Array.from({ length: d.grades }, (_, i): TipRow => ({ icon: i < g ? 'check' : 'olho', text: d.desc(i + 1), tone: i < g ? 'bad' : 'dim' })) });
  });
}

export function omensView(c: Ctx): HTMLElement {
  const p = c.p, st = c.st.dream;
  if (p.dream.nights === 0) return h('div', 'omens-locked', ui('olho', 64), h('b', null, 'Presságios'), h('span', null, 'A primeira noite é só para conhecer o caminho. Depois dela você pode deixar as próximas mais difíceis, em troca de mais Lembranças.'));
  const weight = omenWeight(st.omens), bonus = omenMemories(st.omens);
  const mark = (n: number): Child => tip(h('i', `omen-mark${p.dream.bestWeight >= n ? ' won' : ''}${weight >= n ? ' on' : ''}`, n), { title: `Peso ${n}`, sub: p.dream.bestWeight >= n ? 'Já venceu uma noite assim' : 'Ainda não vencida', subColor: p.dream.bestWeight >= n ? '#86e07a' : undefined });
  return h('div', 'omens',
    h('div', 'omens-head',
      tip(h('div', 'omen-weight', ui('olho', 30), h('b', null, `Peso ${weight}`), h('span', null, bonus > 0 ? `+${pct(bonus)} de Lembranças` : 'Sem Presságios')),
        { title: 'Peso da noite', icon: ui('olho', 36), rows: [{ text: `Cada ponto de Peso dá +${pct(OMEN.memoriesPerPoint)} de Lembranças, até +${pct(OMEN.maxBonus)}.` }, { icon: 'coroa', text: 'Maior Peso já vencido', value: String(p.dream.bestWeight) }] }),
      h('div', 'omen-marks', OMEN.marks.map(mark)),
      weight > 0 && h('button', { type: 'button', class: 'btn small', 'data-fk': 'omen-limpar', onclick: () => { st.omens = {}; c.redraw('omen-limpar'); } }, 'Limpar')),
    h('div', 'omens-grid', omenRows(st.omens, (next, fk) => { st.omens = next; c.redraw(fk); })));
}
