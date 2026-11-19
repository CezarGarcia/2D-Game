/** Aba Feitiços: os cinco feitiços do capítulo e os três espaços Q, E, R. */
import { SPELLS, SPELL_ORDER, type SpellId } from '../data/content';
import { knownSpells, setLoadout } from '../meta/profile';
import type { Ctx } from './ctx';
import { btn, h, icon, num } from './dom';

const KEYS = ['Q', 'E', 'R'];

export function renderFeiticos(c: Ctx): HTMLElement {
  const p = c.p, known = knownSpells(p);
  const put = (index: number, spell: SpellId | null) => () => { if (setLoadout(p, index, spell)) c.commit(); };

  return h('div', 'tab-feiticos',
    h('section', { class: 'panel loadout', 'aria-label': 'Feitiços em uso' },
      h('header', 'panel-head', h('h2', 'title', 'Em uso'), h('span', 'muted small', 'Três feitiços vão para a luta, nas teclas Q, E e R.')),
      h('div', 'loadout-slots', KEYS.map((key, i) => {
        const id = p.loadout[i] ?? null, sp = id ? SPELLS[id] : null;
        return h('div', `lslot${sp ? '' : ' empty'}`,
          h('kbd', null, key),
          sp ? icon('misc', sp.id, 44) : h('span', 'lslot-blank'),
          h('div', 'lslot-text', h('strong', null, sp ? sp.name : 'Vazio'), h('span', 'muted small', sp ? sp.role : 'Escolha um feitiço abaixo')),
          sp && btn('Tirar', put(i, null), { small: true, kind: 'quiet', fk: `tirar-${key}`, label: `Tirar ${sp.name} da tecla ${key}` }));
      }))),
    h('section', { class: 'spell-list', 'aria-label': 'Feitiços' },
      SPELL_ORDER.map((id) => {
        const sp = SPELLS[id], has = known.includes(id), at = p.loadout.indexOf(id);
        return h('article', `panel spell${has ? '' : ' unknown'}`,
          h('div', 'spell-head',
            icon('misc', sp.id, 48),
            h('div', null, h('h3', 'title', sp.name), h('span', 'chip', sp.role))),
          h('p', 'spell-desc', sp.desc),
          h('dl', 'spell-nums',
            h('div', null, h('dt', null, 'Custo'), h('dd', 'num', `${num(sp.cost)} de mana`)),
            h('div', null, h('dt', null, 'Recarga'), h('dd', 'num', `${num(sp.cooldown, 1)} s`))),
          has
            ? h('div', { class: 'spell-keys', role: 'group', 'aria-label': `Tecla de ${sp.name}` },
              h('span', 'k', 'Tecla'),
              KEYS.map((key, i) => btn(key, put(i, id), { small: true, pressed: at === i, fk: `sp-${id}-${key}`, cls: 'key', label: `${sp.name} na tecla ${key}${at === i ? ' (em uso)' : ''}` })))
            : h('p', 'spell-lock', `Aprende no nível ${sp.unlock}`));
      })),
    h('p', 'muted small foot-note', 'Pôr um feitiço numa tecla ocupada troca os dois de lugar. A recarga cai com Espírito, talentos e equipamento.'),
  );
}
