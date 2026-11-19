/** Aba Ferreiro: aprimorar (+1) e fundir (subir a raridade). As chances e os custos vêm prontos das regras. */
import { STAGES } from '../data/stages';
import { ITEM_TYPES, MAX_RARITY, RARITIES, SLOTS, affixText, baseLabel, baseValue, itemScore, type Item } from '../data/items';
import { FUSE_CHANCE, MATERIAL_LABEL, findItem, fuseInfo, fuseItems, upgradeInfo, upgradeItem } from '../meta/profile';
import type { Ctx } from './ctx';
import { br, btn, h, icon, num, pct } from './dom';
import { fullName, itemCard, itemTile } from './itens';
import { slotName } from './heroi';

function cost(kind: string, label: string, need: number, have: number): HTMLElement {
  return h('div', `cost${have < need ? ' short' : ''}`, icon('misc', kind, 22),
    h('div', null, h('span', 'k', label), h('b', 'num', num(need)), h('span', 'muted num small', ` · você tem ${num(have)}`)));
}

function pickSel(c: Ctx, id: number): void {
  c.st.forgeSel = c.st.forgeSel === id ? null : id;
  c.st.forgeFodder = []; c.st.forgeResult = null;
  c.redraw();
}

function picker(c: Ctx): HTMLElement {
  const p = c.p, mode = c.st.forgeMode;
  const worn = SLOTS.filter((sl) => p.equipped[sl]).map((sl) => ({ slot: sl, item: p.equipped[sl] as Item }));
  const bag = p.inventory.slice().sort((a, b) => b.rarity - a.rarity || itemScore(b) - itemScore(a) || b.id - a.id);
  const setMode = (m: 'aprimorar' | 'fundir') => () => { c.st.forgeMode = m; c.st.forgeFodder = []; c.st.forgeResult = null; c.redraw(); };
  const rules = mode === 'aprimorar'
    ? ['Cada + aumenta o dano ou a defesa do item; anéis, amuletos e aljavas não têm valor base.',
      'Falhar gasta o custo, mas nunca destrói o item, e a próxima chance sobe 5 pontos.',
      `Cada raridade tem um teto: ${RARITIES.slice(0, 5).map((r) => `${r.label} +${r.maxPlus}`).join(', ')}.`]
    : ['Junta 3 itens da mesma raridade e do mesmo espaço: o principal sobe uma raridade e ganha um bônus novo.',
      'Se falhar, você perde só um dos dois itens consumidos. O principal nunca se perde.',
      `Chance por raridade de partida: ${FUSE_CHANCE.map((ch, i) => `${RARITIES[i].label} ${pct(ch)}`).join(', ')}.`];

  return h('section', { class: 'panel forge-pick', 'aria-label': 'Escolha do item' },
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Modo do ferreiro' },
      btn('Aprimorar', setMode('aprimorar'), { pressed: mode === 'aprimorar', fk: 'modo-aprimorar' }),
      btn('Fundir', setMode('fundir'), { pressed: mode === 'fundir', fk: 'modo-fundir' })),
    h('ul', 'rules', rules.map((r) => h('li', null, r))),
    h('div', { class: 'panel-scroll', 'data-sk': 'forge-pick' },
      h('h3', null, mode === 'aprimorar' ? 'Equipados' : 'Item principal: equipados'),
      h('div', 'bag-grid', worn.map(({ slot, item }) => itemTile(item, {
        fk: `fg-${item.id}`, selected: c.st.forgeSel === item.id, title: `${fullName(item)} · ${slotName(slot)}`, onClick: () => pickSel(c, item.id),
      }))),
      h('h3', null, 'Mochila'),
      bag.length
        ? h('div', 'bag-grid', bag.map((item) => itemTile(item, { fk: `fg-${item.id}`, selected: c.st.forgeSel === item.id, onClick: () => pickSel(c, item.id) })))
        : h('p', 'muted', 'Mochila vazia.')),
  );
}

interface Work { body: HTMLElement; foot: HTMLElement }

function result(c: Ctx): HTMLElement {
  const r = c.st.forgeResult;
  return r ? h('div', { class: `result ${r.ok ? 'ok' : 'fail'}`, role: 'status' }, h('strong', null, r.title), h('span', null, r.text)) : h('div', { class: 'result-slot', role: 'status' });
}

function upgradePanel(c: Ctx, item: Item): Work {
  const p = c.p, info = upgradeInfo(p, item), max = RARITIES[item.rarity].maxPlus, atMax = item.plus >= max;
  const after = baseLabel({ ...item, plus: item.plus + 1 }), hasBase = baseValue(item) > 0;
  const body = h('div', 'forge-body',
    result(c),
    itemCard(item, true),
    h('div', 'steps',
      h('div', 'step', h('span', 'k', 'Agora'), h('b', 'num big', `+${item.plus}`), hasBase && h('span', 'num', br(baseLabel(item)))),
      h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'),
      atMax
        ? h('div', 'step', h('span', 'k', 'Teto da raridade'), h('b', 'num big', `+${max}`), h('span', 'muted small', 'Funda para subir a raridade'))
        : h('div', 'step next', h('span', 'k', 'Depois'), h('b', 'num big', `+${item.plus + 1}`), hasBase && h('span', 'num', br(after))),
      !atMax && h('div', 'step chance', h('span', 'k', 'Chance'), h('b', 'num big', pct(info.chance)),
        h('span', 'muted small', (item.pity ?? 0) > 0 ? `inclui +${num(item.pity ?? 0)} pontos de falhas anteriores` : `teto de ${RARITIES[item.rarity].label}: +${max}`))),
    !atMax && h('div', 'costs', cost('ouro', 'Ouro', info.gold, p.gold), cost('material', MATERIAL_LABEL.mata, info.mata, p.materials.mata)),
  );
  const foot = h('div', 'panel-foot forge-foot',
    !info.possible && h('p', 'warn-text', info.reason),
    h('div', 'actions',
      btn(atMax ? 'No teto' : `Aprimorar para +${item.plus + 1}`, () => {
        const r = upgradeItem(c.p, item.id), now = findItem(c.p, item.id)?.item ?? item;
        c.st.forgeResult = !r.done ? { ok: false, title: 'Não deu para aprimorar.', text: r.reason ?? '' }
          : r.success ? { ok: true, title: `Deu certo: ${now.name} agora é +${now.plus}.`, text: baseLabel(now) ? `Valor base: ${br(baseLabel(now))}.` : 'O aprimoramento ficou gravado no item.' }
            : { ok: false, title: 'A forja falhou.', text: 'O item não foi destruído nem perdeu nada. O custo foi gasto e a próxima chance subiu 5 pontos.' };
        c.commit();
      }, { kind: 'primary', disabled: !info.possible, fk: 'aprimorar', cls: 'big' })),
  );
  return { body, foot };
}

function fusePanel(c: Ctx, item: Item): Work {
  const p = c.p;
  c.st.forgeFodder = c.st.forgeFodder.filter((id) => p.inventory.some((i) => i.id === id));
  const fodder = c.st.forgeFodder, info = fuseInfo(p, item.id, fodder);
  const canBeMain = !item.unique && item.rarity < MAX_RARITY;
  const group = ITEM_TYPES[item.type].group;
  const options = p.inventory.filter((i) => i.id !== item.id && i.rarity === item.rarity && ITEM_TYPES[i.type].group === group);
  const next = item.rarity < MAX_RARITY ? RARITIES[item.rarity + 1] : null;
  const toggle = (id: number) => () => {
    c.st.forgeFodder = fodder.includes(id) ? fodder.filter((x) => x !== id) : fodder.length < 2 ? [...fodder, id] : [fodder[1], id];
    c.st.forgeResult = null; c.redraw();
  };
  const body = h('div', 'forge-body',
    result(c),
    itemCard(item, true),
    canBeMain && [
      h('h3', null, `Itens para consumir: ${fodder.length} de 2 escolhidos`),
      options.length
        ? h('div', 'bag-grid fodder', options.map((it) => itemTile(it, {
          fk: `fd-${it.id}`, selected: fodder.includes(it.id), disabled: !!it.locked, onClick: toggle(it.id),
          title: it.locked ? `${fullName(it)} · travado, não pode ser consumido` : fullName(it),
        })))
        : h('p', 'muted', `Não há outros itens ${RARITIES[item.rarity].label} do mesmo espaço na mochila.`),
      h('p', 'muted small', `Só aparecem itens da mochila que servem: ${RARITIES[item.rarity].label}, mesmo espaço de equipamento. Em caso de falha, o primeiro escolhido é o que se perde.`),
    ],
    canBeMain && next && h('div', 'steps',
      h('div', 'step', h('span', 'k', 'Agora'), h('b', { class: 'big', style: `color:${RARITIES[item.rarity].color}` }, RARITIES[item.rarity].label), h('span', 'muted small num', `teto +${RARITIES[item.rarity].maxPlus}`)),
      h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'),
      h('div', 'step next', h('span', 'k', 'Depois'), h('b', { class: 'big', style: `color:${next.color}` }, next.label), h('span', 'muted small num', `teto +${next.maxPlus} · 1 bônus novo`)),
      h('div', 'step chance', h('span', 'k', 'Chance'), h('b', 'num big', pct(info.chance)))),
    canBeMain && h('div', 'costs',
      cost('ouro', 'Ouro', info.gold, p.gold),
      info.lagrima > 0 && cost('lagrima', MATERIAL_LABEL.lagrima, info.lagrima, p.materials.lagrima)),
  );
  const foot = h('div', 'panel-foot forge-foot',
    !info.possible && h('p', 'warn-text', info.reason),
    h('div', 'actions',
      btn('Fundir', () => {
        const before = item.affixes.length, lost = c.p.inventory.find((i) => i.id === fodder[0]);
        const lostName = lost ? fullName(lost) : '';
        const r = fuseItems(c.p, item.id, fodder), now = findItem(c.p, item.id)?.item ?? item;
        c.st.forgeResult = !r.done ? { ok: false, title: 'Não deu para fundir.', text: r.reason ?? '' }
          : r.success ? { ok: true, title: `Fusão feita: ${now.name} agora é ${RARITIES[now.rarity].label}.`, text: now.affixes.length > before ? `Bônus novo: ${affixText(now.affixes[now.affixes.length - 1])}.` : '' }
            : { ok: false, title: 'A fusão falhou.', text: `Você perdeu só um item consumido (${lostName}). O principal e o outro ficaram com você.` };
        c.st.forgeFodder = [];
        c.commit();
      }, { kind: 'primary', disabled: !info.possible, fk: 'fundir', cls: 'big' })),
  );
  return { body, foot };
}

export function renderFerreiro(c: Ctx, unlocked: boolean): HTMLElement {
  if (!unlocked) {
    const gate = STAGES.find((s) => s.id === '1-2') ?? STAGES[1];
    return h('div', 'tab-locked',
      h('div', 'panel locked-box',
        h('h1', 'title', 'O ferreiro ainda não chegou'),
        h('p', null, `Ele monta a bigorna no acampamento quando você vencer a fase ${gate.id} · ${gate.name}.`),
        h('p', 'muted', 'Depois disso você pode aprimorar itens (+1, +2…) e fundir três itens para subir a raridade.'),
        btn('Ver o mapa', () => c.go('mapa'), { kind: 'primary' })));
  }
  const found = c.st.forgeSel != null ? findItem(c.p, c.st.forgeSel) : null;
  if (!found) c.st.forgeSel = null;
  const mode = c.st.forgeMode;
  const work = found ? (mode === 'aprimorar' ? upgradePanel(c, found.item) : fusePanel(c, found.item)) : null;
  return h('div', 'tab-ferreiro',
    picker(c),
    h('section', { class: 'panel forge-work', 'aria-label': mode === 'aprimorar' ? 'Aprimorar' : 'Fundir' },
      h('div', { class: 'panel-scroll', 'data-sk': 'forge-work' },
        h('header', 'panel-head',
          h('h2', 'title', mode === 'aprimorar' ? 'Aprimorar' : 'Fundir'),
          found && btn('Fechar', () => c.redraw(closeFerreiro(c) || undefined), { small: true, kind: 'quiet', fk: 'fechar-forja', title: 'Esc' })),
        work
          ? work.body
          : h('div', 'empty-hint',
            h('p', null, mode === 'aprimorar' ? 'Escolha ao lado o item que você quer aprimorar.' : 'Escolha ao lado o item principal: é ele que sobe de raridade.'),
            h('p', 'muted', 'O custo e a chance aparecem aqui antes de você confirmar.'))),
      work && work.foot),
  );
}

export function closeFerreiro(c: Ctx): string | null {
  const id = c.st.forgeSel;
  if (id == null) return null;
  c.st.forgeSel = null; c.st.forgeFodder = []; c.st.forgeResult = null;
  return `fg-${id}`;
}
