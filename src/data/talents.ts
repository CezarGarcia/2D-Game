/**
 * Teia de talentos: uma árvore só, radial, a partir do centro (docs/gdd/02).
 * Seis raízes, uma por atributo. Um nó só recebe ponto se estiver ligado a um nó que já tem ponto.
 * Nesta etapa os setores de Força, Vitalidade e Agilidade estão completos; os outros três
 * têm a raiz e os dois primeiros nós, e crescem nos próximos capítulos.
 */

export type Sector = 'forca' | 'vitalidade' | 'agilidade' | 'inteligencia' | 'espirito' | 'sorte';
export type TalentKind = 'raiz' | 'comum' | 'chave' | 'ligacao' | 'dom';

export interface TalentNode {
  id: string;
  sector: Sector;
  kind: TalentKind;
  name: string;
  max: number;
  /** Texto do efeito com `rank` pontos (rank mínimo 1). */
  desc: (rank: number) => string;
  /** Posição polar na teia: ângulo em graus (0 = direita, sentido horário) e raio. */
  ang: number; rad: number;
  links: string[];
}

export const SECTORS: Record<Sector, { label: string; ang: number; color: string }> = {
  forca: { label: 'Força', ang: 0, color: '#E4572E' },
  vitalidade: { label: 'Vitalidade', ang: 60, color: '#D9A441' },
  espirito: { label: 'Espírito', ang: 120, color: '#5FBF8E' },
  inteligencia: { label: 'Inteligência', ang: 180, color: '#3FA7E0' },
  sorte: { label: 'Sorte', ang: 240, color: '#B98CFF' },
  agilidade: { label: 'Agilidade', ang: 300, color: '#8FE36A' },
};

const R = [70, 140, 210, 280, 350];
type Def = [id: string, kind: TalentKind, name: string, max: number, desc: (r: number) => string];

function spine(sector: Sector, defs: Def[]): TalentNode[] {
  const ang = SECTORS[sector].ang;
  return defs.map(([id, kind, name, max, desc], i) => ({
    id, sector, kind, name, max, desc, ang, rad: R[i],
    links: [defs[i - 1]?.[0], defs[i + 1]?.[0]].filter(Boolean) as string[],
  }));
}

const nodes: TalentNode[] = [
  ...spine('forca', [
    ['raizForca', 'raiz', 'Raiz da Força', 1, () => '+3 de Força'],
    ['maoPesada', 'comum', 'Mão Pesada', 5, (r) => `+${3 * r}% de dano de arma`],
    ['sedeDeBriga', 'chave', 'Sede de Briga', 1, () => 'Cada inimigo derrotado dá +4% de dano por 6 s. Acumula até 5 vezes.'],
    ['golpeCerteiro', 'comum', 'Golpe Certeiro', 5, (r) => `+${2 * r}% de chance de crítico`],
    ['execucao', 'chave', 'Execução', 1, () => 'Golpes em inimigos abaixo de 25% de vida são sempre críticos.'],
  ]),
  ...spine('vitalidade', [
    ['raizVitalidade', 'raiz', 'Raiz da Vitalidade', 1, () => '+3 de Vitalidade'],
    ['couroCurtido', 'comum', 'Couro Curtido', 5, (r) => `+${3 * r}% de defesa`],
    ['contragolpe', 'chave', 'Contragolpe', 1, () => 'Depois de aparar, o próximo golpe causa 250%.'],
    ['folego', 'comum', 'Fôlego', 5, (r) => `+${4 * r}% de vida`],
    ['cascaDeJabuti', 'chave', 'Casca de Jabuti', 1, () => 'Uma vez por fase, um golpe fatal deixa você com 1 de vida e 2 s de invencibilidade.'],
  ]),
  ...spine('agilidade', [
    ['raizAgilidade', 'raiz', 'Raiz da Agilidade', 1, () => '+3 de Agilidade'],
    ['peLigeiro', 'comum', 'Pé Ligeiro', 5, (r) => `+${2 * r}% de velocidade de movimento`],
    ['rolamentoCortante', 'chave', 'Rolamento Cortante', 1, () => 'A esquiva causa dano em todo inimigo que você atravessa.'],
    ['reflexo', 'comum', 'Reflexo', 5, (r) => `−${4 * r}% na recarga da esquiva`],
    ['segundaEsquiva', 'chave', 'Segunda Esquiva', 1, () => 'Você guarda duas cargas de esquiva.'],
  ]),
  ...spine('inteligencia', [
    ['raizInteligencia', 'raiz', 'Raiz da Inteligência', 1, () => '+3 de Inteligência'],
    ['palavraForte', 'comum', 'Palavra Forte', 5, (r) => `+${3 * r}% de dano de feitiço`],
    ['foco', 'comum', 'Foco', 5, (r) => `+${2 * r}% de crítico de feitiço`],
  ]),
  ...spine('espirito', [
    ['raizEspirito', 'raiz', 'Raiz do Espírito', 1, () => '+3 de Espírito'],
    ['fonte', 'comum', 'Fonte', 5, (r) => `+${5 * r}% de mana máxima`],
    ['pressa', 'comum', 'Pressa', 5, (r) => `−${3 * r}% na recarga de feitiços`],
  ]),
  ...spine('sorte', [
    ['raizSorte', 'raiz', 'Raiz da Sorte', 1, () => '+3 de Sorte'],
    ['olhoVivo', 'comum', 'Olho Vivo', 5, (r) => `+${3 * r}% de ouro`],
    ['bomTrato', 'comum', 'Bom Trato', 5, (r) => `+${5 * r}% de vida e dano do companheiro`],
  ]),
  /* anel de ligação entre setores vizinhos */
  { id: 'eloForcaVitalidade', sector: 'forca', kind: 'ligacao', name: 'Elo do Guerreiro', max: 1, desc: () => '+15 de vida e +2% de dano de arma', ang: 30, rad: 232, links: ['sedeDeBriga', 'contragolpe'] },
  { id: 'eloAgilidadeForca', sector: 'agilidade', kind: 'ligacao', name: 'Elo do Caçador', max: 1, desc: () => '+2% de velocidade de ataque e de movimento', ang: 330, rad: 232, links: ['rolamentoCortante', 'sedeDeBriga'] },
  { id: 'eloVitalidadeEspirito', sector: 'vitalidade', kind: 'ligacao', name: 'Elo do Fôlego', max: 1, desc: () => '+10 de vida e +6 de mana', ang: 90, rad: 164, links: ['couroCurtido', 'fonte'] },
  { id: 'eloInteligenciaEspirito', sector: 'inteligencia', kind: 'ligacao', name: 'Elo do Rezador', max: 1, desc: () => '+3% de dano de feitiço e +6 de mana', ang: 150, rad: 164, links: ['palavraForte', 'fonte'] },
  { id: 'eloSorteInteligencia', sector: 'sorte', kind: 'ligacao', name: 'Elo do Curioso', max: 1, desc: () => '+2 de Sorte e +2 de Inteligência', ang: 210, rad: 164, links: ['olhoVivo', 'palavraForte'] },
  { id: 'eloAgilidadeSorte', sector: 'agilidade', kind: 'ligacao', name: 'Elo do Esperto', max: 1, desc: () => '+2 de Agilidade e +2 de Sorte', ang: 270, rad: 164, links: ['peLigeiro', 'olhoVivo'] },
  /* Dom: a ponta da teia */
  { id: 'sangueQuente', sector: 'forca', kind: 'dom', name: 'Sangue Quente', max: 1, desc: () => 'Abaixo de 35% de vida: +40% de dano e de velocidade de ataque.', ang: 30, rad: 404, links: ['execucao', 'cascaDeJabuti'] },
];

/* completa as ligações nos dois sentidos */
const byId = new Map(nodes.map((n) => [n.id, n]));
for (const n of nodes) for (const l of n.links) { const o = byId.get(l); if (o && !o.links.includes(n.id)) o.links.push(n.id); }

export const TALENTS: TalentNode[] = nodes;
export const TALENT_BY_ID: ReadonlyMap<string, TalentNode> = byId;

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

/** Dá para tirar um ponto se todos os nós com ponto continuarem ligados a alguma raiz. */
export function canRemoveTalent(ranks: TalentRanks, id: string): boolean {
  if (!((ranks[id] || 0) > 0)) return false;
  const next = { ...ranks, [id]: ranks[id] - 1 };
  const seen = new Set<string>();
  const stack = nodes.filter((n) => n.kind === 'raiz' && (next[n.id] || 0) > 0).map((n) => n.id);
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const l of byId.get(cur)!.links) if ((next[l] || 0) > 0 && !seen.has(l)) stack.push(l);
  }
  return nodes.every((n) => !((next[n.id] || 0) > 0) || seen.has(n.id));
}

/** Posição cartesiana do nó, com o centro da teia em (0, 0). */
export function talentPos(n: TalentNode): { x: number; y: number } {
  const a = (n.ang * Math.PI) / 180;
  return { x: Math.cos(a) * n.rad, y: Math.sin(a) * n.rad };
}
