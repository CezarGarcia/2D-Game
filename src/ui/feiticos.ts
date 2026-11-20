/** Feitiços: os três encaixes (Q, E, R), o Supremo (T), uma aba por elemento e os cinco feitiços da aba aberta. */
import { paintTalentBackdrop } from '../art/backdrops';
import {
  ELEMENTS, ELEMENT_ORDER, MAX_SPELL_LEVEL, REACTIONS, SPELLS, SPELL_LEVEL_POWER, SPELL_MILESTONES, SPELL_ORDER, SUPREMOS,
  type ElementId, type SpellId,
} from '../data/content';
import { knownSpells, setLoadout, setSupremo, spellLevel, spellUpgradeInfo, upgradeSpell, type Profile } from '../meta/profile';
import { MAIN_H, MAIN_W, unseen, type Ctx } from './ctx';
import { backdrop, h, keycap, num, pct, stat, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

const KEYS = ['Q', 'E', 'R'];

/** Dois ícones lado a lado: os elementos de uma reação. */
function pair(a: ElementId, b: ElementId): HTMLElement {
  return h('span', 'el-pair', ui(a, 20), ui(b, 20));
}

/** Reações que um elemento faz com os outros. */
function reactionRows(el: ElementId): TipRow[] {
  const list = REACTIONS.filter((r) => r.a === el || r.b === el);
  if (!list.length) return [];
  return [{ head: 'Reações' }, ...list.map((r): TipRow => {
    const other = r.a === el ? r.b : r.a;
    return { node: pair(el, other), text: [h('b', { style: `color:${ELEMENTS[other].color}` }, r.name), ` · ${r.desc}`] };
  })];
}

function spellTip(p: Profile, id: SpellId, where: 'grade' | 'encaixe'): TipSpec {
  const sp = SPELLS[id], el = ELEMENTS[sp.element], known = knownSpells(p).includes(id), lv = spellLevel(p, id);
  const up = spellUpgradeInfo(p, id);
  const rows: TipRow[] = [
    { text: sp.desc },
    { icon: 'mana', text: 'Mana', value: num(sp.cost) },
    { icon: 'recarga', text: 'Recarga', value: `${num(sp.cooldown, 1)} s` },
    { icon: sp.element, text: `${el.status}: ${el.statusDesc}`, tone: 'dim' },
    ...reactionRows(sp.element),
  ];
  if (!known) rows.push('sep', { icon: 'cadeado', text: `Aprende no nível ${sp.unlock}`, tone: 'bad' });
  else {
    rows.push({ head: `Nível ${lv} de ${MAX_SPELL_LEVEL}` });
    if (lv > 1) rows.push({ icon: 'magia', text: 'Dano, cura e duração', value: `+${pct((lv - 1) * SPELL_LEVEL_POWER)}`, tone: 'ok' });
    for (const m of SPELL_MILESTONES) rows.push({ icon: lv >= m.level ? 'check' : 'cadeado', text: `Nv ${m.level}: ${m.text}`, tone: lv >= m.level ? 'ok' : 'dim' });
    if (lv < MAX_SPELL_LEVEL) rows.push({ head: 'Subir de nível' }, { icon: 'tomo', text: 'Tomos', value: num(up.tomos), tone: p.materials.tomo < up.tomos ? 'bad' : undefined }, { icon: 'ouro', text: 'Ouro', value: num(up.gold), tone: p.gold < up.gold ? 'bad' : undefined });
  }
  return {
    title: sp.name, color: el.color, tag: known ? `Nv ${lv}` : undefined,
    sub: `${sp.role} · ${el.name}`, subColor: el.color, icon: ui(id, 40),
    rows,
    foot: !known ? [] : where === 'grade' ? ['Clique: escolher', 'Arraste: equipar'] : ['Clique: trocar', 'Botão direito: esvaziar'],
  };
}

/** Nível em que o primeiro feitiço do elemento é aprendido. */
function opensAt(el: ElementId): number {
  return Math.min(...SPELL_ORDER.filter((id) => SPELLS[id].element === el).map((id) => SPELLS[id].unlock));
}

export function renderFeiticos(c: Ctx): HTMLElement {
  const p = c.p, st = c.st, known = knownSpells(p);
  if (st.spellSel && !known.includes(st.spellSel)) st.spellSel = null;
  const sel = st.spellSel;
  const fresh = new Set(unseen('feiticos', known)), freshSup = new Set(unseen('supremos', p.supremos));
  /* aba aberta: a escolhida; senão a do feitiço selecionado ou do primeiro encaixe */
  const first = p.loadout.find((x): x is SpellId => !!x);
  const tab: ElementId = st.spellEl ?? (sel ? SPELLS[sel].element : first ? SPELLS[first].element : 'natureza');

  const put = (slot: number, id: SpellId | null) => { if (setLoadout(c.p, slot, id)) { st.spellSel = null; c.commit(`encaixe-${slot}`); } };
  const readDrag = (e: DragEvent): SpellId | null => {
    const id = e.dataTransfer?.getData('text/plain') as SpellId | undefined;
    return id && known.includes(id) ? id : null;
  };

  /* ---------- encaixes ---------- */
  const slots = KEYS.map((k, i) => {
    const id = p.loadout[i] ?? null, sp = id ? SPELLS[id] : null;
    const el = h('button', {
      type: 'button', class: `socket${sp ? '' : ' empty'}${sel ? ' target' : ''}`, style: sp ? `--ec:${ELEMENTS[sp.element].color}` : null,
      'aria-label': `Encaixe ${k}: ${sp ? sp.name : 'vazio'}`, 'data-fk': `encaixe-${i}`, draggable: sp ? 'true' : null,
      onclick: () => { if (sel) put(i, sel); else if (id) { st.spellSel = id; st.spellEl = SPELLS[id].element; c.redraw(`encaixe-${i}`); } },
      oncontextmenu: (e: Event) => { e.preventDefault(); if (id) put(i, null); },
      ondragstart: (e: DragEvent) => { if (id) { e.dataTransfer?.setData('text/plain', id); c.muteTips(true); } },
      ondragend: () => c.muteTips(false),
      ondragover: (e: DragEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('over'); },
      ondragleave: (e: DragEvent) => (e.currentTarget as HTMLElement).classList.remove('over'),
      ondrop: (e: DragEvent) => { e.preventDefault(); c.muteTips(false); const got = readDrag(e); if (got) put(i, got); },
    },
    sp ? ui(sp.id, 84) : h('span', 'socket-plus', '+'),
    keycap(k),
    sp && h('span', 'socket-lv', `Nv ${spellLevel(p, sp.id)}`));
    return tip(el, () => (id ? spellTip(c.p, id, 'encaixe') : { title: `Encaixe ${k}`, sub: 'Vazio', rows: [{ text: 'Clique num feitiço e depois aqui, ou arraste o feitiço até aqui.', tone: 'dim' }] }));
  });

  /* ---------- Supremo ---------- */
  const sup = p.supremo && p.supremos.includes(p.supremo) ? p.supremo : null;
  const cycle = () => {
    if (p.supremos.length < 2) return;
    const next = p.supremos[(p.supremos.indexOf(sup ?? p.supremos[0]) + 1) % p.supremos.length];
    if (setSupremo(c.p, next)) c.commit('supremo');
  };
  const supTip = (el: ElementId): TipSpec => ({
    title: SUPREMOS[el].name, color: ELEMENTS[el].color, sub: `Supremo · ${ELEMENTS[el].name}`, subColor: ELEMENTS[el].color, icon: ui(el, 40),
    rows: [{ text: SUPREMOS[el].desc }, { icon: 'supremo', text: 'A carga enche lutando. Cheia, aperte T.', tone: 'dim' }],
  });
  const supremo = p.supremos.length === 0
    ? tip(h('div', { class: 'socket supremo empty locked', tabindex: 0, 'aria-label': 'Supremo trancado' }, ui('cadeado', 56), keycap('T'), h('span', 'socket-note', 'Liberte o Curupira')),
      { title: 'Supremo', color: '#f2c14e', sub: 'Trancado', subColor: '#ff7b6b', rows: [{ text: 'Um Encantado libertado aparece e luta por você quando a carga enche.' }, { icon: 'caveira', text: `Vença a fase ${SUPREMOS.natureza.stage}`, tone: 'bad' }] })
    : h('div', 'supremo-box',
      tip(h('button', {
        type: 'button', class: `socket supremo${sup ? '' : ' empty'}`, style: sup ? `--ec:${ELEMENTS[sup].color}` : null, 'data-fk': 'supremo',
        'aria-label': `Supremo: ${sup ? SUPREMOS[sup].name : 'nenhum'}`, onclick: cycle,
      }, ui('supremo', 100), keycap('T'), sup && h('span', 'socket-lv', SUPREMOS[sup].name), sup && freshSup.has(sup) && h('span', 'new-tag', 'Novo')),
      () => (sup ? { ...supTip(sup), icon: ui('supremo', 40), foot: [p.supremos.length > 1 ? 'Clique: trocar' : null] } : { title: 'Supremo', rows: [{ text: 'Escolha um Encantado.', tone: 'dim' }] })),
      /* os sete Encantados: libertados para escolher, os outros trancados com a fase que liberta */
      h('div', 'supremo-picks', ELEMENT_ORDER.map((el) => {
        const has = p.supremos.includes(el);
        return tip(h('button', {
          type: 'button', class: `mini-btn${el === sup ? ' on' : ''}${has ? '' : ' off'}`, 'aria-pressed': String(el === sup), 'aria-label': has ? SUPREMOS[el].name : `${SUPREMOS[el].name}, trancado`,
          'aria-disabled': has ? null : 'true', style: `--ec:${ELEMENTS[el].color}`, 'data-fk': `sup-${el}`,
          onclick: () => { if (!has) { c.toast(`Vença a fase ${SUPREMOS[el].stage}`, 'bad'); return; } if (setSupremo(c.p, el)) c.commit(`sup-${el}`); },
        }, ui(has ? el : 'cadeado', 26), has && freshSup.has(el) && h('i', 'dot')),
        () => (has ? { ...supTip(el), foot: [el === sup ? null : 'Clique: escolher'] } : { ...supTip(el), sub: 'Trancado', subColor: '#ff7b6b', rows: [{ text: SUPREMOS[el].desc, tone: 'dim' }, { icon: 'caveira', text: `Vença a fase ${SUPREMOS[el].stage}`, tone: 'bad' }] }));
      })));

  /* ---------- abas de elemento ---------- */
  const tabs = ELEMENT_ORDER.map((el) => {
    const def = ELEMENTS[el], ids = SPELL_ORDER.filter((id) => SPELLS[id].element === el), got = ids.filter((id) => known.includes(id));
    const open = got.length > 0, on = el === tab, news = got.some((id) => fresh.has(id)), used = p.loadout.some((x) => x && SPELLS[x].element === el);
    return tip(h('button', {
      type: 'button', class: `el-tab${on ? ' on' : ''}${open ? '' : ' locked'}`, role: 'tab', 'aria-selected': String(on), style: `--ec:${def.color}`,
      'aria-label': `${def.name}${open ? `, ${got.length} de ${ids.length}` : `, abre no nível ${opensAt(el)}`}`, 'data-fk': `aba-${el}`,
      onclick: () => { st.spellEl = el; c.redraw(`aba-${el}`); },
    },
    ui(el, 36),
    open ? h('span', 'el-name', def.name) : h('span', 'el-lock', ui('cadeado', 18), `Nv ${opensAt(el)}`),
    used && h('i', 'el-used'),
    news && !on && h('span', 'new-tag', 'Novo')),
    () => ({
      title: def.name, color: def.color, icon: ui(el, 36), tag: `${got.length}/${ids.length}`,
      rows: [
        { icon: el, text: `${def.status}: ${def.statusDesc}` },
        !open && { icon: 'cadeado', text: `Primeiro feitiço no nível ${opensAt(el)}`, tone: 'bad' as const },
        ...reactionRows(el),
      ],
    }));
  });

  /* ---------- os cinco feitiços da aba ---------- */
  const def = ELEMENTS[tab];
  const cells = SPELL_ORDER.filter((id) => SPELLS[id].element === tab).map((id) => {
    const sp = SPELLS[id], isKnown = known.includes(id), lv = spellLevel(p, id), slot = p.loadout.indexOf(id);
    const up = spellUpgradeInfo(p, id), maxed = lv >= MAX_SPELL_LEVEL;
    const card = tip(h('button', {
      type: 'button', class: `spell${isKnown ? '' : ' unknown'}${sel === id ? ' sel' : ''}${slot >= 0 ? ' used' : ''}`,
      'aria-label': `${sp.name}${isKnown ? `, nível ${lv}` : `, aprende no nível ${sp.unlock}`}`, 'aria-disabled': isKnown ? null : 'true',
      'data-fk': `feitico-${id}`, draggable: isKnown ? 'true' : null,
      onclick: () => {
        if (!isKnown) { c.toast(`Aprende no nível ${sp.unlock}`, 'bad'); return; }
        st.spellSel = sel === id ? null : id; c.redraw(`feitico-${id}`);
      },
      ondragstart: (e: DragEvent) => { if (isKnown) { e.dataTransfer?.setData('text/plain', id); c.muteTips(true); } else e.preventDefault(); },
      ondragend: () => c.muteTips(false),
    },
    h('span', 'spell-ico', ui(id, 96), !isKnown && h('span', 'spell-lock', ui('cadeado', 34), `Nv. ${sp.unlock}`)),
    h('span', 'spell-name', sp.name),
    h('span', 'spell-nums', stat('mana', num(sp.cost), { size: 22 }), stat('recarga', `${num(sp.cooldown, 1)}s`, { size: 22 })),
    isKnown && h('span', 'pips', Array.from({ length: MAX_SPELL_LEVEL }, (_, k) => h('i', k < lv ? 'on' : SPELL_MILESTONES.some((m) => m.level === k + 1) ? 'mark' : ''))),
    slot >= 0 && keycap(KEYS[slot]),
    isKnown && fresh.has(id) && h('span', 'new-tag', 'Novo')),
    () => spellTip(c.p, id, 'grade'));
    const upBtn = isKnown && !maxed
      ? tip(h('button', {
        type: 'button', class: `up-btn${up.possible ? ' can' : ''}`, disabled: !up.possible, 'aria-label': `Subir ${sp.name} para o nível ${lv + 1}`, 'data-fk': `subir-${id}`,
        onclick: () => { if (upgradeSpell(c.p, id)) { c.toast(`${sp.name}: nível ${lv + 1}`); c.commit(`subir-${id}`); } },
      }, h('span', 'up-arrow', '▲'),
      stat('tomo', num(up.tomos), { size: 20, tone: p.materials.tomo < up.tomos ? 'bad' : '' }),
      stat('ouro', num(up.gold), { size: 20, tone: p.gold < up.gold ? 'bad' : '' })),
      () => ({
        title: `Subir para o nível ${lv + 1}`, color: def.color, sub: sp.name,
        rows: [
          { icon: 'magia', text: 'Dano, cura e duração', value: `+${pct(SPELL_LEVEL_POWER)}`, tone: 'ok' },
          ...SPELL_MILESTONES.filter((m) => m.level === lv + 1).map((m): TipRow => ({ icon: 'estrela', text: m.text, tone: 'gold' })),
          'sep',
          { icon: 'tomo', text: 'Tomos', value: `${num(p.materials.tomo)} / ${num(up.tomos)}`, tone: p.materials.tomo < up.tomos ? 'bad' : 'ok' },
          { icon: 'ouro', text: 'Ouro', value: `${num(p.gold)} / ${num(up.gold)}`, tone: p.gold < up.gold ? 'bad' : 'ok' },
        ],
      }))
      : isKnown ? h('span', 'up-btn maxed', 'Máximo') : h('span', 'up-btn none');
    return h('div', 'spell-cell', card, upBtn);
  });

  return h('div', `feiticos${sel ? ' picking' : ''}`,
    backdrop('feiticos', MAIN_W, MAIN_H, (g) => paintTalentBackdrop(g, MAIN_W, MAIN_H)),
    h('div', 'loadout', slots, h('span', 'loadout-gap'), supremo),
    h('div', { class: 'el-tabs', role: 'tablist', 'aria-label': 'Elementos' }, tabs),
    h('div', { class: 'spell-row', role: 'tabpanel', style: `--ec:${def.color}` }, cells));
}
