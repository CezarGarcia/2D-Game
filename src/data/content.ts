/**
 * Feitiços, companheiros e bênçãos de altar do Capítulo 1.
 * Distâncias em pixels do mundo, tempos em segundos.
 */

export type SpellId = 'dardo' | 'sementes' | 'cipo' | 'casca' | 'broto';

export interface SpellDef {
  id: SpellId;
  name: string;
  role: string;
  desc: string;
  /** Nível do personagem em que o feitiço é aprendido. */
  unlock: number;
  cost: number;
  cooldown: number;
}

export const SPELLS: Record<SpellId, SpellDef> = {
  dardo: { id: 'dardo', name: 'Dardo de Espinho', role: 'Projétil', unlock: 1, cost: 12, cooldown: 2.5, desc: 'Três espinhos em leque. Causam dano e envenenam por 3 s.' },
  sementes: { id: 'sementes', name: 'Chuva de Sementes', role: 'Área', unlock: 3, cost: 22, cooldown: 7, desc: 'Sementes caem onde você mira e brotam em vinhas: dano em área e lentidão por 3 s.' },
  cipo: { id: 'cipo', name: 'Cipó-Laço', role: 'Controle', unlock: 4, cost: 16, cooldown: 6, desc: 'Laça o primeiro inimigo na linha, puxa até você e o prende por 2 s.' },
  casca: { id: 'casca', name: 'Casca-Grossa', role: 'Defesa', unlock: 6, cost: 20, cooldown: 12, desc: 'Por 4 s, uma casca absorve dano e devolve metade a quem bateu.' },
  broto: { id: 'broto', name: 'Broto Curandeiro', role: 'Duradouro', unlock: 7, cost: 28, cooldown: 18, desc: 'Planta um broto que cura quem fica perto por 8 s.' },
};
export const SPELL_ORDER: SpellId[] = ['dardo', 'sementes', 'cipo', 'casca', 'broto'];

/** Números de combate dos feitiços. O dano é multiplicado pelo poder mágico do herói. */
export const SPELL_NUM = {
  dardo: { count: 3, spread: 0.2, speed: 640, range: 560, damage: 10, poisonTick: 3, poisonEvery: 0.5, poisonDuration: 3 },
  sementes: { range: 420, radius: 115, delay: 0.55, damage: 22, slow: 0.5, slowDuration: 3 },
  cipo: { speed: 900, range: 480, damage: 8, root: 2, pullTo: 70 },
  casca: { duration: 4, absorb: 0.45, reflect: 0.5 },
  broto: { duration: 8, radius: 150, healPerSecond: 0.045 },
};

export type CompanionId = 'capivara' | 'onca';

export interface CompanionDef {
  id: CompanionId;
  name: string;
  element: string;
  where: string;
  passive: string;
  active: string;
  activeName: string;
  cooldown: number;
  hp: number; damage: number; speed: number;
}

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
  capivara: {
    id: 'capivara', name: 'Capivara', element: 'Natureza', where: 'Resgatada na fase 1-4',
    passive: '+8% de vida', activeName: 'Chamar a Atenção', active: 'Por 4 s, os inimigos próximos atacam a capivara, que recebe metade do dano.',
    cooldown: 14, hp: 160, damage: 6, speed: 215,
  },
  onca: {
    id: 'onca', name: 'Onça-pintada filhote', element: 'Natureza', where: 'Resgatada ao vencer a fase 1-9 sem cair',
    passive: '+5% de chance de crítico', activeName: 'Bote', active: 'Salta no inimigo mais próximo com dano crítico garantido.',
    cooldown: 10, hp: 110, damage: 9, speed: 270,
  },
};
export const COMPANION_ORDER: CompanionId[] = ['capivara', 'onca'];

export type BlessingId = 'furia' | 'vigor' | 'vento' | 'fonte' | 'sanguessuga' | 'espinhos' | 'olho' | 'cura';

export interface BlessingDef { id: BlessingId; name: string; desc: string }

/** Bênçãos de altar: valem só até o fim da fase. */
export const BLESSINGS: Record<BlessingId, BlessingDef> = {
  furia: { id: 'furia', name: 'Fúria da Mata', desc: '+20% de dano até o fim da fase.' },
  vigor: { id: 'vigor', name: 'Seiva Grossa', desc: '+25% de vida máxima, e cura esse tanto agora.' },
  vento: { id: 'vento', name: 'Pé de Vento', desc: '+15% de velocidade e a esquiva recarrega 30% mais rápido.' },
  fonte: { id: 'fonte', name: 'Olho-d’Água', desc: 'Feitiços custam 35% menos mana.' },
  sanguessuga: { id: 'sanguessuga', name: 'Sanguessuga', desc: 'Seus golpes de arma devolvem 5% do dano como vida.' },
  espinhos: { id: 'espinhos', name: 'Couro de Ouriço', desc: 'Quem te acerta de perto recebe 30% do dano de volta.' },
  olho: { id: 'olho', name: 'Olho de Gavião', desc: '+12% de chance de crítico.' },
  cura: { id: 'cura', name: 'Fruta Madura', desc: 'Cura 60% da vida e devolve as poções.' },
};
export const BLESSING_ORDER = Object.keys(BLESSINGS) as BlessingId[];

export const MAX_POTIONS = 3;
/** Fração da vida máxima curada por poção. */
export const POTION_HEAL = 0.4;
