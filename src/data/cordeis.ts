/**
 * Cordéis (docs/gdd/09): folhetos que o jogador compra com Lembranças e equipa antes de dormir.
 * Cada um tem um custo de 1 a 5, e a soma dos equipados não pode passar do Fôlego.
 * Cada folheto tem três níveis; o efeito é um número por nível, lido em src/meta/dream.ts
 * (regras da noite) ou em `StatBoost` (src/meta/stats.ts) quando mexe no herói.
 */

export type CordelId =
  | 'peleja' | 'cantador' | 'rezadeira'
  | 'romanceFeira' | 'mocaVento' | 'valentao' | 'viola' | 'boiMisterioso'
  | 'pavao' | 'lampiao' | 'matuto' | 'donzela' | 'assobiador'
  | 'vaqueiro' | 'malasartes' | 'princesa'
  | 'fiadoSaci' | 'sacoSemFundo' | 'encantado' | 'saoSarue';

export interface CordelDef {
  id: CordelId;
  name: string;
  /** Fôlego que ocupa. */
  cost: 1 | 2 | 3 | 4 | 5;
  icon: string;
  /** O número do efeito em cada um dos três níveis. */
  values: [number, number, number];
  desc: (v: number) => string;
}

const TIER_NAME = ['', 'comum', 'rara', 'épica'];
const C = (id: CordelId, name: string, cost: CordelDef['cost'], icon: string, values: [number, number, number], desc: (v: number) => string): CordelDef => ({ id, name, cost, icon, values, desc });
const s = (v: number, one: string, many: string) => `${v} ${v === 1 ? one : many}`;

export const CORDEIS: Record<CordelId, CordelDef> = {
  /* custo 1 */
  peleja: C('peleja', 'A Peleja do Andarilho', 1, 'vida', [4, 7, 10], (v) => `+${v}% de vida máxima`),
  cantador: C('cantador', 'O Cantador de Viola', 1, 'vintem', [10, 18, 25], (v) => `+${v} vinténs no começo de cada trecho`),
  rezadeira: C('rezadeira', 'A Reza da Rezadeira', 1, 'cura', [8, 14, 20], (v) => `As Fontes curam mais ${v}% da vida`),
  /* custo 2 */
  romanceFeira: C('romanceFeira', 'O Romance da Feira', 2, 'vender', [10, 15, 20], (v) => `Os preços da Feira ficam ${v}% menores`),
  mocaVento: C('mocaVento', 'A Moça que Virou Vento', 2, 'redemoinho', [1, 2, 3], (v) => `+${s(v, 'Pulo', 'Pulos')} em cada Roda`),
  valentao: C('valentao', 'O Valentão do Sertão', 2, 'dano', [5, 8, 12], (v) => `+${v}% de dano de arma e de feitiço`),
  viola: C('viola', 'A Viola Encantada', 2, 'recarga', [5, 8, 12], (v) => `Os feitiços recarregam ${v}% mais rápido`),
  boiMisterioso: C('boiMisterioso', 'O Boi Misterioso', 2, 'regeneracao', [10, 20, 30], (v) => `Vencer um chefe cura mais ${v}% da vida`),
  /* custo 3 */
  pavao: C('pavao', 'O Pavão Misterioso', 3, 'altar', [1, 2, 3], (v) => `${v === 1 ? 'O primeiro altar' : `Os ${v} primeiros altares`} de cada trecho só ${v === 1 ? 'traz' : 'trazem'} bênção rara ou melhor`),
  lampiao: C('lampiao', 'A Chegada de Lampião', 3, 'amuleto', [1, 2, 3], (v) => `Elites, provações e chefes mostram mais ${s(v, 'amuleto', 'amuletos')} para escolher`),
  matuto: C('matuto', 'O Matuto e o Doutor', 3, 'credito', [12, 20, 30], (v) => `Todo causo rende mais ${v} vinténs`),
  donzela: C('donzela', 'A Donzela Teodora', 3, 'critico', [4, 7, 10], (v) => `+${v}% de chance de crítico`),
  assobiador: C('assobiador', 'O Assobiador da Meia-Noite', 3, 'som', [1, 2, 3], (v) => `+${s(v, 'Assobio', 'Assobios')} em cada Roda`),
  /* custo 4 */
  vaqueiro: C('vaqueiro', 'Peleja do Vaqueiro com a Onça', 4, 'escudo', [1, 2, 3], (v) => `Você se levanta ${v === 1 ? 'uma vez' : `${v} vezes`} por noite depois de cair`),
  malasartes: C('malasartes', 'As Proezas de Pedro Malasartes', 4, 'ouro', [30, 45, 60], (v) => `A primeira compra de cada Feira sai ${v}% mais barata`),
  princesa: C('princesa', 'A Princesa da Pedra Fina', 4, 'lembranca', [6, 10, 15], (v) => `+${v}% de Lembranças`),
  /* custo 5 */
  fiadoSaci: C('fiadoSaci', 'O Fiado do Saci', 5, 'roda', [1, 2, 3], (v) => `+${s(v, 'giro grátis', 'giros grátis')} em cada Roda`),
  sacoSemFundo: C('sacoSemFundo', 'O Saco sem Fundo', 5, 'pocao', [1, 2, 3], (v) => `Carrega mais ${s(v, 'poção', 'poções')}`),
  encantado: C('encantado', 'O Afilhado dos Encantados', 5, 'supremo', [1, 2, 3], (v) => `Começa a noite escolhendo uma bênção ${TIER_NAME[v]}`),
  saoSarue: C('saoSarue', 'Viagem a São Saruê', 5, 'estrela', [6, 10, 14], (v) => `Vencer uma sala sem levar golpe rende mais ${v} vinténs`),
};

export const CORDEL_ORDER = Object.keys(CORDEIS) as CordelId[];

export const CORDEL = {
  /** Fôlego sem a Casa de Cordel, e quanto cada nível dela acrescenta. */
  breath: 5, breathPerLevel: 3,
  /** Equipar folhetos de custo 1, 2, 3, 4 e 5 ao mesmo tempo: o Cordel Completo. */
  fullBonus: 0.1,
};

/** Lembranças para comprar (nível 1) ou melhorar (níveis 2 e 3) um folheto. */
export function cordelPrice(id: CordelId, level: number): number {
  const base = 12 + 10 * CORDEIS[id].cost;
  return Math.round(base * [1, 2.2, 4.5][Math.max(0, Math.min(2, level - 1))]);
}

/** Fôlego gasto por uma lista de folhetos. */
export function cordelCost(ids: CordelId[]): number {
  return ids.reduce((n, id) => n + (CORDEIS[id]?.cost ?? 0), 0);
}

/** Tem um folheto de cada custo, de 1 a 5? */
export function isFullCordel(ids: CordelId[]): boolean {
  const costs = new Set(ids.map((id) => CORDEIS[id]?.cost));
  return [1, 2, 3, 4, 5].every((c) => costs.has(c as CordelDef['cost']));
}
