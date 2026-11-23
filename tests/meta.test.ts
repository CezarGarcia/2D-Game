import { describe, expect, it } from 'vitest';
import { RARITIES, makeItem, type Item } from '../src/data/items';
import { stageXp, xpNeeded } from '../src/data/progression';
import { makeRng } from '../src/data/rng';
import { STAGES } from '../src/data/stages';
import { TALENTS, canAddTalent, canRemoveTalent } from '../src/data/talents';
import {
  addItem, addTalent, addXp, allocAttr, enchantInfo, enchantItem, equip, fuseCandidates, fuseInfo, fuseItems, knownSpells, migrate, newProfile, reforgeInfo, reforgeItem,
  removeTalent, spellLevel, spellUpgradeInfo, talentFree, upgradeInfo, upgradeItem, upgradeSpell, type Profile,
} from '../src/meta/profile';
import { applyOutcome, isChapterOpen, isUnlocked, stageInfo, type StageOutcome } from '../src/meta/rewards';
import { attrEffects, deriveStats, powerOf, recommendedPower } from '../src/meta/stats';
import { bestSlot, equipBest, junkItems, planUpgrades, sellJunk } from '../src/meta/mochila';

const win = (stageId: string, over: Partial<StageOutcome> = {}): StageOutcome => ({ stageId, won: true, time: 60, deaths: 0, roomsCleared: 5, kills: 20, perfects: 0, hitsTaken: 0, ...over });

describe('personagem', () => {
  it('começa equipado e com o primeiro feitiço', () => {
    const p = newProfile(1), s = deriveStats(p);
    expect(p.equipped.arma?.type).toBe('facao');
    expect(s.weapon).toBe('facao');
    expect(s.maxHp).toBeGreaterThan(200);
    expect(knownSpells(p)).toEqual(['dardo']);
  });

  it('subir de nível dá 3 pontos de atributo, 1 de talento e libera feitiços', () => {
    const p = newProfile(1);
    const up = addXp(p, xpNeeded(1) + xpNeeded(2));
    expect(up.levels).toBe(2);
    expect(p.level).toBe(3);
    expect(p.attrPoints).toBe(6);
    expect(p.talentPoints).toBe(2);
    expect(up.spells).toEqual(['sementes']);
    expect(p.loadout[1]).toBe('sementes');
  });

  it('atributos mudam os números de combate', () => {
    const p = newProfile(1), before = deriveStats(p);
    p.attrPoints = 10;
    for (let i = 0; i < 5; i++) { allocAttr(p, 'forca'); allocAttr(p, 'vitalidade'); }
    const after = deriveStats(p);
    expect(after.damageMult).toBeGreaterThan(before.damageMult);
    expect(after.maxHp).toBe(before.maxHp + 60);
    expect(powerOf(after)).toBeGreaterThan(powerOf(before));
  });

  it('escudo só conta com facão', () => {
    const p = newProfile(1), rng = makeRng(3);
    addItem(p, makeItem(p.nextItemId++, rng, 1, 1, 'escudo'));
    equip(p, p.inventory[0].id);
    expect(deriveStats(p).hasShield).toBe(true);
    addItem(p, makeItem(p.nextItemId++, rng, 1, 1, 'arco'));
    equip(p, p.inventory.find((i) => i.type === 'arco')!.id);
    const s = deriveStats(p);
    expect(s.weapon).toBe('arco');
    expect(s.hasShield).toBe(false);
    expect(p.inventory.some((i) => i.type === 'facao')).toBe(true);
  });
});

describe('teia de talentos', () => {
  it('todo nó está ligado a alguma raiz', () => {
    const seen = new Set<string>(), stack = TALENTS.filter((n) => n.kind === 'raiz').map((n) => n.id);
    while (stack.length) { const id = stack.pop()!; if (seen.has(id)) continue; seen.add(id); stack.push(...TALENTS.find((n) => n.id === id)!.links); }
    expect(seen.size).toBe(TALENTS.length);
  });

  it('só libera nós vizinhos de um nó com ponto, e não deixa cortar o caminho', () => {
    const p = newProfile(1);
    p.talentPoints = 4;
    expect(canAddTalent(p.talents, 'maoPesada', talentFree(p))).toBe(false);
    expect(addTalent(p, 'raizForca')).toBe(true);
    expect(addTalent(p, 'maoPesada')).toBe(true);
    expect(addTalent(p, 'sedeDeBriga')).toBe(true);
    expect(canRemoveTalent(p.talents, 'maoPesada')).toBe(false);
    expect(removeTalent(p, 'sedeDeBriga')).toBe(true);
    expect(removeTalent(p, 'maoPesada')).toBe(true);
    expect(deriveStats(p).attrs.forca).toBe(8);
  });
});

describe('ferreiro', () => {
  it('aprimorar gasta ouro e resina, e para no teto da raridade', () => {
    const p = newProfile(1), weapon = p.equipped.arma!;
    p.gold = 100000; p.materials.mata = 1000;
    for (let i = 0; i < 10; i++) upgradeItem(p, weapon.id, () => 0);
    expect(weapon.plus).toBe(RARITIES[0].maxPlus);
    expect(upgradeInfo(p, weapon).possible).toBe(false);
    expect(p.gold).toBeLessThan(100000);
  });

  it('falhar não destrói o item e aumenta a próxima chance', () => {
    const p = newProfile(1), rng = makeRng(5);
    const it = makeItem(p.nextItemId++, rng, 4, 4, 'facao');
    it.plus = 8; addItem(p, it);
    p.gold = 100000; p.materials.mata = 1000;
    const chance = upgradeInfo(p, it).chance;
    const r = upgradeItem(p, it.id, () => 0.999);
    expect(r.done).toBe(true); expect(r.success).toBe(false);
    expect(it.plus).toBe(8);
    expect(upgradeInfo(p, it).chance).toBeCloseTo(chance + 0.05);
  });

  it('fundir 3 itens iguais em raridade e espaço sobe a raridade do principal', () => {
    const p = newProfile(1), rng = makeRng(9), items: Item[] = [];
    for (let i = 0; i < 3; i++) { const it = makeItem(p.nextItemId++, rng, 2, 1, 'luvas'); items.push(it); addItem(p, it); }
    const other = makeItem(p.nextItemId++, rng, 2, 1, 'chapeu'); addItem(p, other);
    p.gold = 10000;
    expect(fuseInfo(p, items[0].id, [items[1].id, other.id]).possible).toBe(false);
    const r = fuseItems(p, items[0].id, [items[1].id, items[2].id], () => 0);
    expect(r.success).toBe(true);
    expect(items[0].rarity).toBe(2);
    expect(items[0].affixes.length).toBe(2);
    expect(p.inventory.length).toBe(2);
  });
});

describe('recompensas de fase', () => {
  it('a primeira vitória libera a próxima fase, paga XP com bônus e entrega os itens garantidos', () => {
    const p = newProfile(1), s = STAGES[0];
    expect(isUnlocked(p, STAGES[1])).toBe(false);
    const r = applyOutcome(p, win(s.id));
    expect(r.firstClear).toBe(true);
    expect(r.xp).toBe(Math.round(stageXp(s.level) * 1.5));
    expect(r.items.some((i) => i.type === 'escudo')).toBe(true);
    expect(r.stars).toEqual([true, true, true]);
    expect(isUnlocked(p, STAGES[1])).toBe(true);
    expect(p.level).toBeGreaterThan(1);
  });

  it('fase fácil rende menos XP, e a etiqueta avisa', () => {
    const p = newProfile(1);
    p.level = 12;
    const info = stageInfo(p, STAGES[0]);
    expect(info.xpMult).toBe(0.1);
    expect(info.tag).toBe('cinza');
    expect(applyOutcome(p, win('1-1')).xp).toBe(Math.round(stageXp(1) * 0.1 * 1.5));
  });

  it('o item com nome tem azar com limite: a chance sobe a cada vitória sem ele', () => {
    const p = newProfile(1);
    p.stages['1-1'] = { cleared: true, stars: [true, true, true], bestTime: 50, pity: 0, clears: 1 };
    const stage = STAGES[1];
    let drops = 0;
    for (let i = 0; i < 400 && drops === 0; i++) { p.inventory = []; if (applyOutcome(p, win(stage.id)).named) drops++; }
    expect(drops).toBe(1);
    expect(p.stages[stage.id].pity).toBe(0);
  });

  it('cair no meio paga só uma parte e não dá baú', () => {
    const p = newProfile(1);
    const r = applyOutcome(p, win('1-1', { won: false, roomsCleared: 2, deaths: 2 }));
    expect(r.items.length).toBe(0);
    expect(r.xp).toBeLessThan(stageXp(1));
    expect(p.stages['1-1'].cleared).toBe(false);
  });

  it('o poder recomendado cresce com o nível da fase', () => {
    for (let l = 2; l <= 8; l++) expect(recommendedPower(l)).toBeGreaterThan(recommendedPower(l - 1));
  });
});

describe('etapa 3: o que mudou nas regras', () => {
  it('a teia tem 78 nós, e todo talento muda algum número do herói ou da recompensa', () => {
    expect(TALENTS.length).toBe(78);
    const p = newProfile(1);
    expect(deriveStats(p).xpMult).toBe(1);
    p.talents = { raizInteligencia: 1, palavraForte: 3, eco: 1, sabedoria: 5 };
    expect(deriveStats(p).xpMult).toBeCloseTo(1.2);
    p.talents = { raizSorte: 1, olhoVivo: 5 };
    expect(deriveStats(p).goldMult).toBeGreaterThan(1.15);
  });

  it('cada atributo explica o que rende, com números', () => {
    const p = newProfile(1);
    p.attrs.vitalidade = 10; p.attrs.espirito = 4;
    const fx = attrEffects(p);
    expect(fx.vitalidade[0]).toBe('+180 de vida');
    expect(fx.espirito[0]).toBe('+27 de mana');
    expect(fx.sorte.length).toBe(2);
  });

  it('a bênção Lição da Mata e o talento Sabedoria aumentam o XP da fase', () => {
    const a = newProfile(5), b = newProfile(5);
    const plain = applyOutcome(a, win('1-1')), blessed = applyOutcome(b, win('1-1', { blessings: ['sabedoria'] }));
    expect(blessed.xp).toBe(Math.round(plain.xp * 1.25));
  });

  it('elites e chefões dão tomos, e os tomos sobem o nível dos feitiços', () => {
    const p = newProfile(3);
    for (const s of STAGES.slice(0, 5)) applyOutcome(p, win(s.id));
    expect(p.materials.tomo).toBeGreaterThanOrEqual(2);
    p.gold = 1000;
    expect(spellUpgradeInfo(p, 'dardo').possible).toBe(true);
    expect(upgradeSpell(p, 'dardo')).toBe(true);
    expect(spellLevel(p, 'dardo')).toBe(2);
    expect(deriveStats(p).spellLevels[0]).toBe(2);
  });

  it('libertar o Curupira dá o Supremo de Natureza e abre o Capítulo 2', () => {
    const p = newProfile(9);
    expect(isChapterOpen(p, 2)).toBe(false);
    let last = applyOutcome(p, win('1-1'));
    for (const s of STAGES.slice(1, 12)) last = applyOutcome(p, win(s.id));
    expect(last.supremo).toBe('natureza');
    expect(p.supremo).toBe('natureza');
    expect(deriveStats(p).supremo).toBe('natureza');
    expect(isChapterOpen(p, 2)).toBe(true);
    expect(isUnlocked(p, STAGES[12])).toBe(true);
  });

  it('encantar troca um bônus e fica mais caro a cada vez', () => {
    const p = newProfile(4), rng = makeRng(9);
    const it = makeItem(p.nextItemId++, rng, 5, 2, 'luvas');
    addItem(p, it);
    p.gold = 5000; p.materials.po = 50;
    const before = it.affixes[0].k, first = enchantInfo(p, it);
    expect(first.possible).toBe(true);
    expect(enchantItem(p, it.id, 0, rng).done).toBe(true);
    expect(it.affixes[0].k).not.toBe(before);
    expect(it.affixes.length).toBe(RARITIES[2].affixes);
    expect(enchantInfo(p, it).po).toBeGreaterThan(first.po);
  });

  it('reforjar traz o item para o nível do herói', () => {
    const p = newProfile(4);
    const it = makeItem(p.nextItemId++, makeRng(3), 2, 1, 'facao');
    addItem(p, it);
    p.level = 8; p.gold = 5000; p.materials.mata = 100;
    expect(reforgeInfo(p, it).toLevel).toBe(8);
    expect(reforgeItem(p, it.id).done).toBe(true);
    expect(it.ilvl).toBe(8);
    expect(reforgeInfo(p, it).possible).toBe(false);
  });

  it('o ferreiro sabe dizer quais itens servem para fundir', () => {
    const p = newProfile(4), rng = makeRng(5);
    const main = makeItem(p.nextItemId++, rng, 3, 1, 'chapeu'), same = makeItem(p.nextItemId++, rng, 3, 1, 'chapeu');
    const otherSlot = makeItem(p.nextItemId++, rng, 3, 1, 'luvas'), otherRarity = makeItem(p.nextItemId++, rng, 3, 2, 'chapeu');
    for (const i of [main, same, otherSlot, otherRarity]) addItem(p, i);
    expect(fuseCandidates(p, main.id).map((i) => i.id)).toEqual([same.id]);
  });

  it('um save antigo ganha os campos novos e perde talentos que não existem mais', () => {
    const old = JSON.parse(JSON.stringify(newProfile(3))) as Profile & Record<string, unknown>;
    delete (old as Record<string, unknown>).spellLevels; delete (old as Record<string, unknown>).supremos;
    (old.materials as unknown as Record<string, unknown>) = { mata: 7, po: 1, lagrima: 0 };
    old.talents = { talentoAntigo: 3 }; old.curupiraFreed = true;
    const p = migrate(old);
    expect(p.materials).toEqual({ mata: 7, po: 1, lagrima: 0, tomo: 0 });
    expect(p.talents).toEqual({});
    expect(p.supremos).toEqual(['natureza']);
    expect(p.spellLevels).toEqual({});
  });
});

describe('atalhos da mochila', () => {
  function stocked(): Profile {
    const p = newProfile(5), rng = makeRng(9);
    p.level = 20;
    const types = ['facao', 'arco', 'escudo', 'chapeu', 'gibao', 'luvas', 'alpercatas', 'anel', 'anel', 'amuleto'] as const;
    for (const t of types) addItem(p, makeItem(p.nextItemId++, rng, 18, 2, t));
    for (let i = 0; i < 6; i++) addItem(p, makeItem(p.nextItemId++, rng, 1, 0, 'luvas'));
    return p;
  }

  it('equipar melhores só aumenta o Poder e não troca o tipo de arma', () => {
    const p = stocked(), before = powerOf(deriveStats(p));
    const gain = equipBest(p);
    expect(gain).toBeGreaterThan(0);
    expect(powerOf(deriveStats(p))).toBe(before + gain);
    expect(p.equipped.arma?.type).toBe('facao');
    expect(p.equipped.anel1 && p.equipped.anel2).toBeTruthy();
    expect(planUpgrades(p)).toEqual([]);
  });

  it('vender sobras não vende nada que aumente o Poder, travado ou raro', () => {
    const p = stocked();
    equipBest(p);
    p.inventory[0].locked = true;
    const junk = junkItems(p);
    expect(junk.length).toBeGreaterThan(0);
    for (const it of junk) { expect(it.rarity).toBeLessThanOrEqual(1); expect(it.locked).toBeFalsy(); }
    const gold = p.gold, n = p.inventory.length, r = sellJunk(p);
    expect(r.count).toBe(junk.length);
    expect(p.gold).toBe(gold + r.gold);
    expect(p.inventory.length).toBe(n - r.count);
    expect(junkItems(p)).toEqual([]);
  });

  it('o anel vai para o espaço vazio', () => {
    const p = newProfile(3), rng = makeRng(4);
    p.equipped.anel1 = makeItem(p.nextItemId++, rng, 5, 1, 'anel');
    const ring = makeItem(p.nextItemId++, rng, 5, 1, 'anel');
    addItem(p, ring);
    expect(bestSlot(p, ring).slot).toBe('anel2');
  });
});
