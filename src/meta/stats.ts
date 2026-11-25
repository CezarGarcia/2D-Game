/**
 * Transforma o perfil (nível, atributos, talentos, equipamento, companheiro) e as bênçãos da fase
 * nos números que o combate usa. Fórmulas de docs/gdd/02-personagem-e-talentos.md.
 */
import type { AmuletId } from '../data/amulets';
import { ASPECTS, type AspectId } from '../data/aspects';
import { knowledgeMap } from './life';
import { COMPANIONS, ELEMENT_ORDER, MAX_POTIONS, MAX_SPELL_LEVEL, POTION_HEAL, blessingCounts, patronCounts, patronTier, type BlessingId, type CompanionId, type ElementId, type SpellId } from '../data/content';
import { BEATEN_BY, PACT_COST, GEM_RESIST, GEM_STATUS_CHANCE, GEM_WEAPON_DAMAGE, ITEM_TYPES, SLOTS, baseValue, makeItem, type AffixKey, type Item, type ItemType, type WeaponKind } from '../data/items';
import { makeRng } from '../data/rng';
import { ATTRS, ATTR_BASE, addTalent, newProfile, spellLevel, type AttrKey, type Profile } from './profile';

export interface HeroStats {
  level: number;
  /** Aspecto da arma em uso (src/data/aspects.ts), ou nulo no jeito padrão. */
  aspect: AspectId | null;
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
  /** Afinidades (docs/gdd/11): Faro aumenta o bônus contra quem é fraco ao elemento; Teimosia diminui o castigo contra quem resiste. */
  faro: number; teimosia: number;
  /** Elemento dos golpes de arma (Aspecto de elemento ou Garrafada de têmpera), ou nulo: golpe sem elemento. */
  weaponEl: ElementId | null;
  /** A Casca dos monstros se gasta este tanto mais rápido; dano a mais em quem está Exposto; e um elemento a que todo monstro passa a ser fraco. */
  shellBreak: number; exposeBonus: number; extraWeak: ElementId | null;
  /** Dano extra por elemento (feitiços e golpes com aquele elemento). */
  elemDamage: Record<ElementId, number>;
  /** Gema da arma: aplica o efeito do elemento com esta chance a cada golpe. */
  weaponGem: { el: ElementId; chance: number } | null;
  /** Peças equipadas de cada conjunto. */
  sets: Record<string, number>;
  /** Duração dos efeitos de elemento nos inimigos. */
  statusDuration: number;
  /** Velocidade de carga do Supremo. */
  supremoRate: number;
  /** Bônus por companheiro passivo e conjunto (flags de efeito na simulação). */
  passives: {
    rootedBonus: number; bossDamage: number; wetBonus: number; armoredBonus: number;
    perfectNova: boolean; perfectWave: boolean; perfectWhirl: boolean; dodgeDust: boolean;
    critBurn: boolean; burnExplode: boolean; quake: boolean; killHeal: number; frenzy: boolean; reactionBonus: number;
  };
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
  /** Efeitos de bênçãos, Despertares, Compadrios e sinergias de padrinho que mudam regras (lidos pela simulação). */
  bless: BlessEffects;
  /** Bênçãos de cada padrinho (com o companheiro) e a faixa de sinergia acesa, de 0 a 3. */
  patrons: Record<ElementId, number>;
  patronTiers: Record<ElementId, number>;
  /** Conhecer o inimigo: dano a mais contra cada tipo de monstro já muito enfrentado (não vale com ranking). */
  knowledge: Partial<Record<string, number>>;
  talents: {
    sedeDeBriga: boolean; execucao: boolean; contragolpe: boolean; cascaDeJabuti: boolean;
    rolamentoCortante: boolean; sangueQuente: boolean;
  };
  uniques: {
    mandibulaDaRainha: boolean; presaDaCaipora: boolean; coroaDeCipo: boolean;
    ferraoDeArraia: boolean; denteDoBoto: boolean; escamaDaIara: boolean;
    maoDoCorpoSeco: boolean; alpercatasDoRedemoinho: boolean; cachimboDoSaci: boolean; crinaDaMula: boolean; olhoDoBoitata: boolean;
    couroDoCapelobo: boolean; garraDoMapinguari: boolean; pedraDaTeiniagua: boolean; denteDoLobisomem: boolean; toucaDaPisadeira: boolean;
    colherDaCuca: boolean; fioDoEsquecimento: boolean;
  };
}

export interface BlessEffects {
  /** Golpes de arma aplicam o elemento com esta chance (somada por elemento). */
  hitElements: { el: ElementId; chance: number }[];
  /** Chance de um golpe de arma prender, por quanto tempo, e se também envenena. */
  rootChance: number; rootDur: number; rootPoison: boolean;
  /** Dano a mais contra presos, lentos ou envenenados; contra quem tem menos de 30% de vida; contra quem queima; e o extra do Rachado. */
  mataViva: number; lowHpBonus: number; burnBonus: number; crackBonus: number;
  /** Dano a mais dos feitiços em quem tem algum efeito de elemento. */
  spellStatusBonus: number;
  /** O primeiro golpe em cada inimigo o deixa encantado por este tempo (segundos). */
  firstHitCharm: number;
  /** Correr na luta deixa fogo no chão. */
  fireTrail: boolean;
  /** Um tremor a cada tantos golpes de arma (0 = nunca). */
  quakeHits: number;
  /** Ouriço: intervalo dos espinhos, multiplicador de dano e se atravessam. */
  novaEvery: number; novaMult: number; novaPierce: boolean;
  /** Quem acerta o herói de perto fica preso por este tempo. */
  thornRoot: number;
  /** Fração a menos de dano recebido abaixo de 35% de vida. */
  lowHpGuard: number;
  /** Esquiva: redemoinho, próximo golpe crítico, ataques mais rápidos por 3 s (fração), sósia. */
  dodgeWhirl: boolean; dodgeCrit: boolean; dodgeHaste: number; dodgeDecoy: boolean;
  /** Críticos de arma: amaldiçoam, curam esta fração da vida, espantam os confusos. */
  critCurse: boolean; critHeal: number; critFear: boolean;
  /** Último golpe da sequência e golpe carregado: racham o inimigo, deixam fogo no chão. */
  lastCrack: boolean; lastFire: boolean;
  /** Derrotar quem queima devolve mana e vida; cada abate acelera o herói por um tempo. */
  killBurn: boolean; killHaste: boolean;
  /** Golpes não empurram nem interrompem o herói. */
  steadfast: boolean;
  /** Dano de arma a mais com mais de 80% da vida. */
  fullHpDamage: number;
  /** Fração a menos de dano vindo de inimigos envenenados, presos, lentos ou cegos. */
  safeFrom: number;
  /** Uma vez por sala, ao cair abaixo de 30% de vida, cura esta fração. */
  secondWind: number;
  /** Poção prende e envenena em volta; o Vapor fere; confusos e encantados ficam lentos; presos ficam rachados. */
  potionRoot: boolean; vaporBurn: boolean; charmSlow: boolean; rootCrack: boolean;
  /** Amuletos: dano a mais em quem está com mais de 90% de vida; chance de o abate explodir; uma onda que empurra a cada tantos abates (0 = nunca). */
  fullFoeBonus: number; killExplodeChance: number; killPushEvery: number;
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

/** Peças equipadas de cada conjunto. */
export function setCounts(items: Item[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) if (it.set) out[it.set] = (out[it.set] ?? 0) + 1;
  return out;
}

export function totalAttrs(p: Profile, blessings: BlessingId[] = []): Record<AttrKey, number> {
  const items = activeItems(p), a = affixSums(items), t = p.talents, b = blessingCounts(blessings);
  const root: Record<AttrKey, string> = { forca: 'raizForca', agilidade: 'raizAgilidade', inteligencia: 'raizInteligencia', vitalidade: 'raizVitalidade', espirito: 'raizEspirito', sorte: 'raizSorte' };
  const out = {} as Record<AttrKey, number>;
  for (const { key } of ATTRS) out[key] = ATTR_BASE + p.attrs[key] + (a[key] || 0) + (t[root[key]] ? 3 : 0);
  if (t.eloSorteInteligencia) { out.sorte += 2; out.inteligencia += 2; }
  if (t.eloAgilidadeSorte) { out.agilidade += 2; out.sorte += 2; }
  out.forca += 6 * (b.forca ?? 0); out.agilidade += 6 * (b.agilidade ?? 0); out.inteligencia += 6 * (b.inteligencia ?? 0);
  if ((setCounts(items).lembranca ?? 0) >= 2) for (const { key } of ATTRS) out[key] += 4;
  if (p.companion === 'mico' && p.companions.mico) out.sorte += 15;
  return out;
}

/** O que os Cordéis da noite somam ao herói (só o Sonho tem). */
export interface StatBoost {
  hp?: number; damage?: number; cooldown?: number; crit?: number; potions?: number;
  /** Garrafadas: resistência a mais por elemento, e o elemento que os golpes de arma ganham. */
  res?: Partial<Record<ElementId, number>>; weaponEl?: ElementId | null;
}

/** Amuletos da fase 4 e Cordéis: entram por cima dos números prontos, para não espalhar mais termos nas fórmulas. */
function nightExtras(s: HeroStats, amulets: AmuletId[], boost: StatBoost): void {
  const am = (a: AmuletId) => amulets.includes(a);
  if (am('terco')) s.spellPower *= 1.15;
  if (am('alpercata')) s.dodgeCooldown *= 0.8;
  if (am('cuia')) s.potionHeal *= 1.3;
  if (am('fumoDeRolo')) s.eliteDamage += 0.2;
  if (am('bentinho')) for (const el of ELEMENT_ORDER) s.res[el] = Math.min(0.75, s.res[el] + 0.1);
  if (am('pedraDeRaio')) s.bless.hitElements.push({ el: 'tempestade', chance: 0.15 });
  if (am('berrante')) s.companionMult *= 1.4;
  if (am('lamparina')) s.altarChoices += 1;
  if (am('rosario')) s.regen += 0.01;
  if (am('gibaoVelho')) s.thorns += 0.4;
  if (am('tamborim')) s.supremoRate *= 1.5;
  if (am('caldeiraoDaCuca')) s.echo = Math.min(0.7, s.echo + 0.25);
  if (am('dadoViciado')) s.damageTaken *= 1.25;
  if (am('espelhoQuebrado')) { s.critChance = Math.min(0.85, s.critChance + 0.3); s.maxHp = Math.round(s.maxHp * 0.75); }
  if (boost.hp) s.maxHp = Math.round(s.maxHp * (1 + boost.hp));
  if (boost.damage) { s.damageMult *= 1 + boost.damage; s.spellPower *= 1 + boost.damage; }
  if (boost.cooldown) s.cooldownMult *= 1 - boost.cooldown;
  if (boost.crit) s.critChance = Math.min(0.85, s.critChance + boost.crit);
  if (boost.potions) s.potions += boost.potions;
  /* afinidades: amuletos e Garrafadas */
  if (am('lenteDeGarimpeiro')) s.faro += 0.3;
  if (am('pedraDeAmolar')) s.teimosia += 0.35;
  if (am('marreta')) s.shellBreak *= 1.6;
  if (am('cristalDeRocha')) s.exposeBonus += 0.3;
  if (am('olhoDeVidro')) s.extraWeak = s.supremo;
  if (boost.res) for (const el of ELEMENT_ORDER) if (boost.res[el]) s.res[el] = Math.max(-0.5, Math.min(0.75, s.res[el] + boost.res[el]!));
  if (boost.weaponEl) s.weaponEl = boost.weaponEl;
}

/** Números de combate do herói. `blessings` são as bênçãos da fase; `amulets` e `boost`, os amuletos e os Cordéis da noite (só o Sonho tem). */
export function deriveStats(p: Profile, blessings: BlessingId[] = [], amulets: AmuletId[] = [], boost: StatBoost = {}): HeroStats {
  const items = activeItems(p), a = affixSums(items), t = p.talents, attrs = totalAttrs(p, blessings), bc = blessingCounts(blessings);
  const rank = (id: string) => t[id] || 0;
  const bl = (b: BlessingId) => bc[b] ?? 0;
  const weaponItem = p.equipped.arma;
  const weapon: WeaponKind = weaponItem && ['arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'].includes(weaponItem.type) ? weaponItem.type as WeaponKind : 'facao';
  const bow = weapon === 'arco';
  const sets = setCounts(items), set = (k: string, n: number) => (sets[k] ?? 0) >= n;
  const pet = (id: CompanionId) => companion === id;
  const chest = p.equipped.peito?.type;
  const hasShield = weapon === 'facao' && p.equipped.mao?.type === 'escudo';
  const quiver = bow && p.equipped.mao?.type === 'aljava';
  const companion = p.companion && p.companions[p.companion] ? p.companion : null;
  const pct = (k: AffixKey) => (a[k] || 0) / 100;
  const uniq = (key: string) => items.some((i) => i.unique === key);

  /* sinergia de padrinho: quantas bênçãos de cada um (o companheiro do mesmo elemento conta) e a faixa acesa */
  const patrons = patronCounts(blessings, companion ? COMPANIONS[companion].element : null);
  const patronTiers = {} as Record<ElementId, number>;
  for (const el of ELEMENT_ORDER) patronTiers[el] = patronTier(patrons[el]);
  const syn = (el: ElementId, n: number) => patronTiers[el] >= n;
  const has = (b: BlessingId) => bl(b) > 0;
  const am = (a: AmuletId) => amulets.includes(a);
  const hitElements: BlessEffects['hitElements'] = [];
  const hitEl = (el: ElementId, chance: number) => { if (chance > 0) hitElements.push({ el, chance: Math.min(1, chance) }); };
  hitEl('agua', 0.2 * bl('aguaBenta') + 0.3 * bl('enxurrada'));
  hitEl('tempestade', 0.2 * bl('corisco'));
  hitEl('fogo', has('furiaDoBoitata') ? 1 : 0.2 * bl('ticao'));
  hitEl('terra', 0.2 * bl('rachadura'));
  hitEl('sombra', 0.2 * bl('mordida'));
  hitEl('encanto', 0.2 * bl('quebranto'));
  const bless: BlessEffects = {
    hitElements,
    rootChance: (uniq('ferraoDeArraia') ? 0.15 : 0) + 0.12 * bl('cipoal') + 0.16 * bl('lacoCerteiro'), rootDur: has('cipoalFechado') ? 2 : 1, rootPoison: has('cipoalFechado'),
    mataViva: 0.25 * bl('mataViva'), lowHpBonus: 0.25 * bl('faro'), burnBonus: 0.15 * bl('lenha'), crackBonus: syn('terra', 2) ? 0.15 : 0,
    spellStatusBonus: 0.35 * bl('rezaBrava'),
    firstHitCharm: has('canto') ? 1.5 : 0,
    fireTrail: has('rastro'),
    quakeHits: set('seringueiro', 6) ? (has('pisada') ? 6 : 10) : has('pisada') ? 8 : 0,
    novaEvery: has('ouricoCacheiro') ? 2 : 4, novaMult: has('espinhoComprido') ? 1.6 : 1, novaPierce: has('espinhoComprido'),
    thornRoot: has('mandacaru') ? 1.5 : 0,
    lowHpGuard: has('sangueFrio') ? 0.3 : 0,
    dodgeWhirl: has('vendaval'), dodgeCrit: has('sumico'), dodgeHaste: syn('tempestade', 3) ? 0.4 : 0, dodgeDecoy: has('molecagem'),
    critCurse: has('olhoDeLobo'), critHeal: syn('sombra', 3) ? 0.01 : 0, critFear: has('pesadelo'),
    lastCrack: has('maoDePedra'), lastFire: has('magma'),
    killBurn: has('cinzas'), killHaste: has('luaVentosa'),
    steadfast: has('peFincado'),
    fullHpDamage: syn('terra', 3) ? 0.3 : 0,
    safeFrom: syn('natureza', 3) ? 0.25 : 0,
    secondWind: syn('agua', 3) ? 0.35 : 0,
    potionRoot: has('igarape'), vaporBurn: has('banhoMaria'), charmSlow: has('acalanto'), rootCrack: has('raizDePedra'),
    fullFoeBonus: am('carranca') ? 0.3 : 0, killExplodeChance: am('cabacaDePolvora') ? 0.1 : 0, killPushEvery: am('sanfona') ? 10 : 0,
  };

  const mainAttr = weapon === 'arco' || weapon === 'peixeiras' ? attrs.agilidade : weapon === 'zagaia' ? (attrs.forca + attrs.agilidade) * 0.55 : weapon === 'cajado' ? attrs.inteligencia : attrs.forca;
  const damageMult = (1 + 0.012 * mainAttr)
    * (1 + pct('dano') + 0.03 * rank('maoPesada') + (rank('eloForcaVitalidade') ? 0.02 : 0) + 0.02 * rank('joiaGuerreiro') + 0.02 * rank('joiaCacador')
      + (quiver ? 0.08 : 0) + (bow ? 0.03 * rank('flechaCerteira') : 0) + 0.15 * bl('furia') + 0.08 * bl('chama') + 0.6 * bl('furiaCega') + 0.25 * bl('ferroEmBrasa') + (am('figaTorta') ? 0.4 : 0) + (set('tropeiro', 2) ? 0.08 : 0) + (pet('tamandua') ? 0.06 : 0));

  let defense = 0.2 * attrs.vitalidade;
  for (const it of items) if (ITEM_TYPES[it.type].base === 'defesa') defense += baseValue(it);
  defense *= 1 + pct('defesa') + 0.03 * rank('couroCurtido') + (set('seringueiro', 2) ? 0.12 : 0) + (set('sentinela', 4) ? 0.1 : 0) + (pet('tatu') ? 0.08 : 0);

  const hpFlat = 190 + 10 * p.level + 12 * attrs.vitalidade + (a.vida || 0) + (rank('eloForcaVitalidade') ? 15 : 0) + (rank('eloVitalidadeEspirito') ? 10 : 0);
  const maxHp = Math.round(hpFlat * (1 + 0.04 * rank('folego') + 0.02 * rank('joiaGuerreiro') + 0.02 * rank('joiaMonge') + (companion === 'capivara' ? 0.08 : 0) + 0.2 * bl('vigor') + 0.25 * bl('aguaFunda') + (am('patua') ? 0.15 : 0)
    + (set('mateiro', 2) ? 0.08 : 0) + (set('sentinela', 2) ? 0.1 : 0)));
  const manaFlat = 60 + 3 * attrs.espirito + (a.mana || 0) + (rank('eloVitalidadeEspirito') ? 6 : 0) + (rank('eloInteligenciaEspirito') ? 6 : 0);
  const maxMana = Math.round(manaFlat * (1 + 0.05 * rank('fonte') + 0.03 * rank('joiaMonge') + 0.03 * rank('joiaRezador') + (chest === 'manto' ? 0.2 : 0) + (set('ribeirinho', 2) ? 0.12 : 0)));

  const cooldownCut = Math.min(0.4, 0.005 * attrs.espirito + pct('recarga') + 0.03 * rank('pressa') + (chest === 'manto' ? 0.1 : 0));
  const haste = rank('eloAgilidadeForca') ? 0.02 : 0;
  const resAll = 0.04 * rank('peleGrossa') + pct('resTudo') + (set('lembranca', 4) ? 0.15 : 0);
  const res = {} as Record<ElementId, number>, elemDamage = {} as Record<ElementId, number>;
  for (const el of ELEMENT_ORDER) { res[el] = resAll; elemDamage[el] = 0; }
  /* afixos de elemento: resistência, dano, e o item com preço (dano de um elemento em troca de resistência ao que o vence) */
  for (const it of items) for (const af of it.affixes) {
    const el = af.el ?? 'natureza';
    if (af.k === 'resNatureza') res[el] += af.v / 100;
    else if (af.k === 'danoNatureza') elemDamage[el] += af.v / 100;
    else if (af.k === 'pacto') { elemDamage[el] += af.v / 100; res[BEATEN_BY[el]] -= Math.round(af.v * PACT_COST) / 100; }
  }
  if (uniq('olhoDoBoitata')) elemDamage.fogo += 0.3;
  if (syn('fogo', 1)) elemDamage.fogo += 0.2;
  let weaponGem: HeroStats['weaponGem'] = null;
  for (const it of items) {
    if (!it.gem) continue;
    if (ITEM_TYPES[it.type].group === 'arma') { elemDamage[it.gem.el] += GEM_WEAPON_DAMAGE[it.gem.lvl] / 100; weaponGem = { el: it.gem.el, chance: GEM_STATUS_CHANCE[it.gem.lvl] / 100 }; }
    else res[it.gem.el] += GEM_RESIST[it.gem.lvl] / 100;
  }
  /* de −50% (quem usa itens com preço) a 75% */
  for (const el of ELEMENT_ORDER) res[el] = Math.max(-0.5, Math.min(0.75, res[el]));
  const levelBonus = uniq('ecoDosSete') ? 1 : 0;

  const aspectId = p.aspects?.equipped?.[weapon as WeaponKind], aspect = aspectId && p.aspects.owned.includes(aspectId) && ASPECTS[aspectId]?.weapon === weapon ? aspectId : null;
  const out: HeroStats = {
    level: p.level, attrs, maxHp, maxMana,
    aspect,
    manaRegen: (2 + 0.04 * attrs.espirito) * (1 + 0.12 * rank('menteCalma') + (pet('vagalume') ? 0.25 : 0) + 0.3 * bl('remanso') + (am('contaDeLagrima') ? 0.25 : 0)),
    weapon, hasShield,
    weaponDamage: weaponItem ? baseValue(weaponItem) : 6,
    damageMult,
    attackSpeed: 1 + 0.004 * attrs.agilidade + pct('velAtaque') + haste + 0.02 * rank('maosRapidas') + 0.01 * rank('joiaCacador') + 0.12 * bl('pressa') + 0.2 * bl('maoLeve') + 0.1 * bl('peDeMoleque') + (am('espora') ? 0.15 : 0)
      + (set('lunar', 2) ? 0.06 : 0) + (pet('carcara') ? 0.06 : 0),
    critChance: Math.min(0.85, 0.05 + 0.0015 * attrs.agilidade + pct('critico') + 0.02 * rank('golpeCerteiro') + 0.01 * rank('joiaMalandro')
      + (chest === 'gibao' ? 0.03 : 0) + (companion === 'onca' ? 0.05 : 0) + 0.1 * bl('olho') + 0.15 * bl('olhoDeLobo') + (syn('sombra', 1) ? 0.1 : 0) + (am('denteDeOnca') ? 0.1 : 0)),
    critMult: 1.5 + pct('danoCritico') + 0.06 * rank('brutalidade') + 0.35 * bl('ferocidade') + 0.6 * bl('golpeBaixo') + 0.2 * bl('ferroEmBrasa') + (syn('sombra', 3) ? 0.5 : 0),
    defense: Math.round(defense * 10) / 10,
    damageTaken: Math.pow(0.88, bl('couro')) * (has('cascaGrossa') ? 0.9 : 1) * (has('couroDeAnta') ? 0.85 : 1) * (has('furiaCega') ? 1.3 : 1) * (syn('terra', 1) ? 0.9 : 1) * (am('couroDeJacare') ? 0.88 : 1),
    moveSpeed: BASE_MOVE_SPEED * (1 + 0.02 * rank('peLigeiro') + haste + 0.12 * bl('vento') + 0.15 * bl('peDeMoleque') + (am('penaDeArara') ? 0.12 : 0) + (uniq('escamaDaIara') ? 0.12 : 0) + pct('movimento')
      + (set('vaqueiro', 2) ? 0.1 : 0) + (pet('loboguara') ? 0.06 : 0)),
    dodgeCooldown: BASE_DODGE_COOLDOWN * (1 - 0.04 * rank('reflexo')) * Math.pow(0.75, bl('passo')),
    dodgeDistance: chest === 'couraca' ? 0.8 : 1,
    dodgeCharges: 1 + (rank('segundaEsquiva') ? 1 : 0) + bl('folego') + bl('assobio') + (syn('tempestade', 1) ? 1 : 0),
    spellPower: (1 + 0.012 * attrs.inteligencia)
      * (1 + pct('danoFeitico') + 0.03 * rank('palavraForte') + (rank('eloInteligenciaEspirito') ? 0.03 : 0) + 0.02 * rank('joiaRezador') + (rank('arquimago') ? 0.25 : 0) + 0.2 * bl('mandinga') + 0.08 * bl('chama') + 0.25 * bl('labareda') + (am('figaTorta') ? 0.4 : 0)
        + (set('benzedeira', 2) ? 0.1 : 0) + (pet('coruja') ? 0.08 : 0)),
    spellCrit: 0.05 + 0.02 * rank('foco') + 0.1 * bl('olhoGordo'),
    spellCritMult: rank('sobrecarga') ? 2.5 : 1.5,
    cooldownMult: (1 - cooldownCut) * (rank('fluxo') ? 0.85 : 1) * Math.pow(0.8, bl('ligeireza')) * (has('rezaDaMeiaNoite') ? 0.75 : 1) * (weapon === 'cajado' ? 0.8 : 1) * (pet('tuiuiu') ? 0.92 : 1),
    manaCostMult: (rank('arquimago') ? 0.8 : 1) * Math.pow(0.7, bl('fonte')) * (syn('encanto', 1) ? 0.8 : 1) * (am('contaDeLagrima') ? 0.9 : 1),
    spellArea: 1 + 0.05 * rank('alcanceMagico') + 0.25 * bl('gigante') + 0.3 * bl('bracoDeGigante') + 0.15 * bl('labareda') + 0.4 * bl('feiticaria'),
    poisonMult: 1 + 0.1 * rank('venenoForte') + (syn('natureza', 1) ? 0.3 : 0),
    durationMult: 1 + 0.06 * rank('duracao'),
    freeCast: Math.min(0.7, Math.max(rank('fluxo') ? 0.25 : 0, uniq('fioDoEsquecimento') ? 0.3 : 0) + 0.15 * bl('caldeirao') + (syn('encanto', 3) ? 0.25 : 0)),
    echo: Math.min(0.7, Math.max(rank('eco') ? 0.2 : 0, uniq('fioDoEsquecimento') ? 0.3 : 0) + 0.2 * bl('gorro') + 0.25 * bl('ecoDaCuca') + (syn('encanto', 3) ? 0.25 : 0)),
    reactionMult: (rank('catalisador') ? 1.4 : 1) * (has('receita') ? 1.4 : 1) * (syn('encanto', 2) ? 1.4 : 1) * (am('chocalho') ? 1.3 : 1),
    res, elemDamage, weaponGem, sets,
    faro: pct('faro'), teimosia: pct('teimosia'),
    weaponEl: aspect ? ASPECTS[aspect].element : null, shellBreak: 1, exposeBonus: 0, extraWeak: null,
    statusDuration: (set('benzedeira', 4) ? 2 : 1) * (1 + 0.25 * bl('unha') + 0.6 * bl('brasaDormida')),
    supremoRate: set('lembranca', 6) ? 2 : 1,
    passives: {
      rootedBonus: pet('sucuri') ? 0.1 : 0, bossDamage: pet('jacarezinho') ? 0.1 : 0, wetBonus: (set('ribeirinho', 4) ? 0.15 : 0) + 0.2 * bl('remansoFundo'), armoredBonus: set('seringueiro', 4) ? 0.25 : 0,
      perfectNova: set('mateiro', 6) || syn('natureza', 2), perfectWave: set('ribeirinho', 6) || has('ondaMansa') || syn('agua', 2), perfectWhirl: set('vaqueiro', 6) || has('piao') || syn('tempestade', 2),
      dodgeDust: set('vaqueiro', 4) || has('pegadas'),
      critBurn: set('tropeiro', 4) || has('brasaViva') || syn('fogo', 2), burnExplode: set('tropeiro', 6) || has('fogoQueAnda') || syn('fogo', 3), quake: bless.quakeHits > 0,
      killHeal: (set('lunar', 4) ? 0.02 : 0) + 0.02 * bl('carniceiro') + (syn('sombra', 2) ? 0.03 : 0), frenzy: set('lunar', 6) || has('luaCheia'),
      reactionBonus: set('benzedeira', 6) ? 0.6 : 0,
    },
    lifesteal: pct('rouboVida') + 0.04 * bl('sanguessuga') + 0.06 * bl('chupaSangue'),
    thorns: (rank('espinhoVivo') ? 0.25 : 0) + 0.35 * bl('espinhos') + 0.7 * bl('cascaGrossa'),
    regen: 0.0015 * rank('sangueBom') + 0.01 * bl('seiva') + 0.015 * bl('aguaDeCheiro'),
    healMult: 1 + 0.06 * rank('curaMaior') + (pet('botinho') ? 0.1 : 0) + 0.15 * bl('mare') + (syn('agua', 1) ? 0.2 : 0),
    goldMult: 1 + pct('ouro') + 0.002 * attrs.sorte + 0.03 * rank('olhoVivo') + 0.02 * rank('joiaCurioso') + 0.02 * rank('joiaMalandro') + (companion === 'arara' || companion === 'graxaim' ? 0.1 : 0) + (set('andarilho', 2) ? 0.1 : 0) + 0.1 * (p.village?.casaDeFarinha ?? 0),
    xpMult: 1 + 0.04 * rank('sabedoria') + 0.02 * rank('joiaCurioso') + (set('andarilho', 4) ? 0.15 : 0),
    luck: attrs.sorte + 4 * rank('boaEstrela') + 15 * bl('trevo'),
    eliteDamage: 1 + 0.05 * rank('quebraCasca') + (pet('jacarezinho') ? 0.1 : 0) + 0.15 * bl('cacadorDaNoite'),
    thirdHitMult: 1 + 0.06 * rank('pesoDoGolpe') + 0.15 * bl('pilao') + 0.3 * bl('bracoDeFerro'),
    reachMult: 1 + 0.25 * bl('gigante') + 0.3 * bl('bracoDeGigante'),
    comboWide: !!rank('golpeLargo') || has('abraco'), ignoreArmor: !!rank('arrombar') || has('quebraPedra'),
    doubleArrow: !!rank('flechaDupla'), projectiles: bl('projetil'), pierce: bl('perfurar') > 0,
    perfectBonus: rank('contraAtaque') ? 2.5 : 1.5,
    perfectWindow: BASE_PERFECT_WINDOW * (1 + 0.08 * rank('olhoAberto')),
    critHaste: !!rank('olhoDeOnca') || has('ventania'),
    manaPerHitMult: rank('mare') ? 2 : 1, manaOnKill: rank('sopro') ? 6 : 0, manaOnElite: !!rank('pocoFundo'),
    revives: 1 + (rank('segundoFolego') ? 1 : 0),
    potions: Math.min(p.potions, MAX_POTIONS + (rank('cantilCheio') ? 1 : 0)) + bl('cantil'),
    potionHeal: (POTION_HEAL + 0.06 * rank('pocaoForte')) * (pet('preguica') ? 1.25 : 1) * (has('garrafada') ? 1.4 : 1),
    altarChoices: 3 + (rank('bencaoFarta') ? 1 : 0) + (set('andarilho', 6) ? 1 : 0),
    companion,
    companionMult: 1 + 0.05 * rank('bomTrato') + 0.5 * bl('parceria'),
    petCooldownMult: 1 - 0.05 * rank('faro'),
    petFastRevive: !!rank('seteVidas'), petDouble: !!rank('ataqueCombinado'),
    loadout: p.loadout.slice(0, 3),
    spellLevels: p.loadout.slice(0, 3).map((id) => Math.min(MAX_SPELL_LEVEL + 1, (id ? spellLevel(p, id) : 1) + levelBonus)),
    supremo: p.supremo && p.supremos.includes(p.supremo) ? p.supremo : null,
    onHitPoison: bl('peconha') > 0, onKillExplode: bl('estouro') > 0, firstHitShield: bl('amparo') > 0 || set('sentinela', 6),
    nova: bl('ourico'),
    bless, patrons, patronTiers,
    knowledge: p.life ? knowledgeMap(p.life) : {},
    talents: {
      sedeDeBriga: !!rank('sedeDeBriga') || has('sedeDeSangue'), execucao: !!rank('execucao') || has('boteFinal'), contragolpe: !!rank('contragolpe'),
      cascaDeJabuti: !!rank('cascaDeJabuti') || has('segundaChance'), rolamentoCortante: !!rank('rolamentoCortante'), sangueQuente: !!rank('sangueQuente') || has('sangueFervendo'),
    },
    uniques: {
      mandibulaDaRainha: uniq('mandibulaDaRainha'), presaDaCaipora: uniq('presaDaCaipora'), coroaDeCipo: uniq('coroaDeCipo'),
      ferraoDeArraia: uniq('ferraoDeArraia'), denteDoBoto: uniq('denteDoBoto'), escamaDaIara: uniq('escamaDaIara'),
      maoDoCorpoSeco: uniq('maoDoCorpoSeco'), alpercatasDoRedemoinho: uniq('alpercatasDoRedemoinho'), cachimboDoSaci: uniq('cachimboDoSaci'), crinaDaMula: uniq('crinaDaMula'),
      olhoDoBoitata: uniq('olhoDoBoitata'), couroDoCapelobo: uniq('couroDoCapelobo'), garraDoMapinguari: uniq('garraDoMapinguari'), pedraDaTeiniagua: uniq('pedraDaTeiniagua'),
      denteDoLobisomem: uniq('denteDoLobisomem'), toucaDaPisadeira: uniq('toucaDaPisadeira'), colherDaCuca: uniq('colherDaCuca'), fioDoEsquecimento: uniq('fioDoEsquecimento'),
    },
  };
  if (aspect === 'peixeirasSaci') out.passives.perfectWhirl = true;
  nightExtras(out, amulets, boost);
  return out;
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
  'cascaDeJabuti', 'sangueBom', 'sangueBom', 'sangueBom', 'peleGrossa', 'peleGrossa', 'peleGrossa', 'quebraCasca', 'quebraCasca', 'quebraCasca',
  'pocaoForte', 'pocaoForte', 'cantilCheio', 'segundoFolego', 'golpeCerteiro', 'golpeCerteiro', 'brutalidade', 'brutalidade', 'sangueBom', 'sangueBom',
  'peleGrossa', 'peleGrossa', 'quebraCasca', 'quebraCasca', 'pesoDoGolpe', 'pesoDoGolpe', 'pesoDoGolpe', 'espinhoVivo', 'pocaoForte', 'pocaoForte',
];

/** O personagem de referência usado para calibrar as fases: é dele o "poder recomendado". */
export function referenceProfile(level: number, bow = false, weapon: ItemType = bow ? 'arco' : 'facao'): Profile {
  const p = newProfile(1), rng = makeRng(level * 31 + 7);
  p.level = level;
  const pts = (level - 1) * 3;
  if (bow) p.attrs.agilidade = Math.ceil(pts / 2); else p.attrs.forca = Math.ceil(pts / 2);
  p.attrs.vitalidade = Math.floor(pts / 2);
  /* do Capítulo 3 em diante, quem chega lá já usou o ferreiro: itens Raros (e Épicos depois do 42) mais aprimorados */
  const rarity = level >= 48 ? 3 : level >= 24 ? 2 : level > 1 ? 1 : 0;
  const plus = level >= 24 ? Math.min(rarity === 3 ? 12 : rarity === 2 ? 9 : 6, Math.floor(level / 6)) : Math.min(4, Math.floor(level / 2));
  const set = (slot: 'arma' | 'mao' | 'cabeca' | 'peito' | 'maos' | 'pes', type: ItemType) => {
    const it = makeItem(p.nextItemId++, rng, level, rarity, type);
    it.affixes = []; it.plus = plus;
    p.equipped[slot] = it;
  };
  set('arma', weapon); set('cabeca', 'chapeu'); set('peito', 'gibao');
  if (level >= 2) { set('mao', bow ? 'aljava' : 'escudo'); set('maos', 'luvas'); set('pes', 'alpercatas'); }
  if (level >= 30) p.equipped.arma!.gem = { el: 'fogo', lvl: 1 + Math.floor((level - 30) / 15) };
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
