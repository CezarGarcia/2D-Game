/**
 * A Aldeia (docs/gdd/09), primeira versão: construções pagas com Lembranças, que ficam para sempre.
 * Nesta etapa entram as que já têm o que melhorar. A cena da Aldeia e as outras construções vêm depois.
 */

export type BuildingId = 'rancho' | 'mural' | 'casaDeFarinha' | 'casaDeCordel';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  icon: string;
  /** Uma linha sobre a construção. */
  about: string;
  /** O que cada nível dá (o texto do nível vale somado aos anteriores). */
  levels: { cost: number; desc: string }[];
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  rancho: {
    id: 'rancho', name: 'Rancho do Andarilho', icon: 'descanso', about: 'Onde o andarilho se prepara antes de dormir.',
    levels: [
      { cost: 40, desc: 'Começa cada noite com 30 vinténs' },
      { cost: 110, desc: 'Começa cada noite com um amuleto comum' },
      { cost: 240, desc: 'Começa cada noite escolhendo uma bênção comum' },
    ],
  },
  mural: {
    id: 'mural', name: 'Mural do Almanaque', icon: 'almanaque', about: 'Quem registra o que viu lembra melhor.',
    levels: [
      { cost: 60, desc: '+10% de Lembranças em toda noite' },
      { cost: 160, desc: '+20% de Lembranças em toda noite' },
      { cost: 320, desc: '+30% de Lembranças em toda noite' },
    ],
  },
  casaDeFarinha: {
    id: 'casaDeFarinha', name: 'Casa de Farinha', icon: 'ouro', about: 'A aldeia rende, e sobra para o andarilho.',
    levels: [
      { cost: 50, desc: '+10% de ouro nas fases da campanha' },
      { cost: 140, desc: '+20% de ouro nas fases da campanha' },
      { cost: 300, desc: '+30% de ouro nas fases da campanha' },
    ],
  },
  casaDeCordel: {
    id: 'casaDeCordel', name: 'Casa de Cordel', icon: 'cordel', about: 'Um varal de folhetos. Quanto mais corda, mais história cabe.',
    levels: [
      { cost: 70, desc: 'Fôlego 8 para equipar Cordéis' },
      { cost: 130, desc: 'Fôlego 11 para equipar Cordéis' },
      { cost: 210, desc: 'Fôlego 14 para equipar Cordéis' },
      { cost: 320, desc: 'Fôlego 17 para equipar Cordéis' },
      { cost: 460, desc: 'Fôlego 20 para equipar Cordéis' },
    ],
  },
};

export const BUILDING_ORDER = Object.keys(BUILDINGS) as BuildingId[];
