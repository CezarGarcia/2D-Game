/** Aba Mapa: as 12 fases do capítulo num caminho, e o painel da fase escolhida. */
import { COMPANIONS } from '../data/content';
import { ITEM_TYPES, RARITIES, UNIQUES } from '../data/items';
import { ENEMY_NAMES, STAGES, type StageDef } from '../data/stages';
import type { Profile } from '../meta/profile';
import { STAR_CHESTS, stageInfo, totalStars, type StageInfo } from '../meta/rewards';
import type { Ctx } from './ctx';
import { btn, clock, h, icon, num, pct, s, star, svgButton } from './dom';

/** Posição de cada fase no desenho do mapa (viewBox 840 × 520). O caminho serpenteia em três linhas. */
const POS: [number, number][] = [
  [92, 92], [282, 66], [478, 100], [676, 72],
  [748, 232], [562, 262], [366, 230], [172, 262],
  [98, 408], [300, 424], [506, 392], [724, 408],
];

const FINAL_LABEL: Record<StageDef['final'], string> = { normal: 'Fase comum', elite: 'Fase de elite', chefao: 'Fase de chefão' };
const STAR_GOAL = (stage: StageDef): string[] => ['Terminar a fase', 'Terminar sem cair', `Terminar em até ${clock(stage.starTime)}`];

/** Primeira fase liberada que ainda não foi vencida; se todas foram, a última. */
export function defaultStage(p: Profile): string {
  for (const st of STAGES) { const i = stageInfo(p, st); if (i.unlocked && !i.record.cleared) return st.id; }
  return STAGES[STAGES.length - 1].id;
}

function segment(i: number): string {
  const a = POS[Math.max(0, i - 1)], b = POS[i], c = POS[i + 1], d = POS[Math.min(POS.length - 1, i + 2)];
  const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6];
  return `M${b[0]} ${b[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${c[0]} ${c[1]}`;
}

function burst(points: number, outer: number, inner: number): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points, r = i % 2 ? inner : outer;
    out.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return out.join(' ');
}

function miniStar(x: number, y: number, on: boolean): SVGElement {
  return s('path', { class: on ? 'ms on' : 'ms', transform: `translate(${x - 7} ${y - 7}) scale(0.58)`, d: 'M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.7l-6.3 3.5 1.3-7.1L1.8 9.2l7.1-.9z' });
}

function node(c: Ctx, info: StageInfo, selected: boolean): SVGElement {
  const st = info.stage, [x, y] = POS[st.index];
  const state = !info.unlocked ? 'locked' : info.record.cleared ? 'cleared' : 'open';
  const r = st.final === 'chefao' ? 38 : st.final === 'elite' ? 31 : 26;
  const shape = st.final === 'chefao' ? s('polygon', { class: 'shape', points: burst(12, 38, 31) })
    : st.final === 'elite' ? s('polygon', { class: 'shape', points: burst(8, 32, 26) })
      : s('circle', { class: 'shape', r: 26 });
  const starCount = info.record.stars.filter(Boolean).length;
  const label = `Fase ${st.id}, ${st.name}. ${FINAL_LABEL[st.final]}. ${!info.unlocked ? 'Bloqueada' : info.record.cleared ? `Vencida, ${starCount} de 3 estrelas` : 'Disponível'}.`;
  const g = s('g', { class: `node ${state} ${st.final}${selected ? ' sel' : ''}`, transform: `translate(${x} ${y})` },
    selected && s('circle', { class: 'sel-ring', r: r + 8 }),
    state === 'open' && s('circle', { class: 'pulse', r: r + 3 }),
    shape,
    s('circle', { class: 'focus-ring', r: r + 7 }),
    s('text', { class: 'n', y: st.final === 'chefao' ? 9 : 8 }, st.number),
    st.final !== 'normal' && s('text', { class: 'kind', y: -r - 8 }, st.final === 'chefao' ? 'CHEFÃO' : 'ELITE'),
    info.unlocked && s('circle', { class: `pip tag-${info.tag}`, cx: r * 0.74, cy: -r * 0.74, r: 6.5 }),
    st.named && s('rect', { class: 'gem', x: -r * 0.74 - 5.5, y: -r * 0.74 - 5.5, width: 11, height: 11, transform: `rotate(45 ${-r * 0.74} ${-r * 0.74})`, fill: RARITIES[UNIQUES[st.named.unique].rarity].color }),
    !info.unlocked && s('g', { class: 'lock', transform: `translate(${r * 0.5} ${r * 0.42})` },
      s('circle', { r: 10 }),
      s('path', { d: 'M-2.6 -1.2v-1.6a2.6 2.6 0 0 1 5.2 0v1.6', fill: 'none' }),
      s('rect', { x: -4.2, y: -1.2, width: 8.4, height: 6, rx: 1.2 })),
    s('text', { class: 'name', y: r + 21 }, st.name),
    s('g', { class: 'ministars' }, [0, 1, 2].map((i) => miniStar(-17 + i * 17, r + 37, info.record.stars[i]))),
  );
  return svgButton(g, label, `st-${st.id}`, () => { c.st.mapSel = st.id; c.redraw(); }, selected);
}

function chests(p: Profile): HTMLElement {
  const total = totalStars(p), max = STAR_CHESTS[STAR_CHESTS.length - 1];
  return h('div', 'chests',
    h('div', 'chests-count', star(true, 20), h('b', 'num', `${total}/${max}`), h('span', 'muted', 'estrelas do capítulo')),
    h('div', { class: 'chests-bar', role: 'img', 'aria-label': `${total} de ${max} estrelas` },
      h('i', { style: `width:${Math.min(100, (total / max) * 100)}%` }),
      STAR_CHESTS.map((need, i) => h('span', { class: `chest-mark${i < p.starChests ? ' open' : ''}`, style: `left:${(need / max) * 100}%` }))),
    h('div', 'chests-list', STAR_CHESTS.map((need, i) => h('span', `chip${i < p.starChests ? ' ok' : ''}`,
      `Baú de ${need}: `, i < p.starChests ? 'aberto' : total >= need ? 'abre na próxima vitória' : `faltam ${need - total}`))),
  );
}

function detail(c: Ctx, info: StageInfo): HTMLElement {
  const p = c.p, st = info.stage, rec = info.record;
  const prev = st.index > 0 ? STAGES[st.index - 1] : null;
  const goals = STAR_GOAL(st);
  const unique = st.named ? UNIQUES[st.named.unique] : null;
  const rescue = st.rescue ? COMPANIONS[st.rescue] : null;

  return h('aside', { class: 'panel stage-detail', 'aria-label': `Fase ${st.id}` },
    h('div', { class: 'panel-scroll', 'data-sk': 'stage' },
      h('div', 'eyebrow', `Fase ${st.id}`, st.final !== 'normal' && h('span', `chip kind-${st.final}`, st.final === 'chefao' ? 'Chefão' : 'Elite')),
      h('h2', 'title', st.name),
      h('p', 'intro', st.intro),
      h('div', 'chips',
        h('span', 'chip', `Nível da fase ${st.level}`),
        h('span', `chip tag tag-${info.tag}`, info.tagText),
      ),
      h('div', 'stat-row',
        h('div', 'stat', h('span', 'k', 'XP'), h('b', 'num', pct(info.xpMult))),
        h('div', 'stat', h('span', 'k', 'Ouro'), h('b', 'num', pct(info.goldMult))),
        h('div', 'stat wide', h('span', 'k', 'Seu Poder × recomendado'),
          h('b', `num${info.tag === 'vermelha' ? ' bad' : ''}`, num(info.power), h('span', 'muted', ' × '), num(info.recommended))),
      ),

      h('h3', null, 'Estrelas'),
      h('ul', 'goals', goals.map((g, i) => h('li', rec.stars[i] ? 'done' : null, star(rec.stars[i], 18), h('span', null, g)))),
      h('p', 'line', h('span', 'muted', 'Melhor tempo: '), h('b', 'num', rec.bestTime != null ? clock(rec.bestTime) : 'ainda sem vitória')),

      h('h3', null, 'Inimigos'),
      h('div', 'chips', st.kinds.map((k) => h('span', 'chip', ENEMY_NAMES[k]))),

      h('h3', null, 'Livro de drops'),
      unique && st.named
        ? h('div', { class: 'drop', style: `--rar:${RARITIES[unique.rarity].color}` },
          h('div', 'drop-head',
            h('span', { class: 'tile named', style: '--tile:42px' }, icon('item', unique.type, 30)),
            h('div', 'item-title',
              h('strong', 'item-name', unique.name),
              h('span', 'item-type', `${RARITIES[unique.rarity].label} · ${ITEM_TYPES[unique.type].label} · só cai nesta fase`)),
            h('div', 'drop-chance', h('b', 'num', `${num(info.namedChance, 1)}%`), h('span', 'k', 'chance agora'))),
          h('p', 'unique-effect', unique.effect),
          h('p', 'muted small', `Começa em ${num(st.named.chance, 1)}%. A chance sobe 0,5 ponto a cada vitória em que o item não cai, e volta ao começo quando ele cai. Fase fácil não reduz esta chance.`))
        : h('p', 'muted', 'Esta fase não tem item com nome.'),
      h('p', 'muted small', `Os baús desta fase dão itens de nível ${st.level}.`),

      st.firstClear && st.firstClear.length > 0 && [
        h('h3', null, 'Primeira vitória'),
        h('div', 'chips',
          st.firstClear.map((t) => h('span', 'chip with-ico', icon('item', t, 18), ITEM_TYPES[t].label)),
          h('span', `chip${rec.cleared ? ' ok' : ' hot'}`, rec.cleared ? 'já recebido' : 'garantido')),
      ],

      rescue && st.rescue && [
        h('h3', null, 'Companheiro a resgatar'),
        h('p', 'line', h('b', null, rescue.name), ' · ', p.companions[st.rescue] ? h('span', 'ok-text', 'já está com você') : h('span', null, rescue.where)),
      ],
    ),
    h('div', 'panel-foot',
      !info.unlocked && prev && h('p', 'warn-text', `Bloqueada. Vença a fase ${prev.id} · ${prev.name} para liberar.`),
      btn('Entrar na fase', () => c.host.startStage(st.id), { kind: 'primary', disabled: !info.unlocked, cls: 'big', fk: 'entrar' }),
    ),
  );
}

export function renderMapa(c: Ctx): HTMLElement {
  const p = c.p, infos = STAGES.map((st) => stageInfo(p, st));
  const sel = infos.find((i) => i.stage.id === c.st.mapSel) ?? infos[0];

  const svg = s('svg', { class: 'map', viewBox: '0 0 840 520', role: 'group', 'aria-label': 'Fases do capítulo' },
    s('g', { class: 'canopy', 'aria-hidden': 'true' },
      [[30, 190, 46], [210, 160, 34], [395, 150, 30], [600, 165, 38], [810, 130, 40], [455, 330, 42], [250, 340, 30], [640, 330, 34], [30, 330, 30], [810, 330, 36], [400, 500, 40], [620, 500, 30], [190, 500, 34], [800, 505, 30], [380, 20, 30], [580, 10, 26], [180, 5, 30]]
        .map(([x, y, r]) => s('g', null, s('circle', { cx: x, cy: y, r }), s('circle', { class: 'hi', cx: x - r * 0.25, cy: y - r * 0.28, r: r * 0.55 })))),
    POS.slice(0, -1).map((_, i) => s('path', { class: 'trail-bed', d: segment(i) })),
    POS.slice(0, -1).map((_, i) => s('path', { class: `trail${infos[i + 1].unlocked ? ' walked' : ''}`, d: segment(i) })),
    infos.map((i) => node(c, i, i === sel)),
  );

  return h('div', 'tab-mapa',
    h('section', 'map-side',
      h('header', 'map-head',
        h('div', null, h('div', 'eyebrow', 'Capítulo 1'), h('h1', 'title', 'Mata Atlântica')),
        chests(p)),
      h('div', 'map-wrap', svg),
      h('ul', { class: 'legend', 'aria-label': 'Legenda' },
        h('li', null, h('i', 'dot tag-verde'), 'no ponto'),
        h('li', null, h('i', 'dot tag-amarela'), 'fácil, rende menos'),
        h('li', null, h('i', 'dot tag-cinza'), 'não vale o XP'),
        h('li', null, h('i', 'dot tag-vermelha'), 'acima do seu poder'),
        h('li', null, h('i', 'gem-mark'), 'tem item com nome'),
        h('li', null, h('i', 'ring-open'), 'disponível'),
        h('li', null, h('i', 'ring-cleared'), 'vencida')),
    ),
    detail(c, sel),
  );
}
