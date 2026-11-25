/**
 * Painéis dos desafios com ranking: o Desafio do Dia (no Diário) e o Desafio dos Encantados (na Torre).
 * As regras estão em src/meta/challenge.ts; aqui só se mostra e se chama o host.
 */
import { BOSSES_BY_CHAPTER, ENCANTADOS_LEVEL, WEAPONS, dailyChallenge, secondsToNextBrDay, type HeroSpec } from '../data/challenge';
import { COMPANIONS, ELEMENTS, SPELLS } from '../data/content';
import { EXP_MODS } from '../data/daily';
import { ITEM_TYPES, type WeaponKind } from '../data/items';
import { CHAPTERS } from '../data/stages';
import { ENCANTADOS_HERO_LEVEL, dailyOpen, encantadosOpen, encantadosSpec, touchChallengeDay } from '../meta/challenge';
import type { ChallengeResult } from '../meta/profile';
import type { Ctx } from './ctx';
import { clock, h, hdCanvas, itemIcon, num, ui } from './dom';
import { drawFigure } from './retratos';
import { tip, type TipRow } from './tip';

function look(chapter: number): { icon: string; color: string; name: string } {
  const ch = CHAPTERS.find((c) => c.id === chapter) ?? CHAPTERS[0];
  return { icon: ch.element ?? 'credito', color: ch.element ? ELEMENTS[ch.element].color : '#e9e1f2', name: ch.name };
}

/** "5h 12min" até o próximo dia de Brasília. */
function untilNextDay(): string {
  const min = Math.max(1, Math.ceil(secondsToNextBrDay() / 60)), hrs = Math.floor(min / 60);
  return hrs > 0 ? `${hrs}h ${String(min % 60).padStart(2, '0')}min` : `${min}min`;
}

/** "vitória em 01:47" ou "caiu na sala 3". */
export function resultText(r: ChallengeResult, unit = 'sala'): string {
  return r.won ? `vitória em ${clock(r.time)}` : `caiu na ${unit} ${r.rooms + 1}`;
}

function petIcon(id: string, size: number): HTMLElement {
  const { cv, g } = hdCanvas(size, size, 'ch-pet');
  if (g) drawFigure(g, id, { x: 0, y: 0, w: size, h: size }, 0.2, 0.95, '#c9a36a');
  return cv;
}

/** Ícones do herói de um desafio: arma, três feitiços, companheiro e Supremo. */
function heroIcons(s: HeroSpec, size = 26): HTMLElement {
  return h('span', 'ch-hero',
    tip(h('span', { class: 'ch-ico weapon', tabindex: 0 }, itemIcon(s.weapon, size + 4)), { title: ITEM_TYPES[s.weapon].label, rows: [{ text: ITEM_TYPES[s.weapon].note ?? '', tone: 'dim' }] }),
    s.spells.map((id, i) => id
      ? tip(h('span', { class: 'ch-ico', tabindex: 0 }, ui(id, size)), { title: SPELLS[id].name, color: ELEMENTS[SPELLS[id].element].color, rows: [{ text: SPELLS[id].desc }] })
      : h('span', { class: 'ch-ico empty', 'aria-label': `Espaço ${i + 1} vazio` })),
    s.companion && tip(h('span', { class: 'ch-ico', tabindex: 0 }, petIcon(s.companion, size)), { title: COMPANIONS[s.companion].name }),
    s.supremo && tip(h('span', { class: 'ch-ico', tabindex: 0 }, ui(s.supremo, size)), { title: `Supremo de ${ELEMENTS[s.supremo].name}`, color: ELEMENTS[s.supremo].color }));
}

/* ---------- Desafio do Dia ---------- */

export function dailyChallengeCard(c: Ctx): HTMLElement | null {
  const p = c.p;
  if (!dailyOpen(p)) return null;
  touchChallengeDay(p);
  const d = p.challenges.daily, def = dailyChallenge(d.day), lk = look(def.chapter), mod = EXP_MODS[def.mod], played = d.tries > 0;
  const rows: TipRow[] = [
    { icon: lk.icon, text: lk.name, value: `Nv ${def.level}`, color: lk.color },
    { icon: mod.icon, text: mod.name, value: null }, { text: mod.desc, tone: 'dim' },
    'sep',
    { text: 'O mesmo para todo mundo: salas, monstros, arma, feitiços e companheiro. O equipamento é igual para todos.' },
    { icon: 'coroa', text: 'A primeira tentativa do dia vale para o ranking. As outras são treino.', tone: 'gold' },
    { icon: 'resina', text: 'Primeira tentativa: resina por sala; vitória: pó e um tomo', tone: 'ok' },
    d.streak > 1 ? { icon: 'estrela', text: 'Dias seguidos vencendo', value: num(d.streak), tone: 'ok' } : null,
    'sep',
    { icon: 'relogio', text: 'Novo desafio em', value: untilNextDay() },
  ];
  return tip(h('section', { class: `dia-desafio${played ? ' played' : ''}`, style: `--ec:${lk.color}`, tabindex: 0, 'aria-label': 'Desafio do Dia' },
    h('span', 'dd-medal', ui(lk.icon, 56), h('i', 'dd-mod', ui(mod.icon, 26))),
    h('div', 'dd-mid',
      h('div', 'dd-head', h('b', null, 'Desafio do Dia'), h('span', 'dd-ch', `Nv ${def.level} · ${lk.name}`)),
      heroIcons(def.spec),
      h('div', `dd-status${d.first?.won ? ' ok' : ''}`,
        !played ? [ui('coroa', 20), 'Primeira tentativa vale ranking']
          : [ui(d.first?.won ? 'check' : 'caveira', 20), d.first ? resultText(d.first) : '—', d.tries > 1 ? h('i', null, ` · ${d.tries - 1} ${d.tries === 2 ? 'treino' : 'treinos'}`) : null])),
    h('button', { type: 'button', class: `btn ${played ? '' : 'primary'} dd-go`, 'data-fk': 'desafio-dia', onclick: () => c.host.startChallenge('dia') },
      ui(played ? 'relogio' : 'coroa', 26), played ? 'Treinar' : 'Valendo!')),
  { title: 'Desafio do Dia', color: lk.color, icon: ui(lk.icon, 36), tag: d.day.split('-').reverse().slice(0, 2).join('/'), rows });
}

/* ---------- Desafio dos Encantados ---------- */

export function encantadosPanel(c: Ctx): HTMLElement {
  const p = c.p;
  if (!encantadosOpen(p)) {
    return tip(h('section', { class: 'enc-desafio locked', tabindex: 0 },
      h('span', 'plate', ui('coroa', 26), 'Desafio dos Encantados'),
      ui('cadeado', 56), h('p', null, 'Abre depois do final: vença o Esquecimento.')),
    { title: 'Desafio dos Encantados', icon: ui('coroa', 36), rows: [{ text: 'Os oito Encantados seguidos, contra o relógio, com ranking.' }] });
  }
  const e = p.challenges.encantados, weapon = (c.st.encWeapon ?? encantadosSpec(p).weapon) as WeaponKind, spec = encantadosSpec(p, weapon);
  const bests: TipRow[] = WEAPONS.map((w) => { const r = e.bestByWeapon[w]; return { node: itemIcon(w, 22), text: ITEM_TYPES[w].label, value: r ? resultText(r, 'chefe') : '—', tone: r?.won ? 'ok' : 'dim' }; });
  return h('section', { class: 'enc-desafio', 'aria-label': 'Desafio dos Encantados' },
    h('span', 'plate', ui('coroa', 26), 'Desafio dos Encantados'),
    h('div', 'ed-bosses', BOSSES_BY_CHAPTER.map((ch) => { const lk = look(ch); return tip(h('span', { class: 'ed-boss', style: `--ec:${lk.color}`, tabindex: 0 }, ui(lk.icon, 24)), { title: lk.name, color: lk.color, rows: [{ text: `Chefe do nível ${ENCANTADOS_LEVEL}.`, tone: 'dim' }] }); })),
    h('div', 'ed-label', 'Arma'),
    h('div', { class: 'ed-weapons', role: 'group', 'aria-label': 'Arma' }, WEAPONS.map((w) => tip(h('button', {
      type: 'button', class: `ed-weapon${w === weapon ? ' on' : ''}`, 'aria-pressed': String(w === weapon), 'aria-label': ITEM_TYPES[w].label, 'data-fk': `enc-${w}`,
      onclick: () => { c.st.encWeapon = w; c.redraw(`enc-${w}`); },
    }, itemIcon(w, 34)), { title: ITEM_TYPES[w].label, rows: [{ text: 'O equipamento é o de referência do nível, igual para todos.', tone: 'dim' }] }))),
    h('div', 'ed-label', 'Feitiços, companheiro e Supremo da campanha'),
    heroIcons(spec, 26),
    tip(h('div', { class: 'ed-best', tabindex: 0 }, ui('relogio', 30),
      h('span', null, e.best ? resultText(e.best, 'chefe') : 'Sem tentativa ainda', h('i', null, ` · ${e.wins} ${e.wins === 1 ? 'vitória' : 'vitórias'}`))),
    { title: 'Recordes por arma', icon: ui('relogio', 36), rows: [...bests, 'sep', { text: `Herói do nível ${ENCANTADOS_HERO_LEVEL}, chefes do ${ENCANTADOS_LEVEL}. Um altar a cada dois chefes.`, tone: 'dim' }, e.wins === 0 ? { icon: 'lagrima', text: 'Primeira vitória: 2 Lágrimas de Encantado', tone: 'gold' } : null] }),
    h('button', { type: 'button', class: 'btn primary ed-go', 'data-fk': 'encantados', onclick: () => c.host.startChallenge('encantados', weapon) }, ui('coroa', 30), 'Enfrentar'));
}
