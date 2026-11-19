/**
 * Contrato entre o jogo e as telas de menu (acampamento e resultado da fase).
 * As telas são HTML por cima do canvas do jogo. Elas nunca decidem regra: leem o perfil,
 * chamam as funções de src/meta para alterá-lo e pedem para salvar.
 */
import type { Profile } from '../meta/profile';
import type { StageRewards } from '../meta/rewards';

export type CampTab = 'mapa' | 'heroi' | 'ferreiro' | 'talentos' | 'feiticos' | 'companheiros';

export interface UiHost {
  /** Perfil em memória. Pode ser trocado por outro objeto depois de `resetGame`, então leia sempre por aqui. */
  getProfile(): Profile;
  /** Grava o perfil. Chame depois de qualquer alteração. */
  save(): void;
  /** Fecha os menus e começa a fase. */
  startStage(stageId: string): void;
  /** Apaga o progresso e recomeça do zero. */
  resetGame(): void;
}

export interface UiController {
  showCamp(tab?: CampTab): void;
  showResults(stageId: string, rewards: StageRewards): void;
  hide(): void;
  readonly visible: boolean;
}
