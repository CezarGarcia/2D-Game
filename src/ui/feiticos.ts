/** Feitiços: os três encaixes (Q, E, R), o Supremo (T) e a grade de feitiços por elemento. */
import { paintTalentBackdrop } from '../art/backdrops';
import { ELEMENTS, MAX_SPELL_LEVEL, SPELLS, SPELL_LEVEL_POWER, SPELL_MILESTONES, SPELL_ORDER, SUPREMOS, type ElementId, type SpellId } from '../data/content';
import { knownSpells, setLoadout, setSupremo, spellLevel, spellUpgradeInfo, upgradeSpell, type Profile } from '../meta/profile';
import { MAIN_H, MAIN_W, unseen, type Ctx } from './ctx';
import { backdrop, h, keycap, num, pct, stat, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

const KEYS = ['Q', 'E', 'R'];

function spellTip(p: Profile, id: SpellId, where: 'grade' | 'encaixe'): TipSpec {
  const sp = SPELLS[id], el = ELEMENTS[sp.element], known = knownSpells(p).includes(id), lv = spellLevel(p, id);
  const up = spellUpgradeInfo(p, id);
  const rows: TipRow[] = [
    { text: sp.desc },
    { icon: 'mana', text: 'Mana', value: num(sp.cost) },
    { icon: 'recarga', text: 'Recarga', value: `${num(sp.cooldown, 1)} s` },
    { icon: sp.element, text: `${el.status}: ${el.statusDesc}`, tone: 'dim' },
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

export function renderFeiticos(c: Ctx): HTMLElement {
  const p = c.p, st = c.st, known = knownSpells(p);
  if (st.spellSel && !known.includes(st.spellSel)) st.spellSel = null;
  const sel = st.spellSel;
  const fresh = new Set(unseen('feiticos', known)), freshSup = new Set(unseen('supremos', p.supremos));

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
      onclick: () => { if (sel) put(i, sel); else if (id) { st.spellSel = id; c.redraw(`encaixe-${i}`); } },
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
  const supremo = p.supremos.length === 0
    ? tip(h('div', { class: 'socket supremo empty locked', tabindex: 0, 'aria-label': 'Supremo trancado' }, ui('cadeado', 56), keycap('T'), h('span', 'socket-note', 'Liberte o Curupira')),
      { title: 'Supremo', color: '#f2c14e', sub: 'Trancado', subColor: '#ff7b6b', rows: [{ text: 'Um Encantado libertado aparece e luta por você quando a carga enche.' }, { icon: 'caveira', text: `Vença a fase ${SUPREMOS.natureza.stage}`, tone: 'bad' }] })
    : h('div', 'supremo-box',
      tip(h('button', {
        type: 'button', class: `socket supremo${sup ? '' : ' empty'}`, style: sup ? `--ec:${ELEMENTS[sup].color}` : null, 'data-fk': 'supremo',
        'aria-label': `Supremo: ${sup ? SUPREMOS[sup].name : 'nenhum'}`, onclick: cycle,
      }, ui('supremo', 100), keycap('T'), sup && h('span', 'socket-lv', SUPREMOS[sup].name), sup && freshSup.has(sup) && h('span', 'new-tag', 'Novo')),
      () => (sup ? {
        title: SUPREMOS[sup].name, color: ELEMENTS[sup].color, sub: `Supremo · ${ELEMENTS[sup].name}`, subColor: ELEMENTS[sup].color, icon: ui('supremo', 40),
        rows: [{ text: SUPREMOS[sup].desc }, { icon: 'supremo', text: 'A carga enche lutando. Cheia, aperte T.', tone: 'dim' }],
        foot: [p.supremos.length > 1 ? 'Clique: trocar' : null],
      } : { title: 'Supremo', rows: [{ text: 'Escolha um Encantado.', tone: 'dim' }] })),
      p.supremos.length > 1 && h('div', 'supremo-picks', p.supremos.map((el: ElementId) => tip(h('button', {
        type: 'button', class: `mini-btn${el === sup ? ' on' : ''}`, 'aria-pressed': String(el === sup), 'aria-label': SUPREMOS[el].name, style: `--ec:${ELEMENTS[el].color}`,
        onclick: () => { if (setSupremo(c.p, el)) c.commit('supremo'); },
      }, ui(el, 24)), { title: SUPREMOS[el].name, color: ELEMENTS[el].color, rows: [{ text: SUPREMOS[el].desc }] }))));

  /* ---------- grade por elemento ---------- */
  const rows = (Object.keys(ELEMENTS) as ElementId[]).map((el) => {
    const def = ELEMENTS[el];
    return h('div', { class: 'spell-row', style: `--ec:${def.color}` },
      tip(h('div', { class: 'el-plate', tabindex: 0 }, ui(el, 52), h('span', null, def.name)),
        { title: def.name, color: def.color, icon: ui(el, 36), rows: [{ icon: el, text: `${def.status}: ${def.statusDesc}` }] }),
      SPELL_ORDER.filter((id) => SPELLS[id].element === el).map((id) => {
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
        h('span', 'spell-ico', ui(id, 72), !isKnown && h('span', 'spell-lock', ui('cadeado', 30), `Nv. ${sp.unlock}`)),
        h('span', 'spell-name', sp.name),
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
      }));
  });

  return h('div', `feiticos${sel ? ' picking' : ''}`,
    backdrop('feiticos', MAIN_W, MAIN_H, (g) => paintTalentBackdrop(g, MAIN_W, MAIN_H)),
    h('div', 'loadout', slots, h('span', 'loadout-gap'), supremo),
    h('div', 'spell-rows', rows));
}
