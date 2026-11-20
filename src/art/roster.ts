/**
 * Lista das criaturas dos capítulos 3 a 8 que precisam de arte, com o tamanho-alvo na tela (px lógicos,
 * o maior lado do corpo) e o tipo de folha. A descrição de cada uma está em docs/arte/etapa3-criaturas.md.
 * mob = monstro comum (move, atk, hide se emboscada) · boss = chefe (idle, move, atk, cast, down, special)
 * free = Encantado libertado, colorido (idle) · pet = companheiro (idle, walk, act; ou fly, act)
 * fx = efeito animado de cenário (move) · tex = textura parada
 */
export interface CreatureArt {
  key: string; chapter: number; type: 'mob' | 'boss' | 'free' | 'pet' | 'fx' | 'tex'; size: number; fly?: boolean; hide?: boolean;
}

const C = (chapter: number, type: CreatureArt['type'], key: string, size: number, extra: Partial<CreatureArt> = {}): CreatureArt => ({ key, chapter, type, size, ...extra });

export const CREATURES: CreatureArt[] = [
  C(3, 'mob', 'calango', 34), C(3, 'mob', 'cascavel', 56, { hide: true }), C(3, 'mob', 'mandacaru', 62), C(3, 'mob', 'bode', 64), C(3, 'mob', 'urubu', 54, { fly: true }),
  C(3, 'boss', 'corposeco', 120), C(3, 'boss', 'saci', 90), C(3, 'free', 'saci_free', 90),
  C(3, 'pet', 'tatu', 40), C(3, 'pet', 'carcara', 46, { fly: true }), C(3, 'fx', 'poeira', 90),

  C(4, 'mob', 'formiga', 26), C(4, 'mob', 'seriema', 62), C(4, 'mob', 'pequizeiro', 82), C(4, 'mob', 'cupinzeiro', 78), C(4, 'mob', 'taturana', 36),
  C(4, 'boss', 'mula', 130), C(4, 'boss', 'boitata', 110), C(4, 'tex', 'boitata_seg', 70), C(4, 'tex', 'boitata_cauda', 70), C(4, 'free', 'boitata_free', 110),
  C(4, 'pet', 'loboguara', 56), C(4, 'pet', 'tamandua', 62), C(4, 'tex', 'capim', 96), C(4, 'fx', 'chama', 64),

  C(5, 'mob', 'morcego', 36, { fly: true }), C(5, 'mob', 'besouro', 70), C(5, 'mob', 'aranha', 54, { hide: true }), C(5, 'mob', 'macaco', 48), C(5, 'mob', 'totem', 66),
  C(5, 'boss', 'capelobo', 130), C(5, 'boss', 'mapinguari', 170), C(5, 'free', 'mapinguari_free', 170),
  C(5, 'pet', 'vagalume', 26, { fly: true }), C(5, 'pet', 'preguica', 50), C(5, 'pet', 'sucuri', 72),

  C(6, 'mob', 'queroquero', 36, { fly: true }), C(6, 'mob', 'boibarroso', 92), C(6, 'mob', 'almapenada', 62, { fly: true }), C(6, 'mob', 'fatuo', 30, { fly: true }), C(6, 'mob', 'espantalho', 82),
  C(6, 'boss', 'teiniagua', 100), C(6, 'boss', 'lobisomem_h', 100), C(6, 'boss', 'lobisomem', 150), C(6, 'free', 'lobisomem_free', 150),
  C(6, 'pet', 'graxaim', 46), C(6, 'pet', 'coruja', 34, { fly: true }),

  C(7, 'mob', 'ariranha', 42), C(7, 'mob', 'soco', 62), C(7, 'mob', 'jararaca', 50, { hide: true }), C(7, 'mob', 'cururu', 52), C(7, 'mob', 'tracaja', 76),
  C(7, 'boss', 'pisadeira', 130), C(7, 'boss', 'cuca', 140), C(7, 'free', 'cuca_free', 140), C(7, 'tex', 'caldeirao', 70),
  C(7, 'pet', 'jacarezinho', 62), C(7, 'pet', 'tuiuiu', 62, { fly: true }),

  C(8, 'mob', 'vulto', 52), C(8, 'mob', 'vazio', 38), C(8, 'mob', 'lembranca', 56, { fly: true }), C(8, 'mob', 'esquecido', 92), C(8, 'mob', 'silencio', 66),
  C(8, 'boss', 'esquecimento', 190),
  C(8, 'pet', 'mico', 36), C(8, 'pet', 'botinho', 58, { fly: true }),
];

export const CREATURE_BY_KEY: ReadonlyMap<string, CreatureArt> = new Map(CREATURES.map((c) => [c.key, c]));
