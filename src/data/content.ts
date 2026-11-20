/**
 * Elementos, feitiços, Supremos, companheiros e bênçãos de altar.
 * Distâncias em pixels do mundo, tempos em segundos.
 */

export type ElementId = 'natureza' | 'agua';
export const ELEMENTS: Record<ElementId, { name: string; color: string; status: string; statusDesc: string }> = {
  natureza: { name: 'Natureza', color: '#7BD45A', status: 'Envenenado', statusDesc: 'Perde vida aos poucos.' },
  agua: { name: 'Água', color: '#4FB6F0', status: 'Molhado', statusDesc: 'Sozinho não faz nada. Prepara reações com outros elementos.' },
};

export type SpellId = 'dardo' | 'sementes' | 'cipo' | 'casca' | 'broto' | 'jato' | 'onda' | 'bolha' | 'correnteza' | 'chuva';

export interface SpellDef {
  id: SpellId;
  name: string;
  element: ElementId;
  role: string;
  desc: string;
  /** Nível do personagem em que o feitiço é aprendido. */
  unlock: number;
  cost: number;
  cooldown: number;
}

export const SPELLS: Record<SpellId, SpellDef> = {
  dardo: { id: 'dardo', name: 'Dardo de Espinho', element: 'natureza', role: 'Projétil', unlock: 1, cost: 12, cooldown: 2.5, desc: 'Três espinhos em leque. Causam dano e envenenam.' },
  sementes: { id: 'sementes', name: 'Chuva de Sementes', element: 'natureza', role: 'Área', unlock: 3, cost: 22, cooldown: 7, desc: 'Vinhas brotam onde você mira: dano em área e lentidão.' },
  cipo: { id: 'cipo', name: 'Cipó-Laço', element: 'natureza', role: 'Controle', unlock: 4, cost: 16, cooldown: 6, desc: 'Laça o primeiro inimigo na linha, puxa até você e o prende.' },
  casca: { id: 'casca', name: 'Casca-Grossa', element: 'natureza', role: 'Defesa', unlock: 6, cost: 20, cooldown: 12, desc: 'Uma casca absorve dano e devolve metade a quem bateu.' },
  broto: { id: 'broto', name: 'Broto Curandeiro', element: 'natureza', role: 'Cura', unlock: 7, cost: 28, cooldown: 18, desc: 'Planta um broto que cura quem fica perto.' },
  jato: { id: 'jato', name: 'Jato', element: 'agua', role: 'Projétil', unlock: 13, cost: 14, cooldown: 3, desc: 'Um jato que atravessa todos na linha e deixa Molhado.' },
  onda: { id: 'onda', name: 'Onda', element: 'agua', role: 'Área', unlock: 14, cost: 20, cooldown: 6, desc: 'Empurra para longe e molha todos à sua frente.' },
  bolha: { id: 'bolha', name: 'Bolha', element: 'agua', role: 'Controle', unlock: 16, cost: 18, cooldown: 9, desc: 'Prende um inimigo numa bolha. Ele não age até ela estourar.' },
  correnteza: { id: 'correnteza', name: 'Correnteza', element: 'agua', role: 'Movimento', unlock: 18, cost: 16, cooldown: 7, desc: 'Você desliza para onde mira, sem tomar dano, molhando quem atravessa.' },
  chuva: { id: 'chuva', name: 'Chuva', element: 'agua', role: 'Cura', unlock: 20, cost: 30, cooldown: 20, desc: 'Chove numa área: molha os inimigos e cura você aos poucos.' },
};
export const SPELL_ORDER: SpellId[] = ['dardo', 'sementes', 'cipo', 'casca', 'broto', 'jato', 'onda', 'bolha', 'correnteza', 'chuva'];

/** Números de combate dos feitiços. Dano e cura são multiplicados pelo poder mágico do herói e pelo nível do feitiço. */
export const SPELL_NUM = {
  dardo: { count: 3, spread: 0.2, speed: 640, range: 560, damage: 10, poisonTick: 3, poisonEvery: 0.5, poisonDuration: 3 },
  sementes: { range: 420, radius: 115, delay: 0.55, damage: 22, slow: 0.5, slowDuration: 3 },
  cipo: { speed: 900, range: 480, damage: 8, root: 2, pullTo: 70 },
  casca: { duration: 4, absorb: 0.45, reflect: 0.5 },
  broto: { duration: 8, radius: 150, healPerSecond: 0.045 },
  jato: { speed: 860, range: 620, damage: 17 },
  onda: { radius: 230, arc: 0.95, damage: 20, knock: 460 },
  bolha: { speed: 560, range: 540, damage: 6, trap: 3, bossSlow: 3 },
  correnteza: { duration: 0.26, speed: 980, damage: 16 },
  chuva: { range: 420, radius: 160, duration: 6, healPerSecond: 0.025 },
};

/** Tempo que um inimigo fica Molhado. */
export const WET_DURATION = 6;
/** Reação entre Natureza e Água: as vinhas brotam. */
export const BROTAR = { damage: 34, root: 1.6, heal: 0.04, radius: 90 };

export const MAX_SPELL_LEVEL = 10;
/** Cada nível de feitiço acima do primeiro soma este tanto de dano, cura e duração. */
export const SPELL_LEVEL_POWER = 0.1;
/** Marcos de nível, iguais para todos os feitiços. */
export const SPELL_MILESTONES = [
  { level: 4, text: 'Recarrega 15% mais rápido' },
  { level: 7, text: 'Custa 20% menos mana' },
  { level: 10, text: '+25% de poder' },
];

export interface SupremoDef { element: ElementId; name: string; desc: string; stage: string }
/** Supremo: o Encantado libertado aparece e luta por você. Um por elemento. */
export const SUPREMOS: Record<ElementId, SupremoDef> = {
  natureza: { element: 'natureza', name: 'Curupira', stage: '1-12', desc: 'O Curupira corre pela sala e a mata se levanta: dano em todos os inimigos, que ficam presos por 3 s.' },
  agua: { element: 'agua', name: 'Iara', stage: '2-12', desc: 'A Iara canta: todos os inimigos são puxados para o centro, molhados e afogados.' },
};
export const SUPREMO_NUM = {
  /** Carga por segundo em combate, por golpe acertado e por golpe recebido (a carga cheia é 100). */
  perSecond: 0.7, perHit: 0.55, perHurt: 3,
  natureza: { damage: 75, root: 3 },
  agua: { damage: 60, slow: 3.5, pullTo: 90 },
};

export type CompanionId = 'capivara' | 'onca' | 'arara';

export interface CompanionDef {
  id: CompanionId;
  name: string;
  where: string;
  passive: string;
  active: string;
  activeName: string;
  cooldown: number;
  hp: number; damage: number; speed: number;
}

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
  capivara: {
    id: 'capivara', name: 'Capivara', where: 'Fase 1-4',
    passive: '+8% de vida', activeName: 'Chamar a Atenção', active: 'Por 4 s, os inimigos próximos atacam a capivara, que recebe metade do dano.',
    cooldown: 14, hp: 160, damage: 6, speed: 215,
  },
  onca: {
    id: 'onca', name: 'Onça-pintada', where: 'Fase 1-9, sem cair',
    passive: '+5% de crítico', activeName: 'Bote', active: 'Salta no inimigo mais próximo com dano crítico.',
    cooldown: 10, hp: 110, damage: 9, speed: 270,
  },
  arara: {
    id: 'arara', name: 'Arara', where: 'Fase 2-3',
    passive: '+10% de ouro', activeName: 'Marcar', active: 'Marca o inimigo mais forte: ele recebe +25% de dano por 6 s.',
    cooldown: 12, hp: 90, damage: 7, speed: 300,
  },
};
export const COMPANION_ORDER: CompanionId[] = ['capivara', 'onca', 'arara'];

/* ---------- bênçãos de altar ---------- */

export type BlessingId =
  | 'furia' | 'olho' | 'ferocidade' | 'pressa' | 'projetil' | 'perfurar' | 'gigante' | 'peconha' | 'estouro' | 'ourico'
  | 'vigor' | 'couro' | 'sanguessuga' | 'seiva' | 'espinhos' | 'amparo' | 'cura'
  | 'vento' | 'folego' | 'passo' | 'fonte' | 'ligeireza' | 'mandinga'
  | 'forca' | 'agilidade' | 'inteligencia'
  | 'ouro' | 'sabedoria' | 'fartura' | 'parceria';

export interface BlessingDef {
  id: BlessingId;
  name: string;
  desc: string;
  /** Chave do ícone em src/art/uiicons.ts. */
  icon: string;
  /** 1 = comum, 2 = rara, 3 = épica. Mais alta, mais forte e mais difícil de aparecer. */
  tier: 1 | 2 | 3;
  /** Quantas vezes pode ser escolhida na mesma fase. */
  max: number;
}

const B = (id: BlessingId, name: string, tier: 1 | 2 | 3, max: number, icon: string, desc: string): BlessingDef => ({ id, name, tier, max, icon, desc });

/** Bênçãos: valem até o fim da fase e várias podem ser escolhidas mais de uma vez. */
export const BLESSINGS: Record<BlessingId, BlessingDef> = {
  furia: B('furia', 'Fúria', 1, 5, 'dano', '+15% de dano de arma'),
  olho: B('olho', 'Olho de Gavião', 1, 4, 'critico', '+10% de chance de crítico'),
  ferocidade: B('ferocidade', 'Ferocidade', 2, 3, 'danoCritico', '+35% de dano crítico'),
  pressa: B('pressa', 'Mãos Ligeiras', 1, 4, 'velAtaque', '+12% de velocidade de ataque'),
  projetil: B('projetil', 'Mais Um', 3, 3, 'projetil', '+1 projétil: mais uma flecha por tiro e mais um espinho por Dardo'),
  perfurar: B('perfurar', 'Ponta Dura', 2, 1, 'perfurar', 'Flechas e espinhos atravessam os inimigos'),
  gigante: B('gigante', 'Braço Comprido', 2, 2, 'alcance', '+25% de alcance dos golpes e de área dos feitiços'),
  peconha: B('peconha', 'Peçonha', 2, 1, 'veneno', 'Todo golpe de arma envenena'),
  estouro: B('estouro', 'Estouro', 3, 1, 'explosao', 'Inimigos derrotados explodem e ferem quem está perto'),
  ourico: B('ourico', 'Ouriço', 2, 2, 'espinhos', 'A cada 4 s você dispara espinhos em todas as direções'),
  vigor: B('vigor', 'Seiva Grossa', 1, 4, 'vida', '+20% de vida máxima, e cura esse tanto agora'),
  couro: B('couro', 'Couro Duro', 1, 3, 'defesa', 'Recebe 12% menos dano'),
  sanguessuga: B('sanguessuga', 'Sanguessuga', 2, 3, 'roubo', 'Golpes de arma devolvem 4% do dano como vida'),
  seiva: B('seiva', 'Seiva Viva', 2, 3, 'regeneracao', 'Recupera 1% da vida por segundo'),
  espinhos: B('espinhos', 'Couro de Ouriço', 1, 2, 'espinhos', 'Quem te acerta de perto recebe 35% do dano de volta'),
  amparo: B('amparo', 'Amparo', 2, 1, 'escudo', 'Em cada sala, o primeiro golpe que você tomaria não causa dano'),
  cura: B('cura', 'Fruta Madura', 1, 9, 'cura', 'Cura 60% da vida e devolve as poções'),
  vento: B('vento', 'Pé de Vento', 1, 3, 'movimento', '+12% de velocidade de movimento'),
  folego: B('folego', 'Fôlego de Onça', 2, 1, 'esquiva', '+1 esquiva guardada'),
  passo: B('passo', 'Passo Leve', 1, 3, 'esquiva', 'A esquiva recarrega 25% mais rápido'),
  fonte: B('fonte', 'Olho-d’Água', 1, 2, 'mana', 'Feitiços custam 30% menos mana'),
  ligeireza: B('ligeireza', 'Reza Ligeira', 1, 3, 'recarga', 'Feitiços recarregam 20% mais rápido'),
  mandinga: B('mandinga', 'Mandinga Forte', 1, 5, 'magia', '+20% de dano de feitiço'),
  forca: B('forca', 'Braço Forte', 1, 5, 'forca', '+6 de Força'),
  agilidade: B('agilidade', 'Corpo Leve', 1, 5, 'agilidade', '+6 de Agilidade'),
  inteligencia: B('inteligencia', 'Cabeça Fria', 1, 5, 'inteligencia', '+6 de Inteligência'),
  ouro: B('ouro', 'Pote de Ouro', 1, 2, 'ouro', '+40% de ouro nesta fase'),
  sabedoria: B('sabedoria', 'Lição da Mata', 1, 2, 'xp', '+25% de experiência nesta fase'),
  fartura: B('fartura', 'Fartura', 3, 1, 'bau', '+1 item no baú desta fase'),
  parceria: B('parceria', 'Parceria', 2, 2, 'companheiro', 'Seu companheiro causa e aguenta 50% mais'),
};
export const BLESSING_ORDER = Object.keys(BLESSINGS) as BlessingId[];
/** Peso de cada raridade no sorteio do altar. */
export const BLESSING_WEIGHT: Record<1 | 2 | 3, number> = { 1: 60, 2: 30, 3: 12 };
export const BLESSING_TIER_LABEL: Record<1 | 2 | 3, string> = { 1: 'Comum', 2: 'Rara', 3: 'Épica' };
export const BLESSING_TIER_COLOR: Record<1 | 2 | 3, string> = { 1: '#9BE7C0', 2: '#6AA5FF', 3: '#BC8CFF' };

/** Quantas vezes cada bênção já foi escolhida. */
export function blessingCounts(list: BlessingId[]): Partial<Record<BlessingId, number>> {
  const out: Partial<Record<BlessingId, number>> = {};
  for (const b of list) out[b] = (out[b] ?? 0) + 1;
  return out;
}

export const MAX_POTIONS = 2;
/** Fração da vida máxima curada por poção. */
export const POTION_HEAL = 0.35;
