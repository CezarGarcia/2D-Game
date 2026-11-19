import { describe, expect, it } from 'vitest';
import { RARITIES, makeItem, type Item } from '../src/data/items';
import { stageXp, xpNeeded } from '../src/data/progression';
import { makeRng } from '../src/data/rng';
import { STAGES } from '../src/data/stages';
import { TALENTS, canAddTalent, canRemoveTalent } from '../src/data/talents';
import {
  addItem, addTalent, addXp, allocAttr, equip, fuseInfo, fuseItems, knownSpells, newProfile, removeTalent, talentFree, upgradeInfo, upgradeItem,
} from '../src/meta/profile';
import { applyOutcome, isUnlocked, stageInfo, type StageOutcome } from '../src/meta/rewards';
import { deriveStats, powerOf, recommendedPower } from '../src/meta/stats';

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
