/**
 * Ferreiro: cinco modos em ícones, a bigorna no meio e a grade de itens que acende o que dá para trabalhar.
 * O modo Gemas troca a bigorna pelo encaixe do item e mostra a bolsa de gemas à direita.
 */
import { drawAnvil, paintForgeBackdrop } from '../art/backdrops';
import { ELEMENTS } from '../data/content';
import { GEM_MAX, ITEM_TYPES, MAX_RARITY, RARITIES, affixText, baseLabel, canHoldGem, gemName, gemText, itemScore, type Gem, type Item } from '../data/items';
import {
  GEM_FUSE_COST, GEM_REMOVE_COST, GEM_SOCKET_COST, allItems, enchantInfo, enchantItem, findItem, fuseCandidates, fuseGems, fuseInfo, fuseItems, gemList,
  reforgeInfo, reforgeItem, reforgedPreview, socketGem, unsocketGem, upgradeInfo, upgradeItem, type Profile,
} from '../meta/profile';
import { isForgeUnlocked } from '../meta/rewards';
import { MAIN_H, MAIN_W, type CostLine, type Ctx, type ForgeMode } from './ctx';
import { backdrop, br, h, hdCanvas, num, pct, s, stat, ui } from './dom';
import { AFFIX_ICON, emptyTile, gemLabel, gemTile, itemTile, itemTip, rarColor } from './itens';
import { tip, type TipRow } from './tip';

const MODES: { id: ForgeMode; icon: string; label: string; text: string }[] = [
  { id: 'aprimorar', icon: 'aprimorar', label: 'Aprimorar', text: 'Sobe o +N do item: mais dano ou defesa. Falhar não destrói.' },
  { id: 'fundir', icon: 'fundir', label: 'Fundir', text: 'Junta 3 itens da mesma raridade e espaço: o principal sobe de raridade e ganha um bônus.' },
  { id: 'encantar', icon: 'encantar', label: 'Encantar', text: 'Troca um bônus do item por outro, sorteado.' },
  { id: 'reforjar', icon: 'reforjar', label: 'Reforjar', text: 'Traz um item antigo para o seu nível.' },
  { id: 'gemas', icon: 'gema', label: 'Gemas', text: 'Encaixa uma gema na arma ou na armadura. Três gemas iguais viram uma mais forte.' },
];
const NO_SOCKET = 'Anéis, amuletos e aljavas não têm encaixe.';

interface Work { lit: boolean; can: boolean; why?: string }

/** O item serve para o modo atual? E dá para pagar agora? */
function workOf(p: Profile, mode: ForgeMode, it: Item): Work {
  if (mode === 'aprimorar') {
    const i = upgradeInfo(p, it);
    return { lit: it.plus < RARITIES[it.rarity].maxPlus, can: i.possible, why: i.reason };
  }
  if (mode === 'fundir') {
    if (it.unique) return { lit: false, can: false, why: 'Itens com nome não podem ser fundidos.' };
    if (it.rarity >= MAX_RARITY) return { lit: false, can: false, why: 'Já está na raridade máxima.' };
    const cands = fuseCandidates(p, it.id);
    if (cands.length < 2) return { lit: true, can: false, why: `Faltam ${2 - cands.length === 1 ? '1 item' : '2 itens'} ${RARITIES[it.rarity].label} do mesmo espaço na mochila.` };
    const i = fuseInfo(p, it.id, [cands[0].id, cands[1].id]);
    return { lit: true, can: i.possible, why: i.reason };
  }
  if (mode === 'gemas') {
    if (!canHoldGem(it)) return { lit: false, can: false, why: NO_SOCKET };
    return { lit: true, can: gemList(p).length > 0 || !!it.gem };
  }
  if (mode === 'encantar') {
    const i = enchantInfo(p, it);
    return { lit: it.affixes.length > 0, can: i.possible, why: i.reason };
  }
  const i = reforgeInfo(p, it);
  return { lit: it.ilvl < p.level, can: i.possible, why: i.reason };
}

function costs(list: (CostLine | null | false)[]): HTMLElement {
  return h('div', 'costs', list.filter((x): x is CostLine => !!x).map((cst) =>
    tip(stat(cst.icon, num(cst.amount), { size: 30, tone: cst.have < cst.amount ? 'bad' : '' }),
      { title: 'Custo', rows: [{ icon: cst.icon, text: 'Precisa', value: num(cst.amount) }, { icon: cst.icon, text: 'Você tem', value: num(cst.have), tone: cst.have < cst.amount ? 'bad' : 'ok' }] })));
}

/** Medidor de chance: um anel que enche; a parte do bônus de azar aparece em outra cor. */
function gauge(chance: number, pity: number, failText: string): HTMLElement {
  const R = 40, C = 2 * Math.PI * R, base = Math.max(0, chance - pity / 100);
  const color = chance >= 0.9 ? '#5fcb6a' : chance >= 0.6 ? '#f2c14e' : '#ff8a4c';
  return tip(h('div', { class: 'gauge', style: `--gc:${color}`, tabindex: 0, 'aria-label': `Chance de sucesso: ${pct(chance)}` },
    s('svg', { viewBox: '0 0 100 100', width: 104, height: 104, 'aria-hidden': 'true' },
      s('circle', { class: 'g-track', cx: 50, cy: 50, r: R }),
      s('circle', { class: 'g-pity', cx: 50, cy: 50, r: R, 'stroke-dasharray': `${C * chance} ${C}`, transform: 'rotate(-90 50 50)' }),
      s('circle', { class: 'g-fill', cx: 50, cy: 50, r: R, 'stroke-dasharray': `${C * base} ${C}`, transform: 'rotate(-90 50 50)' })),
    h('b', null, pct(chance))),
  {
    title: 'Chance de sucesso', tag: pct(chance), color,
    rows: [
      pity > 0 ? { icon: 'sorte', text: 'Bônus por falhas anteriores', value: `+${num(pity)}%`, tone: 'ok' } : null,
      { text: failText, tone: 'dim' },
    ],
  });
}

function arrow(): HTMLElement {
  return h('span', 'to', ui('seta', 26));
}

function modeBar(c: Ctx): HTMLElement {
  const st = c.st, mode = st.forgeMode;
  const setMode = (m: ForgeMode) => { st.forgeMode = m; st.forgeFodder = []; st.forgeAffix = null; c.redraw(`modo-${m}`); };
  return h('div', { class: 'forge-modes', role: 'tablist', 'aria-label': 'Modo do ferreiro' }, MODES.map((m) => tip(h('button', {
    type: 'button', class: `mode-btn${mode === m.id ? ' on' : ''}`, role: 'tab', 'aria-selected': String(mode === m.id), 'data-fk': `modo-${m.id}`, onclick: () => setMode(m.id),
  }, ui(m.icon, 52), h('span', null, m.label)), { title: m.label, icon: ui(m.icon, 36), rows: [{ text: m.text }] })));
}

/* ---------- modo Gemas ---------- */

/** O que a gema faz na arma e na armadura (o texto vem da camada de dados). */
function gemEffects(g: Gem): { weapon: string; armor: string } {
  const probe = (type: Item['type']): Item => ({ id: -1, type, name: '', ilvl: 1, rarity: 0, plus: 0, affixes: [], gem: g });
  return { weapon: gemText(probe('facao')), armor: gemText(probe('gibao')) };
}

function renderGemas(c: Ctx, bg: HTMLElement): HTMLElement {
  const p = c.p, st = c.st, fx = st.forgeFx;
  let main = st.forgeSel != null ? findItem(p, st.forgeSel)?.item ?? null : null;
  if (main && !canHoldGem(main)) main = null;
  if (!main) st.forgeSel = null;
  st.forgeFodder = []; st.forgeAffix = null;
  const bag = gemList(p), equippedIds = new Set(Object.values(p.equipped).map((i) => i?.id));
  const clear = () => { st.forgeSel = null; c.redraw(); };

  /* ---------- itens: só armas e armaduras acendem ---------- */
  const grid = allItems(p).map((it) => {
    const ok = canHoldGem(it), isMain = main?.id === it.id;
    return itemTile(it, {
      size: 52, fk: `forja-${it.id}`, cls: `${ok ? 'lit' : 'dim'}${isMain ? ' picked' : ''}`, equipped: equippedIds.has(it.id),
      onClick: () => {
        if (isMain) { clear(); return; }
        if (!ok) { c.toast(NO_SOCKET, 'bad'); return; }
        st.forgeSel = it.id; c.redraw(`forja-${it.id}`);
      },
      tipSpec: () => itemTip(c.p, it, { where: 'outro', noSell: true, extra: ok ? [] : [{ icon: 'cadeado', text: NO_SOCKET, tone: 'bad' }], foot: [isMain ? 'Clique: soltar' : ok ? 'Clique: escolher' : null] }),
    });
  });

  /* ---------- item escolhido e o encaixe ---------- */
  const g = main?.gem ?? null;
  const pull = () => {
    if (!main) return;
    const r = unsocketGem(c.p, main.id);
    if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
    st.forgeFx = { ok: true, text: 'Solta!', color: g ? ELEMENTS[g.el].color : undefined };
    c.commit('tirar');
  };
  const socket = g
    ? tip(h('span', { class: 'gem-socket full', style: `--gc:${ELEMENTS[g.el].color}`, tabindex: 0 }, gemTile(g, 76)),
      { title: gemName(g), color: ELEMENTS[g.el].color, tag: `Nv ${g.lvl}`, icon: gemTile(g, 36), rows: [{ text: gemText(main!) }] })
    : tip(h('span', { class: `gem-socket${main ? ' wait' : ''}`, tabindex: 0 }, h('i', 'socket-hole')),
      { title: 'Encaixe', sub: main ? 'Vazio' : undefined, rows: [{ text: main ? 'Clique numa gema da bolsa para encaixar.' : 'Escolha uma arma ou armadura.', tone: 'dim' }] });
  const removeCost = g ? GEM_REMOVE_COST(g.lvl) : 0;
  const top = h('div', 'gem-top',
    main
      ? itemTile(main, { size: 96, cls: 'on-anvil', fk: 'bigorna', onClick: clear, tipSpec: () => itemTip(c.p, main!, { where: 'outro', noSell: true, foot: ['Clique: soltar'] }) })
      : tip(emptyTile(null, 96, 'on-anvil wait'), { title: 'Gemas', rows: [{ text: 'Clique numa arma ou armadura acesa.', tone: 'dim' }] }),
    h('span', 'to', ui('seta', 30)),
    socket,
    g && tip(h('button', { type: 'button', class: 'btn pull', 'data-fk': 'tirar', disabled: p.gold < removeCost, onclick: pull }, ui('fechar', 24), stat('ouro', num(removeCost), { size: 22, tone: p.gold < removeCost ? 'bad' : '' })), {
      title: 'Tirar a gema', color: ELEMENTS[g.el].color, rows: [{ text: 'A gema volta para a bolsa.', tone: 'dim' }, { icon: 'ouro', text: 'Custo', value: num(removeCost), tone: p.gold < removeCost ? 'bad' : undefined }],
    }));
  const line = h('div', 'gem-line', g
    ? h('span', { style: `color:${ELEMENTS[g.el].color}` }, gemText(main!))
    : main ? [ui('seta', 26, 'flip'), h('span', null, 'Escolha uma gema')] : [ui('seta', 26), h('span', null, 'Escolha um item')]);

  /* ---------- bolsa de gemas ---------- */
  const cells = bag.map(({ gem, count }) => {
    const key = `${gem.el}-${gem.lvl}`, color = ELEMENTS[gem.el].color, fx2 = gemEffects(gem);
    const cost = main ? GEM_SOCKET_COST(gem.lvl) + (main.gem ? GEM_REMOVE_COST(main.gem.lvl) : 0) : GEM_SOCKET_COST(gem.lvl);
    const fuseCost = GEM_FUSE_COST(gem.lvl), canFuse = count >= 3 && gem.lvl < GEM_MAX;
    const put = () => {
      if (!main) { c.toast('Escolha uma arma ou armadura', 'bad'); return; }
      const r = socketGem(c.p, main.id, gem);
      if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
      st.forgeFx = { ok: true, text: gemName(gem), color };
      c.commit(`gema-${key}`);
    };
    const fuse = () => {
      const r = fuseGems(c.p, gem);
      if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
      const made = { el: gem.el, lvl: gem.lvl + 1 };
      st.forgeFx = { ok: true, text: gemName(made), sub: `Nv ${made.lvl}`, color };
      c.commit(`fundir-${gem.el}-${made.lvl}`);
    };
    return h('div', { class: `gem-cell${main ? ' can' : ''}`, style: `--gc:${color}` },
      tip(h('button', { type: 'button', class: 'gem-pick', 'data-fk': `gema-${key}`, 'aria-label': `${gemLabel(gem)}, ${count}`, onclick: put },
        gemTile(gem, 56), h('b', 'gem-count', `×${count}`)),
      () => ({
        title: gemName(gem), color, tag: `Nv ${gem.lvl}`, icon: gemTile(gem, 36),
        rows: [
          { icon: 'dano', text: `Na arma: ${fx2.weapon}` },
          { icon: 'defesa', text: `Na armadura: ${fx2.armor}` },
          'sep',
          { node: gemTile(gem, 20), text: 'Na bolsa', value: num(count) },
          main ? { icon: 'ouro', text: main.gem ? 'Encaixar (troca a atual)' : 'Encaixar', value: num(cost), tone: c.p.gold < cost ? 'bad' : undefined } : { icon: 'seta', text: 'Escolha um item primeiro', tone: 'dim' },
        ],
        foot: [main ? 'Clique: encaixar' : null],
      })),
      canFuse && tip(h('button', { type: 'button', class: `gem-fuse${p.gold < fuseCost ? ' short' : ''}`, 'data-fk': `fundir-${key}`, 'aria-label': `Fundir 3 em ${gemName({ el: gem.el, lvl: gem.lvl + 1 })}`, onclick: fuse },
        ui('fundir', 22), stat('ouro', num(fuseCost), { size: 18, tone: p.gold < fuseCost ? 'bad' : '' })),
      () => ({
        title: 'Fundir 3 gemas', color, icon: gemTile({ el: gem.el, lvl: gem.lvl + 1 }, 36),
        rows: [
          { node: gemTile(gem, 20), text: `3 × ${gemName(gem)}` },
          { icon: 'seta', text: `${gemName({ el: gem.el, lvl: gem.lvl + 1 })} · Nv ${gem.lvl + 1}`, tone: 'ok' },
          { icon: 'ouro', text: 'Custo', value: num(fuseCost), tone: c.p.gold < fuseCost ? 'bad' : undefined },
        ],
        foot: ['Clique: fundir'],
      })));
  });

  return h('div', 'ferreiro gemas',
    bg,
    modeBar(c),
    h('div', 'gem-bench',
      top,
      fx && h('div', { class: `forge-fx gemfx ${fx.ok ? 'ok' : 'fail'}`, style: fx.color ? `--fxc:${fx.color}` : null, 'aria-live': 'polite' }, h('i', 'flash'), h('b', null, fx.text), fx.sub && h('span', null, fx.sub)),
      line,
      h('section', { class: 'panel gem-items', 'aria-label': 'Seus itens' }, grid)),
    h('section', { class: 'panel gem-bag', 'aria-label': 'Bolsa de gemas' },
      cells.length ? cells : tip(h('div', { class: 'gem-none', tabindex: 0 }, ui('gema', 64), h('b', null, '0')),
        { title: 'Bolsa de gemas', rows: [{ text: 'Elites, chefões e a Torre dão gemas.', tone: 'dim' }] })));
}

export function renderFerreiro(c: Ctx): HTMLElement {
  const p = c.p, st = c.st;
  const bg = backdrop('ferreiro', MAIN_W, MAIN_H, (g) => paintForgeBackdrop(g, MAIN_W, MAIN_H));
  const AW = 560, AH = 260;
  const { cv: anvil } = hdCanvas(AW, AH, 'anvil');
  const paintAnvil = (g: CanvasRenderingContext2D, t: number) => { g.clearRect(0, 0, AW, AH); g.save(); g.translate(AW / 2, AH / 2); g.scale(1.15, 1.15); drawAnvil(g, t); g.restore(); };

  if (!isForgeUnlocked(p)) {
    const g = anvil.getContext('2d');
    if (g) { try { paintAnvil(g, 0); } catch { /* sem bigorna, segue só o cadeado */ } }
    return h('div', 'ferreiro locked', bg, h('div', 'forge-off', anvil),
      tip(h('div', { class: 'big-lock', tabindex: 0 }, ui('cadeado', 96), h('span', 'plate', 'Fase 1-2')),
        { title: 'Ferreiro trancado', color: '#ff7b6b', rows: [{ icon: 'mapa', text: 'Vença a fase 1-2 para abrir.' }] }));
  }
  if (st.forgeMode === 'gemas') return renderGemas(c, bg);
  c.animate(anvil, paintAnvil);

  /* a seleção pode ter sumido (vendida, consumida) ou não valer mais para o modo */
  const mode = st.forgeMode;
  let main = st.forgeSel != null ? findItem(p, st.forgeSel)?.item ?? null : null;
  /* fundir e encantar não aceitam qualquer item; aprimorar e reforjar mostram "no máximo" e seguem com ele na bigorna */
  if (main && (mode === 'fundir' || mode === 'encantar') && !workOf(p, mode, main).lit) main = null;
  if (!main) { st.forgeSel = null; st.forgeFodder = []; st.forgeAffix = null; }
  const cands = main && mode === 'fundir' ? fuseCandidates(p, main.id) : [];
  st.forgeFodder = mode === 'fundir' ? st.forgeFodder.filter((id) => cands.some((i) => i.id === id)).slice(0, 2) : [];
  if (main && mode === 'encantar' && (st.forgeAffix == null || !main.affixes[st.forgeAffix])) st.forgeAffix = null;

  const clear = () => { st.forgeSel = null; st.forgeFodder = []; st.forgeAffix = null; c.redraw(); };

  /* ---------- grade de itens ---------- */
  const equippedIds = new Set(Object.values(p.equipped).map((i) => i?.id));
  const grid = allItems(p).map((it) => {
    const w = workOf(p, mode, it), isMain = main?.id === it.id;
    const isCand = !!main && mode === 'fundir' && cands.some((i) => i.id === it.id), isFodder = st.forgeFodder.includes(it.id);
    const lit = main && mode === 'fundir' ? isMain || isCand : w.lit;
    const click = () => {
      if (isMain) { clear(); return; }
      if (isCand) {
        if (isFodder) st.forgeFodder = st.forgeFodder.filter((id) => id !== it.id);
        else st.forgeFodder = [...st.forgeFodder, it.id].slice(-2);
        c.redraw(`forja-${it.id}`); return;
      }
      if (!w.lit) { if (w.why) c.toast(w.why, 'bad'); return; }
      st.forgeSel = it.id; st.forgeFodder = []; st.forgeAffix = null;
      c.redraw(`forja-${it.id}`);
    };
    const extra: TipRow[] = [];
    if (isCand) extra.push({ icon: 'fundir', text: isFodder ? 'Vai ser consumido na fusão' : 'Serve para consumir na fusão', tone: isFodder ? 'warn' : 'ok' });
    else if (w.can) extra.push({ icon: mode, text: 'Dá para fazer agora', tone: 'ok' });
    else if (w.why) extra.push({ icon: mode, text: w.why, tone: 'bad' });
    return itemTile(it, {
      size: 58, fk: `forja-${it.id}`, onClick: click,
      cls: `${lit ? 'lit' : 'dim'}${isMain ? ' picked' : ''}${isFodder ? ' fodder' : ''}`,
      seal: lit && !isCand && w.can, equipped: equippedIds.has(it.id),
      tipSpec: () => itemTip(c.p, it, { where: 'outro', noSell: true, extra, foot: [isMain ? 'Clique: tirar da bigorna' : isCand ? (isFodder ? 'Clique: não consumir' : 'Clique: consumir') : w.lit ? 'Clique: pôr na bigorna' : null] }),
    });
  });

  /* ---------- bancada ---------- */
  const fx = st.forgeFx;
  const mainSlot = (size: number) => main
    ? itemTile(main, { size, cls: 'on-anvil', fk: 'bigorna', onClick: clear, tipSpec: () => itemTip(c.p, main!, { where: 'outro', noSell: true, foot: ['Clique: tirar da bigorna'] }) })
    : tip(emptyTile(null, size, 'on-anvil wait'), { title: MODES.find((m) => m.id === mode)!.label, rows: [{ text: 'Clique num item aceso na grade ao lado.', tone: 'dim' }] });

  let slots: HTMLElement, info: HTMLElement | null = null, action: HTMLElement | null = null;
  const hammer = (ok: boolean, why: string | undefined, run: () => void, label: string) => tip(h('button', {
    type: 'button', class: 'btn primary big hammer', disabled: !ok, 'data-fk': 'martelo', onclick: run,
  }, ui(mode, 40), label), { title: label, rows: [!ok && why ? { icon: 'cadeado', text: why, tone: 'bad' } : { text: MODES.find((m) => m.id === mode)!.text, tone: 'dim' }] });

  if (mode === 'fundir') {
    const fodder = st.forgeFodder.map((id) => cands.find((i) => i.id === id)!);
    const auto = () => {
      const pickable = cands.slice().sort((a, b) => itemScore(a) - itemScore(b)).slice(0, 2);
      if (pickable.length < 2) { c.toast('Faltam itens iguais na mochila', 'bad'); return; }
      st.forgeFodder = pickable.map((i) => i.id);
      c.redraw('martelo');
    };
    slots = h('div', 'forge-slots fuse',
      mainSlot(96),
      h('span', 'plus', '+'),
      [0, 1].map((k) => fodder[k]
        ? itemTile(fodder[k], { size: 72, cls: 'fodder', fk: `consumo-${k}`, onClick: () => { st.forgeFodder = st.forgeFodder.filter((id) => id !== fodder[k].id); c.redraw(); }, tipSpec: () => itemTip(c.p, fodder[k], { where: 'outro', noSell: true, foot: ['Clique: não consumir'] }) })
        : tip(emptyTile(main ? main.type : null, 72, main ? 'wait' : ''), { title: 'Item a consumir', rows: [{ text: 'Mesma raridade e mesmo espaço do principal. Precisa estar na mochila e destravado.', tone: 'dim' }] })),
      main && tip(h('button', { type: 'button', class: 'btn small auto', 'data-fk': 'auto', disabled: cands.length < 2, onclick: auto }, 'Auto'),
        { title: 'Auto', rows: [{ text: 'Escolhe os 2 itens mais fracos que servem.', tone: 'dim' }] }));
    if (main) {
      const i = fuseInfo(p, main.id, st.forgeFodder), next = RARITIES[main.rarity + 1];
      info = h('div', 'forge-info',
        h('div', 'big-line', h('b', { style: `color:${rarColor(main)}` }, RARITIES[main.rarity].label), arrow(), h('b', { style: `color:${next.color}` }, next.label)),
        h('div', 'sub-line', stat('mais', '1 bônus', { size: 22, tone: 'ok' }), stat('aprimorar', `até +${next.maxPlus}`, { size: 22, tone: 'ok' })));
      action = h('div', 'forge-act',
        costs([{ icon: 'ouro', amount: i.gold, have: p.gold }, i.lagrima > 0 && { icon: 'lagrima', amount: i.lagrima, have: p.materials.lagrima }]),
        gauge(i.chance, 0, 'Falhar consome só 1 dos 2 itens. O principal fica como está.'),
        hammer(i.possible, i.reason, () => {
          const r = fuseItems(c.p, main!.id, st.forgeFodder);
          if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
          st.forgeFx = r.success ? { ok: true, text: `${RARITIES[main!.rarity].label}!`, color: rarColor(main!) } : { ok: false, text: 'Falhou', sub: '1 item perdido' };
          c.commit('martelo');
        }, 'Fundir'));
    }
  } else {
    slots = h('div', 'forge-slots', mainSlot(96));
    if (main && mode === 'aprimorar') {
      const i = upgradeInfo(p, main), after = { ...main, plus: main.plus + 1 }, base = ITEM_TYPES[main.type].base;
      const capped = main.plus >= RARITIES[main.rarity].maxPlus;
      info = capped
        ? h('div', 'forge-info',
          h('div', 'big-line', h('b', null, `+${main.plus}`), h('span', 'max-tag', 'Máximo')),
          main.rarity < MAX_RARITY && !main.unique && h('div', 'sub-line', ui('fundir', 24), h('span', null, 'Funda para ir além'), h('b', { style: `color:${RARITIES[main.rarity + 1].color}` }, `+${RARITIES[main.rarity + 1].maxPlus}`)))
        : h('div', 'forge-info',
          h('div', 'big-line', h('b', null, `+${main.plus}`), arrow(), h('b', 'ok', `+${after.plus}`)),
          base !== 'nenhum' && h('div', 'sub-line', ui(base === 'dano' ? 'dano' : 'defesa', 24), h('span', null, br(baseLabel(main)).split(' ')[0]), arrow(), h('b', 'ok', br(baseLabel(after)).split(' ')[0])));
      action = h('div', 'forge-act',
        !capped && costs([{ icon: 'ouro', amount: i.gold, have: p.gold }, { icon: 'resina', amount: i.mata, have: p.materials.mata }]),
        !capped && gauge(i.chance, main.pity ?? 0, 'Falhar gasta o custo, nunca destrói o item, e soma 5% à próxima tentativa.'),
        hammer(i.possible, i.reason, () => {
          const r = upgradeItem(c.p, main!.id);
          if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
          st.forgeFx = r.success ? { ok: true, text: `+${main!.plus}!` } : { ok: false, text: 'Falhou', sub: '+5% na próxima' };
          c.commit('martelo');
        }, 'Aprimorar'));
    } else if (main && mode === 'encantar') {
      const i = enchantInfo(p, main), idx = st.forgeAffix;
      info = h('div', 'forge-info affixes', main.affixes.map((a, k) => tip(h('button', {
        type: 'button', class: `affix${idx === k ? ' on' : ''}`, 'aria-pressed': String(idx === k), 'data-fk': `bonus-${k}`,
        onclick: () => { st.forgeAffix = k; c.redraw(`bonus-${k}`); },
      }, ui(AFFIX_ICON[a.k], 24), h('span', null, affixText(a)), idx === k && h('b', 'swap', ui('seta', 20), '?')),
      { title: 'Trocar este bônus', rows: [{ text: 'Sai este e entra outro, sorteado. Os demais ficam.', tone: 'dim' }], foot: ['Clique: escolher'] })));
      action = h('div', 'forge-act',
        costs([{ icon: 'ouro', amount: i.gold, have: p.gold }, { icon: 'po', amount: i.po, have: p.materials.po }]),
        hammer(i.possible && idx != null, idx == null ? 'Escolha o bônus que vai trocar.' : i.reason, () => {
          const r = enchantItem(c.p, main!.id, st.forgeAffix ?? -1);
          if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
          const got = main!.affixes[st.forgeAffix ?? 0];
          st.forgeFx = { ok: true, text: got ? affixText(got) : 'Trocado!' };
          c.commit('martelo');
        }, 'Encantar'));
    } else if (main && mode === 'reforjar') {
      const i = reforgeInfo(p, main), level = main.ilvl >= i.toLevel, after = reforgedPreview(main, Math.max(main.ilvl, i.toLevel)), base = ITEM_TYPES[main.type].base;
      const changed = main.affixes.map((a, k) => ({ a, b: after.affixes[k] })).filter((x) => x.b && x.b.v !== x.a.v);
      info = level
        ? h('div', 'forge-info', h('div', 'big-line', h('b', null, `Nv ${main.ilvl}`), h('span', 'max-tag', 'No seu nível')))
        : h('div', 'forge-info',
          h('div', 'big-line', h('b', null, `Nv ${main.ilvl}`), arrow(), h('b', 'ok', `Nv ${after.ilvl}`)),
          base !== 'nenhum' && h('div', 'sub-line', ui(base === 'dano' ? 'dano' : 'defesa', 24), h('span', null, br(baseLabel(main)).split(' ')[0]), arrow(), h('b', 'ok', br(baseLabel(after)).split(' ')[0])),
          changed.length > 0 && h('div', 'sub-line wrap', changed.slice(0, 4).map((x) => stat(AFFIX_ICON[x.a.k], `${x.a.v} → ${x.b.v}`, { size: 22, tone: 'ok' }))));
      action = h('div', 'forge-act',
        !level && costs([{ icon: 'ouro', amount: i.gold, have: p.gold }, { icon: 'resina', amount: i.mata, have: p.materials.mata }]),
        hammer(i.possible, i.reason, () => {
          const r = reforgeItem(c.p, main!.id);
          if (!r.done) { c.toast(r.reason ?? 'Não deu', 'bad'); return; }
          st.forgeFx = { ok: true, text: `Nv ${c.p.level}!` };
          c.commit('martelo');
        }, 'Reforjar'));
    }
  }

  const litCount = allItems(p).filter((it) => workOf(p, mode, it).lit).length;
  return h('div', 'ferreiro',
    bg,
    modeBar(c),
    h('div', 'forge-bench',
      anvil,
      slots,
      fx && h('div', { class: `forge-fx ${fx.ok ? 'ok' : 'fail'}`, style: fx.color ? `--fxc:${fx.color}` : null, 'aria-live': 'polite' }, h('i', 'flash'), h('b', null, fx.text), fx.sub && h('span', null, fx.sub)),
      info,
      action,
      !main && h('div', 'forge-hint', litCount > 0 ? [ui('seta', 30), 'Escolha um item'] : 'Nenhum item serve')),
    h('section', { class: 'panel forge-grid', 'aria-label': 'Seus itens' }, grid));
}
