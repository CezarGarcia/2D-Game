/**
 * Elementos, feitiços, Supremos, companheiros e bênçãos de altar.
 * Distâncias em pixels do mundo, tempos em segundos.
 */

export type ElementId = 'natureza' | 'agua' | 'tempestade' | 'fogo' | 'terra' | 'sombra' | 'encanto';
export const ELEMENT_ORDER: ElementId[] = ['natureza', 'agua', 'tempestade', 'fogo', 'terra', 'sombra', 'encanto'];
export const ELEMENTS: Record<ElementId, { name: string; color: string; status: string; statusDesc: string }> = {
  natureza: { name: 'Natureza', color: '#7BD45A', status: 'Envenenado', statusDesc: 'Perde vida aos poucos.' },
  agua: { name: 'Água', color: '#4FB6F0', status: 'Molhado', statusDesc: 'Sozinho não faz nada. Prepara reações com outros elementos.' },
  tempestade: { name: 'Tempestade', color: '#FFD23F', status: 'Carregado', statusDesc: 'O próximo golpe que ele receber solta uma faísca nos vizinhos.' },
  fogo: { name: 'Fogo', color: '#FF7A2A', status: 'Queimando', statusDesc: 'Perde muita vida, por pouco tempo.' },
  terra: { name: 'Terra', color: '#C99A5A', status: 'Rachado', statusDesc: 'Perde a blindagem e recebe 15% mais dano.' },
  sombra: { name: 'Sombra', color: '#9A6AFF', status: 'Amaldiçoado', statusDesc: 'Recebe 15% mais dano de tudo.' },
  encanto: { name: 'Encanto', color: '#FF7AD9', status: 'Confuso', statusDesc: 'Erra metade dos ataques e anda sem rumo.' },
};

export type ReactionId = 'eletrocutar' | 'queimada' | 'lama' | 'vapor' | 'redemoinhoFogo' | 'estilhaco' | 'brotar' | 'pesadelo' | 'fogoFatuo' | 'estatua';
/** Reações: um elemento em quem já tem o efeito de outro consome o efeito e causa a reação. A ordem não importa. */
export const REACTIONS: { id: ReactionId; a: ElementId; b: ElementId; name: string; desc: string }[] = [
  { id: 'eletrocutar', a: 'agua', b: 'tempestade', name: 'Eletrocutar', desc: 'O raio salta entre todos os inimigos molhados.' },
  { id: 'queimada', a: 'natureza', b: 'fogo', name: 'Queimada', desc: 'Explosão em área; o fogo passa para quem está envenenado.' },
  { id: 'lama', a: 'agua', b: 'terra', name: 'Lama', desc: 'Prende no lugar por 3 s.' },
  { id: 'vapor', a: 'fogo', b: 'agua', name: 'Vapor', desc: 'Nuvem que cega os inimigos dentro dela por 4 s.' },
  { id: 'redemoinhoFogo', a: 'tempestade', b: 'fogo', name: 'Redemoinho de Fogo', desc: 'Puxa os inimigos em volta e queima.' },
  { id: 'estilhaco', a: 'terra', b: 'tempestade', name: 'Estilhaço', desc: 'Lascas de pedra voam em todas as direções.' },
  { id: 'brotar', a: 'natureza', b: 'agua', name: 'Brotar', desc: 'Vinhas prendem quem está em volta e curam você.' },
  { id: 'pesadelo', a: 'sombra', b: 'encanto', name: 'Pesadelo', desc: 'Os inimigos em volta atacam uns aos outros por 4 s.' },
  { id: 'fogoFatuo', a: 'sombra', b: 'fogo', name: 'Fogo-Fátuo', desc: 'Queima forte; se ele cair, a maldição pula para o vizinho.' },
  { id: 'estatua', a: 'encanto', b: 'terra', name: 'Estátua', desc: 'Vira pedra por 2 s; o próximo golpe causa o dobro.' },
];
export function reactionOf(a: ElementId, b: ElementId): (typeof REACTIONS)[number] | null {
  return REACTIONS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)) ?? null;
}

export type SpellId = 'dardo' | 'sementes' | 'cipo' | 'casca' | 'broto' | 'jato' | 'onda' | 'bolha' | 'correnteza' | 'chuva'
  | 'faisca' | 'trovao' | 'redemoinho' | 'pedevento' | 'nuvem'
  | 'brasa' | 'explosao' | 'coivara' | 'passocinza' | 'fogofatuo'
  | 'pedrada' | 'tremor' | 'muralha' | 'pelepedra' | 'estaca'
  | 'garra' | 'uivo' | 'marcalua' | 'passosombra' | 'matilha'
  | 'sussurro' | 'borbulhante' | 'ninar' | 'troca' | 'espelho';

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

const S = (id: SpellId, name: string, element: ElementId, role: string, unlock: number, cost: number, cooldown: number, desc: string): SpellDef => ({ id, name, element, role, unlock, cost, cooldown, desc });

export const SPELLS: Record<SpellId, SpellDef> = {
  dardo: S('dardo', 'Dardo de Espinho', 'natureza', 'Projétil', 1, 12, 2.5, 'Três espinhos em leque. Causam dano e envenenam.'),
  sementes: S('sementes', 'Chuva de Sementes', 'natureza', 'Área', 3, 22, 7, 'Vinhas brotam onde você mira: dano em área e lentidão.'),
  cipo: S('cipo', 'Cipó-Laço', 'natureza', 'Controle', 4, 16, 6, 'Laça o primeiro inimigo na linha, puxa até você e o prende.'),
  casca: S('casca', 'Casca-Grossa', 'natureza', 'Defesa', 6, 20, 12, 'Uma casca absorve dano e devolve metade a quem bateu.'),
  broto: S('broto', 'Broto Curandeiro', 'natureza', 'Cura', 7, 28, 18, 'Planta um broto que cura quem fica perto.'),
  jato: S('jato', 'Jato', 'agua', 'Projétil', 13, 14, 3, 'Um jato que atravessa todos na linha e deixa Molhado.'),
  onda: S('onda', 'Onda', 'agua', 'Área', 14, 20, 6, 'Empurra para longe e molha todos à sua frente.'),
  bolha: S('bolha', 'Bolha', 'agua', 'Controle', 16, 18, 9, 'Prende um inimigo numa bolha. Ele não age até ela estourar.'),
  correnteza: S('correnteza', 'Correnteza', 'agua', 'Movimento', 18, 16, 7, 'Você desliza para onde mira, sem tomar dano, molhando quem atravessa.'),
  chuva: S('chuva', 'Chuva', 'agua', 'Cura', 20, 30, 20, 'Chove numa área: molha os inimigos e cura você aos poucos.'),
  faisca: S('faisca', 'Faísca', 'tempestade', 'Projétil', 24, 12, 2.5, 'Um raio que salta para mais dois inimigos e deixa Carregado.'),
  trovao: S('trovao', 'Trovão', 'tempestade', 'Área', 25, 24, 8, 'Depois de um segundo, um raio enorme cai onde você mirou.'),
  redemoinho: S('redemoinho', 'Redemoinho', 'tempestade', 'Controle', 27, 20, 10, 'Um redemoinho puxa e gira os inimigos por 3 s.'),
  pedevento: S('pedevento', 'Pé-de-Vento', 'tempestade', 'Movimento', 28, 14, 6, 'Você dispara para onde mira, sem tomar dano, empurrando quem estiver no caminho.'),
  nuvem: S('nuvem', 'Nuvem Carregada', 'tempestade', 'Duradouro', 30, 30, 22, 'Uma nuvem segue você por 10 s e dispara raios no inimigo mais perto.'),
  brasa: S('brasa', 'Brasa', 'fogo', 'Projétil', 31, 12, 2.5, 'Uma bola de fogo que estoura no alvo e deixa Queimando.'),
  explosao: S('explosao', 'Explosão', 'fogo', 'Área', 32, 24, 7, 'Uma explosão onde você mira.'),
  coivara: S('coivara', 'Coivara', 'fogo', 'Controle', 33, 20, 9, 'Uma linha de fogo no chão à sua frente, que queima quem passa por 4 s.'),
  passocinza: S('passocinza', 'Passo de Cinza', 'fogo', 'Movimento', 34, 16, 7, 'Você some em cinzas e reaparece onde mira; o lugar de onde saiu explode.'),
  fogofatuo: S('fogofatuo', 'Fogo-Fátuo', 'fogo', 'Duradouro', 36, 28, 20, 'Três chamas giram em volta de você por 10 s e queimam quem encostar.'),
  pedrada: S('pedrada', 'Pedrada', 'terra', 'Projétil', 37, 14, 3, 'Uma pedra pesada que empurra e deixa Rachado.'),
  tremor: S('tremor', 'Tremor', 'terra', 'Área', 38, 22, 8, 'O chão treme em volta de você: dano e atordoa por um instante.'),
  muralha: S('muralha', 'Muralha', 'terra', 'Controle', 39, 18, 12, 'Ergue um muro de pedra que bloqueia inimigos e disparos por 6 s.'),
  pelepedra: S('pelepedra', 'Pele de Pedra', 'terra', 'Defesa', 40, 20, 16, 'Por 6 s você recebe 40% menos dano e não é empurrado.'),
  estaca: S('estaca', 'Estaca', 'terra', 'Duradouro', 42, 28, 22, 'Planta uma torre de pedra que atira nos inimigos por 12 s.'),
  garra: S('garra', 'Garra Sombria', 'sombra', 'Projétil', 43, 12, 2.5, 'Três garras de sombra; parte do dano volta como vida.'),
  uivo: S('uivo', 'Uivo', 'sombra', 'Área', 44, 20, 10, 'Os inimigos em volta fogem de medo por 3 s.'),
  marcalua: S('marcalua', 'Marca da Lua', 'sombra', 'Controle', 45, 16, 9, 'Marca um inimigo: por 8 s ele fica lento e recebe 35% mais dano.'),
  passosombra: S('passosombra', 'Passo nas Sombras', 'sombra', 'Movimento', 46, 16, 7, 'Você aparece nas costas do inimigo onde mira; o próximo golpe é crítico.'),
  matilha: S('matilha', 'Matilha', 'sombra', 'Duradouro', 48, 30, 24, 'Dois lobos de sombra lutam por você por 12 s.'),
  sussurro: S('sussurro', 'Sussurro', 'encanto', 'Projétil', 49, 12, 2.5, 'Uma palavra encantada que deixa Confuso.'),
  borbulhante: S('borbulhante', 'Poção Borbulhante', 'encanto', 'Área', 50, 22, 8, 'Uma poção que estoura onde você mira, com um elemento sorteado.'),
  ninar: S('ninar', 'Canção de Ninar', 'encanto', 'Controle', 51, 22, 12, 'Os inimigos na área dormem por 4 s, até levarem um golpe.'),
  troca: S('troca', 'Troca', 'encanto', 'Movimento', 52, 14, 8, 'Você troca de lugar com o inimigo onde mira, e ele fica confuso.'),
  espelho: S('espelho', 'Espelho', 'encanto', 'Duradouro', 54, 26, 20, 'Uma cópia sua chama a atenção dos inimigos por 6 s.'),
};
export const SPELL_ORDER = Object.keys(SPELLS) as SpellId[];

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
  faisca: { speed: 900, range: 560, damage: 14, jumps: 2, jumpRange: 230 },
  trovao: { range: 460, radius: 140, delay: 1.0, damage: 40 },
  redemoinho: { range: 420, radius: 120, duration: 3, pull: 260, tick: 5 },
  pedevento: { duration: 0.22, speed: 1100, damage: 10, knock: 380 },
  nuvem: { duration: 10, every: 0.8, range: 320, damage: 9 },
  brasa: { speed: 760, range: 560, damage: 16, splash: 55, splashDamage: 7 },
  explosao: { range: 440, radius: 120, delay: 0.35, damage: 34 },
  coivara: { length: 380, width: 60, duration: 4, tick: 6 },
  passocinza: { range: 300, radius: 90, damage: 18 },
  fogofatuo: { duration: 10, orbs: 3, radius: 72, damage: 8, spin: 3.2 },
  pedrada: { speed: 620, range: 520, damage: 22, knock: 320 },
  tremor: { radius: 170, damage: 26, stun: 0.8 },
  muralha: { blocks: 5, gap: 50, dist: 130, duration: 6, radius: 26 },
  pelepedra: { duration: 6, reduce: 0.4 },
  estaca: { range: 320, duration: 12, every: 0.9, reach: 430, damage: 10 },
  garra: { count: 3, spread: 0.16, speed: 720, range: 520, damage: 9, lifesteal: 0.3 },
  uivo: { radius: 210, fear: 3, damage: 10 },
  marcalua: { speed: 800, range: 600, mark: 8, bonus: 0.35 },
  passosombra: { range: 420 },
  matilha: { duration: 12, wolves: 2, damage: 6, hp: 120 },
  sussurro: { speed: 700, range: 560, damage: 14 },
  borbulhante: { range: 440, radius: 120, delay: 0.5, damage: 22 },
  ninar: { range: 420, radius: 150, sleep: 4 },
  troca: { range: 500, confuse: 2 },
  espelho: { duration: 6, hp: 0.6 },
};

/** Efeitos de estado nos inimigos e reações (segundos e multiplicadores). */
export const STATUS = {
  poison: 3, wet: 6, charge: 6, chargeSpark: 0.6, chargeRange: 180,
  burn: 2.5, burnTick: 0.4, burnDamage: 5, crack: 5, crackBonus: 0.15, curse: 6, curseBonus: 0.15, confuse: 3, confuseMiss: 0.5,
};
export const REACTION_NUM = {
  eletrocutar: { damage: 30 }, queimada: { damage: 36, radius: 120 }, lama: { root: 3 }, vapor: { radius: 120, blind: 4 },
  redemoinhoFogo: { radius: 150, damage: 24, pull: 90 }, estilhaco: { shards: 10, damage: 14 }, pesadelo: { radius: 180, charm: 4 },
  fogoFatuo: { damage: 30 }, estatua: { stun: 2, mult: 2 },
};

/** Tempo que um inimigo fica Molhado. */
export const WET_DURATION = STATUS.wet;
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
  tempestade: { element: 'tempestade', name: 'Saci', stage: '3-12', desc: 'O Saci atravessa a sala num redemoinho gigante que puxa, gira e carrega todos.' },
  fogo: { element: 'fogo', name: 'Boitatá', stage: '4-12', desc: 'A cobra de fogo cruza a sala três vezes, queimando tudo no caminho.' },
  terra: { element: 'terra', name: 'Mapinguari', stage: '5-12', desc: 'O Mapinguari esmaga a sala: dano em todos, atordoa e quebra toda armadura.' },
  sombra: { element: 'sombra', name: 'Lobisomem', stage: '6-12', desc: 'Você vira lobo por 10 s: mais dano, mais velocidade e roubo de vida.' },
  encanto: { element: 'encanto', name: 'Cuca', stage: '7-12', desc: 'A Cuca transforma os inimigos comuns da sala em sapos por 6 s.' },
};
export const SUPREMO_NUM = {
  /** Carga por segundo em combate, por golpe acertado e por golpe recebido (a carga cheia é 100). */
  perSecond: 0.7, perHit: 0.55, perHurt: 3,
  natureza: { damage: 75, root: 3 },
  agua: { damage: 60, slow: 3.5, pullTo: 90 },
  tempestade: { duration: 4, radius: 210, pull: 320, tick: 9 },
  fogo: { lanes: 3, damage: 55, width: 120 },
  terra: { damage: 90, stun: 2 },
  sombra: { duration: 10, damage: 0.6, speed: 0.3, lifesteal: 0.1 },
  encanto: { duration: 6, bonus: 0.5 },
};

export type CompanionId = 'capivara' | 'onca' | 'arara' | 'botinho' | 'tatu' | 'carcara' | 'loboguara' | 'tamandua'
  | 'vagalume' | 'preguica' | 'sucuri' | 'graxaim' | 'coruja' | 'jacarezinho' | 'tuiuiu' | 'mico';

/** O que a habilidade (tecla F) faz. */
export type PetAbility = 'taunt' | 'pounce' | 'mark' | 'wave' | 'roll' | 'dive' | 'trail' | 'hug' | 'flash' | 'slow' | 'squeeze' | 'steal' | 'silence' | 'bite' | 'gust' | 'confuse';

export interface CompanionDef {
  id: CompanionId;
  name: string;
  element: ElementId;
  where: string;
  passive: string;
  active: string;
  activeName: string;
  ability: PetAbility;
  cooldown: number;
  hp: number; damage: number; speed: number;
  /** Voa em volta do herói e bica de longe, em vez de correr até o inimigo. */
  fly?: boolean;
}

const P = (id: CompanionId, name: string, element: ElementId, where: string, passive: string, activeName: string, ability: PetAbility, active: string, cooldown: number, hp: number, damage: number, speed: number, fly = false): CompanionDef =>
  ({ id, name, element, where, passive, activeName, ability, active, cooldown, hp, damage, speed, fly });

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
  capivara: P('capivara', 'Capivara', 'natureza', 'Fase 1-4', '+8% de vida', 'Chamar a Atenção', 'taunt', 'Por 4 s, os inimigos próximos atacam a capivara, que recebe metade do dano.', 14, 160, 6, 215),
  onca: P('onca', 'Onça-pintada', 'natureza', 'Fase 1-9, sem cair', '+5% de crítico', 'Bote', 'pounce', 'Salta no inimigo mais próximo com dano crítico.', 10, 110, 9, 270),
  arara: P('arara', 'Arara', 'tempestade', 'Fase 2-3', '+10% de ouro', 'Marcar', 'mark', 'Marca o inimigo mais forte: ele recebe +25% de dano por 6 s.', 12, 90, 7, 300, true),
  botinho: P('botinho', 'Boto-cor-de-rosa', 'agua', 'Fase 2-10', '+10% de cura recebida', 'Onda do Boto', 'wave', 'Uma onda molha todos os inimigos em volta e cura você em 10%.', 14, 120, 7, 260, true),
  tatu: P('tatu', 'Tatu-bola', 'terra', 'Fase 3-5', '+8% de defesa', 'Rolar', 'roll', 'Vira bola e rola pela sala, atordoando quem atropelar.', 12, 170, 7, 230),
  carcara: P('carcara', 'Carcará', 'tempestade', 'Fase 3-9', '+6% de velocidade de ataque', 'Mergulho', 'dive', 'Mergulha no inimigo mais forte e o atordoa por 2 s.', 11, 100, 10, 320, true),
  loboguara: P('loboguara', 'Lobo-guará', 'fogo', 'Fase 4-4', '+6% de velocidade de movimento', 'Corrida de Fogo', 'trail', 'Corre em volta de você deixando um rastro de fogo.', 13, 130, 9, 300),
  tamandua: P('tamandua', 'Tamanduá-bandeira', 'terra', 'Fase 4-10', '+6% de dano', 'Abraço', 'hug', 'Agarra o inimigo mais forte: ele fica preso por 3 s.', 14, 190, 9, 210),
  vagalume: P('vagalume', 'Vaga-lume', 'encanto', 'Fase 5-2', '+25% de recuperação de mana', 'Clarão', 'flash', 'Um clarão cega os inimigos em volta por 3 s.', 14, 70, 5, 300, true),
  preguica: P('preguica', 'Preguiça', 'natureza', 'Fase 5-8', 'Poções curam 25% mais', 'Bocejo', 'slow', 'Todos os inimigos da sala ficam lentos por 4 s.', 16, 170, 5, 170),
  sucuri: P('sucuri', 'Sucuri', 'agua', 'Fase 5-11', '+10% de dano em inimigos presos', 'Enrolar', 'squeeze', 'Enrola o inimigo mais perto: preso por 3 s e apertado.', 13, 180, 11, 240),
  graxaim: P('graxaim', 'Graxaim', 'sombra', 'Fase 6-3', '+10% de ouro', 'Afanar', 'steal', 'Bote num elite ou chefão: no fim da fase, um item a mais no baú (uma vez por fase).', 15, 110, 9, 290),
  coruja: P('coruja', 'Coruja-buraqueira', 'sombra', 'Fase 6-9', '+8% de dano de feitiço', 'Silenciar', 'silence', 'Os conjuradores e atiradores perto dela param de agir por 5 s.', 15, 80, 7, 300, true),
  jacarezinho: P('jacarezinho', 'Jacaré', 'agua', 'Fase 7-4', '+10% de dano contra elites e chefões', 'Mordida', 'bite', 'Mordida forte que deixa o alvo Rachado.', 11, 200, 12, 220),
  tuiuiu: P('tuiuiu', 'Tuiuiú', 'encanto', 'Fase 7-10', '−8% de recarga de feitiços', 'Bater de Asas', 'gust', 'Empurra todos os inimigos para longe de você.', 12, 110, 8, 300, true),
  mico: P('mico', 'Mico-leão-dourado', 'encanto', 'Torre, andar 50', '+15 de Sorte', 'Confusão', 'confuse', 'Dois inimigos trocam de lado por 5 s.', 14, 90, 8, 300),
};
export const COMPANION_ORDER = Object.keys(COMPANIONS) as CompanionId[];

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
