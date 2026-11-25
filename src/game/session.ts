/** Ponte entre a cena de jogo e o resto do aplicativo: quem é o herói e o que fazer quando a fase termina. */
import type { Profile } from '../meta/profile';
import type { StageOutcome } from '../meta/rewards';

export const session: {
  profile: Profile | null;
  onStageEnd: (outcome: StageOutcome) => void;
  /** Velocidade da Caçada automática escolhida por último (a tecla V muda durante a fase). */
  autoSpeed: number;
} = {
  profile: null,
  autoSpeed: 1,
  onStageEnd: () => undefined,
};
