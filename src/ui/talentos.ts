/** Aba Talentos: a teia radial em SVG e o painel do nó escolhido. */
import {
  SECTORS, TALENTS, TALENT_BY_ID, canAddTalent, canRemoveTalent, talentPos, talentReachable, talentSpent,
  type Sector, type TalentKind, type TalentNode,
} from '../data/talents';
import { addTalent, removeTalent, resetTalents, respecCost, talentFree } from '../meta/profile';
import { confirmStep, type Ctx } from './ctx';
import { btn, h, num, s, svgButton } from './dom';
import { respecLabel } from './heroi';

const KIND_LABEL: Record<TalentKind, string> = { raiz: 'Raiz', comum: 'Talento comum', chave: 'Talento-chave', ligacao: 'Elo de ligação', dom: 'Dom' };
const KIND_HINT: Record<TalentKind, string> = {
  raiz: 'Ponto de partida de um setor. O primeiro ponto da teia vai numa raiz.',
  comum: 'Recebe até 5 pontos; cada um soma um pouco.',
  chave: 'Um ponto só, e muda como algo funciona.',
  ligacao: 'Liga dois setores vizinhos sem voltar ao centro.',
  dom: 'A ponta da teia: o talento mais forte do caminho.',
};
/** Onde fica o nome de cada setor na borda da teia. */
const LABEL: Record<Sector, { x: number; y: number; anchor: string }> = {
  forca: { x: 350, y: -52, anchor: 'middle' },
  vitalidade: { x: 175, y: 356, anchor: 'middle' },
  agilidade: { x: 175, y: -344, anchor: 'middle' },
  inteligencia: { x: -262, y: -8, anchor: 'end' },
  espirito: { x: -148, y: 262, anchor: 'middle' },
  sorte: { x: -148, y: -276, anchor: 'middle' },
};
/** Setores que por enquanto só têm os três primeiros nós. */
const SHORT: Sector[] = ['inteligencia', 'espirito', 'sorte'];

function poly(points: number, outer: number, inner = outer, rot = -Math.PI / 2): string {
  const out: string[] = [], n = inner === outer ? points : points * 2;
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n, r = inner !== outer && i % 2 ? inner : outer;
    out.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return out.join(' ');
}

function shape(kind: TalentKind): SVGElement[] {
  switch (kind) {
    case 'raiz': return [s('circle', { class: 'shape', r: 25 }), s('circle', { class: 'inner', r: 19 })];
    case 'chave': return [s('polygon', { class: 'shape', points: poly(4, 29) })];
    case 'ligacao': return [s('polygon', { class: 'shape', points: poly(6, 30, 30, 0) })];
    case 'dom': return [s('polygon', { class: 'halo', points: poly(10, 44, 35) }), s('polygon', { class: 'shape', points: poly(10, 37, 30) })];
    default: return [s('circle', { class: 'shape', r: 22 })];
  }
}

function web(c: Ctx): SVGElement {
  const p = c.p, ranks = p.talents, free = talentFree(p);
  const rank = (id: string) => ranks[id] || 0;
  const links: SVGElement[] = [];
  for (const n of TALENTS) {
    const a = talentPos(n);
    if (n.kind === 'raiz') links.push(s('line', { class: `tl root${rank(n.id) ? ' lit' : ''}`, x1: 0, y1: 0, x2: a.x, y2: a.y, style: `--sec:${SECTORS[n.sector].color}` }));
    for (const l of n.links) {
      const o = TALENT_BY_ID.get(l);
      if (!o || n.id >= o.id) continue;
      const b = talentPos(o), lit = rank(n.id) > 0 && rank(o.id) > 0;
      const color = n.sector === o.sector && n.kind !== 'ligacao' && o.kind !== 'ligacao' ? SECTORS[n.sector].color : '#F1EBD8';
      links.push(s('line', { class: `tl${lit ? ' lit' : ''}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, style: `--sec:${color}` }));
    }
  }
  const stubs = SHORT.map((sec) => {
    const ang = (SECTORS[sec].ang * Math.PI) / 180, cos = Math.cos(ang), sin = Math.sin(ang);
    return s('line', { class: 'stub', x1: cos * 234, y1: sin * 234, x2: cos * (sec === 'inteligencia' ? 252 : 262), y2: sin * (sec === 'inteligencia' ? 252 : 262), style: `--sec:${SECTORS[sec].color}` });
  });
  const labels = (Object.keys(SECTORS) as Sector[]).map((sec) => {
    const l = LABEL[sec];
    return s('g', { class: 'sector-label', style: `--sec:${SECTORS[sec].color}` },
      s('text', { class: 'sl', x: l.x, y: l.y, 'text-anchor': l.anchor }, SECTORS[sec].label.toUpperCase()),
      SHORT.includes(sec) && s('text', { class: 'sn', x: l.x, y: l.y + 17, 'text-anchor': l.anchor }, 'cresce no Capítulo 2'));
  });
  const nodes = TALENTS.map((n) => {
    const { x, y } = talentPos(n), r = rank(n.id), can = canAddTalent(ranks, n.id, free), reach = talentReachable(ranks, n.id);
    const cls = ['tn', `kind-${n.kind}`, r > 0 && 'has', r >= n.max && 'full', can && 'can', !reach && r === 0 && 'far', c.st.talentSel === n.id && 'sel'].filter(Boolean).join(' ');
    const g = s('g', { class: cls, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, style: `--sec:${SECTORS[n.sector].color}` },
      s('title', null, `${n.name} · ${n.desc(Math.max(1, r))}`),
      c.st.talentSel === n.id && s('circle', { class: 'sel-ring', r: n.kind === 'dom' ? 50 : 38 }),
      can && s('circle', { class: 'pulse', r: n.kind === 'dom' ? 44 : 33 }),
      shape(n.kind),
      s('circle', { class: 'focus-ring', r: n.kind === 'dom' ? 47 : 36 }),
      s('text', { class: 'rk', y: 5 }, `${r}/${n.max}`));
    const label = `${n.name}, ${KIND_LABEL[n.kind]} de ${SECTORS[n.sector].label}, ${r} de ${n.max} pontos${can ? ', pode receber ponto' : !reach && r === 0 ? ', fora de alcance' : ''}`;
    return svgButton(g, label, `tal-${n.id}`, () => { c.st.talentSel = n.id; c.st.armed = null; c.redraw(); }, c.st.talentSel === n.id);
  });
  return s('svg', { class: 'web', viewBox: '-412 -374 814 748', role: 'group', 'aria-label': 'Teia de talentos' },
    s('g', { class: 'rings', 'aria-hidden': 'true' }, [70, 140, 210, 280, 350].map((r) => s('circle', { r }))),
    links, stubs,
    s('circle', { class: 'core', r: 17 }), s('circle', { class: 'core-dot', r: 6 }),
    labels, nodes);
}

function blockedReason(node: TalentNode, rank: number, reach: boolean, free: number): string | null {
  if (rank >= node.max) return 'Já está no máximo.';
  if (!reach) return `Fora de alcance. Ponha antes um ponto num vizinho: ${node.links.map((l) => TALENT_BY_ID.get(l)?.name).filter(Boolean).join(' ou ')}.`;
  if (free <= 0) return 'Sem pontos livres. Você ganha 1 ponto de talento por nível.';
  return null;
}

function nodePanel(c: Ctx, node: TalentNode): HTMLElement {
  const p = c.p, rank = p.talents[node.id] || 0, free = talentFree(p);
  const can = canAddTalent(p.talents, node.id, free), canRemove = canRemoveTalent(p.talents, node.id);
  const reason = can ? null : blockedReason(node, rank, talentReachable(p.talents, node.id), free);
  const sec = SECTORS[node.sector];
  return h('div', { class: 'talent-card', style: `--sec:${sec.color}` },
    h('header', 'panel-head',
      h('span', 'eyebrow', `${KIND_LABEL[node.kind]} · ${sec.label}`),
      btn('Fechar', () => c.redraw(closeTalentos(c) || undefined), { small: true, kind: 'quiet', fk: 'fechar-talento', title: 'Esc' })),
    h('h2', 'title', node.name, h('span', 'rank num', `${rank}/${node.max}`)),
    h('p', 'muted small', KIND_HINT[node.kind]),
    node.max === 1
      ? h('div', `effect${rank > 0 ? ' on' : ''}`, h('span', 'k', rank > 0 ? 'Efeito ativo' : 'Efeito'), h('p', null, node.desc(1)))
      : [
        rank > 0 && h('div', 'effect on', h('span', 'k', `Agora · ${rank} ${rank === 1 ? 'ponto' : 'pontos'}`), h('p', null, node.desc(rank))),
        rank < node.max && h('div', 'effect', h('span', 'k', `Com o próximo ponto · ${rank + 1} de ${node.max}`), h('p', null, node.desc(rank + 1))),
      ],
    reason && h('p', rank >= node.max ? 'ok-text small' : 'warn-text small', reason),
    h('div', 'actions',
      btn('+1 ponto', () => { if (addTalent(c.p, node.id)) c.commit(); }, { kind: 'primary', disabled: !can, fk: 'mais-ponto' }),
      btn('−1 ponto', () => { if (removeTalent(c.p, node.id)) c.commit(); }, { disabled: !canRemove, fk: 'menos-ponto' })),
    !canRemove && h('p', 'muted small', rank === 0 ? 'Não há ponto aqui para tirar.' : 'Não dá para tirar: outros talentos com ponto ficariam soltos, sem caminho até uma raiz.'),
  );
}

export function renderTalentos(c: Ctx): HTMLElement {
  const p = c.p, free = talentFree(p), spent = talentSpent(p.talents), cost = respecCost(p);
  const node = c.st.talentSel ? TALENT_BY_ID.get(c.st.talentSel) : undefined;
  return h('div', 'tab-talentos',
    h('section', { class: 'web-wrap', 'aria-label': 'Teia de talentos' }, web(c)),
    h('aside', 'panel talent-side',
      h('div', { class: 'panel-scroll', 'data-sk': 'talent' },
        h('div', `free${free > 0 ? ' hot' : ''}`, h('b', 'num', free), h('span', null, free === 1 ? 'ponto livre' : 'pontos livres'),
          h('span', 'muted small num', `${num(spent)} de ${num(p.talentPoints)} usados`)),
        node ? nodePanel(c, node) : h('div', 'talent-card empty',
          h('h2', 'title', 'Teia de talentos'),
          h('p', null, 'Comece por uma raiz no centro. Um talento só recebe ponto se estiver ligado a outro que já tem.'),
          h('p', 'muted', 'Clique num nó para ver o que ele faz. Os nós com brilho podem receber ponto agora.')),
        h('ul', 'web-legend',
          (['raiz', 'comum', 'chave', 'ligacao', 'dom'] as TalentKind[]).map((k) => h('li', null,
            s('svg', { class: `web mini tn kind-${k}`, viewBox: '-46 -46 92 92', width: 26, height: 26, 'aria-hidden': 'true' }, shape(k)),
            h('span', null, h('b', null, KIND_LABEL[k]), h('span', 'muted', ` · ${KIND_HINT[k]}`))))),
        h('p', 'muted small', 'Inteligência, Espírito e Sorte têm só três nós por enquanto: esses setores crescem no Capítulo 2.'),
      ),
      h('div', 'panel-foot',
        btn(c.st.armed === 'talentos' ? 'Confirmar: devolver todos os pontos' : 'Redistribuir tudo', () => {
          if (!confirmStep(c, 'talentos')) return;
          resetTalents(c.p);
          c.commit();
        }, { kind: c.st.armed === 'talentos' ? 'danger' : undefined, disabled: spent === 0 || p.gold < cost, fk: 'respec-talentos' }),
        h('span', 'muted small', spent === 0 ? 'Nenhum ponto usado ainda.' : p.gold < cost ? `Falta ouro: ${respecLabel(p)}.` : `Devolve os ${num(spent)} pontos: ${respecLabel(p)}.`)),
    ),
  );
}

export function closeTalentos(c: Ctx): string | null {
  const id = c.st.talentSel;
  if (id == null) return null;
  c.st.talentSel = null; c.st.armed = null;
  return `tal-${id}`;
}
