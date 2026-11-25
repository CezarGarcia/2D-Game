/**
 * Garrafadas (docs/gdd/11): o botão no painel da fase e a janelinha para escolher uma.
 * A escolhida fica em `c.st.brew` e é gasta (em material) quando o jogador entra na fase.
 */
import { wheelAffinity } from '../data/affinity';
import { BREWS, type BrewDef, type BrewId, type BrewKind } from '../data/brews';
import { ELEMENTS, ELEMENT_ORDER, type ElementId } from '../data/content';
import { brewUnlocked, canBrew } from '../meta/afinidade';
import type { Ctx } from './ctx';
import { h, num, ui } from './dom';
import { tip } from './tip';

const costText = (b: BrewDef) => (b.cost.mata ? `${b.cost.mata} de Resina` : `${b.cost.po} de Pó de Assombro`);

/** O botão: mostra a garrafada escolhida, ou convida a escolher. Sem material para a escolhida, ela é desmarcada. */
export function brewChip(c: Ctx): HTMLElement {
  if (c.st.brew && !canBrew(c.p, c.st.brew)) c.st.brew = null;
  const b = c.st.brew ? BREWS[c.st.brew] : null;
  return tip(h('button', { type: 'button', class: `chip hunt-chip brew-chip${b ? ' on' : ''}`, style: b ? `--ec:${ELEMENTS[b.el].color}` : null, 'data-fk': 'garrafada', 'aria-label': b ? `Garrafada: ${b.name}` : 'Garrafada', onclick: () => { c.st.brewOpen = true; c.redraw('brew-fechar'); } },
    ui(b ? b.el : 'pocao', 20), b ? (b.kind === 'res' ? 'Proteção' : 'Têmpera') : 'Garrafada'),
  () => (b
    ? { title: b.name, color: ELEMENTS[b.el].color, icon: ui(b.el, 36), sub: `Gasta ${costText(b)} ao entrar`, rows: [{ text: b.desc }, { text: 'Vale ao jogar na mão. Clique para trocar ou tirar.', tone: 'dim' as const }] }
    : { title: 'Garrafada', icon: ui('pocao', 36), rows: [{ text: 'Um preparo para esta fase: resistência a um elemento, ou um elemento nos golpes da arma.' }, { text: 'É feita na hora, com material, e dura a fase.', tone: 'dim' as const }] }));
}

/**
 * A janelinha. `threat` são os elementos que os monstros da fase usam e `weak`, aqueles a que são fracos:
 * as garrafadas que respondem a eles vêm marcadas.
 */
export function brewPopup(c: Ctx, o: { threat?: ElementId[]; weak?: ElementId[]; fk?: string } = {}): HTMLElement | null {
  if (!c.st.brewOpen) return null;
  const close = () => { c.st.brewOpen = false; c.redraw(o.fk ?? 'garrafada'); };
  const row = (kind: BrewKind, el: ElementId): HTMLElement => {
    const id = `${kind}-${el}` as BrewId, b = BREWS[id], on = c.st.brew === id, can = canBrew(c.p, id), open = brewUnlocked(c.p, id);
    const good = kind === 'res' ? !!o.threat?.includes(el) : !!o.weak?.includes(el);
    return tip(h('button', { type: 'button', class: `brew${on ? ' on' : ''}${good ? ' good' : ''}`, style: `--ec:${ELEMENTS[el].color}`, disabled: !can && !on, 'aria-pressed': String(on), 'data-fk': `brew-${id}`, onclick: () => { c.st.brew = on ? null : id; c.redraw(`brew-${id}`); } },
      h('span', 'brew-ico', ui(open ? el : 'cadeado', 26)), h('span', 'brew-name', b.name), good && open && h('i', 'brew-good', ui('check', 14))),
    { title: b.name, color: ELEMENTS[el].color, icon: ui(el, 36), sub: !open ? 'Liberte o Encantado deste elemento' : can ? `Custa ${costText(b)}` : `Falta material: ${costText(b)}`, subColor: can ? undefined : '#ff7b6b',
      rows: [{ text: b.desc }, kind === 'arma' ? { text: `Golpe de ${ELEMENTS[el].name} pega os monstros fracos a ${ELEMENTS[el].name}, sofre com os que resistem e gasta a Casca.`, tone: 'dim' as const } : null,
        good ? { icon: 'check', text: kind === 'res' ? 'Os monstros desta fase atacam com este elemento.' : 'Os monstros desta fase são fracos a este elemento.', tone: 'ok' as const } : null] });
  };
  const col = (kind: BrewKind, title: string, icon: string, mat: 'mata' | 'po') => h('div', 'brew-col',
    h('div', 'brew-col-title', ui(icon, 24), title, h('span', null, ui(mat === 'mata' ? 'resina' : 'po', 18), kind === 'res' ? BREWS['res-fogo'].cost.mata : BREWS['arma-fogo'].cost.po)),
    ELEMENT_ORDER.map((el) => row(kind, el)));
  void wheelAffinity;
  return h('div', { class: 'omen-pop', onclick: (e: Event) => { if (e.target === e.currentTarget) close(); } },
    h('div', { class: 'panel brew-pop', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Garrafadas' },
      h('div', 'brew-pop-title', ui('pocao', 34), 'Garrafadas', h('span', 'brew-have', ui('resina', 20), num(c.p.materials.mata), ui('po', 20), num(c.p.materials.po))),
      h('div', 'brew-pop-sub', 'Uma por fase. O material é gasto quando você entra nela.'),
      h('div', 'brew-cols', col('res', 'Proteção', 'resistencia', 'mata'), col('arma', 'Têmpera', 'dano', 'po')),
      h('div', 'omen-pop-foot',
        c.st.brew && h('button', { type: 'button', class: 'btn small', 'data-fk': 'brew-nenhuma', onclick: () => { c.st.brew = null; c.redraw('brew-fechar'); } }, 'Sem garrafada'),
        h('button', { type: 'button', class: 'btn primary', 'data-fk': 'brew-fechar', onclick: close }, 'Pronto'))));
}
