/**
 * Roda do Saci (docs/gdd/09): a matemática da grade, separada da tela e das regras da noite.
 * Uma grade 3x3; três símbolos iguais numa das 8 linhas pagam. O Gorro é curinga.
 * Aqui não há estado: só pesos, sorteio, leitura das linhas e as chances exatas que o painel mostra.
 */
import type { ElementId } from '../data/content';
import { DREAM } from '../data/dream';
import type { Rng } from '../data/rng';

export type RodaSymbol = ElementId | 'gorro' | 'vintem' | 'olho';
export type RodaWeights = Partial<Record<RodaSymbol, number>>;

/** As 8 linhas: 3 deitadas, 3 em pé e 2 diagonais (casas de 0 a 8, da esquerda para a direita, de cima para baixo). */
export const LINES: readonly (readonly [number, number, number])[] = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

/** Pesos dos símbolos: cada padrinho da grade pesa mais conforme as bênçãos dele que o herói já tem. */
export function rodaWeights(patrons: ElementId[], blessingsOf: Partial<Record<ElementId, number>>, extraOlho = 0): RodaWeights {
  const W = DREAM.roda.weights, out: RodaWeights = {};
  for (const el of patrons) out[el] = W.patron * (1 + DREAM.roda.buildPull * (blessingsOf[el] ?? 0));
  out.gorro = W.gorro; out.vintem = W.vintem; out.olho = W.olho + extraOlho;
  return out;
}

function draw(r: Rng, keys: RodaSymbol[], weights: RodaWeights, total: number): RodaSymbol {
  let roll = r() * total;
  for (const k of keys) { roll -= weights[k]!; if (roll <= 0) return k; }
  return keys[keys.length - 1];
}

/** Sorteia as 9 casas (ou só as pedidas, para o Pulo). */
export function spinGrid(r: Rng, weights: RodaWeights, grid: RodaSymbol[] = [], cells: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]): RodaSymbol[] {
  const keys = Object.keys(weights) as RodaSymbol[], total = keys.reduce((n, k) => n + weights[k]!, 0), out = grid.slice();
  for (const c of cells) out[c] = draw(r, keys, weights, total);
  return out;
}

/** O símbolo que uma linha paga: o que se repete nas três casas (o Gorro vale por qualquer um), ou nulo. */
export function lineSymbol(grid: RodaSymbol[], line: readonly number[]): RodaSymbol | null {
  let sym: RodaSymbol | null = null;
  for (const c of line) {
    const s = grid[c];
    if (s === 'gorro') continue;
    if (sym && s !== sym) return null;
    sym = s;
  }
  return sym ?? 'gorro';
}

export interface RodaRead {
  /** As linhas que pagam e o símbolo de cada uma. */
  lines: { cells: readonly number[]; symbol: RodaSymbol }[];
  /** Linhas de cada padrinho, de vinténs e de Olhos. Uma linha só de Gorros conta para o padrinho com mais linhas. */
  patrons: Partial<Record<ElementId, number>>;
  vintem: number; olho: number;
  /** Padrinho que fechou a sorte grande, se algum. */
  jackpot: ElementId | null;
}

/** Lê a grade: que linhas pagam e o quê. `patrons` é a ordem de desempate das linhas só de Gorros. */
export function readGrid(grid: RodaSymbol[], patrons: ElementId[]): RodaRead {
  const lines: RodaRead['lines'] = [], count: Partial<Record<ElementId, number>> = {};
  let vintem = 0, olho = 0, wild = 0;
  for (const line of LINES) {
    const s = lineSymbol(grid, line);
    if (!s) continue;
    lines.push({ cells: line, symbol: s });
    if (s === 'vintem') vintem++; else if (s === 'olho') olho++; else if (s === 'gorro') wild++; else count[s] = (count[s] ?? 0) + 1;
  }
  if (wild > 0 && patrons.length) {
    const best = patrons.reduce((a, b) => ((count[b] ?? 0) > (count[a] ?? 0) ? b : a), patrons[0]);
    count[best] = (count[best] ?? 0) + wild;
    for (const l of lines) if (l.symbol === 'gorro') l.symbol = best;
  }
  const top = patrons.find((el) => (count[el] ?? 0) >= DREAM.roda.jackpotLines) ?? null;
  return { lines, patrons: count, vintem, olho, jackpot: top };
}

export interface RodaOdds {
  /** Chance de cada símbolo numa casa. */
  symbol: Partial<Record<RodaSymbol, number>>;
  /** Chance de um giro ter pelo menos uma linha, pelo menos uma linha de padrinho (bênção), e a sorte grande. */
  anyLine: number; blessing: number; jackpot: number;
}

const memo = new Map<string, RodaOdds>();

const keyOf = (weights: RodaWeights) => (Object.keys(weights) as RodaSymbol[]).filter((k) => weights[k]! > 0).map((k) => `${k}:${weights[k]}`).join('|');

/**
 * A soma de todas as grades possíveis (até 6 símbolos em 9 casas, uns 10 milhões), em fatias: uma por símbolo da primeira casa.
 * A conta anda casa por casa e confere cada linha no instante em que a última casa dela é preenchida.
 */
function oddsJob(weights: RodaWeights): { parts: number; part: (first: number) => void; done: () => RodaOdds } {
  const keys = (Object.keys(weights) as RodaSymbol[]).filter((k) => weights[k]! > 0);
  const total = keys.reduce((n, k) => n + weights[k]!, 0), prob = keys.map((k) => weights[k]! / total), S = keys.length;
  const WILD = keys.indexOf('gorro');
  const patron = keys.map((k) => (k !== 'gorro' && k !== 'vintem' && k !== 'olho' ? 1 : 0));
  /* linhas que fecham em cada casa: as outras duas casas de cada uma, em fila (a, b, a, b...) */
  const closes: number[][] = Array.from({ length: 9 }, () => []);
  for (const l of LINES) { const last = Math.max(...l), rest = l.filter((c) => c !== last); closes[last].push(rest[0], rest[1]); }
  const grid = new Int8Array(9), count = new Int32Array(S), undo = new Int8Array(27);
  let anyLine = 0, blessing = 0, jackpot = 0;
  const J = DREAM.roda.jackpotLines;
  const walk = (cell: number, p: number, lines: number, wild: number): void => {
    const cl = closes[cell], n = cl.length, base = cell * 3;
    for (let k = 0; k < S; k++) {
      grid[cell] = k;
      let add = 0, addWild = 0, un = 0;
      for (let i = 0; i < n; i += 2) {
        const a = grid[cl[i]], b = grid[cl[i + 1]];
        /* o símbolo da linha: o primeiro que não é Gorro; os outros têm de ser ele ou Gorro */
        let sym = k;
        if (sym === WILD) sym = a;
        if (sym === WILD) sym = b;
        if ((k !== WILD && k !== sym) || (a !== WILD && a !== sym) || (b !== WILD && b !== sym)) continue;
        add++;
        if (sym === WILD) addWild++; else if (patron[sym]) { count[sym]++; undo[base + un++] = sym; }
      }
      if (cell === 8) {
        /* a última casa fecha a grade: soma aqui mesmo, sem descer mais um nível */
        const q = p * prob[k], w2 = wild + addWild;
        if (lines + add > 0) anyLine += q;
        let best = 0, some = w2 > 0;
        for (let m = 0; m < S; m++) if (count[m] > 0) { some = true; if (count[m] > best) best = count[m]; }
        if (some) blessing += q;
        if (best + w2 >= J) jackpot += q;
      } else walk(cell + 1, p * prob[k], lines + add, wild + addWild);
      while (un > 0) count[undo[base + --un]]--;
    }
  };
  return {
    parts: S,
    part: (first) => { grid[0] = first; walk(1, prob[first], 0, 0); },
    done: () => {
      const symbol: RodaOdds['symbol'] = {};
      keys.forEach((k, i) => { symbol[k] = prob[i]; });
      const out = { symbol, anyLine, blessing, jackpot };
      if (memo.size > 40) memo.clear();
      memo.set(keyOf(weights), out);
      return out;
    },
  };
}

/** Chances exatas de um giro. Leva algumas centenas de milissegundos na primeira vez para cada conjunto de pesos; depois fica guardada. */
export function rodaOdds(weights: RodaWeights): RodaOdds {
  const hit = memo.get(keyOf(weights));
  if (hit) return hit;
  const job = oddsJob(weights);
  for (let k = 0; k < job.parts; k++) job.part(k);
  return job.done();
}

/** As chances, se já foram calculadas para estes pesos. */
export function rodaOddsReady(weights: RodaWeights): RodaOdds | null {
  return memo.get(keyOf(weights)) ?? null;
}

/** Calcula as chances em fatias, sem travar a tela, e avisa quando terminar. Devolve como cancelar. */
export function rodaOddsLater(weights: RodaWeights, done: (o: RodaOdds) => void): () => void {
  const hit = memo.get(keyOf(weights));
  let stop = false;
  if (hit) { done(hit); return () => undefined; }
  const job = oddsJob(weights);
  let k = 0;
  const step = (): void => {
    if (stop) return;
    if (k < job.parts) { job.part(k++); setTimeout(step, 0); return; }
    done(job.done());
  };
  setTimeout(step, 0);
  return () => { stop = true; };
}
