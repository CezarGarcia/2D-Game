/**
 * Teia de talentos: uma árvore só, radial, a partir do centro (docs/gdd/02).
 * Seis setores, um por atributo. Cada setor tem uma raiz, um tronco de cinco nós que termina
 * num Dom, e dois galhos laterais. Um anel de elos liga setores vizinhos, e cada elo leva a uma joia.
 * Um nó só recebe ponto se estiver ligado a um nó que já tem ponto.
 */
import { fcos, fsin } from '../sim/fmath';

export type Sector = 'forca' | 'vitalidade' | 'agilidade' | 'inteligencia' | 'espirito' | 'sorte';
export type TalentKind = 'raiz' | 'comum' | 'chave' | 'ligacao' | 'joia' | 'dom';

export interface TalentNode {
  id: string;
  sector: Sector;
  kind: TalentKind;
  name: string;
  max: number;
  /** Texto do efeito com `rank` pontos (rank mínimo 1). */
  desc: (rank: number) => string;
  /** Chave do ícone em src/art/uiicons.ts. */
  icon: string;
  /** Posição polar na teia: ângulo em graus (0 = direita, sentido horário) e raio. */
  ang: number; rad: number;
  links: string[];
}

export const SECTORS: Record<Sector, { label: string; ang: number; color: string; desc: string }> = {
  forca: { label: 'Força', ang: 0, color: '#E4572E', desc: 'Dano com o facão, críticos e golpes contra inimigos grandes.' },
  vitalidade: { label: 'Vitalidade', ang: 60, color: '#D9A441', desc: 'Vida, defesa, poções e formas de não cair.' },
  espirito: { label: 'Espírito', ang: 120, color: '#5FBF8E', desc: 'Mana, recarga dos feitiços, cura e bênçãos.' },
  inteligencia: { label: 'Inteligência', ang: 180, color: '#3FA7E0', desc: 'Dano dos feitiços, veneno, reações e experiência.' },
  sorte: { label: 'Sorte', ang: 240, color: '#B98CFF', desc: 'Ouro, itens melhores, ferreiro mais barato e companheiro.' },
  agilidade: { label: 'Agilidade', ang: 300, color: '#8FE36A', desc: 'Esquiva, velocidade, arco e golpes rápidos.' },
};
export const SECTOR_ORDER: Sector[] = ['forca', 'vitalidade', 'espirito', 'inteligencia', 'sorte', 'agilidade'];

type Def = [id: string, name: string, max: number, icon: string, desc: (r: number) => string];
const one = (text: string) => () => text;

interface SectorPlan { root: Def; spine: Def[]; dom: Def; left: [Def, Def]; right: [Def, Def] }

const PLANS: Record<Sector, SectorPlan> = {
  forca: {
    root: ['raizForca', 'Raiz da Força', 1, 'forca', one('+3 de Força')],
    spine: [
      ['maoPesada', 'Mão Pesada', 5, 'dano', (r) => `+${3 * r}% de dano de arma`],
      ['sedeDeBriga', 'Sede de Briga', 1, 'furia', one('Cada inimigo derrotado dá +4% de dano por 6 s. Acumula 5 vezes.')],
      ['golpeCerteiro', 'Golpe Certeiro', 5, 'critico', (r) => `+${2 * r}% de chance de crítico`],
      ['execucao', 'Execução', 1, 'execucao', one('Golpes em inimigos com menos de 25% de vida são sempre críticos.')],
      ['brutalidade', 'Brutalidade', 5, 'danoCritico', (r) => `+${6 * r}% de dano crítico`],
    ],
    dom: ['sangueQuente', 'Sangue Quente', 1, 'furia', one('Com menos de 35% de vida: +40% de dano e de velocidade de ataque.')],
    left: [
      ['quebraCasca', 'Quebra-Casca', 5, 'elite', (r) => `+${5 * r}% de dano contra elites e chefões`],
      ['arrombar', 'Arrombar', 1, 'perfurar', one('Seus golpes de arma ignoram a blindagem dos inimigos.')],
    ],
    right: [
      ['pesoDoGolpe', 'Peso do Golpe', 5, 'dano', (r) => `+${6 * r}% de dano no terceiro golpe e no tiro carregado`],
      ['golpeLargo', 'Golpe Largo', 1, 'alcance', one('O terceiro golpe da sequência acerta todos à sua volta.')],
    ],
  },
  vitalidade: {
    root: ['raizVitalidade', 'Raiz da Vitalidade', 1, 'vitalidade', one('+3 de Vitalidade')],
    spine: [
      ['couroCurtido', 'Couro Curtido', 5, 'defesa', (r) => `+${3 * r}% de defesa`],
      ['contragolpe', 'Contragolpe', 1, 'escudo', one('Depois de aparar com o escudo, o próximo golpe causa 250%.')],
      ['folego', 'Fôlego', 5, 'vida', (r) => `+${4 * r}% de vida`],
      ['cascaDeJabuti', 'Casca de Jabuti', 1, 'escudo', one('Uma vez por fase, um golpe fatal deixa você com 1 de vida e 2 s sem tomar dano.')],
      ['sangueBom', 'Sangue Bom', 5, 'regeneracao', (r) => `Recupera ${(0.15 * r).toFixed(2).replace('.', ',')}% da vida por segundo`],
    ],
    dom: ['segundoFolego', 'Segundo Fôlego', 1, 'cura', one('Você pode cair mais uma vez por fase antes de perdê-la.')],
    left: [
      ['pocaoForte', 'Poção Forte', 5, 'pocao', (r) => `Poções curam +${6 * r}% da vida`],
      ['cantilCheio', 'Cantil Cheio', 1, 'pocao', one('+1 poção por fase.')],
    ],
    right: [
      ['peleGrossa', 'Pele Grossa', 5, 'resistencia', (r) => `+${4 * r}% de resistência a todos os elementos`],
      ['espinhoVivo', 'Espinho Vivo', 1, 'espinhos', one('Quem te acerta de perto recebe 25% do dano de volta.')],
    ],
  },
  espirito: {
    root: ['raizEspirito', 'Raiz do Espírito', 1, 'espirito', one('+3 de Espírito')],
    spine: [
      ['fonte', 'Fonte', 5, 'mana', (r) => `+${5 * r}% de mana máxima`],
      ['mare', 'Maré', 1, 'mana', one('Golpes de arma devolvem o dobro de mana.')],
      ['pressa', 'Pressa', 5, 'recarga', (r) => `Feitiços recarregam ${3 * r}% mais rápido`],
      ['sopro', 'Sopro', 1, 'mana', one('Cada inimigo derrotado devolve 6 de mana.')],
      ['menteCalma', 'Mente Calma', 5, 'regeneracao', (r) => `+${12 * r}% de regeneração de mana`],
    ],
    dom: ['fluxo', 'Fluxo', 1, 'magia', one('Feitiços têm 25% de chance de não gastar mana e recarregam 15% mais rápido.')],
    left: [
      ['curaMaior', 'Cura Maior', 5, 'cura', (r) => `+${6 * r}% em toda cura recebida`],
      ['bencaoFarta', 'Bênção Farta', 1, 'altar', one('O altar oferece 4 bênçãos em vez de 3.')],
    ],
    right: [
      ['duracao', 'Longa Duração', 5, 'relogio', (r) => `Seus efeitos (veneno, lentidão, prisão, casca, broto) duram ${6 * r}% mais`],
      ['pocoFundo', 'Poço Fundo', 1, 'mana', one('Derrotar um elite ou chefão recupera toda a mana.')],
    ],
  },
  inteligencia: {
    root: ['raizInteligencia', 'Raiz da Inteligência', 1, 'inteligencia', one('+3 de Inteligência')],
    spine: [
      ['palavraForte', 'Palavra Forte', 5, 'magia', (r) => `+${3 * r}% de dano de feitiço`],
      ['eco', 'Eco', 1, 'recarga', one('20% de chance de o feitiço não entrar em recarga.')],
      ['foco', 'Foco', 5, 'critico', (r) => `+${2 * r}% de chance de crítico com feitiços`],
      ['sobrecarga', 'Sobrecarga', 1, 'danoCritico', one('Críticos de feitiço causam 250% em vez de 150%.')],
      ['venenoForte', 'Veneno Forte', 5, 'veneno', (r) => `+${10 * r}% de dano de veneno`],
    ],
    dom: ['arquimago', 'Arquimago', 1, 'magia', one('+25% de dano de feitiço e feitiços custam 20% menos mana.')],
    left: [
      ['sabedoria', 'Sabedoria', 5, 'xp', (r) => `+${4 * r}% de experiência`],
      ['estudioso', 'Estudioso', 1, 'tomo', one('Subir o nível de um feitiço gasta 1 tomo a menos (mínimo 1).')],
    ],
    right: [
      ['alcanceMagico', 'Alcance', 5, 'alcance', (r) => `+${5 * r}% de área e alcance dos feitiços`],
      ['catalisador', 'Catalisador', 1, 'explosao', one('Reações entre elementos causam +40% de dano.')],
    ],
  },
  sorte: {
    root: ['raizSorte', 'Raiz da Sorte', 1, 'sorte', one('+3 de Sorte')],
    spine: [
      ['olhoVivo', 'Olho Vivo', 5, 'ouro', (r) => `+${3 * r}% de ouro`],
      ['farejador', 'Farejador', 1, 'item', one('Todo baú de fase traz 1 item a mais.')],
      ['boaEstrela', 'Boa Estrela', 5, 'sorte', (r) => `+${4 * r} de Sorte ao abrir baús (mais itens raros)`],
      ['catador', 'Catador', 1, 'material', one('+50% de resina e de pó de assombro.')],
      ['pechincha', 'Pechincha', 5, 'ouro', (r) => `O ferreiro cobra ${4 * r}% menos ouro`],
    ],
    dom: ['dedoDeOuro', 'Dedo de Ouro', 1, 'bau', one('Itens com nome têm o dobro da chance de cair, e o primeiro item de cada baú é pelo menos Raro.')],
    left: [
      ['bomTrato', 'Bom Trato', 5, 'companheiro', (r) => `+${5 * r}% de vida e dano do companheiro`],
      ['seteVidas', 'Sete Vidas', 1, 'companheiro', one('Se cair, o companheiro volta em 8 s.')],
    ],
    right: [
      ['faro', 'Faro', 5, 'recarga', (r) => `A habilidade do companheiro recarrega ${5 * r}% mais rápido`],
      ['ataqueCombinado', 'Ataque Combinado', 1, 'companheiro', one('A habilidade do companheiro tem o dobro do efeito.')],
    ],
  },
  agilidade: {
    root: ['raizAgilidade', 'Raiz da Agilidade', 1, 'agilidade', one('+3 de Agilidade')],
    spine: [
      ['peLigeiro', 'Pé Ligeiro', 5, 'movimento', (r) => `+${2 * r}% de velocidade de movimento`],
      ['rolamentoCortante', 'Rolamento Cortante', 1, 'esquiva', one('A esquiva causa dano em todo inimigo que você atravessa.')],
      ['reflexo', 'Reflexo', 5, 'esquiva', (r) => `A esquiva recarrega ${4 * r}% mais rápido`],
      ['segundaEsquiva', 'Segunda Esquiva', 1, 'esquiva', one('Você guarda duas esquivas.')],
      ['maosRapidas', 'Mãos Rápidas', 5, 'velAtaque', (r) => `+${2 * r}% de velocidade de ataque`],
    ],
    dom: ['olhoDeOnca', 'Olho de Onça', 1, 'critico', one('Cada crítico adianta a recarga da esquiva em 0,5 s e a dos feitiços em 0,3 s.')],
    left: [
      ['flechaCerteira', 'Flecha Certeira', 5, 'projetil', (r) => `+${3 * r}% de dano com arco`],
      ['flechaDupla', 'Flecha Dupla', 1, 'projetil', one('O tiro normal do arco solta 2 flechas.')],
    ],
    right: [
      ['olhoAberto', 'Olho Aberto', 5, 'relogio', (r) => `+${8 * r}% de tempo para acertar a esquiva perfeita`],
      ['contraAtaque', 'Contra-Ataque', 1, 'dano', one('Depois de uma esquiva perfeita, o próximo golpe causa 250% em vez de 150%.')],
    ],
  },
};

/** Elo entre um setor e o seguinte (em sentido horário), e a joia que fica além dele. */
const RING: Record<Sector, { elo: Def; joia: Def }> = {
  forca: {
    elo: ['eloForcaVitalidade', 'Elo do Guerreiro', 1, 'vida', one('+15 de vida e +2% de dano de arma')],
    joia: ['joiaGuerreiro', 'Joia do Guerreiro', 3, 'dano', (r) => `+${2 * r}% de dano de arma e +${2 * r}% de vida`],
  },
  vitalidade: {
    elo: ['eloVitalidadeEspirito', 'Elo do Fôlego', 1, 'vida', one('+10 de vida e +6 de mana')],
    joia: ['joiaMonge', 'Joia do Monge', 3, 'vida', (r) => `+${2 * r}% de vida e +${3 * r}% de mana`],
  },
  espirito: {
    elo: ['eloInteligenciaEspirito', 'Elo do Rezador', 1, 'magia', one('+3% de dano de feitiço e +6 de mana')],
    joia: ['joiaRezador', 'Joia do Rezador', 3, 'magia', (r) => `+${2 * r}% de dano de feitiço e +${3 * r}% de mana`],
  },
  inteligencia: {
    elo: ['eloSorteInteligencia', 'Elo do Curioso', 1, 'sorte', one('+2 de Sorte e +2 de Inteligência')],
    joia: ['joiaCurioso', 'Joia do Curioso', 3, 'xp', (r) => `+${2 * r}% de experiência e +${2 * r}% de ouro`],
  },
  sorte: {
    elo: ['eloAgilidadeSorte', 'Elo do Esperto', 1, 'agilidade', one('+2 de Agilidade e +2 de Sorte')],
    joia: ['joiaMalandro', 'Joia do Malandro', 3, 'ouro', (r) => `+${r}% de chance de crítico e +${2 * r}% de ouro`],
  },
  agilidade: {
    elo: ['eloAgilidadeForca', 'Elo do Caçador', 1, 'velAtaque', one('+2% de velocidade de ataque e de movimento')],
    joia: ['joiaCacador', 'Joia do Caçador', 3, 'velAtaque', (r) => `+${r}% de velocidade de ataque e +${2 * r}% de dano de arma`],
  },
};

const R_ROOT = 74, R_SPINE = [150, 226, 302, 378, 454], R_DOM = 540;

function build(): TalentNode[] {
  const out: TalentNode[] = [];
  const add = (sector: Sector, kind: TalentKind, d: Def, ang: number, rad: number, links: string[]) => {
    out.push({ id: d[0], sector, kind, name: d[1], max: d[2], icon: d[3], desc: d[4], ang: (ang + 360) % 360, rad, links });
  };
  SECTOR_ORDER.forEach((sector, i) => {
    const P = PLANS[sector], ang = SECTORS[sector].ang, next = SECTOR_ORDER[(i + 1) % SECTOR_ORDER.length];
    add(sector, 'raiz', P.root, ang, R_ROOT, [P.spine[0][0]]);
    P.spine.forEach((d, k) => add(sector, d[2] === 1 ? 'chave' : 'comum', d, ang, R_SPINE[k], [k === 0 ? P.root[0] : P.spine[k - 1][0]]));
    add(sector, 'dom', P.dom, ang, R_DOM, [P.spine[4][0]]);
    add(sector, 'comum', P.left[0], ang - 15, 290, [P.spine[1][0]]);
    add(sector, 'chave', P.left[1], ang - 19, 366, [P.left[0][0]]);
    add(sector, 'comum', P.right[0], ang + 15, 290, [P.spine[1][0]]);
    add(sector, 'chave', P.right[1], ang + 19, 366, [P.right[0][0]]);
    add(sector, 'ligacao', RING[sector].elo, ang + 30, 404, [P.right[1][0], PLANS[next].left[1][0]]);
    add(sector, 'joia', RING[sector].joia, ang + 30, 488, [RING[sector].elo[0]]);
  });
  return out;
}

const nodes = build();

/* completa as ligações nos dois sentidos */
const byId = new Map(nodes.map((n) => [n.id, n]));
for (const n of nodes) for (const l of n.links) { const o = byId.get(l); if (o && !o.links.includes(n.id)) o.links.push(n.id); }

export const TALENTS: TalentNode[] = nodes;
export const TALENT_BY_ID: ReadonlyMap<string, TalentNode> = byId;
/** Raio da teia, para quem a desenha saber o tamanho. */
export const TALENT_RADIUS = R_DOM + 40;

export type TalentRanks = Record<string, number>;

export function talentSpent(ranks: TalentRanks): number {
  let s = 0;
  for (const k in ranks) s += ranks[k] || 0;
  return s;
}

/** Um nó está alcançável se é raiz ou tem um vizinho com ponto. */
export function talentReachable(ranks: TalentRanks, id: string): boolean {
  const n = byId.get(id);
  if (!n) return false;
  return n.kind === 'raiz' || n.links.some((l) => (ranks[l] || 0) > 0);
}

export function canAddTalent(ranks: TalentRanks, id: string, freePoints: number): boolean {
  const n = byId.get(id);
  return !!n && freePoints > 0 && (ranks[id] || 0) < n.max && talentReachable(ranks, id);
}

/** Todos os nós com ponto estão ligados a alguma raiz com ponto? */
export function talentsConnected(ranks: TalentRanks): boolean {
  const seen = new Set<string>();
  const stack = nodes.filter((n) => n.kind === 'raiz' && (ranks[n.id] || 0) > 0).map((n) => n.id);
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const l of byId.get(cur)!.links) if ((ranks[l] || 0) > 0 && !seen.has(l)) stack.push(l);
  }
  for (const id in ranks) if ((ranks[id] || 0) > 0 && !seen.has(id)) return false;
  return true;
}

/** Dá para tirar um ponto se todos os nós com ponto continuarem ligados a alguma raiz. */
export function canRemoveTalent(ranks: TalentRanks, id: string): boolean {
  if (!((ranks[id] || 0) > 0)) return false;
  return talentsConnected({ ...ranks, [id]: ranks[id] - 1 });
}

/** Por que o nó não pode receber ponto agora, em uma frase. Vazio se pode. */
export function talentBlockReason(ranks: TalentRanks, id: string, freePoints: number): string {
  const n = byId.get(id);
  if (!n) return '';
  if ((ranks[id] || 0) >= n.max) return 'Completo';
  if (!talentReachable(ranks, id)) return 'Precisa de um talento vizinho primeiro';
  if (freePoints <= 0) return 'Sem pontos livres';
  return '';
}

/** Posição cartesiana do nó, com o centro da teia em (0, 0). */
export function talentPos(n: TalentNode): { x: number; y: number } {
  const a = (n.ang * Math.PI) / 180;
  return { x: fcos(a) * n.rad, y: fsin(a) * n.rad };
}
