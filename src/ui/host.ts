/**
 * Contrato entre o jogo e as telas de menu (acampamento e resultado da fase).
 * As telas são HTML por cima do canvas do jogo. Elas nunca decidem regra: leem o perfil,
 * chamam as funções de src/meta para alterá-lo e pedem para salvar.
 */
import type { BrewId } from '../data/brews';
import type { WeaponKind } from '../data/items';
import type { OmenPick } from '../data/omens';
import type { Profile } from '../meta/profile';
import type { NodeResult } from '../meta/dream';
import type { StageRewards } from '../meta/rewards';

export type CampTab = 'mapa' | 'heroi' | 'ferreiro' | 'talentos' | 'feiticos' | 'companheiros';

/** Soma de uma Caçada automática, para a tela de resultado. */
export interface HuntSummary { runs: number; wins: number; xp: number; gold: number; items: number; dismantled: number; mata: number; po: number; tomo: number; levels: number; stopped: 'fim' | 'queda' | 'mochila' | 'parou' }

export interface UiHost {
  /** Perfil em memória. Pode ser trocado por outro objeto depois de `resetGame`, então leia sempre por aqui. */
  getProfile(): Profile;
  /** Grava o perfil. Chame depois de qualquer alteração. */
  save(): void;
  /** Fecha os menus e começa a fase. Com `auto`, a Caçada automática joga a fase `runs` vezes seguidas. */
  startStage(stageId: string, opts?: { auto?: { runs: number; speed: number }; omens?: OmenPick; brew?: BrewId }): void;
  /** Abre o Terreiro de treino. */
  startTraining(): void;
  /** Joga a sala do nó em que o herói do Sonho está. */
  startDreamNode(): void;
  /** Começa um desafio com ranking: o do dia (herói do dia) ou o dos Encantados (com a arma escolhida). */
  startChallenge(kind: 'dia' | 'encantados', weapon?: WeaponKind): void;
  /** Apaga o progresso e recomeça do zero. */
  resetGame(): void;
}

export interface UiController {
  showCamp(tab?: CampTab | 'torre' | 'diario' | 'almanaque' | 'sonho'): void;
  showResults(stageId: string, rewards: StageRewards, hunt?: HuntSummary): void;
  /** Volta para o mapa da noite depois de uma sala do Sonho (ou para o resumo, se a noite acabou). */
  showDream(result: NodeResult | null): void;
  /** Aviso curto por cima da tela atual (conquistas). */
  notify(text: string): void;
  hide(): void;
  readonly visible: boolean;
}
