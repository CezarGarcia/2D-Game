/**
 * Transforma o perfil (nível, atributos, talentos, equipamento, companheiro) e as bênçãos da fase
 * nos números que o combate usa. Fórmulas de docs/gdd/02-personagem-e-talentos.md.
 */
import { COMPANIONS, MAX_POTIONS, POTION_HEAL, blessingCounts, type BlessingId, type CompanionId, type ElementId, type SpellId } from '../data/content';
import { ITEM_TYPES, SLOTS, baseValue, makeItem, type AffixKey, type Item, type WeaponKind } from '../data/items';
import { makeRng } from '../data/rng';
import { ATTRS, ATTR_BASE, addTalent, newProfile, spellLevel, type AttrKey, type Profile } from './profile';

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
  /** Multiplicador do dano recebido, depois da defesa. */
  damageTaken: number;
  moveSpeed: number;
  dodgeCooldown: number; dodgeDistance: number; dodgeCharges: number;
  spellPower: number; spellCrit: number; spellCritMult: number;
  cooldownMult: number; manaCostMult: number; spellArea: number;
  poisonMult: number; durationMult: number;
  /** Chance de o feitiço não gastar mana, e de não entrar em recarga. */
  freeCast: number; echo: number;
  reactionMult: number;
  res: Record<ElementId, number>;
  lifesteal: number; thorns: number;
  /** Fração da vida recuperada por segundo. */
  regen: number;
  healMult: number;
  goldMult: number; xpMult: number; luck: number;
  eliteDamage: number; thirdHitMult: number; reachMult: number;
  comboWide: boolean; ignoreArmor: boolean;
  doubleArrow: boolean; projectiles: number; pierce: boolean;
  perfectBonus: number; perfectWindow: number; critHaste: boolean;
  manaPerHitMult: number; manaOnKill: number; manaOnElite: boolean;
  revives: number; potions: number; potionHeal: number;
  altarChoices: number;
  companion: CompanionId | null;
  companionMult: number; petCooldownMult: number; petFastRevive: boolean; petDouble: boolean;
  loadout: (SpellId | null)[];
  /** Nível do feitiço em cada espaço. */
  spellLevels: number[];
  supremo: ElementId | null;
  onHitPoison: boolean; onKillExplode: boolean; firstHitShield: boolean;
  /** Quantas bênçãos Ouriço: dispara espinhos em volta a cada 4 s. */
  nova: number;
  talents: {
    sedeDeBriga: boolean; execucao: boolean; contragolpe: boolean; cascaDeJabuti: boolean;
    rolamentoCortante: boolean; sangueQuente: boolean;
  };
  uniques: {
    mandibulaDaRainha: boolean; presaDaCaipora: boolean; coroaDeCipo: boolean;
    ferraoDeArraia: boolean; denteDoBoto: boolean; escamaDaIara: boolean;
  };
}

export const BASE_MOVE_SPEED = 250;
export const BASE_DODGE_COOLDOWN = 1.2;
export const BASE_PERFECT_WINDOW = 0.2;

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

export function totalAttrs(p: Profile, blessings: BlessingId[] = []): Record<AttrKey, number> {
  const a = affixSums(activeItems(p)), t = p.talents, b = blessingCounts(blessings);
  const root: Record<AttrKey, string> = { forca: 'raizForca', agilidade: 'raizAgilidade', inteligencia: 'raizInteligencia', vitalidade: 'raizVitalidade', espirito: 'raizEspirito', sorte: 'raizSorte' };
  const out = {} as Record<AttrKey, number>;
  for (const { key } of ATTRS) out[key] = ATTR_BASE + p.attrs[key] + (a[key] || 0) + (t[root[key]] ? 3 : 0);
  if (t.eloSorteInteligencia) { out.sorte += 2; out.inteligencia += 2; }
  if (t.eloAgilidadeSorte) { out.agilidade += 2; out.sorte += 2; }
  out.forca += 6 * (b.forca ?? 0); out.agilidade += 6 * (b.agilidade ?? 0); out.inteligencia += 6 * (b.inteligencia ?? 0);
  return out;
}

export function deriveStats(p: Profile, blessings: BlessingId[] = []): HeroStats {
  const items = activeItems(p), a = affixSums(items), t = p.talents, attrs = totalAttrs(p, blessings), bc = blessingCounts(blessings);
  const rank = (id: string) => t[id] || 0;
  const bl = (b: BlessingId) => bc[b] ?? 0;
  const weaponItem = p.equipped.arma;
  const weapon: WeaponKind = weaponItem && weaponItem.type === 'arco' ? 'arco' : 'facao';
  const bow = weapon === 'arco';
  const chest = p.equipped.peito?.type;
  const hasShield = !bow && p.equipped.mao?.type === 'escudo';
  const quiver = bow && p.equipped.mao?.type === 'aljava';
  const companion = p.companion && p.companions[p.companion] ? p.companion : null;
  const pct = (k: AffixKey) => (a[k] || 0) / 100;
  const uniq = (key: string) => items.some((i) => i.unique === key);

  const mainAttr = bow ? attrs.agilidade : attrs.forca;
  const damageMult = (1 + 0.012 * mainAttr)
    * (1 + pct('dano') + 0.03 * rank('maoPesada') + (rank('eloForcaVitalidade') ? 0.02 : 0) + 0.02 * rank('joiaGuerreiro') + 0.02 * rank('joiaCacador')
      + (quiver ? 0.08 : 0) + (bow ? 0.03 * rank('flechaCerteira') : 0) + 0.15 * bl('furia'));

  let defense = 0.2 * attrs.vitalidade;
  for (const it of items) if (ITEM_TYPES[it.type].base === 'defesa') defense += baseValue(it);
  defense *= 1 + pct('defesa') + 0.03 * rank('couroCurtido');

  const hpFlat = 190 + 10 * p.level + 12 * attrs.vitalidade + (a.vida || 0) + (rank('eloForcaVitalidade') ? 15 : 0) + (rank('eloVitalidadeEspirito') ? 10 : 0);
  const maxHp = Math.round(hpFlat * (1 + 0.04 * rank('folego') + 0.02 * rank('joiaGuerreiro') + 0.02 * rank('joiaMonge') + (companion === 'capivara' ? 0.08 : 0) + 0.2 * bl('vigor')));
  const manaFlat = 60 + 3 * attrs.espirito + (a.mana || 0) + (rank('eloVitalidadeEspirito') ? 6 : 0) + (rank('eloInteligenciaEspirito') ? 6 : 0);
  const maxMana = Math.round(manaFlat * (1 + 0.05 * rank('fonte') + 0.03 * rank('joiaMonge') + 0.03 * rank('joiaRezador') + (chest === 'manto' ? 0.2 : 0)));

  const cooldownCut = Math.min(0.4, 0.005 * attrs.espirito + pct('recarga') + 0.03 * rank('pressa') + (chest === 'manto' ? 0.1 : 0));
  const haste = rank('eloAgilidadeForca') ? 0.02 : 0;
  const resAll = 0.04 * rank('peleGrossa');

  return {
    level: p.level, attrs, maxHp, maxMana,
    manaRegen: (2 + 0.04 * attrs.espirito) * (1 + 0.12 * rank('menteCalma')),
    weapon, hasShield,
    weaponDamage: weaponItem ? baseValue(weaponItem) : 6,
    damageMult,
    attackSpeed: 1 + 0.004 * attrs.agilidade + pct('velAtaque') + haste + 0.02 * rank('maosRapidas') + 0.01 * rank('joiaCacador') + 0.12 * bl('pressa'),
    critChance: Math.min(0.85, 0.05 + 0.0015 * attrs.agilidade + pct('critico') + 0.02 * rank('golpeCerteiro') + 0.01 * rank('joiaMalandro')
      + (chest === 'gibao' ? 0.03 : 0) + (companion === 'onca' ? 0.05 : 0) + 0.1 * bl('olho')),
    critMult: 1.5 + pct('danoCritico') + 0.06 * rank('brutalidade') + 0.35 * bl('ferocidade'),
    defense: Math.round(defense * 10) / 10,
    damageTaken: Math.pow(0.88, bl('couro')),
    moveSpeed: BASE_MOVE_SPEED * (1 + 0.02 * rank('peLigeiro') + haste + 0.12 * bl('vento') + (uniq('escamaDaIara') ? 0.12 : 0)),
    dodgeCooldown: BASE_DODGE_COOLDOWN * (1 - 0.04 * rank('reflexo')) * Math.pow(0.75, bl('passo')),
    dodgeDistance: chest === 'couraca' ? 0.8 : 1,
    dodgeCharges: 1 + (rank('segundaEsquiva') ? 1 : 0) + bl('folego'),
    spellPower: (1 + 0.012 * attrs.inteligencia)
      * (1 + pct('danoNatureza') + 0.03 * rank('palavraForte') + (rank('eloInteligenciaEspirito') ? 0.03 : 0) + 0.02 * rank('joiaRezador') + (rank('arquimago') ? 0.25 : 0) + 0.2 * bl('mandinga')),
    spellCrit: 0.05 + 0.02 * rank('foco'),
    spellCritMult: rank('sobrecarga') ? 2.5 : 1.5,
    cooldownMult: (1 - cooldownCut) * (rank('fluxo') ? 0.85 : 1) * Math.pow(0.8, bl('ligeireza')),
    manaCostMult: (rank('arquimago') ? 0.8 : 1) * Math.pow(0.7, bl('fonte')),
    spellArea: 1 + 0.05 * rank('alcanceMagico') + 0.25 * bl('gigante'),
    poisonMult: 1 + 0.1 * rank('venenoForte'),
    durationMult: 1 + 0.06 * rank('duracao'),
    freeCast: rank('fluxo') ? 0.25 : 0,
    echo: rank('eco') ? 0.2 : 0,
    reactionMult: rank('catalisador') ? 1.4 : 1,
    res: { natureza: Math.min(0.75, pct('resNatureza') + resAll), agua: Math.min(0.75, resAll) },
    lifesteal: pct('rouboVida') + 0.04 * bl('sanguessuga'),
    thorns: (rank('espinhoVivo') ? 0.25 : 0) + 0.35 * bl('espinhos'),
    regen: 0.0015 * rank('sangueBom') + 0.01 * bl('seiva'),
    healMult: 1 + 0.06 * rank('curaMaior'),
    goldMult: 1 + pct('ouro') + 0.002 * attrs.sorte + 0.03 * rank('olhoVivo') + 0.02 * rank('joiaCurioso') + 0.02 * rank('joiaMalandro') + (companion === 'arara' ? 0.1 : 0),
    xpMult: 1 + 0.04 * rank('sabedoria') + 0.02 * rank('joiaCurioso'),
    luck: attrs.sorte + 4 * rank('boaEstrela'),
    eliteDamage: 1 + 0.05 * rank('quebraCasca'),
    thirdHitMult: 1 + 0.06 * rank('pesoDoGolpe'),
    reachMult: 1 + 0.25 * bl('gigante'),
    comboWide: !!rank('golpeLargo'), ignoreArmor: !!rank('arrombar'),
    doubleArrow: !!rank('flechaDupla'), projectiles: bl('projetil'), pierce: bl('perfurar') > 0,
    perfectBonus: rank('contraAtaque') ? 2.5 : 1.5,
    perfectWindow: BASE_PERFECT_WINDOW * (1 + 0.08 * rank('olhoAberto')),
    critHaste: !!rank('olhoDeOnca'),
    manaPerHitMult: rank('mare') ? 2 : 1, manaOnKill: rank('sopro') ? 6 : 0, manaOnElite: !!rank('pocoFundo'),
    revives: 1 + (rank('segundoFolego') ? 1 : 0),
    potions: Math.min(p.potions, MAX_POTIONS + (rank('cantilCheio') ? 1 : 0)),
    potionHeal: POTION_HEAL + 0.06 * rank('pocaoForte'),
    altarChoices: 3 + (rank('bencaoFarta') ? 1 : 0),
    companion,
    companionMult: 1 + 0.05 * rank('bomTrato') + 0.5 * bl('parceria'),
    petCooldownMult: 1 - 0.05 * rank('faro'),
    petFastRevive: !!rank('seteVidas'), petDouble: !!rank('ataqueCombinado'),
    loadout: p.loadout.slice(0, 3),
    spellLevels: p.loadout.slice(0, 3).map((id) => (id ? spellLevel(p, id) : 1)),
    supremo: p.supremo && p.supremos.includes(p.supremo) ? p.supremo : null,
    onHitPoison: bl('peconha') > 0, onKillExplode: bl('estouro') > 0, firstHitShield: bl('amparo') > 0,
    nova: bl('ourico'),
    talents: {
      sedeDeBriga: !!rank('sedeDeBriga'), execucao: !!rank('execucao'), contragolpe: !!rank('contragolpe'),
      cascaDeJabuti: !!rank('cascaDeJabuti'), rolamentoCortante: !!rank('rolamentoCortante'), sangueQuente: !!rank('sangueQuente'),
    },
    uniques: {
      mandibulaDaRainha: uniq('mandibulaDaRainha'), presaDaCaipora: uniq('presaDaCaipora'), coroaDeCipo: uniq('coroaDeCipo'),
      ferraoDeArraia: uniq('ferraoDeArraia'), denteDoBoto: uniq('denteDoBoto'), escamaDaIara: uniq('escamaDaIara'),
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
  const ehp = s.maxHp / ((1 - damageReduction(s.defense, s.level)) * s.damageTaken);
  return Math.round(dps * 6 + ehp * 0.5);
}

/** O que cada atributo está rendendo agora, em linhas curtas com os números do herói. */
export function attrEffects(p: Profile): Record<AttrKey, string[]> {
  const a = totalAttrs(p), n = (v: number, d = 0) => v.toFixed(d).replace('.', ',');
  return {
    forca: [`+${n(a.forca * 1.2)}% de dano com facão`],
    agilidade: [`+${n(a.agilidade * 1.2)}% de dano com arco`, `+${n(a.agilidade * 0.4, 1)}% de velocidade de ataque`, `+${n(a.agilidade * 0.15, 1)}% de crítico`],
    inteligencia: [`+${n(a.inteligencia * 1.2)}% de poder dos feitiços`],
    vitalidade: [`+${n(a.vitalidade * 12)} de vida`, `+${n(a.vitalidade * 0.2, 1)} de defesa`],
    espirito: [`+${n(a.espirito * 3)} de mana`, `Feitiços ${n(Math.min(40, a.espirito * 0.5), 1)}% mais rápidos`],
    sorte: [`+${n(a.sorte * 0.3, 1)}% de chance de raridade maior`, `+${n(a.sorte * 0.2, 1)}% de ouro`],
  };
}

const recommendedCache = new Map<number, number>();

/**
 * Poder de um personagem de referência no nível da fase: pontos divididos entre Força e
 * Vitalidade, itens Incomuns do nível levemente aprimorados e um ponto de talento por nível.
 * As fases são calibradas para ele passar apertado; abaixo disso, é preciso evoluir antes.
 */
export function recommendedPower(level: number): number {
  const hit = recommendedCache.get(level);
  if (hit != null) return hit;
  const v = powerOf(deriveStats(referenceProfile(level)));
  recommendedCache.set(level, v);
  return v;
}

const REFERENCE_TALENTS = [
  'raizForca', 'maoPesada', 'maoPesada', 'maoPesada', 'sedeDeBriga', 'golpeCerteiro', 'golpeCerteiro', 'golpeCerteiro',
  'raizVitalidade', 'couroCurtido', 'couroCurtido', 'couroCurtido', 'contragolpe', 'folego', 'folego', 'folego', 'execucao',
  'brutalidade', 'brutalidade', 'brutalidade', 'maoPesada', 'maoPesada', 'folego', 'folego', 'couroCurtido', 'couroCurtido',
];

/** O personagem de referência usado para calibrar as fases: é dele o "poder recomendado". */
export function referenceProfile(level: number, bow = false): Profile {
  const p = newProfile(1), rng = makeRng(level * 31 + 7);
  p.level = level;
  const pts = (level - 1) * 3;
  if (bow) p.attrs.agilidade = Math.ceil(pts / 2); else p.attrs.forca = Math.ceil(pts / 2);
  p.attrs.vitalidade = Math.floor(pts / 2);
  const plus = Math.min(4, Math.floor(level / 2));
  const set = (slot: 'arma' | 'mao' | 'cabeca' | 'peito' | 'maos' | 'pes', type: Parameters<typeof makeItem>[4]) => {
    const it = makeItem(p.nextItemId++, rng, level, level > 1 ? 1 : 0, type);
    it.affixes = []; it.plus = plus;
    p.equipped[slot] = it;
  };
  set('arma', bow ? 'arco' : 'facao'); set('cabeca', 'chapeu'); set('peito', 'gibao');
  if (level >= 2) { set('mao', bow ? 'aljava' : 'escudo'); set('maos', 'luvas'); set('pes', 'alpercatas'); }
  /* talentos: um ponto por nível, num caminho simples de dano e vida */
  p.talentPoints = level - 1;
  for (const t of REFERENCE_TALENTS) addTalent(p, t);
  p.loadout = ['dardo', level >= 3 ? 'sementes' : null, level >= 4 ? 'cipo' : null];
  if (level >= 4) { p.companions.capivara = { level: 1 }; p.companion = 'capivara'; }
  if (level >= 12) { p.supremos = ['natureza']; p.supremo = 'natureza'; }
  return p;
}

export function companionName(id: CompanionId | null): string {
  return id ? COMPANIONS[id].name : 'Nenhum';
}
