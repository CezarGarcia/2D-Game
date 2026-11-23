/**
 * Resultado da fase: faixa de vitória ou derrota, estrelas, XP, ganhos e os itens saltando em fila.
 * Na Torre, os andares vencidos e o recorde tomam o lugar das estrelas. Na primeira vitória sobre o
 * Esquecimento, antes de tudo vem a tela do final.
 */
import { paintHeroBackdrop } from '../art/backdrops';
import { gemName, gemText, type Gem, type Item } from '../data/items';
import { COMPANIONS, ELEMENTS, SPELLS, SUPREMOS } from '../data/content';
import { xpNeeded } from '../data/progression';
import { STAGES, type StageDef } from '../data/stages';
import { FLOORS_PER_RUN, TOWER_FLOORS, findStage, isTowerId } from '../data/tower';
import { ATTR_PER_LEVEL, MATERIAL_LABEL, talentFree, type Materials } from '../meta/profile';
import { EXP_MODS, EXP_REWARDED_RUNS, isExpeditionId } from '../data/daily';
import { missionText, type DailyNews, type SettledRewards } from '../meta/daily';
import { isUnlocked, recordOf, type StageRewards } from '../meta/rewards';
import { MAT_ICON, VIEW_H, VIEW_W, type Ctx } from './ctx';
import { backdrop, clock, h, hdCanvas, num, pct, star, ui, type Child } from './dom';
import type { Tab } from './ctx';
import { gemTile, itemTile, itemTip } from './itens';
import { FREED, drawFigure } from './retratos';
import { tip, type TipRow, type TipSpec } from './tip';

/** Número que sobe de zero até o valor, para dar gosto de ganho. */
function countUp(c: Ctx, to: number, delay: number, prefix = '+'): HTMLElement {
  const el = h('b', 'count', `${prefix}${num(c.still ? to : 0)}`);
  if (c.still || to <= 0) { el.textContent = `${prefix}${num(to)}`; return el; }
  const dur = 700;
  let start = 0;
  const step = (ms: number) => {
    if (!start) start = ms + delay;
    const k = Math.max(0, Math.min(1, (ms - start) / dur));
    el.textContent = `${prefix}${num(Math.round(to * (1 - Math.pow(1 - k, 3))))}`;
    if (k < 1 && (el.isConnected || ms - start < 100)) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return el;
}

export function renderResultado(c: Ctx, stageId: string, r: StageRewards): HTMLElement {
  if (r.credits && !finaleDone.has(r)) return renderFinal(c, r);
  const p = c.p, tower = isTowerId(stageId) && r.tower ? r.tower : null;
  const daily: DailyNews | undefined = (r as SettledRewards).daily, exp = isExpeditionId(stageId) ? daily?.expedition ?? null : null;
  const stage: StageDef = findStage(stageId) ?? STAGES[0];
  const rec = recordOf(p, stage.id), next = tower || exp || stage.index < 0 ? undefined : STAGES[stage.index + 1] as StageDef | undefined;
  const rest = daily?.rest ?? 0;
  const nextOpen = r.won && !!next && isUnlocked(p, next);
  const need = xpNeeded(p.level), endFrac = Math.min(1, p.xp / need);
  const startFrac = r.levels > 0 ? 0 : Math.max(0, Math.min(endFrac, (p.xp - r.xp) / need));
  const goals: Child[] = ['Vencer', 'Sem cair', clock(stage.starTime)];

  /* ---------- estrelas (na Torre, os andares) ---------- */
  let stamped = 0;
  const stars = tower ? towerBlock(c, tower, r.won) : exp ? expBlock(exp, r.won) : h('div', { class: 'res-stars', role: 'img', 'aria-label': `${r.stars.filter(Boolean).length} de 3 estrelas` }, r.stars.map((on, i) => {
    const delay = on && r.won ? 350 + 320 * stamped++ : 0;
    return tip(h('div', { class: `res-star${on ? ' on' : ''}${on && r.won ? ' stamp' : ''}`, style: `animation-delay:${delay}ms`, tabindex: 0 },
      star(on, i === 1 ? 92 : 74), h('span', null, i === 2 && ui('relogio', 18), goals[i])),
    { title: ['Vencer a fase', 'Vencer sem cair', `Vencer em até ${clock(stage.starTime)}`][i], color: on ? '#f2c14e' : undefined, sub: on ? 'Conquistada' : 'Ainda não', subColor: on ? '#f2c14e' : '#b9b2a3' });
  }));

  /* ---------- experiência ---------- */
  const fill = h('i', { style: `width:${(c.still ? endFrac : startFrac) * 100}%` });
  if (!c.still) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${endFrac * 100}%`; }));
  const xp = h('div', 'res-xp',
    h('span', 'lvl-medal big', p.level),
    h('div', 'res-xp-mid',
      h('div', 'xp-bar big', fill),
      h('div', 'res-xp-text', h('span', null, `${num(p.xp)} / ${num(need)}`),
        rest > 0 && tip(h('span', { class: 'res-rest', tabindex: 0 }, ui('descanso', 22), `Descanso +${num(rest)}`), {
          title: 'Bônus de descanso', color: '#cdb8ff', icon: ui('descanso', 36), tag: 'XP x2',
          rows: [{ icon: 'xp', text: 'Experiência a mais', value: `+${num(rest)}`, tone: 'ok' }, { icon: 'descanso', text: 'Ainda guardado', value: num(daily?.restLeft ?? 0) }],
        }),
        r.xpMult < 1 && h('span', 'warn', `Fase fácil: ${pct(r.xpMult)} da experiência`))),
    r.levels > 0 && tip(h('div', 'level-up', h('b', null, `Nível ${p.level}!`), h('span', null, ui('forca', 20), `+${ATTR_PER_LEVEL * r.levels}`, ui('talentos', 20), `+${r.levels}`)),
      { title: `Nível ${p.level}!`, color: '#f2c14e', rows: [{ icon: 'forca', text: 'Pontos de atributo', value: `+${ATTR_PER_LEVEL * r.levels}`, tone: 'ok' }, { icon: 'talentos', text: 'Pontos de talento', value: `+${r.levels}`, tone: 'ok' }] }));

  /* ---------- ganhos em ícone + número ---------- */
  const gain = (icon: string, amount: number, i: number, spec: TipSpec): HTMLElement =>
    tip(h('div', { class: 'gain', style: `animation-delay:${500 + i * 90}ms`, tabindex: 0 }, ui(icon, 40), countUp(c, amount, 500 + i * 90)), spec);
  const mats = (Object.keys(r.materials) as (keyof Materials)[]).filter((k) => r.materials[k] > 0);
  const gains = h('div', 'res-gains',
    gain('xp', r.xp, 0, { title: 'Experiência', tag: `+${num(r.xp)}`, rows: [r.firstClear ? { icon: 'novo', text: 'Bônus de primeira vitória', tone: 'ok' } : null, rest > 0 ? { icon: 'descanso', text: 'Descanso: experiência em dobro', value: `+${num(rest)}`, tone: 'ok' } : null, r.xpMult < 1 ? { icon: 'xp', text: 'Fase abaixo do seu nível', value: pct(r.xpMult), tone: 'warn' } : null, !r.won ? { text: 'Parte da experiência das salas vencidas.', tone: 'dim' } : null] }),
    gain('ouro', r.gold, 1, { title: 'Ouro', color: '#f2c14e', tag: `+${num(r.gold)}`, rows: [r.goldMult < 1 ? { icon: 'ouro', text: 'Fase abaixo do seu nível', value: pct(r.goldMult), tone: 'warn' } : null, r.soldOverflow.length ? { icon: 'vender', text: 'Inclui itens vendidos (mochila cheia)', tone: 'dim' } : null] }),
    mats.map((k, i) => gain(MAT_ICON[k], r.materials[k], 2 + i, { title: MATERIAL_LABEL[k], tag: `+${num(r.materials[k])}`, rows: [{ icon: MAT_ICON[k], text: 'Você tem', value: num(p.materials[k]) }] })));

  /* ---------- itens e gemas ---------- */
  const gemAt = 900 + (r.items.length + r.soldOverflow.length) * 130;
  const tiles = [
    ...r.items.map((it, i) => h('div', { class: `loot${it.unique ? ' named' : ''}`, style: `animation-delay:${900 + i * 130}ms` },
      itemTile(it, { size: 68, onClick: () => undefined, tipSpec: () => itemTip(c.p, it, { where: 'mochila', foot: [] }) }),
      it.unique && h('span', 'loot-star', star(true, 26)))),
    ...r.soldOverflow.map((so, i) => h('div', { class: 'loot sold', style: `animation-delay:${900 + (r.items.length + i) * 130}ms` },
      itemTile(so.item, { size: 68, onClick: () => undefined, tipSpec: () => itemTip(c.p, so.item, { where: 'outro', noSell: true, extra: [{ icon: 'vender', text: 'Mochila cheia: vendido', value: `+${num(so.gold)}`, tone: 'warn' }] }) }),
      h('span', 'loot-sold', ui('ouro', 26)))),
    ...r.gems.map((g, i) => tip(h('div', { class: 'loot gem', style: `animation-delay:${gemAt + i * 110}ms;--gc:${ELEMENTS[g.el].color}`, tabindex: 0 }, gemTile(g, 50)), () => gemSpec(c, g))),
  ];

  /* ---------- novidades ---------- */
  const news: HTMLElement[] = [];
  const note = (icon: Node, label: string, to: Tab | null, spec: TipSpec, cls = '') => {
    const kids = [icon, h('span', null, label)];
    news.push(tip(to
      ? h('button', { type: 'button', class: `news ${cls}`.trim(), style: `animation-delay:${1300 + news.length * 120}ms`, onclick: () => c.go(to) }, kids)
      : h('div', { class: `news ${cls}`.trim(), style: `animation-delay:${1300 + news.length * 120}ms`, tabindex: 0 }, kids), spec));
  };
  for (const i of daily?.missions ?? []) {
    const m = p.daily.missions[i];
    if (m) note(ui('diario', 34), 'Missão cumprida', 'diario', { title: missionText(m), color: '#f2c14e', icon: ui('diario', 36), sub: 'Missão do dia pronta', subColor: '#86e07a', foot: ['Clique: pegar no diário'] }, 'gold');
  }
  if (r.named) note(star(true, 30), 'Item com nome!', 'heroi', itemTip(p, r.named, { where: 'mochila', foot: ['Clique: ver no herói'] }), 'gold');
  if (r.rescued) { const d = COMPANIONS[r.rescued]; note(ui('companheiro', 34), `${d.name} livre!`, 'companheiros', { title: d.name, color: '#f2c14e', sub: 'Novo companheiro', rows: [{ icon: 'companheiro', text: d.passive, tone: 'ok' }, { text: `${d.activeName}: ${d.active}` }], foot: ['Clique: ver companheiros'] }, 'gold'); }
  if (r.supremo) { const d = SUPREMOS[r.supremo]; note(ui(r.supremo, 34), `${d.name} libertado!`, 'feiticos', { title: d.name, color: ELEMENTS[r.supremo].color, icon: ui('supremo', 40), sub: `Encantado libertado · Supremo de ${ELEMENTS[r.supremo].name}`, subColor: ELEMENTS[r.supremo].color, rows: [{ text: d.desc }, { icon: 'supremo', text: 'Tecla T quando a carga enche', tone: 'dim' }], foot: ['Clique: ver feitiços'] }, 'gold'); }
  if (r.gems.length) note(ui('gema', 34), `+${r.gems.length} ${r.gems.length === 1 ? 'gema' : 'gemas'}`, 'ferreiro', { title: 'Gemas', icon: ui('gema', 36), rows: r.gems.map((g) => ({ node: gemTile(g, 22), text: gemName(g), value: `Nv ${g.lvl}`, color: ELEMENTS[g.el].color })), foot: ['Clique: ver no ferreiro'] });
  for (const sp of r.spells) note(ui(sp, 34), 'Feitiço novo', 'feiticos', { title: SPELLS[sp].name, color: ELEMENTS[SPELLS[sp].element].color, sub: `${SPELLS[sp].role} · ${ELEMENTS[SPELLS[sp].element].name}`, rows: [{ text: SPELLS[sp].desc }], foot: ['Clique: ver feitiços'] });
  if (r.starChest) {
    const rows: TipRow[] = [{ icon: 'ouro', text: 'Ouro', value: `+${num(r.starChest.gold)}`, tone: 'ok' }, { icon: 'resina', text: 'Resina', value: `+${num(r.starChest.mata)}`, tone: 'ok' }, r.starChest.talent ? { icon: 'talentos', text: 'Ponto de talento', value: '+1', tone: 'ok' } : null];
    note(ui('bau', 34), 'Baú de estrelas', null, { title: `Baú de ${r.starChest.stars} estrelas`, color: '#f2c14e', rows }, 'gold');
  }
  if (r.talentPoints > 0) note(ui('talentos', 34), `+${r.talentPoints} talento`, 'talentos', { title: 'Ponto de talento', rows: [{ text: 'Prêmio por vencer o chefão pela primeira vez.' }], foot: ['Clique: ver talentos'] });
  if (r.bestTime && rec.bestTime != null) note(ui('relogio', 34), `Recorde ${clock(rec.bestTime)}`, null, { title: 'Novo melhor tempo', tag: clock(rec.bestTime), rows: [{ icon: 'relogio', text: 'Tempo da 3ª estrela', value: clock(stage.starTime) }] });
  if (p.attrPoints > 0) note(ui('heroi', 34), `${p.attrPoints} ${p.attrPoints === 1 ? 'ponto' : 'pontos'}`, 'heroi', { title: 'Pontos de atributo', tag: String(p.attrPoints), rows: [{ text: 'Você tem pontos de atributo para gastar.' }], foot: ['Clique: ver herói'] }, 'hot');
  const free = talentFree(p);
  if (free > 0 && r.talentPoints === 0) note(ui('talentos', 34), `${free} ${free === 1 ? 'talento' : 'talentos'}`, 'talentos', { title: 'Pontos de talento', tag: String(free), rows: [{ text: 'Você tem pontos de talento para gastar.' }], foot: ['Clique: ver talentos'] }, 'hot');

  const again = () => c.host.startStage(stage.id);
  const actions = exp
    ? [
      h('button', { type: 'button', class: 'btn big', 'data-fk': 'res-mapa', onclick: () => c.go('diario') }, ui('diario', 30), 'Diário'),
      c.p.daily.expeditions.includes(stage.id) && h('button', { type: 'button', class: 'btn big primary', 'data-fk': 'res-principal', onclick: again }, ui('expedicao', 30), r.won ? 'Jogar de novo' : 'Tentar de novo'),
    ]
    : tower
    ? [
      h('button', { type: 'button', class: 'btn big', 'data-fk': 'res-mapa', onclick: () => c.go('torre') }, ui('torre', 30), 'Torre'),
      tip(h('button', { type: 'button', class: 'btn big primary', 'data-fk': 'res-principal', onclick: () => c.host.startStage(`torre-${c.p.tower.checkpoint}`) }, ui('seta', 30), r.won ? 'Continuar' : 'Tentar de novo'),
        () => ({ title: `Andares ${c.p.tower.checkpoint}–${Math.min(TOWER_FLOORS, c.p.tower.checkpoint + FLOORS_PER_RUN - 1)}`, icon: ui('torre', 36) })),
    ]
    : [
      h('button', { type: 'button', class: 'btn big', 'data-fk': 'res-mapa', onclick: () => c.go('mapa') }, ui('mapa', 30), 'Mapa'),
      h('button', { type: 'button', class: `btn big${nextOpen ? '' : ' primary'}`, 'data-fk': nextOpen ? 'res-de-novo' : 'res-principal', onclick: again }, ui('dano', 30), r.won ? 'Jogar de novo' : 'Tentar de novo'),
      nextOpen && next && tip(h('button', { type: 'button', class: 'btn big primary', 'data-fk': 'res-principal', onclick: () => c.host.startStage(next.id) }, 'Próxima fase', ui('seta', 30)),
        { title: `${next.id} · ${next.name}`, tag: `Nv ${next.level}` }),
    ];
  const title = tower ? (r.won ? 'Vitória!' : 'Fim da subida') : r.won ? 'Vitória!' : 'Derrota';
  const sub = exp ? `Expedição · ${stage.name}` : tower ? `Torre · andares ${tower.from}–${Math.min(TOWER_FLOORS, tower.from + FLOORS_PER_RUN - 1)}` : `${stage.id} · ${stage.name}`;
  return h('div', `results ${r.won || (tower && tower.floors > 0) ? 'won' : 'lost'}${tower ? ' tower' : ''}`,
    backdrop('resultado', VIEW_W, VIEW_H, (g) => paintHeroBackdrop(g, VIEW_W, VIEW_H)),
    h('div', 'res-shade'),
    h('div', 'res-banner', h('h1', null, title), h('span', null, sub)),
    stars,
    h('div', 'res-panel', xp, gains),
    tiles.length > 0 && h('div', 'res-loot', tiles),
    news.length > 0 && h('div', 'res-news', news.slice(0, 7)),
    h('div', 'res-actions', actions));
}

function gemSpec(c: Ctx, g: Gem): TipSpec {
  const probe = (type: Item['type']): Item => ({ id: -1, type, name: '', ilvl: 1, rarity: 0, plus: 0, affixes: [], gem: g });
  return {
    title: gemName(g), color: ELEMENTS[g.el].color, tag: `Nv ${g.lvl}`, icon: gemTile(g, 36),
    rows: [{ icon: 'dano', text: `Na arma: ${gemText(probe('facao'))}` }, { icon: 'defesa', text: `Na armadura: ${gemText(probe('gibao'))}` }, 'sep', { icon: 'ferreiro', text: 'Encaixe no ferreiro, modo Gemas', tone: 'dim' }],
  };
}

/* ---------- expedição: modificador e o que ainda paga hoje ---------- */

function expBlock(e: NonNullable<DailyNews['expedition']>, won: boolean): HTMLElement {
  const mod = EXP_MODS[e.mod];
  return h('div', 'res-tower res-exp',
    tip(h('div', { class: 'res-exp-mod', tabindex: 0 }, ui(mod.icon, 34), mod.name), { title: mod.name, color: '#ffc247', icon: ui(mod.icon, 36), rows: [{ text: mod.desc, tone: 'dim' }] }),
    e.first && tip(h('div', { class: 'res-exp-mod first', tabindex: 0 }, ui('novo', 34), '1ª vitória do dia'), { title: 'Primeira vitória do dia', color: '#f2c14e', rows: [{ icon: 'resina', text: 'Resina em dobro', tone: 'ok' }, { icon: 'tomo', text: 'Um tomo', tone: 'ok' }, { icon: 'item', text: 'Um item', tone: 'ok' }] }),
    tip(h('div', { class: `res-exp-mod${e.runsLeft > 0 ? '' : ' out'}`, tabindex: 0 }, ui('bau', 34), `${e.runsLeft}/${EXP_REWARDED_RUNS}`), {
      title: 'Vitórias que ainda pagam hoje', tag: `${e.runsLeft}/${EXP_REWARDED_RUNS}`, icon: ui('bau', 36),
      rows: [won && !e.rewarded ? { icon: 'cadeado', text: 'Esta vitória só deu experiência.', tone: 'warn' } : null, { text: 'Ouro e material voltam amanhã.', tone: 'dim' }],
    }));
}

/* ---------- Torre: andares vencidos e recorde ---------- */

function towerBlock(c: Ctx, t: NonNullable<StageRewards['tower']>, won: boolean): HTMLElement {
  const top = t.from + t.floors - 1, pips = Array.from({ length: FLOORS_PER_RUN }, (_, i) => t.from + i);
  return h('div', 'res-tower',
    h('div', { class: 'rt-floors', role: 'img', 'aria-label': `${t.floors} de ${FLOORS_PER_RUN} andares vencidos` }, pips.map((f, i) => tip(h('span', {
      class: `rt-pip${f <= top ? ' on' : ''}${f % 10 === 0 ? ' boss' : ''}`, style: `animation-delay:${300 + i * 90}ms`, tabindex: 0,
    }, f % 10 === 0 ? ui('caveira', 26) : h('b', null, f)), { title: `Andar ${f}`, sub: f <= top ? 'Vencido' : 'Não chegou', subColor: f <= top ? '#86e07a' : '#b9b2a3' }))),
    h('div', 'rt-stats',
      tip(h('div', { class: 'rt-stat', tabindex: 0 }, ui('torre', 40), h('b', null, `+${t.floors}`)), { title: 'Andares vencidos', tag: `${t.floors}/${FLOORS_PER_RUN}`, icon: ui('torre', 36), rows: [won ? { icon: 'check', text: 'Próximo marco aberto', tone: 'ok' } : { text: 'Os andares vencidos pagam mesmo sem chegar ao topo.', tone: 'dim' }] }),
      tip(h('div', { class: `rt-stat${t.newBest ? ' best' : ''}`, tabindex: 0 }, ui('coroa', 40), h('b', null, num(t.best)), t.newBest && h('span', 'rt-new', 'Recorde!')), { title: t.newBest ? 'Novo recorde!' : 'Recorde', color: '#f2c14e', tag: `${t.best}/${TOWER_FLOORS}`, icon: ui('coroa', 36), rows: [{ icon: 'torre', text: 'Andar mais alto vencido', value: num(t.best) }] }),
      tip(h('div', { class: 'rt-stat', tabindex: 0 }, ui('relogio', 36), h('b', null, num(t.weekBest))), { title: 'Recorde da semana', tag: num(t.weekBest), icon: ui('relogio', 36), rows: [c.p.tower.weekTime > 0 ? { icon: 'relogio', text: 'Tempo', value: clock(c.p.tower.weekTime) } : null] })));
}

/* ---------- final do jogo ---------- */

/** Resultados cujo final já foi visto nesta sessão (a tela de espólios vem depois). */
const finaleDone = new WeakSet<StageRewards>();

const ENDING = [
  'O cinza não resistiu a quem se lembrou.',
  'Você chamou cada Encantado pelo nome, e cada nome trouxe de volta uma cor: o verde da mata, o azul dos rios, o ouro do sertão.',
  'A Terra Sem Nome tem nome outra vez.',
  'Enquanto alguém contar estas histórias, elas não se apagam.',
];

/** Os sete Encantados e o herói, na ordem em que aparecem; altura relativa de cada um. */
const PARADE: { key: string; el: keyof typeof ELEMENTS | null; name: string; hgt: number }[] = [
  { key: FREED[0], el: 'natureza', name: SUPREMOS.natureza.name, hgt: 0.86 },
  { key: FREED[1], el: 'agua', name: SUPREMOS.agua.name, hgt: 0.86 },
  { key: FREED[2], el: 'tempestade', name: SUPREMOS.tempestade.name, hgt: 0.74 },
  { key: 'heroi', el: null, name: 'Você', hgt: 0.7 },
  { key: FREED[3], el: 'fogo', name: SUPREMOS.fogo.name, hgt: 0.8 },
  { key: FREED[4], el: 'terra', name: SUPREMOS.terra.name, hgt: 1 },
  { key: FREED[5], el: 'sombra', name: SUPREMOS.sombra.name, hgt: 0.95 },
  { key: FREED[6], el: 'encanto', name: SUPREMOS.encanto.name, hgt: 0.88 },
];

function renderFinal(c: Ctx, r: StageRewards): HTMLElement {
  const W = 1240, H = 290, slot = W / PARADE.length;
  const { cv } = hdCanvas(W, H, 'final-cv');
  const born = performance.now() / 1000;
  let shown = -1;
  const draw = (g: CanvasRenderingContext2D, t: number) => {
    /* oito figuras grandes: 30 quadros por segundo bastam e poupam a máquina */
    if (t - shown < 1 / 30) return;
    shown = t;
    g.clearRect(0, 0, W, H);
    const age = c.still ? 99 : t - born;
    PARADE.forEach((f, i) => {
      /* cada um chega um pouco depois do outro, subindo do chão */
      const k = Math.max(0, Math.min(1, (age - 0.6 - i * 0.28) / 0.7)), ease = 1 - Math.pow(1 - k, 3);
      if (k <= 0) return;
      const bh = H * f.hgt, x = i * slot;
      g.save();
      g.globalAlpha = ease;
      g.fillStyle = 'rgba(8,14,8,.35)'; g.beginPath(); g.ellipse(x + slot / 2, H - 10, slot * 0.36, 8, 0, 0, Math.PI * 2); g.fill();
      g.translate(0, (1 - ease) * 30);
      drawFigure(g, f.key, { x: x - 14, y: H - bh, w: slot + 28, h: bh }, t, 0.96, f.el ? ELEMENTS[f.el].color : '#f2c14e');
      g.restore();
    });
  };
  c.animate(cv, draw);
  const hits = PARADE.map((f, i) => tip(h('span', { class: 'final-hit', style: `left:${i * slot}px;width:${slot}px`, tabindex: 0, 'aria-label': f.name }),
    { title: f.name, color: f.el ? ELEMENTS[f.el].color : '#f2c14e', icon: f.el ? ui(f.el, 36) : ui('heroi', 36), sub: f.el ? ELEMENTS[f.el].name : undefined, subColor: f.el ? ELEMENTS[f.el].color : undefined }));
  const done = (to: Tab | null) => { finaleDone.add(r); if (to) c.go(to); else c.redraw('res-principal'); };
  return h('div', `final${c.still ? ' still' : ''}`,
    backdrop('final', VIEW_W, VIEW_H, (g) => paintHeroBackdrop(g, VIEW_W, VIEW_H)),
    h('div', 'final-glow'),
    h('div', 'final-title', h('h1', null, 'A cor voltou')),
    h('div', 'final-text', ENDING.map((line, i) => h('p', { style: `animation-delay:${2.6 + i * 0.9}s` }, line))),
    h('div', 'final-parade', cv, hits),
    h('div', 'final-credits', ui('credito', 30), h('span', null, h('b', null, 'Encantados'), ' — feito por Cezar Garcia com Claude')),
    h('div', 'res-actions final-actions',
      tip(h('button', { type: 'button', class: 'btn big', 'data-fk': 'final-espolios', onclick: () => done(null) }, ui('bau', 30), 'Espólios'), { title: 'Espólios da fase', rows: [{ text: 'Experiência, ouro e itens desta vitória.', tone: 'dim' }] }),
      h('button', { type: 'button', class: 'btn big primary', 'data-fk': 'res-principal', onclick: () => done('mapa') }, ui('mapa', 30), 'Voltar ao mapa')));
}
