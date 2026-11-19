/**
 * Transforma o perfil (nível, atributos, talentos, equipamento, companheiro) nos números que o
 * combate usa. Fórmulas de docs/gdd/02-personagem-e-talentos.md.
 */
import { COMPANIONS, type BlessingId, type CompanionId, type SpellId } from '../data/content';
import { ITEM_TYPES, SLOTS, baseValue, makeItem, type AffixKey, type Item, type WeaponKind } from '../data/items';
import { makeRng } from '../data/rng';
import { ATTRS, ATTR_BASE, newProfile, type AttrKey, type Profile } from './profile';

export interface HeroStats {
  level: number;
  attrs: Record<AttrKey, number>;
  maxHp: number; maxMana: number; manaRegen: number;
  weapon: WeaponKind;
  hasShield: boolean;
  /** Dano base da arma equipada. */
  weaponDamage: number;
  /** Multiplicador total de dano de arma (atributo, bônus e talentos). */
  damageMult: number;
  attackSpeed: number;
  critChance: number; critMult: number;
  defense: number;
  moveSpeed: number;
  dodgeCooldown: number; dodgeDistance: number; dodgeCharges: number;
  spellPower: number; spellCrit: number; cooldownMult: number; manaCostMult: number;
  resNatureza: number;
  lifesteal: number;
  thorns: number;
  goldMult: number; luck: number;
  companion: CompanionId | null;
  companionMult: number;
  loadout: (SpellId | null)[];
  potions: number;
  talents: {
    sedeDeBriga: boolean; execucao: boolean; contragolpe: boolean; cascaDeJabuti: boolean;
    rolamentoCortante: boolean; sangueQuente: boolean;
  };
  uniques: { mandibulaDaRainha: boolean; presaDaCaipora: boolean; coroaDeCipo: boolean };
}

export const BASE_MOVE_SPEED = 250;
export const BASE_DODGE_COOLDOWN = 1.2;

function affixSums(items: Item[]): Record<AffixKey, number> {
  const sum = {} as Record<AffixKey, number>;
  for (const it of items) for (const a of it.affixes) sum[a.k] = (sum[a.k] || 0) + a.v;
  return sum;
}

/** Itens equipados que realmente contam (escudo sem facão e aljava sem arco não contam). */
export function activeItems(p: Profile): Item[] {
  const weapon = p.equipped.arma;
  return SLOTS.map((s) => p.equipped[s]).filter((it): it is Item => {
    if (!it) return false;
    const needs = ITEM_TYPES[it.type].needs;
    return !needs || (!!weapon && weapon.type === needs);
  });
}

export function totalAttrs(p: Profile): Record<AttrKey, number> {
  const a = affixSums(activeItems(p)), t = p.talents;
  const root: Record<AttrKey, string> = { forca: 'raizForca', agilidade: 'raizAgilidade', inteligencia: 'raizInteligencia', vitalidade: 'raizVitalidade', espirito: 'raizEspirito', sorte: 'raizSorte' };
  const out = {} as Record<AttrKey, number>;
  for (const { key } of ATTRS) out[key] = ATTR_BASE + p.attrs[key] + (a[key] || 0) + (t[root[key]] ? 3 : 0);
  if (t.eloSorteInteligencia) { out.sorte += 2; out.inteligencia += 2; }
  if (t.eloAgilidadeSorte) { out.agilidade += 2; out.sorte += 2; }
  return out;
}

export function deriveStats(p: Profile, blessings: BlessingId[] = []): HeroStats {
  const items = activeItems(p), a = affixSums(items), t = p.talents, attrs = totalAttrs(p);
  const rank = (id: string) => t[id] || 0;
  const has = (b: BlessingId) => blessings.includes(b);
  const weaponItem = p.equipped.arma;
  const weapon: WeaponKind = weaponItem && weaponItem.type === 'arco' ? 'arco' : 'facao';
  const chest = p.equipped.peito?.type;
  const hasShield = weapon === 'facao' && p.equipped.mao?.type === 'escudo';
  const quiver = weapon === 'arco' && p.equipped.mao?.type === 'aljava';
  const companion = p.companion && p.companions[p.companion] ? p.companion : null;
  const pct = (k: AffixKey) => (a[k] || 0) / 100;

  const mainAttr = weapon === 'arco' ? attrs.agilidade : attrs.forca;
  const damageMult = (1 + 0.012 * mainAttr)
    * (1 + pct('dano') + 0.03 * rank('maoPesada') + (rank('eloForcaVitalidade') ? 0.02 : 0) + (quiver ? 0.08 : 0) + (has('furia') ? 0.2 : 0));

  let defense = 0.2 * attrs.vitalidade;
  for (const it of items) if (ITEM_TYPES[it.type].base === 'defesa') defense += baseValue(it);
  defense *= 1 + pct('defesa') + 0.03 * rank('couroCurtido');

  const hpFlat = 190 + 10 * p.level + 12 * attrs.vitalidade + (a.vida || 0) + (rank('eloForcaVitalidade') ? 15 : 0) + (rank('eloVitalidadeEspirito') ? 10 : 0);
  const maxHp = Math.round(hpFlat * (1 + 0.04 * rank('folego') + (companion === 'capivara' ? 0.08 : 0) + (has('vigor') ? 0.25 : 0)));
  const manaFlat = 60 + 3 * attrs.espirito + (a.mana || 0) + (rank('eloVitalidadeEspirito') ? 6 : 0) + (rank('eloInteligenciaEspirito') ? 6 : 0);
  const maxMana = Math.round(manaFlat * (1 + 0.05 * rank('fonte') + (chest === 'manto' ? 0.2 : 0)));

  const cooldownCut = Math.min(0.4, 0.005 * attrs.espirito + pct('recarga') + 0.03 * rank('pressa') + (chest === 'manto' ? 0.1 : 0));
  const haste = rank('eloAgilidadeForca') ? 0.02 : 0;

  return {
    level: p.level, attrs, maxHp, maxMana,
    manaRegen: 2 + 0.04 * attrs.espirito,
    weapon, hasShield,
    weaponDamage: weaponItem ? baseValue(weaponItem) : 6,
    damageMult,
    attackSpeed: 1 + 0.004 * attrs.agilidade + pct('velAtaque') + haste,
    critChance: Math.min(0.75, 0.05 + 0.0015 * attrs.agilidade + pct('critico') + 0.02 * rank('golpeCerteiro') + (chest === 'gibao' ? 0.03 : 0) + (companion === 'onca' ? 0.05 : 0) + (has('olho') ? 0.12 : 0)),
    critMult: 1.5 + pct('danoCritico'),
    defense: Math.round(defense * 10) / 10,
    moveSpeed: BASE_MOVE_SPEED * (1 + 0.02 * rank('peLigeiro') + haste + (has('vento') ? 0.15 : 0)),
    dodgeCooldown: BASE_DODGE_COOLDOWN * (1 - 0.04 * rank('reflexo')) * (has('vento') ? 0.7 : 1),
    dodgeDistance: chest === 'couraca' ? 0.8 : 1,
    dodgeCharges: rank('segundaEsquiva') ? 2 : 1,
    spellPower: (1 + 0.012 * attrs.inteligencia) * (1 + pct('danoNatureza') + 0.03 * rank('palavraForte') + (rank('eloInteligenciaEspirito') ? 0.03 : 0)),
    spellCrit: 0.05 + 0.02 * rank('foco'),
    cooldownMult: 1 - cooldownCut,
    manaCostMult: has('fonte') ? 0.65 : 1,
    resNatureza: Math.min(0.75, pct('resNatureza')),
    lifesteal: pct('rouboVida') + (has('sanguessuga') ? 0.05 : 0),
    thorns: has('espinhos') ? 0.3 : 0,
    goldMult: 1 + pct('ouro') + 0.002 * attrs.sorte + 0.03 * rank('olhoVivo'),
    luck: attrs.sorte,
    companion,
    companionMult: 1 + 0.05 * rank('bomTrato'),
    loadout: p.loadout.slice(0, 3),
    potions: p.potions,
    talents: {
      sedeDeBriga: !!rank('sedeDeBriga'), execucao: !!rank('execucao'), contragolpe: !!rank('contragolpe'),
      cascaDeJabuti: !!rank('cascaDeJabuti'), rolamentoCortante: !!rank('rolamentoCortante'), sangueQuente: !!rank('sangueQuente'),
    },
    uniques: {
      mandibulaDaRainha: items.some((i) => i.unique === 'mandibulaDaRainha'),
      presaDaCaipora: items.some((i) => i.unique === 'presaDaCaipora'),
      coroaDeCipo: items.some((i) => i.unique === 'coroaDeCipo'),
    },
  };
}

/** Fração do dano recebido que a defesa corta, contra um inimigo do nível dado. Limite de 75%. */
export function damageReduction(defense: number, enemyLevel: number): number {
  return Math.min(0.75, defense / (defense + 50 + 10 * enemyLevel));
}

/** Número único que resume o personagem: dano por segundo e vida efetiva. */
export function powerOf(s: HeroStats): number {
  const dps = s.weaponDamage * s.damageMult * s.attackSpeed * (1 + s.critChance * (s.critMult - 1));
  const ehp = s.maxHp / (1 - damageReduction(s.defense, s.level));
  return Math.round(dps * 6 + ehp * 0.5);
}

const recommendedCache = new Map<number, number>();

/**
 * Poder de um personagem de referência no nível da fase: pontos divididos entre Força e
 * Vitalidade, todos os espaços de armadura com itens Incomuns do nível, levemente aprimorados.
 */
export function recommendedPower(level: number): number {
  const hit = recommendedCache.get(level);
  if (hit != null) return hit;
  const p = newProfile(1), rng = makeRng(level * 31 + 7);
  p.level = level;
  const pts = (level - 1) * 3;
  p.attrs.forca = Math.ceil(pts / 2); p.attrs.vitalidade = Math.floor(pts / 2);
  const plus = Math.min(4, Math.floor(level / 2));
  const set = (slot: 'arma' | 'mao' | 'cabeca' | 'peito' | 'maos' | 'pes', type: Parameters<typeof makeItem>[4]) => {
    const it = makeItem(1, rng, level, level > 1 ? 1 : 0, type);
    it.affixes = []; it.plus = plus;
    p.equipped[slot] = it;
  };
  set('arma', 'facao'); set('cabeca', 'chapeu'); set('peito', 'gibao');
  if (level >= 2) { set('mao', 'escudo'); set('maos', 'luvas'); set('pes', 'alpercatas'); }
  const v = powerOf(deriveStats(p));
  recommendedCache.set(level, v);
  return v;
}

export function companionName(id: CompanionId | null): string {
  return id ? COMPANIONS[id].name : 'Nenhum';
}
