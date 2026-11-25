/**
 * Falas da Aldeia (docs/gdd/09): ao acordar de uma noite, um Encantado libertado comenta o que aconteceu.
 * Cada fala tem quem diz, quando vale e o texto. A tela mostra uma que ainda não apareceu.
 */
import type { ElementId } from './content';

/** O que a fala pode olhar: como a noite acabou e o que o jogador já fez. */
export interface FalaFacts { won: boolean; how: 'venceu' | 'caiu' | 'desistiu'; trechos: number; of: number; weight: number; nights: number; wins: number; awakened: number; jackpots: number; amulets: number; blessings: number }

export interface FalaDef { id: string; who: ElementId; when: (f: FalaFacts) => boolean; text: string }

const F = (id: string, who: ElementId, when: (f: FalaFacts) => boolean, text: string): FalaDef => ({ id, who, when, text });

export const FALAS: FalaDef[] = [
  /* Curupira */
  F('curupira-1', 'natureza', (f) => f.nights <= 2, 'Voltou. Quem dorme na mata e acorda inteiro já aprendeu alguma coisa.'),
  F('curupira-caiu', 'natureza', (f) => f.how === 'caiu' && f.trechos === 0, 'Caiu logo no começo. Rastro novo engana até quem conhece o caminho.'),
  F('curupira-venceu', 'natureza', (f) => f.won, 'A noite inteira, e nenhum galho quebrado à toa. Assim eu gosto.'),
  F('curupira-pouco', 'natureza', (f) => f.blessings <= 2 && !f.won, 'Você pediu pouca bênção. Padrinho gosta de ser procurado.'),
  /* Iara */
  F('iara-fundo', 'agua', (f) => f.trechos >= 2 && !f.won, 'Chegou fundo desta vez. O rio também não se atravessa de uma braçada.'),
  F('iara-desistiu', 'agua', (f) => f.how === 'desistiu', 'Acordar por querer também é saber nadar. Ninguém vence a correnteza no grito.'),
  F('iara-venceu', 'agua', (f) => f.won && f.wins >= 3, 'Três noites vencidas. Daqui a pouco é você quem canta para eles.'),
  /* Saci */
  F('saci-roda', 'tempestade', (f) => f.jackpots >= 1, 'Quatro linhas na minha Roda! Eu disse que devia uma. Agora deve você.'),
  F('saci-amuleto', 'tempestade', (f) => f.amulets >= 4, 'Tanto penduricalho no pescoço que eu ouvi você chegando de longe.'),
  F('saci-caiu', 'tempestade', (f) => f.how === 'caiu' && f.trechos >= 1, 'Tropeçou no segundo trecho? Não fui eu. Desta vez não fui eu.'),
  /* Boitatá */
  F('boitata-despertar', 'fogo', (f) => f.awakened >= 1, 'Vi uma bênção sua acender de verdade. Fogo que desperta não apaga mais.'),
  F('boitata-peso', 'fogo', (f) => f.weight >= 8, 'Você dormiu com o Peso nas costas e ainda voltou. Tem brasa aí dentro.'),
  F('boitata-venceu', 'fogo', (f) => f.won && f.weight === 0, 'Venceu a noite limpa. Da próxima, deixe o Presságio entrar: o que queima também ensina.'),
  /* Mapinguari */
  F('mapinguari-venceu', 'terra', (f) => f.won, 'O Esquecimento perdeu uma noite. Eu sei o que é perder uma. Não é pouco.'),
  F('mapinguari-caiu', 'terra', (f) => f.how === 'caiu', 'Cair é do chão. O chão sempre devolve quem cai nele.'),
  F('mapinguari-muitas', 'terra', (f) => f.nights >= 10, 'Dez noites. A mata fechada já conhece o seu passo.'),
  /* Lobisomem */
  F('lobisomem-peso', 'sombra', (f) => f.weight >= 16, 'Noite sem lua, com esse Peso todo. Eu não entraria. E olha quem está falando.'),
  F('lobisomem-caiu', 'sombra', (f) => f.how === 'caiu' && f.weight > 0, 'O Presságio cobrou. Ele sempre cobra de madrugada.'),
  F('lobisomem-venceu', 'sombra', (f) => f.won && f.weight >= 8, 'Venceu a noite pesada. Uiva comigo, que hoje pode.'),
  /* Cuca */
  F('cuca-bencaos', 'encanto', (f) => f.blessings >= 10, 'Dez bênçãos numa noite só. Meu caldeirão nunca levou tanta coisa junta.'),
  F('cuca-venceu', 'encanto', (f) => f.won && f.wins >= 5, 'Cinco noites inteiras. Eu durmo uma a cada sete anos, e você aí, colecionando.'),
  F('cuca-desistiu', 'encanto', (f) => f.how === 'desistiu' && f.trechos === 0, 'Acordou antes do primeiro chefe? Nem deu tempo de eu mexer a colher.'),
];
