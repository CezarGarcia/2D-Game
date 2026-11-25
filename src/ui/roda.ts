/**
 * Roda do Saci (docs/gdd/09): a tela do nó. Uma grade 3x3, o painel de chances, o Pulo, o Assobio e o que o giro pagou.
 * A conta fica em src/meta/roda.ts e as regras em src/meta/dream.ts; aqui é só mostrar e chamar.
 */
import { BLESSINGS, ELEMENTS, PATRONS } from '../data/content';
import { DREAM } from '../data/dream';
import { collectRoda, leaveNode, rodaAssobio, rodaCost, rodaPulo, rodaWeightsOf, spinRoda, type DreamRun, type Pending } from '../meta/dream';
import { readGrid, rodaOddsLater, rodaOddsReady, type RodaSymbol } from '../meta/roda';
import type { Ctx } from './ctx';
import { h, num, pct, s, ui } from './dom';
import { blessChip } from './sonho';
import { tip } from './tip';

type Roda = Extract<Pending, { kind: 'roda' }>;

const SYM: Record<'gorro' | 'vintem' | 'olho', { name: string; color: string; what: string }> = {
  gorro: { name: 'Gorro', color: '#e0344c', what: 'Curinga: vale por qualquer símbolo' },
  vintem: { name: 'Vintém', color: '#d98a4a', what: `Linha paga ${DREAM.roda.vintemPay} vinténs` },
  olho: { name: 'Olho do Esquecimento', color: '#9a6aff', what: 'Linha amaldiçoa o trecho e dobra as Lembranças dele' },
};
const symColor = (k: RodaSymbol) => (k in SYM ? SYM[k as 'gorro'].color : ELEMENTS[k as 'fogo'].color);
const symName = (k: RodaSymbol) => (k in SYM ? SYM[k as 'gorro'].name : PATRONS[k as 'fogo'].name);

/** Centro de uma casa da grade, em px, para riscar as linhas que pagaram. */
const CELL = 108, GAP = 10;
const center = (cell: number) => ({ x: (cell % 3) * (CELL + GAP) + CELL / 2, y: Math.floor(cell / 3) * (CELL + GAP) + CELL / 2 });

let pending: (() => void) | null = null;

export function rodaPanel(c: Ctx, run: DreamRun, w: Roda): HTMLElement {
  const st = c.st.dream, onTable = !!w.grid && !w.collected, cost = rodaCost(run, w), read = w.grid ? readGrid(w.grid, w.patrons) : null;
  const rolled = st.rolled;
  st.rolled = null;
  const weights = rodaWeightsOf(run, w);
  /* as chances exatas levam um instante na primeira vez: calcula em fatias e redesenha quando ficar pronto */
  const odds = rodaOddsReady(weights);
  pending?.(); pending = null;
  if (!odds) pending = rodaOddsLater(weights, () => { pending = null; if (c.p.dream.run?.pending === w) c.redraw(); });

  const spin = () => {
    if (!spinRoda(c.p)) { c.toast(cost == null ? 'Acabaram os giros desta Roda' : 'Faltam vinténs', 'bad'); return; }
    st.rolled = 'all'; st.whistle = false;
    c.commit('roda-receber');
  };
  const collect = () => {
    const out = collectRoda(c.p);
    if (!out) return;
    if (out.jackpot) c.toast('Sorte grande!');
    else if (!out.lines.length) c.toast('Nada desta vez', 'bad');
    st.whistle = false;
    c.commit(cost != null ? 'roda-girar' : 'roda-sair');
  };
  const pulo = (col: number) => { if (rodaPulo(c.p, col)) { st.rolled = col; c.commit(`roda-pulo-${col}`); } };
  const cellClick = (i: number) => { if (st.whistle && rodaAssobio(c.p, i)) { st.whistle = false; c.commit('roda-receber'); } };

  const winning = new Set<number>();
  if (read) for (const l of read.lines) for (const cell of l.cells) winning.add(cell);
  const cells = Array.from({ length: 9 }, (_, i) => {
    const k = w.grid?.[i] ?? null, col = i % 3, roll = k && (rolled === 'all' || rolled === col);
    const can = onTable && st.whistle && k !== 'gorro';
    return h(can ? 'button' : 'div', { type: can ? 'button' : null, class: `rcell${k ? '' : ' empty'}${winning.has(i) ? ' win' : ''}${roll ? ' roll' : ''}${can ? ' pickable' : ''}`, style: `${k ? `--sc:${symColor(k)};` : ''}--d:${rolled === 'all' ? col * 0.22 + Math.floor(i / 3) * 0.05 : 0}s`, 'aria-label': k ? symName(k) : 'Casa vazia', 'data-fk': `roda-casa-${i}`, onclick: can ? () => cellClick(i) : null },
      h('span', 'rcell-in', k ? ui(k, 68) : ui('roda', 54)));
  });
  const lines = read && onTable ? read.lines.map((l, n) => { const a = center(l.cells[0]), b = center(l.cells[2]); return s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'rline', style: `stroke:${symColor(l.symbol)};animation-delay:${rolled === 'all' ? 0.95 + n * 0.12 : 0.15}s` }); }) : [];
  const size = CELL * 3 + GAP * 2;
  const pulos = h('div', 'roda-pulos', [0, 1, 2].map((col) => tip(h('button', { type: 'button', class: 'btn small', disabled: !onTable || w.pulos <= 0, 'data-fk': `roda-pulo-${col}`, 'aria-label': `Pulo na coluna ${col + 1}`, onclick: () => pulo(col) }, ui('redemoinho', 20), 'Pulo'),
    { title: 'Pulo', icon: ui('redemoinho', 36), tag: `${w.pulos} ${w.pulos === 1 ? 'carga' : 'cargas'}`, rows: [{ text: 'Gira de novo só esta coluna do giro que está na mesa.' }] })));

  const symbols = (Object.keys(weights) as RodaSymbol[]).map((k) => tip(h('div', 'rodd', h('span', { class: 'rodd-ico', style: `--sc:${symColor(k)}` }, ui(k, 24)), h('b', null, odds ? pct(odds.symbol[k] ?? 0) : '…')),
    { title: symName(k), color: symColor(k), rows: k in SYM ? [{ text: SYM[k as 'gorro'].what }] : [{ text: `Linha dá uma bênção ${PATRONS[k as 'fogo'].of}: rara com 2 linhas, épica com 3 ou mais.` }, { text: `Cada bênção ${PATRONS[k as 'fogo'].of} que você tem aumenta em ${pct(DREAM.roda.buildPull)} o peso deste símbolo.`, tone: 'dim' }] }));

  const last = w.last && w.collected ? w.last : null;
  const result = onTable
    ? h('div', 'roda-result', read!.lines.length ? [h('b', null, `${read!.lines.length} ${read!.lines.length === 1 ? 'linha' : 'linhas'}!`), h('span', null, w.pulos > 0 || w.assobios > 0 ? 'Dá para mexer antes de receber.' : 'Receba o que pagou.')] : [h('b', 'bad', 'Nenhuma linha'), h('span', null, w.pulos > 0 || w.assobios > 0 ? 'Um Pulo ou um Assobio ainda pode fechar uma.' : 'Fica para o próximo giro.')])
    : last
      ? h('div', 'roda-result', last.lines.length
        ? [h('b', null, last.jackpot ? 'Sorte grande!' : 'Pagou'), h('div', 'roda-won', last.blessings.map((b) => blessChip(b, 1)), last.vintem > 0 && h('span', 'roda-coins', ui('vintem', 22), `+${num(last.vintem)}`), last.cursed && tip(h('span', 'roda-curse', ui('olho', 22), 'Maldição'), { title: 'Olhos do Esquecimento', color: '#c8a8ff', rows: [{ text: `Até o fim do trecho, os monstros têm +${pct(DREAM.roda.curse.hp)} de vida e +${pct(DREAM.roda.curse.damage)} de dano, e as Lembranças do trecho vêm em dobro.` }] })), last.blessings.length > 0 && h('span', null, last.blessings.map((b) => BLESSINGS[b].name).join(', '))]
        : [h('b', 'bad', 'Nada desta vez'), h('span', null, run.dry >= DREAM.roda.pityAfter ? 'O próximo giro tem linha garantida.' : `Sem linha há ${run.dry} ${run.dry === 1 ? 'giro' : 'giros'}.`)])
      : h('div', 'roda-result', h('b', null, 'O Saci deve uma'), h('span', null, 'Três iguais numa linha pagam: deitada, em pé ou de quina.'));

  const spinLabel = cost == null ? 'Sem mais giros' : cost === 0 ? `Girar de graça${w.free > 1 ? ` (${w.free})` : ''}` : 'Girar';
  return h('div', 'dover', h('div', { class: 'dpanel roda', role: 'dialog', 'aria-modal': 'true' },
    h('div', 'dp-title', ui('roda', 34), 'Roda do Saci', h('span', 'dp-purse', ui('vintem', 26), h('b', null, num(run.vintem)))),
    h('div', 'roda-body',
      h('div', 'roda-left',
        pulos,
        h('div', { class: `rgrid${st.whistle ? ' whistle' : ''}`, style: `width:${size}px;height:${size}px` }, cells, s('svg', { class: 'rlines', width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' }, lines)),
        h('div', 'roda-tools',
          tip(h('button', { type: 'button', class: `btn small${st.whistle ? ' primary' : ''}`, disabled: !onTable || w.assobios <= 0, 'data-fk': 'roda-assobio', onclick: () => { st.whistle = !st.whistle; c.redraw('roda-assobio'); } }, ui('som', 20), st.whistle ? 'Escolha uma casa' : `Assobio (${w.assobios})`),
            { title: 'Assobio', icon: ui('som', 36), tag: `${w.assobios} ${w.assobios === 1 ? 'carga' : 'cargas'}`, rows: [{ text: 'Troca o símbolo de uma casa por um Gorro, que vale por qualquer um.' }, { text: 'As cargas vêm de amuletos e de Cordéis.', tone: 'dim' }] }),
          h('span', 'roda-charges', ui('redemoinho', 18), `${w.pulos} ${w.pulos === 1 ? 'Pulo' : 'Pulos'}`))),
      h('div', 'roda-right',
        h('div', 'roda-box',
          h('div', 'roda-box-title', 'Chances de cada casa'),
          h('div', 'rodds', symbols),
          h('div', 'rodd-lines',
            tip(h('div', 'rodd-line', h('span', null, 'Alguma linha'), h('b', null, odds ? pct(odds.anyLine) : '…')), { title: 'Alguma linha', rows: [{ text: 'Chance de um giro fechar pelo menos uma linha, de qualquer símbolo.' }] }),
            tip(h('div', 'rodd-line', h('span', null, 'Bênção'), h('b', null, odds ? pct(odds.blessing) : '…')), { title: 'Bênção', rows: [{ text: 'Chance de um giro fechar pelo menos uma linha de padrinho.' }] }),
            tip(h('div', 'rodd-line gold', h('span', null, 'Sorte grande'), h('b', null, odds ? pct(odds.jackpot, 1) : '…')), { title: 'Sorte grande', color: '#f2c14e', rows: [{ text: `${DREAM.roda.jackpotLines} linhas do mesmo padrinho num giro só: desperta na hora uma das suas bênçãos, à escolha.` }] }))),
        result,
        h('div', 'roda-actions',
          onTable
            ? h('button', { type: 'button', class: 'btn primary big', 'data-fk': 'roda-receber', onclick: collect }, read!.lines.length ? 'Receber' : 'Seguir')
            : h('button', { type: 'button', class: 'btn primary big', disabled: cost == null || run.vintem < cost, 'data-fk': 'roda-girar', onclick: spin }, ui('roda', 30), spinLabel, cost != null && cost > 0 && h('span', `bcard-price${run.vintem >= cost ? '' : ' short'}`, ui('vintem', 20), h('b', null, num(cost)))),
          h('button', { type: 'button', class: 'btn', 'data-fk': 'roda-sair', onclick: () => { st.whistle = false; leaveNode(c.p); c.commit(); } }, 'Seguir viagem', ui('seta', 22))),
        h('div', 'roda-note', `Depois de ${DREAM.roda.pityAfter} giros sem linha, o próximo é garantido. A Roda só usa vinténs do Sonho.`)))));
}

