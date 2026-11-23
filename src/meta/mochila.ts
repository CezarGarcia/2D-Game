/**
 * Atalhos da mochila: equipar o que aumenta o Poder e achar as sobras que só ocupam espaço.
 * Nunca troca o tipo de arma (isso muda o jeito de jogar) nem mexe em itens travados.
 */
import { ITEM_TYPES, sellValue, type Item, type Slot } from '../data/items';
import { equip, sellItem, slotsFor, type Profile } from './profile';
import { deriveStats, powerOf } from './stats';

function clone(p: Profile): Profile {
  return { ...p, inventory: p.inventory.slice(), equipped: { ...p.equipped } };
}

/** Melhor espaço e ganho de Poder ao equipar o item da mochila. */
export function bestSlot(p: Profile, item: Item): { slot: Slot; delta: number } {
  const base = powerOf(deriveStats(p));
  let best: { slot: Slot; delta: number } | null = null;
  // espaços vazios primeiro: em empate, não tira nada do corpo
  const slots = slotsFor(item.type).sort((a, b) => Number(!!p.equipped[a]) - Number(!!p.equipped[b]));
  for (const slot of slots) {
    const t = clone(p);
    if (!equip(t, item.id, slot)) continue;
    const delta = powerOf(deriveStats(t)) - base;
    if (!best || delta > best.delta) best = { slot, delta };
  }
  return best ?? { slot: slotsFor(item.type)[0], delta: 0 };
}

/** Pode entrar no equipamento sem trocar o estilo de jogo: arma só do mesmo tipo, outra mão só se servir na arma. */
function keepsStyle(p: Profile, item: Item): boolean {
  const def = ITEM_TYPES[item.type], weapon = p.equipped.arma;
  if (def.group === 'arma') return !weapon || weapon.type === item.type;
  if (def.needs) return !!weapon && weapon.type === def.needs;
  return true;
}

/** Trocas que aumentam o Poder, na ordem em que seriam feitas (a maior primeiro, recalculando a cada troca). */
export function planUpgrades(p: Profile): { id: number; slot: Slot; delta: number }[] {
  const t = clone(p), plan: { id: number; slot: Slot; delta: number }[] = [];
  for (let guard = 0; guard < 12; guard++) {
    let pick: { id: number; slot: Slot; delta: number } | null = null;
    for (const it of t.inventory) {
      if (!keepsStyle(t, it)) continue;
      const b = bestSlot(t, it);
      if (b.delta > 0 && (!pick || b.delta > pick.delta)) pick = { id: it.id, ...b };
    }
    if (!pick) break;
    equip(t, pick.id, pick.slot);
    plan.push(pick);
  }
  return plan;
}

/** Equipa todas as melhorias. Devolve o ganho total de Poder. */
export function equipBest(p: Profile): number {
  const before = powerOf(deriveStats(p));
  for (const step of planUpgrades(p)) equip(p, step.id, step.slot);
  return powerOf(deriveStats(p)) - before;
}

/**
 * Sobras: Comuns e Incomuns sem trava, sem conjunto, sem nome, sem gema e sem aprimoramento,
 * que não aumentam o Poder em nenhum espaço.
 */
export function junkItems(p: Profile): Item[] {
  return p.inventory.filter((it) => !it.locked && it.rarity <= 1 && !it.set && !it.unique && !it.gem && it.plus <= 0 && bestSlot(p, it).delta <= 0);
}

export function junkValue(items: Item[]): number {
  return items.reduce((n, it) => n + sellValue(it), 0);
}

/** Vende as sobras. Devolve quantos itens e quanto ouro. */
export function sellJunk(p: Profile): { count: number; gold: number } {
  const ids = junkItems(p).map((it) => it.id);
  let gold = 0;
  for (const id of ids) gold += sellItem(p, id);
  return { count: ids.length, gold };
}
