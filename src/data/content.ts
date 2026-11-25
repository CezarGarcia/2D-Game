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
  eletrocutar: { damage: 30 }, queimada: { damage: 36, radius: 120 }, lama: { root: 3 }, vapor: { radius: 120, blind: 4, burn: 9 },
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

/**
 * Padrinhos (docs/gdd/09): cada Encantado libertado dá bênçãos do seu jeito. O padrinho é o elemento dele.
 * As bênçãos sem padrinho são neutras: valem para qualquer build e não contam para sinergia nenhuma.
 */
export const PATRONS: Record<ElementId, { name: string; of: string; style: string }> = {
  natureza: { name: 'Curupira', of: 'do Curupira', style: 'Veneno, espinhos e enganar' },
  agua: { name: 'Iara', of: 'da Iara', style: 'Cura, mana e encanto' },
  tempestade: { name: 'Saci', of: 'do Saci', style: 'Velocidade, esquiva e redemoinho' },
  fogo: { name: 'Boitatá', of: 'do Boitatá', style: 'Dano e fogo' },
  terra: { name: 'Mapinguari', of: 'do Mapinguari', style: 'Defesa e golpes pesados' },
  sombra: { name: 'Lobisomem', of: 'do Lobisomem', style: 'Crítico, roubo de vida e abates' },
  encanto: { name: 'Cuca', of: 'da Cuca', style: 'Feitiços e reações' },
};

/** Bênçãos comuns de altar: 8 de cada padrinho e 8 neutras. */
export type BaseBlessingId =
  /* Curupira */ | 'peconha' | 'ourico' | 'espinhos' | 'seiva' | 'perfurar' | 'pegadas' | 'cipoal' | 'mataViva'
  /* Iara */ | 'cura' | 'fonte' | 'vigor' | 'canto' | 'mare' | 'remanso' | 'aguaBenta' | 'ondaMansa'
  /* Saci */ | 'vento' | 'folego' | 'passo' | 'pressa' | 'projetil' | 'piao' | 'corisco' | 'gorro'
  /* Boitatá */ | 'estouro' | 'furia' | 'rastro' | 'ticao' | 'lenha' | 'brasaViva' | 'chama' | 'cinzas'
  /* Mapinguari */ | 'couro' | 'amparo' | 'gigante' | 'forca' | 'pisada' | 'pilao' | 'quebraPedra' | 'rachadura'
  /* Lobisomem */ | 'olho' | 'ferocidade' | 'sanguessuga' | 'faro' | 'sedeDeSangue' | 'luaCheia' | 'mordida' | 'carniceiro'
  /* Cuca */ | 'mandinga' | 'ligeireza' | 'inteligencia' | 'caldeirao' | 'quebranto' | 'olhoGordo' | 'receita' | 'unha'
  /* neutras */ | 'ouro' | 'sabedoria' | 'fartura' | 'parceria' | 'agilidade' | 'cantil' | 'segundaChance' | 'trevo';

/** Formas despertas: duas para cada bênção que desperta, à escolha, quando ela chega ao máximo. */
export type AwakenedId =
  | 'ouricoCacheiro' | 'espinhoComprido' | 'mandacaru' | 'cascaGrossa' | 'cipoalFechado' | 'lacoCerteiro'
  | 'aguaFunda' | 'sangueFrio' | 'garrafada' | 'aguaDeCheiro' | 'enxurrada' | 'remansoFundo'
  | 'vendaval' | 'peDeMoleque' | 'assobio' | 'sumico' | 'maoLeve' | 'ventania'
  | 'furiaDoBoitata' | 'furiaCega' | 'labareda' | 'ferroEmBrasa' | 'fogoQueAnda' | 'brasaDormida'
  | 'couroDeAnta' | 'peFincado' | 'maoDePedra' | 'bracoDeFerro' | 'bracoDeGigante' | 'abraco'
  | 'olhoDeLobo' | 'golpeBaixo' | 'chupaSangue' | 'sangueFervendo' | 'boteFinal' | 'cacadorDaNoite'
  | 'feiticaria' | 'rezaBrava' | 'rezaDaMeiaNoite' | 'ecoDaCuca';

/** Compadrio: bênção de dois padrinhos, para quem tem pelo menos duas de cada um. */
export type CompadrioId = 'banhoMaria' | 'molecagem' | 'pesadelo' | 'magma' | 'igarape' | 'luaVentosa' | 'acalanto' | 'raizDePedra';

export type BlessingId = BaseBlessingId | AwakenedId | CompadrioId;
export type BlessingKind = 'normal' | 'desperta' | 'compadrio';
export type BlessingTier = 1 | 2 | 3 | 4;

export interface BlessingDef {
  id: BlessingId;
  name: string;
  desc: string;
  /** Chave do ícone em src/art/uiicons.ts. */
  icon: string;
  /** 1 = comum, 2 = rara, 3 = épica, 4 = lendária (despertas e compadrios). Mais alta, mais forte e mais difícil de aparecer. */
  tier: BlessingTier;
  /** Quantas vezes pode ser escolhida na mesma fase. */
  max: number;
  kind: BlessingKind;
  /** Padrinho (o elemento do Encantado), ou nulo se for neutra. */
  patron: ElementId | null;
  /** Forma desperta: a bênção de que ela vem. */
  awakens?: BaseBlessingId;
  /** Compadrio: os dois padrinhos. */
  pair?: [ElementId, ElementId];
}

const DEFS: BlessingDef[] = [];
const patronGroup = (patron: ElementId | null) => (id: BaseBlessingId, name: string, tier: 1 | 2 | 3, max: number, icon: string, desc: string): void => { DEFS.push({ id, name, tier, max, icon, desc, kind: 'normal', patron }); };

/* Curupira: veneno, espinhos e enganar */
let B = patronGroup('natureza');
B('peconha', 'Peçonha', 2, 1, 'veneno', 'Todo golpe de arma envenena');
B('ourico', 'Ouriço', 2, 2, 'espinhos', 'A cada 4 s você dispara espinhos em todas as direções');
B('espinhos', 'Couro de Ouriço', 1, 2, 'espinhos', 'Quem te acerta de perto recebe 35% do dano de volta');
B('seiva', 'Seiva Viva', 2, 3, 'regeneracao', 'Recupera 1% da vida por segundo');
B('perfurar', 'Ponta Dura', 2, 1, 'perfurar', 'Flechas e espinhos atravessam os inimigos');
B('pegadas', 'Pegadas Trocadas', 2, 1, 'esquiva', 'A esquiva levanta poeira: quem entra nela erra os golpes');
B('cipoal', 'Cipoal', 2, 2, 'cipo', 'Golpes de arma têm 12% de chance de prender o inimigo por 1 s');
B('mataViva', 'Mata Viva', 3, 1, 'broto', 'Inimigos presos, lentos ou envenenados recebem 25% mais dano');

/* Iara: cura, mana e encanto */
B = patronGroup('agua');
B('cura', 'Fruta Madura', 1, 9, 'cura', 'Cura 60% da vida e devolve as poções');
B('fonte', 'Olho-d’Água', 1, 2, 'mana', 'Feitiços custam 30% menos mana');
B('vigor', 'Seiva Grossa', 1, 4, 'vida', '+20% de vida máxima, e cura esse tanto agora');
B('canto', 'Canto da Iara', 2, 1, 'sussurro', 'O primeiro golpe em cada inimigo o deixa encantado por 1,5 s: ele ataca os outros');
B('mare', 'Maré Cheia', 1, 3, 'cura', '+15% de cura recebida');
B('remanso', 'Remanso', 1, 3, 'mana', '+30% de recuperação de mana');
B('aguaBenta', 'Água Benta', 2, 2, 'st_molhado', 'Golpes de arma têm 20% de chance de molhar o inimigo');
B('ondaMansa', 'Onda Mansa', 2, 1, 'onda', 'A esquiva perfeita molha quem está perto e cura 5% da vida');

/* Saci: velocidade, esquiva e redemoinho */
B = patronGroup('tempestade');
B('vento', 'Pé de Vento', 1, 3, 'movimento', '+12% de velocidade de movimento');
B('folego', 'Fôlego de Onça', 2, 1, 'esquiva', '+1 esquiva guardada');
B('passo', 'Passo Leve', 1, 3, 'esquiva', 'A esquiva recarrega 25% mais rápido');
B('pressa', 'Mãos Ligeiras', 1, 4, 'velAtaque', '+12% de velocidade de ataque');
B('projetil', 'Mais Um', 3, 3, 'projetil', '+1 projétil: mais uma flecha por tiro e mais um espinho por Dardo');
B('piao', 'Pião', 2, 1, 'redemoinho', 'A esquiva perfeita solta um redemoinho que arrasta os inimigos');
B('corisco', 'Corisco', 2, 2, 'st_carregado', 'Golpes de arma têm 20% de chance de deixar o inimigo Carregado');
B('gorro', 'Gorro Vermelho', 3, 1, 'pedevento', 'Feitiços têm 20% de chance de não entrar em recarga');

/* Boitatá: dano e fogo */
B = patronGroup('fogo');
B('estouro', 'Estouro', 3, 1, 'explosao', 'Inimigos derrotados explodem e ferem quem está perto');
B('furia', 'Fúria', 1, 5, 'dano', '+15% de dano de arma');
B('rastro', 'Rastro Aceso', 2, 1, 'coivara', 'Correr durante a luta deixa fogo no chão');
B('ticao', 'Tição', 2, 2, 'st_queimando', 'Golpes de arma têm 20% de chance de queimar o inimigo');
B('lenha', 'Lenha Seca', 1, 3, 'brasa', 'Inimigos queimando recebem 15% mais dano');
B('brasaViva', 'Brasa Viva', 2, 1, 'fogofatuo', 'Críticos de arma queimam o inimigo');
B('chama', 'Chama Alta', 1, 5, 'fogo', '+8% de dano de arma e de feitiço');
B('cinzas', 'Cinzas Quentes', 2, 1, 'passocinza', 'Derrotar um inimigo queimando devolve 8 de mana e 2% da vida');

/* Mapinguari: defesa e golpes pesados */
B = patronGroup('terra');
B('couro', 'Couro Duro', 1, 3, 'defesa', 'Recebe 12% menos dano');
B('amparo', 'Amparo', 2, 1, 'escudo', 'Em cada sala, o primeiro golpe que você tomaria não causa dano');
B('gigante', 'Braço Comprido', 2, 2, 'alcance', '+25% de alcance dos golpes e de área dos feitiços');
B('forca', 'Braço Forte', 1, 5, 'forca', '+6 de Força');
B('pisada', 'Pisada', 3, 1, 'tremor', 'A cada 8 golpes de arma, um tremor fere todos em volta de você');
B('pilao', 'Mão de Pilão', 1, 3, 'pedrada', '+15% de dano no último golpe da sequência e no golpe carregado');
B('quebraPedra', 'Quebra-Pedra', 2, 1, 'execucao', 'Seus golpes de arma ignoram a blindagem');
B('rachadura', 'Rachadura', 2, 2, 'st_rachado', 'Golpes de arma têm 20% de chance de rachar o inimigo');

/* Lobisomem: crítico, roubo de vida e abates */
B = patronGroup('sombra');
B('olho', 'Olho de Gavião', 1, 4, 'critico', '+10% de chance de crítico');
B('ferocidade', 'Ferocidade', 2, 3, 'danoCritico', '+35% de dano crítico');
B('sanguessuga', 'Sanguessuga', 2, 3, 'roubo', 'Golpes de arma devolvem 4% do dano como vida');
B('faro', 'Faro', 2, 2, 'marcalua', 'Inimigos com menos de 30% de vida recebem 25% mais dano');
B('sedeDeSangue', 'Sede de Sangue', 2, 1, 'furia', 'Cada inimigo derrotado dá +4% de dano de arma por 6 s, até 5 vezes');
B('luaCheia', 'Lua Cheia', 3, 1, 'lua', 'A cada 20 s de luta você entra em fúria por 5 s: +40% de dano de arma e roubo de vida');
B('mordida', 'Mordida', 2, 2, 'st_amaldicoado', 'Golpes de arma têm 20% de chance de amaldiçoar o inimigo');
B('carniceiro', 'Carniceiro', 1, 3, 'garra', 'Derrotar um inimigo cura 2% da vida');

/* Cuca: feitiços e reações */
B = patronGroup('encanto');
B('mandinga', 'Mandinga Forte', 1, 5, 'magia', '+20% de dano de feitiço');
B('ligeireza', 'Reza Ligeira', 1, 3, 'recarga', 'Feitiços recarregam 20% mais rápido');
B('inteligencia', 'Cabeça Fria', 1, 5, 'inteligencia', '+6 de Inteligência');
B('caldeirao', 'Caldeirão', 2, 2, 'borbulhante', 'Feitiços têm 15% de chance de não gastar mana');
B('quebranto', 'Quebranto', 2, 2, 'st_confuso', 'Golpes de arma têm 20% de chance de confundir o inimigo');
B('olhoGordo', 'Olho Gordo', 1, 3, 'espelho', '+10% de chance de crítico dos feitiços');
B('receita', 'Receita Antiga', 3, 1, 'reacao', 'Reações de elementos causam 40% mais dano');
B('unha', 'Unha de Bruxa', 1, 3, 'relogio', 'Os efeitos de elemento que você aplica duram 25% mais');

/* neutras */
B = patronGroup(null);
B('ouro', 'Pote de Ouro', 1, 2, 'ouro', '+40% de ouro nesta fase');
B('sabedoria', 'Lição da Mata', 1, 2, 'xp', '+25% de experiência nesta fase');
B('fartura', 'Fartura', 3, 1, 'bau', '+1 item no baú desta fase');
B('parceria', 'Parceria', 2, 2, 'companheiro', 'Seu companheiro causa e aguenta 50% mais');
B('agilidade', 'Corpo Leve', 1, 5, 'agilidade', '+6 de Agilidade');
B('cantil', 'Cantil Cheio', 1, 2, 'pocao', '+1 poção, e ganha uma agora');
B('segundaChance', 'Corpo Fechado', 3, 1, 'vitalidade', 'Uma vez por fase, o golpe que derrubaria você te deixa com 1 de vida e 2 s sem poder ser ferido');
B('trevo', 'Trevo', 1, 2, 'sorte', '+15 de Sorte para os itens desta fase');

/** As bênçãos comuns, na ordem em que entram no sorteio do altar. */
export const BLESSING_ORDER = DEFS.map((d) => d.id) as BaseBlessingId[];

/* ---------- Despertar ---------- */

const patronOf = (id: BaseBlessingId) => DEFS.find((d) => d.id === id)!.patron;
const iconOf = (id: BaseBlessingId) => DEFS.find((d) => d.id === id)!.icon;
const AWAKE: [BaseBlessingId, [AwakenedId, string, string], [AwakenedId, string, string]][] = [
  ['ourico', ['ouricoCacheiro', 'Ouriço-Cacheiro', 'Os espinhos do Ouriço saem a cada 2 s'], ['espinhoComprido', 'Espinho Comprido', 'Os espinhos do Ouriço atravessam os inimigos e causam 60% mais dano']],
  ['espinhos', ['mandacaru', 'Abraço de Mandacaru', 'Quem te acerta de perto fica preso por 1,5 s'], ['cascaGrossa', 'Casca Grossa', 'Devolve o dobro do dano e você recebe 10% menos dano']],
  ['cipoal', ['cipoalFechado', 'Cipoal Fechado', 'Quem fica preso pelo Cipoal fica 2 s e também é envenenado'], ['lacoCerteiro', 'Laço Certeiro', '+16% de chance de prender com golpes de arma']],
  ['vigor', ['aguaFunda', 'Água Funda', '+25% de vida máxima'], ['sangueFrio', 'Sangue Frio', 'Abaixo de 35% de vida, você recebe 30% menos dano']],
  ['mare', ['garrafada', 'Garrafada', 'As poções curam 40% a mais'], ['aguaDeCheiro', 'Água de Cheiro', 'Recupera 1,5% da vida por segundo']],
  ['aguaBenta', ['enxurrada', 'Enxurrada', '+30% de chance de molhar com golpes de arma'], ['remansoFundo', 'Remanso Fundo', 'Inimigos molhados recebem 20% mais dano']],
  ['vento', ['vendaval', 'Vendaval', 'A esquiva deixa um redemoinho que arrasta e fere os inimigos'], ['peDeMoleque', 'Pé de Moleque', '+15% de velocidade de movimento e +10% de velocidade de ataque']],
  ['passo', ['assobio', 'Assobio do Saci', '+1 esquiva guardada'], ['sumico', 'Sumiço', 'Depois de esquivar, seu próximo golpe de arma é crítico']],
  ['pressa', ['maoLeve', 'Mão Leve', '+20% de velocidade de ataque'], ['ventania', 'Ventania', 'Críticos de arma adiantam a esquiva e a recarga dos feitiços']],
  ['furia', ['furiaDoBoitata', 'Fúria do Boitatá', 'Todo golpe de arma queima o inimigo'], ['furiaCega', 'Fúria Cega', '+60% de dano de arma, mas você recebe 30% mais dano']],
  ['chama', ['labareda', 'Labareda', '+25% de dano de feitiço, e a área dos feitiços fica 15% maior'], ['ferroEmBrasa', 'Ferro em Brasa', '+25% de dano de arma e +20% de dano crítico']],
  ['ticao', ['fogoQueAnda', 'Fogo que Anda', 'Inimigos queimando explodem ao cair e espalham o fogo'], ['brasaDormida', 'Brasa Dormida', 'Os efeitos de elemento que você aplica duram 60% mais']],
  ['couro', ['couroDeAnta', 'Couro de Anta', 'Recebe 15% menos dano'], ['peFincado', 'Pé Fincado', 'Golpes não te empurram nem interrompem o que você está fazendo']],
  ['pilao', ['maoDePedra', 'Mão de Pedra', 'O último golpe da sequência e o golpe carregado racham o inimigo'], ['bracoDeFerro', 'Braço de Ferro', '+30% de dano no último golpe da sequência e no golpe carregado']],
  ['gigante', ['bracoDeGigante', 'Braço de Gigante', '+30% de alcance dos golpes e de área dos feitiços'], ['abraco', 'Abraço do Mapinguari', 'O último golpe da sequência acerta todos em volta de você']],
  ['olho', ['olhoDeLobo', 'Olho de Lobo', '+15% de chance de crítico, e críticos de arma amaldiçoam o inimigo'], ['golpeBaixo', 'Golpe Baixo', '+60% de dano crítico']],
  ['sanguessuga', ['chupaSangue', 'Chupa-Sangue', 'Golpes de arma devolvem mais 6% do dano como vida'], ['sangueFervendo', 'Sangue Fervendo', 'Abaixo de 35% de vida: +40% de dano de arma e de velocidade de ataque']],
  ['faro', ['boteFinal', 'Bote Final', 'Golpes de arma em inimigos com menos de 25% de vida são sempre críticos'], ['cacadorDaNoite', 'Caçador da Noite', '+15% de dano contra elites e chefões']],
  ['mandinga', ['feiticaria', 'Feitiçaria', 'A área dos feitiços fica 40% maior'], ['rezaBrava', 'Reza Brava', 'Feitiços causam 35% mais dano em inimigos com algum efeito de elemento']],
  ['ligeireza', ['rezaDaMeiaNoite', 'Reza da Meia-Noite', 'Feitiços recarregam 25% mais rápido'], ['ecoDaCuca', 'Eco da Cuca', 'Feitiços têm 25% de chance de não entrar em recarga']],
];

/** As duas formas despertas de cada bênção que desperta. */
export const AWAKENINGS: Partial<Record<BaseBlessingId, [AwakenedId, AwakenedId]>> = {};
for (const [base, a, b] of AWAKE) {
  AWAKENINGS[base] = [a[0], b[0]];
  for (const [id, name, desc] of [a, b]) DEFS.push({ id, name, desc, icon: iconOf(base), tier: 4, max: 1, kind: 'desperta', patron: patronOf(base), awakens: base });
}

/* ---------- Compadrio ---------- */

const COMP: [CompadrioId, ElementId, ElementId, string, string, string][] = [
  ['banhoMaria', 'agua', 'fogo', 'Banho-Maria', 'nuvem', 'A reação Vapor também fere quem está dentro da nuvem, a cada meio segundo'],
  ['molecagem', 'tempestade', 'natureza', 'Molecagem', 'espelho', 'A esquiva deixa um sósia que atrai os inimigos por 2 s'],
  ['pesadelo', 'sombra', 'encanto', 'Pesadelo', 'ninar', 'Críticos de arma em inimigos confusos os fazem fugir por 2 s'],
  ['magma', 'terra', 'fogo', 'Magma', 'coivara', 'O último golpe da sequência e o golpe carregado deixam fogo no chão'],
  ['igarape', 'agua', 'natureza', 'Igarapé', 'broto', 'Beber uma poção prende por 2 s e envenena os inimigos em volta'],
  ['luaVentosa', 'tempestade', 'sombra', 'Lua Ventosa', 'uivo', 'Cada inimigo derrotado dá +5% de velocidade de movimento e de ataque por 4 s, até 5 vezes'],
  ['acalanto', 'encanto', 'agua', 'Acalanto', 'ninar', 'Inimigos confusos ou encantados ficam lentos quando você os acerta'],
  ['raizDePedra', 'terra', 'natureza', 'Raiz de Pedra', 'estaca', 'Inimigos presos ficam Rachados: perdem a blindagem e recebem mais dano'],
];
/** Compadrios existentes, com o par de padrinhos de cada um. */
export const COMPADRIOS: { id: CompadrioId; a: ElementId; b: ElementId }[] = COMP.map(([id, a, b]) => ({ id, a, b }));
for (const [id, a, b, name, icon, desc] of COMP) DEFS.push({ id, name, desc, icon, tier: 4, max: 1, kind: 'compadrio', patron: null, pair: [a, b] });
/** Quantas bênçãos de cada padrinho do par é preciso ter para o Compadrio aparecer. */
export const COMPADRIO_NEEDS = 2;

export const BLESSINGS = Object.fromEntries(DEFS.map((d) => [d.id, d])) as Record<BlessingId, BlessingDef>;

/** Peso de cada raridade no sorteio do altar (as lendárias nunca saem do sorteio comum). */
export const BLESSING_WEIGHT: Record<BlessingTier, number> = { 1: 60, 2: 30, 3: 12, 4: 0 };
export const BLESSING_TIER_LABEL: Record<BlessingTier, string> = { 1: 'Comum', 2: 'Rara', 3: 'Épica', 4: 'Lendária' };
export const BLESSING_TIER_COLOR: Record<BlessingTier, string> = { 1: '#9BE7C0', 2: '#6AA5FF', 3: '#BC8CFF', 4: '#FFB238' };
/** Altares seguidos só com bênçãos comuns antes de o próximo garantir uma rara ou melhor. */
/** Bênçãos que só mexem no que a fase paga (ouro e experiência): não aparecem no Sonho, que não paga por sala. */
export const STAGE_ONLY_BLESSINGS: readonly BaseBlessingId[] = ['ouro', 'sabedoria'];

export const ALTAR_PITY = 2;

/** Quantas vezes cada bênção já foi escolhida. */
export function blessingCounts(list: BlessingId[]): Partial<Record<BlessingId, number>> {
  const out: Partial<Record<BlessingId, number>> = {};
  for (const b of list) out[b] = (out[b] ?? 0) + 1;
  return out;
}

/* ---------- sinergia de padrinho ---------- */

/** Quantas bênçãos do mesmo padrinho acendem cada faixa. */
export const PATRON_STEPS = [3, 5, 7] as const;
/** O que cada faixa dá (os efeitos estão em src/meta/stats.ts). */
export const PATRON_TIERS: Record<ElementId, [string, string, string]> = {
  natureza: ['Seu veneno causa 30% mais dano', 'A esquiva perfeita solta espinhos em todas as direções', 'Inimigos envenenados, presos, lentos ou cegos causam 25% menos dano a você'],
  agua: ['+20% de cura recebida', 'A esquiva perfeita molha quem está perto e cura 5% da vida', 'Uma vez por sala, ao cair abaixo de 30% de vida, você recupera 35%'],
  tempestade: ['+1 esquiva guardada', 'A esquiva perfeita solta um redemoinho que arrasta os inimigos', 'Por 3 s depois de cada esquiva, seus ataques são 40% mais rápidos'],
  fogo: ['+20% de dano de Fogo', 'Críticos de arma queimam o inimigo', 'Inimigos queimando explodem ao cair e espalham o fogo'],
  terra: ['Recebe 10% menos dano', 'Inimigos rachados recebem 30% mais dano, em vez de 15%', 'Com mais de 80% da vida, +30% de dano de arma'],
  sombra: ['+10% de chance de crítico', 'Derrotar um inimigo cura 3% da vida', '+50% de dano crítico, e críticos de arma curam 1% da vida'],
  encanto: ['Feitiços custam 20% menos mana', 'Reações de elementos causam 40% mais dano', 'Feitiços têm 25% de chance de sair de graça e 25% de não entrar em recarga'],
};

/**
 * Bênçãos de cada padrinho na lista (cada escolha conta uma vez; um Compadrio conta para os dois padrinhos),
 * mais um se o companheiro for do elemento do padrinho.
 */
export function patronCounts(list: BlessingId[], companion: ElementId | null = null): Record<ElementId, number> {
  const out = {} as Record<ElementId, number>;
  for (const el of ELEMENT_ORDER) out[el] = 0;
  for (const id of list) {
    const d = BLESSINGS[id];
    if (!d) continue;
    if (d.patron) out[d.patron]++;
    if (d.pair) { out[d.pair[0]]++; out[d.pair[1]]++; }
  }
  if (companion) out[companion]++;
  return out;
}

/** Faixa de sinergia acesa (0 a 3) para um número de bênçãos. */
export function patronTier(count: number): 0 | 1 | 2 | 3 {
  return count >= PATRON_STEPS[2] ? 3 : count >= PATRON_STEPS[1] ? 2 : count >= PATRON_STEPS[0] ? 1 : 0;
}

/** O Despertar que cabe a esta lista: as duas formas de cada bênção no máximo que ainda não despertou. */
export function awakeningsFor(list: BlessingId[]): [AwakenedId, AwakenedId][] {
  const have = blessingCounts(list), out: [AwakenedId, AwakenedId][] = [];
  for (const base of Object.keys(AWAKENINGS) as BaseBlessingId[]) {
    const forms = AWAKENINGS[base]!;
    if ((have[base] ?? 0) >= BLESSINGS[base].max && !have[forms[0]] && !have[forms[1]]) out.push(forms);
  }
  return out;
}

/** Compadrios que esta lista já pode receber (duas bênçãos de cada padrinho do par, sem contar o companheiro). */
export function compadriosFor(list: BlessingId[]): CompadrioId[] {
  const n = patronCounts(list), have = blessingCounts(list);
  return COMPADRIOS.filter((c) => !have[c.id] && n[c.a] >= COMPADRIO_NEEDS && n[c.b] >= COMPADRIO_NEEDS).map((c) => c.id);
}

export const MAX_POTIONS = 2;
/** Fração da vida máxima curada por poção. */
export const POTION_HEAL = 0.35;
