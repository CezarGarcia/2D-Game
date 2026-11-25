/**
 * Capítulos e fases. As salas de cada fase são fixas: saem de uma semente por fase, então todo
 * jogador encontra a mesma sequência e os tempos são comparáveis.
 */
import { ARENA, isBossKind, isMonster, type EliteMod, type EnemyKind, type SpawnDef } from './balance';
import { BOSSES, MONSTERS } from './bestiary';
import type { CompanionId, ElementId } from './content';
import type { ItemType } from './items';
import { stageLevel } from './progression';
import { makeRng, pick, type Rng } from './rng';

export type RoomType = 'combat' | 'altar' | 'elite' | 'boss';

export interface RoomDef {
  type: RoomType;
  waves: SpawnDef[][];
  /** Variação do cenário. */
  bg: number;
  /** Poças: deixam todos Molhados e o herói mais lento. */
  puddles?: { x: number; y: number; r: number }[];
  /** Correnteza: empurra o herói e os inimigos na horizontal, em pixels por segundo. Negativo empurra para a esquerda. */
  current?: number;
  /** Redemoinhos de poeira que andam pela sala e arremessam (Sertão). */
  whirls?: number;
  /** Touceiras de capim seco que pegam fogo e espalham (Cerrado). */
  grass?: { x: number; y: number }[];
  /** Escuro: só há luz em volta do herói (Selva Profunda). */
  dark?: boolean;
  /** A lua enche durante a sala e fortalece os monstros (Pampa). */
  moon?: boolean;
  /** Ilusões por onda: cópias falsas dos monstros, que somem com um golpe (Pantanal). */
  illusions?: number;
  /** De tanto em tanto tempo um feitiço é apagado até a sala acabar (Terra Sem Nome). */
  erase?: boolean;
  /** Terreiro de treino: sem potes nem desafio. */
  training?: boolean;
  /** Torre: nível dos monstros desta sala (senão vale o da fase), andar e capítulo de onde vêm a arte e o terreno. */
  level?: number;
  floor?: number;
  artChapter?: number;
}

export interface ChapterDef {
  id: number;
  name: string;
  /** Encantado que guarda a região. */
  encantado: string;
  element: ElementId | null;
  /** Capítulos ainda em construção aparecem trancados. */
  available: boolean;
  /** O que muda nas fases deste capítulo, em uma linha. */
  terrain: string;
  /** História curta mostrada quando o capítulo abre. */
  story: string;
}

export const CHAPTERS: ChapterDef[] = [
  { id: 1, name: 'Mata Atlântica', encantado: 'Curupira', element: 'natureza', available: true, terrain: 'Inimigos camuflados entre os galhos.', story: 'A mata perdeu a cor. Os bichos viraram Assombros, e o Curupira, que guardava tudo, não lembra mais quem é. Siga o rastro até ele.' },
  { id: 2, name: 'Rios do Norte', encantado: 'Iara', element: 'agua', available: true, terrain: 'Poças que molham e correnteza que arrasta.', story: 'O Curupira, de volta a si, aponta para o norte: os rios estão parados e cinzentos. A Iara canta, mas ninguém lembra a letra.' },
  { id: 3, name: 'Sertão', encantado: 'Saci', element: 'tempestade', available: true, terrain: 'Redemoinhos de poeira atravessam a sala e arremessam quem pegam.', story: 'No sertão, a chuva prometida nunca chega. Um redemoinho anda sozinho pela caatinga, e dentro dele alguém ri.' },
  { id: 4, name: 'Cerrado em chamas', encantado: 'Boitatá', element: 'fogo', available: true, terrain: 'O capim seco pega fogo e o fogo se espalha.', story: 'O cerrado queima sem parar. O Boitatá, que protegia os campos do fogo, virou o próprio incêndio.' },
  { id: 5, name: 'Selva Profunda', encantado: 'Mapinguari', element: 'terra', available: true, terrain: 'Escuro: você só enxerga perto de si. Muitos inimigos blindados.', story: 'Onde a selva é tão fechada que o sol não entra, pegadas enormes quebram as árvores. O Mapinguari esqueceu que guardava a floresta.' },
  { id: 6, name: 'Pampa de lua cheia', encantado: 'Lobisomem', element: 'sombra', available: true, terrain: 'A lua enche durante cada sala e deixa os monstros mais fortes.', story: 'No pampa, toda noite é de lua cheia. Um homem que virava lobo para proteger o gado agora só sabe uivar.' },
  { id: 7, name: 'Pantanal da Cuca', encantado: 'Cuca', element: 'encanto', available: true, terrain: 'Ilusões: alguns monstros são falsos e somem com um golpe.', story: 'O pantanal virou um caldeirão. A Cuca, que sabia todos os feitiços, mistura tudo sem lembrar para quê.' },
  { id: 8, name: 'Terra Sem Nome', encantado: 'O Esquecimento', element: null, available: true, terrain: 'Seus feitiços vão sendo apagados enquanto você luta.', story: 'Depois do último rio existe um lugar que ninguém lembra. Foi dali que o cinza veio. Os sete Encantados vão com você.' },
];

export interface StageDef {
  id: string;
  chapter: number;
  /** Índice global da fase (0 = 1-1). */
  index: number;
  number: number;
  name: string;
  intro: string;
  level: number;
  rooms: RoomDef[];
  /** Tempo-alvo da terceira estrela, em segundos. */
  starTime: number;
  kinds: EnemyKind[];
  final: 'normal' | 'elite' | 'chefao';
  /** Item com nome que só cai aqui, e a chance em porcento. */
  named?: { unique: string; chance: number };
  rescue?: CompanionId;
  /** Itens garantidos na primeira vitória. */
  firstClear?: ItemType[];
  /** Posição no mapa do capítulo, de 0 a 1 em cada eixo. */
  map: { x: number; y: number };
}

interface Plan {
  name: string; intro: string; pool: EnemyKind[]; rooms: number;
  elite?: { kind: EnemyKind; mods: EliteMod[] };
  boss?: EnemyKind;
  named?: { unique: string; chance: number };
  rescue?: CompanionId;
  firstClear?: ItemType[];
  water?: boolean;
  current?: boolean;
}

/** Terreno dos capítulos 3 a 8, aplicado a todas as salas de combate do capítulo. */
export const TERRAIN: Record<number, (rng: Rng, n: number) => Partial<RoomDef>> = {
  3: (rng, n) => (n >= 1 ? { whirls: 1 + (rng() < 0.4 + n * 0.04 ? 1 : 0) } : {}),
  4: (rng) => ({ grass: Array.from({ length: 5 + Math.floor(rng() * 4) }, () => ({ x: Math.round(ARENA.x0 + 120 + rng() * (ARENA.x1 - ARENA.x0 - 240)), y: Math.round(ARENA.y0 + 60 + rng() * (ARENA.y1 - ARENA.y0 - 120)) })) }),
  5: () => ({ dark: true }),
  6: () => ({ moon: true }),
  7: (rng, n) => ({ illusions: 1 + Math.floor(rng() * 2) + (n >= 6 ? 1 : 0) }),
  8: () => ({ erase: true }),
};

const CH1: Plan[] = [
  { name: 'A Trilha', intro: 'Saúvas cinzentas tomaram a trilha de entrada da mata.', pool: ['sauva'], rooms: 4, firstClear: ['escudo'] },
  { name: 'O Formigueiro', intro: 'O chão está furado de túneis, e algo cospe das moitas.', pool: ['sauva', 'cuspidor'], rooms: 5, named: { unique: 'mandibulaDaRainha', chance: 4 }, firstClear: ['arco', 'aljava'] },
  { name: 'Rastro de Queixada', intro: 'Marcas fundas de casco. Elas correm em linha reta, e não param.', pool: ['sauva', 'cuspidor', 'queixada'], rooms: 5 },
  { name: 'A Gaiola', intro: 'Alguém prendeu um bicho numa gaiola de cipó no fim da trilha.', pool: ['sauva', 'queixada', 'cogumelo'], rooms: 5, rescue: 'capivara' },
  { name: 'O Tronco que Anda', intro: 'Um toco velho se levantou. Ele só sente golpe depois que bate.', pool: ['sauva', 'cogumelo', 'cuspidor'], rooms: 5, elite: { kind: 'tronco', mods: ['blindado'] } },
  { name: 'Galhos que Olham', intro: 'Nem todo galho quebrado é galho. Alguns abrem os olhos.', pool: ['urutau', 'sauva', 'cuspidor'], rooms: 6 },
  { name: 'Chuva de Esporos', intro: 'Os cogumelos incham quando chegam perto. Não deixe chegarem.', pool: ['cogumelo', 'urutau', 'queixada'], rooms: 6, elite: { kind: 'queixada', mods: ['veloz'] } },
  { name: 'Mata Fechada', intro: 'A mata fecha. Tudo o que você já enfrentou está aqui junto.', pool: ['sauva', 'cuspidor', 'queixada', 'cogumelo', 'urutau'], rooms: 6, elite: { kind: 'tronco', mods: ['blindado', 'regenerador'] } },
  { name: 'A Toca', intro: 'Um miado fraco vem de dentro. Não caia, ou o filhote foge.', pool: ['urutau', 'queixada', 'cogumelo', 'sauva'], rooms: 6, elite: { kind: 'sauva', mods: ['veloz', 'vampirico'] }, rescue: 'onca' },
  { name: 'Clareira Antiga', intro: 'Pedras de um tempo em que ainda lembravam do guardião.', pool: ['sauva', 'cuspidor', 'queixada', 'cogumelo', 'urutau'], rooms: 7, elite: { kind: 'queixada', mods: ['veloz', 'explosivo'] } },
  { name: 'O Chamado da Caipora', intro: 'Ela vem montada, e a mata abre caminho para ela.', pool: ['sauva', 'queixada', 'urutau', 'cogumelo'], rooms: 5, boss: 'caipora', named: { unique: 'presaDaCaipora', chance: 3 } },
  { name: 'O Curupira', intro: 'As pegadas apontam para o lado errado. Leia o aviso, não o rastro.', pool: ['sauva', 'urutau', 'cogumelo'], rooms: 4, boss: 'curupira', named: { unique: 'coroaDeCipo', chance: 2 } },
];

const CH2: Plan[] = [
  { name: 'A Margem', intro: 'A mata acaba num barranco. Na água rasa, alguma coisa morde.', pool: ['piranha', 'sapo'], rooms: 5, water: true, firstClear: ['manto'] },
  { name: 'Igapó', intro: 'Floresta alagada até o joelho. Olhe onde pisa: a areia se mexe.', pool: ['piranha', 'sapo', 'arraia'], rooms: 5, water: true, named: { unique: 'ferraoDeArraia', chance: 4 } },
  { name: 'A Gaiola no Galho', intro: 'Um grito de arara vem do alto de uma árvore afogada.', pool: ['piranha', 'arraia', 'sapo'], rooms: 5, water: true, rescue: 'arara' },
  { name: 'Correnteza', intro: 'O rio aperta e puxa. Quem para de andar é levado.', pool: ['jacare', 'piranha', 'sapo'], rooms: 6, water: true, current: true },
  { name: 'O Dono do Remanso', intro: 'Um tronco boiando abre os olhos. É o maior jacaré que você já viu.', pool: ['piranha', 'sapo', 'arraia'], rooms: 6, water: true, elite: { kind: 'jacare', mods: ['blindado'] } },
  { name: 'Conchas', intro: 'Enquanto o caramujo estiver vivo, nada perto dele se machuca direito.', pool: ['caramujo', 'piranha', 'arraia'], rooms: 6, water: true },
  { name: 'Água Parada', intro: 'Sapos por toda parte, e as bolhas que eles cospem não somem.', pool: ['sapo', 'caramujo', 'jacare'], rooms: 6, water: true, elite: { kind: 'sapo', mods: ['veloz', 'explosivo'] } },
  { name: 'Braço Morto', intro: 'Um braço de rio esquecido. Tudo o que vive aqui está junto.', pool: ['piranha', 'sapo', 'arraia', 'jacare', 'caramujo'], rooms: 6, water: true, elite: { kind: 'caramujo', mods: ['regenerador', 'vampirico'] } },
  { name: 'Furo Estreito', intro: 'A passagem é estreita e a água corre contra você.', pool: ['piranha', 'jacare', 'arraia', 'caramujo'], rooms: 7, water: true, current: true, elite: { kind: 'jacare', mods: ['veloz'] } },
  { name: 'Véspera', intro: 'Música ao longe, de uma festa na beira do rio. Um botinho cor-de-rosa ficou preso num remanso.', pool: ['piranha', 'sapo', 'arraia', 'jacare', 'caramujo'], rooms: 7, water: true, rescue: 'botinho', elite: { kind: 'arraia', mods: ['veloz', 'explosivo'] } },
  { name: 'O Baile do Boto', intro: 'Um moço de chapéu branco dança sozinho. Ele não tira o chapéu.', pool: ['piranha', 'sapo', 'caramujo'], rooms: 5, water: true, boss: 'boto', named: { unique: 'denteDoBoto', chance: 3 } },
  { name: 'A Iara', intro: 'Ela canta, e os seus pés andam sozinhos na direção da água.', pool: ['piranha', 'arraia', 'sapo'], rooms: 4, water: true, boss: 'iara', named: { unique: 'escamaDaIara', chance: 2 } },
];


const CH3: Plan[] = [
  { name: 'Porteira do Sertão', intro: 'A mata acaba de repente. Daqui pra frente é terra rachada e calango correndo.', pool: ['calango', 'mandacaru'], rooms: 5, firstClear: ['borduna'] },
  { name: 'Leito Seco', intro: 'Um rio que secou. Na areia do fundo, alguma coisa chacoalha.', pool: ['calango', 'cascavel', 'mandacaru'], rooms: 5, firstClear: ['peixeiras'] },
  { name: 'Curral Vazio', intro: 'O gado sumiu. Ficou só o bode, e ele não gosta de visita.', pool: ['calango', 'bode', 'mandacaru'], rooms: 5 },
  { name: 'Céu de Urubu', intro: 'Eles rodam lá em cima. Quando descem as asas, o raio cai.', pool: ['urubu', 'calango', 'cascavel'], rooms: 5 },
  { name: 'A Toca do Tatu', intro: 'Um buraco fundo e um choro baixinho lá dentro.', pool: ['calango', 'bode', 'urubu'], rooms: 6, rescue: 'tatu', elite: { kind: 'mandacaru', mods: ['blindado', 'regenerador'] } },
  { name: 'Xique-Xique', intro: 'Espinho para todo lado. Ande devagar, mas não pare.', pool: ['mandacaru', 'cascavel', 'calango'], rooms: 6 },
  { name: 'Estrada de Romeiro', intro: 'Alguém deixou cair um cachimbo de barro no caminho. Ainda está quente.', pool: ['bode', 'urubu', 'cascavel'], rooms: 6, named: { unique: 'cachimboDoSaci', chance: 2 }, elite: { kind: 'bode', mods: ['veloz'] } },
  { name: 'Lajedo', intro: 'Pedra quente e cobra escondida em cada fresta.', pool: ['cascavel', 'mandacaru', 'urubu', 'calango'], rooms: 6, elite: { kind: 'urubu', mods: ['veloz', 'explosivo'] } },
  { name: 'O Pouso do Carcará', intro: 'Um carcará preso numa armadilha de corda grita no alto da cerca.', pool: ['calango', 'bode', 'urubu', 'mandacaru'], rooms: 6, rescue: 'carcara', elite: { kind: 'cascavel', mods: ['vampirico'] } },
  { name: 'Vento Quente', intro: 'O redemoinho passou por aqui. A poeira ainda não baixou.', pool: ['calango', 'cascavel', 'mandacaru', 'bode', 'urubu'], rooms: 7, elite: { kind: 'bode', mods: ['veloz', 'regenerador'] } },
  { name: 'O Corpo-Seco', intro: 'Nem a terra quis ficar com ele. Ele quer ficar com você.', pool: ['calango', 'urubu', 'cascavel'], rooms: 5, boss: 'corposeco', named: { unique: 'maoDoCorpoSeco', chance: 3 } },
  { name: 'O Saci', intro: 'Ele ri de você de dentro do redemoinho. E pegou uma coisa sua.', pool: ['calango', 'mandacaru', 'urubu'], rooms: 4, boss: 'saci', named: { unique: 'alpercatasDoRedemoinho', chance: 2 } },
];

const CH4: Plan[] = [
  { name: 'Campo Dourado', intro: 'Capim dourado até onde a vista alcança. E fumaça no fim dele.', pool: ['formiga', 'seriema'], rooms: 5, firstClear: ['zagaia'] },
  { name: 'Formigueiro em Brasa', intro: 'As formigas daqui não picam: queimam.', pool: ['formiga', 'pequizeiro', 'seriema'], rooms: 5, firstClear: ['cajado'] },
  { name: 'Pequizal', intro: 'Cuidado onde pisa e com o que cai das árvores.', pool: ['pequizeiro', 'formiga', 'taturana'], rooms: 5 },
  { name: 'A Vereda', intro: 'Um lobo-guará encurralado entre os buritis e o fogo.', pool: ['seriema', 'taturana', 'formiga'], rooms: 5, rescue: 'loboguara' },
  { name: 'Cidade de Barro', intro: 'Cupinzeiros por todo lado, e alguns andam.', pool: ['formiga', 'pequizeiro', 'taturana'], rooms: 6, elite: { kind: 'cupinzeiro', mods: ['blindado'] } },
  { name: 'Aceiro', intro: 'Uma faixa limpa contra o fogo. O fogo não respeitou.', pool: ['cupinzeiro', 'seriema', 'formiga'], rooms: 6 },
  { name: 'Lagarta de Fogo', intro: 'As taturanas incham quando chegam perto. Não deixe chegarem.', pool: ['taturana', 'pequizeiro', 'seriema'], rooms: 6, elite: { kind: 'seriema', mods: ['veloz', 'explosivo'] } },
  { name: 'Chapada', intro: 'Do alto da chapada se vê o rastro de fogo serpenteando no campo.', pool: ['formiga', 'seriema', 'pequizeiro', 'cupinzeiro'], rooms: 6, elite: { kind: 'cupinzeiro', mods: ['blindado', 'regenerador'] } },
  { name: 'Queimada', intro: 'Tudo em volta já queimou. O que sobrou está bravo.', pool: ['taturana', 'cupinzeiro', 'formiga', 'seriema'], rooms: 6, elite: { kind: 'pequizeiro', mods: ['explosivo', 'vampirico'] } },
  { name: 'O Ninho do Tamanduá', intro: 'Um tamanduá-bandeira cercado por formigas de fogo.', pool: ['formiga', 'seriema', 'pequizeiro', 'cupinzeiro', 'taturana'], rooms: 7, rescue: 'tamandua', elite: { kind: 'seriema', mods: ['veloz', 'vampirico'] } },
  { name: 'A Mula-sem-Cabeça', intro: 'Ferraduras de prata no chão e um galope sem cabeça na noite.', pool: ['formiga', 'taturana', 'seriema'], rooms: 5, boss: 'mula', named: { unique: 'crinaDaMula', chance: 3 } },
  { name: 'O Boitatá', intro: 'A cobra de fogo é do tamanho do campo. Só a cabeça sente.', pool: ['formiga', 'taturana', 'pequizeiro'], rooms: 4, boss: 'boitata', named: { unique: 'olhoDoBoitata', chance: 2 } },
];

const CH5: Plan[] = [
  { name: 'Onde o Sol Não Entra', intro: 'A selva fecha por cima. A luz que sobra é a sua.', pool: ['morcego', 'macaco'], rooms: 5 },
  { name: 'Vaga-lume', intro: 'Uma luzinha presa numa teia, piscando por socorro.', pool: ['morcego', 'aranha', 'macaco'], rooms: 5, rescue: 'vagalume' },
  { name: 'Raízes', intro: 'Raízes do tamanho de casas. Algo se mexe embaixo delas.', pool: ['aranha', 'besouro', 'morcego'], rooms: 5 },
  { name: 'O Totem', intro: 'Totens de barro guardam o caminho, e protegem quem está perto.', pool: ['totem', 'macaco', 'morcego'], rooms: 5 },
  { name: 'Igarapé Escuro', intro: 'A água é preta como o céu. Os besouros não se importam.', pool: ['morcego', 'macaco', 'aranha'], rooms: 6, elite: { kind: 'besouro', mods: ['blindado', 'regenerador'] } },
  { name: 'Ruína Antiga', intro: 'Pedras de um povo que lembrava do guardião.', pool: ['totem', 'besouro', 'aranha'], rooms: 6 },
  { name: 'Teia', intro: 'Fios por todo lado. Quem desce do escuro não avisa.', pool: ['aranha', 'morcego', 'totem'], rooms: 6, elite: { kind: 'aranha', mods: ['veloz', 'vampirico'] } },
  { name: 'A Preguiça', intro: 'Pendurada num galho, uma preguiça não consegue descer.', pool: ['macaco', 'besouro', 'morcego', 'totem'], rooms: 6, rescue: 'preguica', elite: { kind: 'macaco', mods: ['veloz', 'explosivo'] } },
  { name: 'Pegadas', intro: 'Pegadas fundas, de pé virado. Ele passou por aqui.', pool: ['besouro', 'aranha', 'totem', 'morcego'], rooms: 6, elite: { kind: 'totem', mods: ['regenerador', 'vampirico'] } },
  { name: 'Coração da Selva', intro: 'Tudo o que vive no escuro está aqui.', pool: ['morcego', 'besouro', 'aranha', 'macaco', 'totem'], rooms: 7, elite: { kind: 'besouro', mods: ['blindado', 'explosivo'] } },
  { name: 'O Capelobo', intro: 'Focinho de anta e fome de gente. Ele pula.', pool: ['morcego', 'aranha', 'macaco'], rooms: 5, boss: 'capelobo', named: { unique: 'couroDoCapelobo', chance: 3 }, rescue: 'sucuri' },
  { name: 'O Mapinguari', intro: 'Couro de pedra. Só a boca da barriga sente, quando ele ruge.', pool: ['morcego', 'besouro', 'macaco'], rooms: 4, boss: 'mapinguari', named: { unique: 'garraDoMapinguari', chance: 2 } },
];

const CH6: Plan[] = [
  { name: 'Coxilha', intro: 'Campo aberto, lua grande e um grito de quero-quero.', pool: ['queroquero', 'espantalho'], rooms: 5 },
  { name: 'Taipa de Pedra', intro: 'Cercas de pedra antigas. Algo se arrasta entre elas.', pool: ['queroquero', 'almapenada', 'espantalho'], rooms: 5 },
  { name: 'O Graxaim', intro: 'Um graxaim preso numa armadilha de laço.', pool: ['queroquero', 'boibarroso', 'espantalho'], rooms: 5, rescue: 'graxaim' },
  { name: 'Fogo-Fátuo', intro: 'Luzes frias no banhado. Não siga, e não deixe chegarem.', pool: ['fatuo', 'almapenada', 'queroquero'], rooms: 5 },
  { name: 'A Estância', intro: 'Uma estância abandonada, porteira aberta.', pool: ['queroquero', 'espantalho', 'fatuo'], rooms: 6, elite: { kind: 'boibarroso', mods: ['blindado'] } },
  { name: 'Sanga', intro: 'O riacho reflete uma lua que não está no céu.', pool: ['almapenada', 'boibarroso', 'queroquero'], rooms: 6 },
  { name: 'Rodeio de Almas', intro: 'As almas penadas rodeiam o campo, de corrente arrastando.', pool: ['almapenada', 'fatuo', 'espantalho'], rooms: 6, elite: { kind: 'espantalho', mods: ['veloz', 'explosivo'] } },
  { name: 'Figueira', intro: 'Embaixo da figueira velha, ninguém dorme.', pool: ['boibarroso', 'queroquero', 'fatuo', 'espantalho'], rooms: 6, elite: { kind: 'almapenada', mods: ['regenerador', 'vampirico'] } },
  { name: 'A Coruja', intro: 'Uma coruja-buraqueira encurralada no próprio buraco.', pool: ['espantalho', 'almapenada', 'boibarroso', 'queroquero'], rooms: 6, rescue: 'coruja', elite: { kind: 'boibarroso', mods: ['veloz'] } },
  { name: 'Noite Mais Longa', intro: 'A lua não se põe. Tudo do pampa está acordado.', pool: ['queroquero', 'boibarroso', 'almapenada', 'fatuo', 'espantalho'], rooms: 7, elite: { kind: 'fatuo', mods: ['explosivo', 'veloz'] } },
  { name: 'A Teiniaguá', intro: 'Uma lagartixa com uma pedra vermelha na testa. Quando ela brilha, corra.', pool: ['queroquero', 'fatuo', 'espantalho'], rooms: 5, boss: 'teiniagua', named: { unique: 'pedraDaTeiniagua', chance: 3 } },
  { name: 'O Lobisomem', intro: 'Ele ainda é homem. Por enquanto. A lua está enchendo.', pool: ['queroquero', 'almapenada', 'fatuo'], rooms: 4, boss: 'lobisomem', named: { unique: 'denteDoLobisomem', chance: 2 } },
];

const CH7: Plan[] = [
  { name: 'Aguapé', intro: 'Água rasa, aguapé e uma névoa cor-de-rosa.', pool: ['ariranha', 'soco'], rooms: 5 },
  { name: 'Corixo', intro: 'Ariranhas em bando e garças que atiram de longe.', pool: ['ariranha', 'soco', 'jararaca'], rooms: 5 },
  { name: 'Ninhal', intro: 'Ninhos por toda parte. Nem todo bicho que você vê está aqui.', pool: ['soco', 'jararaca', 'ariranha'], rooms: 5 },
  { name: 'O Jacaré', intro: 'Um filhote de jacaré colorido, cercado por sapos-feiticeiros.', pool: ['cururu', 'ariranha', 'soco'], rooms: 5, rescue: 'jacarezinho' },
  { name: 'Baía', intro: 'Uma tracajá do tamanho de uma canoa se levanta da lama.', pool: ['ariranha', 'soco', 'cururu'], rooms: 6, elite: { kind: 'tracaja', mods: ['blindado'] } },
  { name: 'Capão', intro: 'Ilhas de mato no meio da água. Cobras no capim.', pool: ['jararaca', 'tracaja', 'cururu'], rooms: 6 },
  { name: 'Caldo Encantado', intro: 'O cheiro de caldeirão já chega até aqui.', pool: ['cururu', 'soco', 'ariranha', 'jararaca'], rooms: 6, elite: { kind: 'cururu', mods: ['veloz', 'regenerador'] } },
  { name: 'Corredor de Ilusões', intro: 'Metade do que ataca é de mentira. Descubra qual metade.', pool: ['ariranha', 'jararaca', 'tracaja', 'soco'], rooms: 6, elite: { kind: 'soco', mods: ['explosivo', 'vampirico'] } },
  { name: 'Lagoa da Lua', intro: 'A lua do pampa caiu aqui e ficou boiando.', pool: ['tracaja', 'cururu', 'soco', 'jararaca'], rooms: 6, elite: { kind: 'jararaca', mods: ['veloz', 'vampirico'] } },
  { name: 'O Tuiuiú', intro: 'O tuiuiú está preso num feitiço de sono, de pé, no meio da água.', pool: ['ariranha', 'soco', 'jararaca', 'cururu', 'tracaja'], rooms: 7, rescue: 'tuiuiu', elite: { kind: 'tracaja', mods: ['blindado', 'regenerador'] } },
  { name: 'A Pisadeira', intro: 'Ela espera você parar para pisar. Não pare.', pool: ['ariranha', 'cururu', 'soco'], rooms: 5, boss: 'pisadeira', named: { unique: 'toucaDaPisadeira', chance: 3 } },
  { name: 'A Cuca', intro: 'Dorme, nenê, que a Cuca vem pegar. Não durma.', pool: ['ariranha', 'jararaca', 'cururu'], rooms: 4, boss: 'cuca', named: { unique: 'colherDaCuca', chance: 2 } },
];

const CH8: Plan[] = [
  { name: 'Depois do Último Rio', intro: 'O mapa acaba aqui. O chão continua.', pool: ['vulto', 'lembranca'], rooms: 5 },
  { name: 'Sem Cor', intro: 'Nem cinza: aqui as coisas não têm cor nenhuma.', pool: ['vulto', 'vazio', 'lembranca'], rooms: 5 },
  { name: 'Retratos', intro: 'Retratos rasgados flutuam. Você conhece alguns desses rostos.', pool: ['lembranca', 'vulto', 'silencio'], rooms: 5 },
  { name: 'Silêncio', intro: 'Ninguém fala. Quem tenta, esquece a palavra.', pool: ['silencio', 'vazio', 'vulto'], rooms: 5 },
  { name: 'Estátuas', intro: 'Estátuas sem rosto. Algumas se viram quando você passa.', pool: ['vulto', 'lembranca', 'vazio'], rooms: 6, elite: { kind: 'esquecido', mods: ['blindado'] } },
  { name: 'Ecos', intro: 'Você ouve o Curupira rindo. Mas ele está ao seu lado.', pool: ['esquecido', 'silencio', 'vulto'], rooms: 6 },
  { name: 'Página em Branco', intro: 'O chão vai se apagando. Ande rápido.', pool: ['vazio', 'lembranca', 'silencio', 'vulto'], rooms: 6, elite: { kind: 'silencio', mods: ['veloz', 'regenerador'] } },
  { name: 'Os Nomes', intro: 'Escritos no chão, os nomes dos Encantados. Alguns já sumiram.', pool: ['vulto', 'esquecido', 'lembranca', 'vazio'], rooms: 6, elite: { kind: 'lembranca', mods: ['explosivo', 'vampirico'] } },
  { name: 'Borda', intro: 'Daqui para frente, só o branco.', pool: ['esquecido', 'silencio', 'vazio', 'vulto'], rooms: 6, elite: { kind: 'esquecido', mods: ['blindado', 'regenerador'] } },
  { name: 'Tudo Junto', intro: 'Tudo o que foi esquecido vem de uma vez.', pool: ['vulto', 'vazio', 'lembranca', 'esquecido', 'silencio'], rooms: 7, elite: { kind: 'vulto', mods: ['veloz', 'vampirico'] } },
  { name: 'Ecos dos Sete', intro: 'Os sete Encantados, do jeito que foram esquecidos.', pool: ['vulto', 'lembranca', 'vazio'], rooms: 5, boss: 'ecos', named: { unique: 'ecoDosSete', chance: 3 } },
  { name: 'O Esquecimento', intro: 'Ele não tem rosto. Ele quer o seu nome.', pool: ['vulto', 'vazio', 'silencio'], rooms: 4, boss: 'esquecimento', named: { unique: 'fioDoEsquecimento', chance: 2 } },
];

/** Caminho de cada capítulo no mapa: 12 pontos, de 0 a 1. */
const MAPS: Record<number, [number, number][]> = {
  1: [[0.1, 0.24], [0.33, 0.17], [0.56, 0.25], [0.8, 0.18], [0.88, 0.47], [0.64, 0.54], [0.4, 0.46], [0.16, 0.54], [0.12, 0.82], [0.36, 0.86], [0.6, 0.77], [0.85, 0.83]],
  2: [[0.08, 0.8], [0.26, 0.7], [0.19, 0.44], [0.36, 0.27], [0.56, 0.19], [0.75, 0.29], [0.67, 0.52], [0.46, 0.58], [0.5, 0.82], [0.71, 0.85], [0.88, 0.66], [0.9, 0.36]],
  3: [[0.08, 0.5], [0.2, 0.28], [0.36, 0.2], [0.5, 0.34], [0.42, 0.58], [0.28, 0.78], [0.46, 0.86], [0.62, 0.7], [0.7, 0.46], [0.8, 0.24], [0.9, 0.5], [0.86, 0.8]],
  4: [[0.1, 0.82], [0.14, 0.56], [0.26, 0.36], [0.4, 0.2], [0.56, 0.3], [0.48, 0.54], [0.34, 0.7], [0.52, 0.82], [0.68, 0.66], [0.76, 0.42], [0.7, 0.18], [0.9, 0.3]],
  5: [[0.06, 0.22], [0.22, 0.3], [0.18, 0.56], [0.32, 0.78], [0.48, 0.66], [0.42, 0.4], [0.56, 0.2], [0.72, 0.3], [0.66, 0.56], [0.78, 0.78], [0.92, 0.62], [0.86, 0.32]],
  6: [[0.1, 0.3], [0.28, 0.22], [0.44, 0.3], [0.6, 0.2], [0.78, 0.28], [0.88, 0.5], [0.7, 0.6], [0.52, 0.52], [0.34, 0.6], [0.18, 0.74], [0.4, 0.84], [0.66, 0.82]],
  7: [[0.08, 0.62], [0.22, 0.8], [0.38, 0.7], [0.3, 0.46], [0.18, 0.26], [0.36, 0.16], [0.52, 0.32], [0.58, 0.58], [0.74, 0.76], [0.88, 0.6], [0.8, 0.36], [0.9, 0.16]],
  8: [[0.08, 0.5], [0.18, 0.3], [0.3, 0.5], [0.22, 0.74], [0.4, 0.78], [0.5, 0.56], [0.42, 0.3], [0.58, 0.18], [0.7, 0.38], [0.66, 0.66], [0.8, 0.8], [0.88, 0.5]],
};

const LEGACY_COST: Partial<Record<EnemyKind, number>> = {
  sauva: 1, cogumelo: 1.4, cuspidor: 1.8, urutau: 1.8, queixada: 2.6, tronco: 4,
  piranha: 1.1, sapo: 1.7, arraia: 2, caramujo: 2.4, jacare: 3.4,
};
const LEGACY_CAP: Partial<Record<EnemyKind, number>> = { queixada: 2, cuspidor: 3, tronco: 1, urutau: 3, cogumelo: 4, sapo: 3, arraia: 3, caramujo: 1, jacare: 2 };
const COST = (k: EnemyKind): number => (isMonster(k) ? MONSTERS[k].cost : isBossKind(k) ? 99 : LEGACY_COST[k] ?? 99);
const CAP = (k: EnemyKind): number => (isMonster(k) ? MONSTERS[k].cap : LEGACY_CAP[k] ?? 12);
const CHAMPION_MODS: EliteMod[] = ['veloz', 'vampirico', 'regenerador', 'explosivo'];

function place(rng: Rng, kind: EnemyKind, used: { x: number; y: number }[]): { x: number; y: number } {
  const w = ARENA.x1 - ARENA.x0, h = ARENA.y1 - ARENA.y0;
  for (let tries = 0; tries < 30; tries++) {
    let x = ARENA.x0 + w * (0.42 + rng() * 0.52), y = ARENA.y0 + 50 + rng() * (h - 100);
    if (kind === 'cuspidor' || kind === 'sapo') x = ARENA.x0 + w * (0.66 + rng() * 0.28);
    if (kind === 'urutau') { x = ARENA.x0 + w * (0.3 + rng() * 0.62); y = rng() < 0.5 ? ARENA.y0 + 34 + rng() * 40 : ARENA.y1 - 34 - rng() * 40; }
    if (kind === 'arraia') x = ARENA.x0 + w * (0.3 + rng() * 0.6);
    if (isMonster(kind)) {
      const a = MONSTERS[kind].arch;
      if (a === 'atirador' || a === 'conjurador') x = ARENA.x0 + w * (0.62 + rng() * 0.32);
      if (a === 'emboscada') x = ARENA.x0 + w * (0.28 + rng() * 0.64);
    }
    if (used.every((u) => Math.hypot(u.x - x, u.y - y) > 76)) { used.push({ x, y }); return { x: Math.round(x), y: Math.round(y) }; }
  }
  const p = { x: Math.round(ARENA.x0 + w * 0.75), y: Math.round(ARENA.y0 + h * rng()) };
  used.push(p);
  return p;
}

export function wave(rng: Rng, pool: EnemyKind[], budget: number, used: { x: number; y: number }[], championChance: number): SpawnDef[] {
  const out: SpawnDef[] = [], count: Partial<Record<EnemyKind, number>> = {};
  let left = budget;
  for (let guard = 0; guard < 60 && left >= 0.9; guard++) {
    const options = pool.filter((k) => COST(k) <= left && (count[k] ?? 0) < CAP(k));
    if (!options.length) break;
    const k = pick(rng, options);
    count[k] = (count[k] ?? 0) + 1; left -= COST(k);
    out.push({ kind: k, ...place(rng, k, used) });
  }
  if (!out.length) out.push({ kind: pool[0], ...place(rng, pool[0], used) });
  /* campeão: um inimigo comum mais forte, com um modificador */
  if (rng() < championChance) {
    const c = out[Math.floor(rng() * out.length)];
    if (c.kind !== 'caramujo' && !(isMonster(c.kind) && MONSTERS[c.kind].arch === 'protetor')) { c.champion = true; c.mods = [pick(rng, CHAMPION_MODS)]; }
  }
  return out;
}

function altarRooms(n: number): number[] {
  return n >= 7 ? [2, 5] : n >= 6 ? [1, 4] : [Math.max(1, Math.floor(n / 2))];
}

function buildRooms(plan: Plan, level: number, seed: number, chapter = 1, number = 0): RoomDef[] {
  const rng = makeRng(seed), rooms: RoomDef[] = [], altars = altarRooms(plan.rooms);
  const championChance = level <= 2 ? 0 : Math.min(0.6, 0.12 + level * 0.04);
  for (let i = 0; i < plan.rooms; i++) {
    const last = i === plan.rooms - 1, bg = (seed + i) % 3;
    const room: RoomDef = { type: 'combat', waves: [], bg };
    if (plan.water) {
      const n = 2 + Math.floor(rng() * 3);
      room.puddles = Array.from({ length: n }, () => ({
        x: Math.round(ARENA.x0 + 140 + rng() * (ARENA.x1 - ARENA.x0 - 280)), y: Math.round(ARENA.y0 + 80 + rng() * (ARENA.y1 - ARENA.y0 - 160)), r: Math.round(70 + rng() * 60),
      }));
      if (plan.current && !altars.includes(i)) room.current = (rng() < 0.5 ? -1 : 1) * Math.round(46 + rng() * 22);
    }
    if (altars.includes(i) && !last) { room.type = 'altar'; rooms.push(room); continue; }
    const terrain = TERRAIN[chapter];
    if (terrain) {
      const t = terrain(rng, number);
      if (last && plan.boss) { if (t.dark) room.dark = true; if (t.moon) room.moon = true; if (t.erase) room.erase = true; }
      else Object.assign(room, t);
    }
    const budget = 5.5 + 1.25 * Math.min(level, 12) + (0.35 * Math.max(0, Math.min(level, 24) - 12) + i * 0.7) - (plan.boss ? 5 : 0);
    if (last && plan.boss) {
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.72), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      room.type = 'boss'; room.waves = [[{ kind: plan.boss, ...c, elite: true }]];
      room.current = undefined;
    } else if (last && plan.elite) {
      const used: { x: number; y: number }[] = [];
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.75), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      used.push(c);
      const adds = plan.pool.filter((k) => k !== plan.elite!.kind);
      room.type = 'elite';
      room.waves = [
        [{ kind: plan.elite.kind, ...c, elite: true, mods: plan.elite.mods }, ...wave(rng, adds, budget * 0.4, used, 0)],
        wave(rng, adds, budget * 0.45, [], 0),
      ];
    } else {
      const n = level >= 3 ? 3 : 2, share = n === 3 ? 0.44 : 0.62;
      room.waves = Array.from({ length: n }, (_, k) => wave(rng, plan.pool, budget * (share + k * 0.06), [], k > 0 ? championChance : 0));
    }
    rooms.push(room);
  }
  return rooms;
}

function buildChapter(chapter: number, plans: Plan[]): StageDef[] {
  return plans.map((plan, n) => {
    const index = (chapter - 1) * 12 + n, level = stageLevel(index), rooms = buildRooms(plan, level, 1000 + index * 77, chapter, n);
    const kinds = Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind))));
    const enemies = rooms.reduce((s, r) => s + r.waves.reduce((a, w) => a + w.length, 0), 0);
    /* calibrado para cerca de uma vez e meia o tempo de um jogador automático cuidadoso */
    const starTime = Math.round((enemies * 1.9 + rooms.length * 8 + (plan.elite ? 20 : 0) + (plan.boss ? 90 : 0)) / 5) * 5;
    const [x, y] = MAPS[chapter][n];
    return {
      id: `${chapter}-${n + 1}`, chapter, index, number: n + 1, name: plan.name, intro: plan.intro, level, rooms, starTime, kinds,
      final: plan.boss ? 'chefao' : plan.elite ? 'elite' : 'normal',
      named: plan.named, rescue: plan.rescue, firstClear: plan.firstClear, map: { x, y },
    };
  });
}

export const STAGES: StageDef[] = [
  ...buildChapter(1, CH1), ...buildChapter(2, CH2), ...buildChapter(3, CH3), ...buildChapter(4, CH4),
  ...buildChapter(5, CH5), ...buildChapter(6, CH6), ...buildChapter(7, CH7), ...buildChapter(8, CH8),
];

export const STAGE_BY_ID: ReadonlyMap<string, StageDef> = new Map(STAGES.map((s) => [s.id, s]));

export function stagesOf(chapter: number): StageDef[] {
  return STAGES.filter((s) => s.chapter === chapter);
}

const LEGACY_NAMES: Partial<Record<EnemyKind, string>> = {
  sauva: 'Saúva-Cinza', queixada: 'Queixada Sombria', cuspidor: 'Cuspidor', tronco: 'Tronco-Oco',
  urutau: 'Urutau', cogumelo: 'Cogumelo-Estouro', caipora: 'Caipora', curupira: 'Curupira',
  piranha: 'Piranha-Cinza', sapo: 'Sapo-Cururu', arraia: 'Arraia de Areia', caramujo: 'Caramujo-Concha', jacare: 'Jacaré de Lodo',
  boto: 'Boto', iara: 'Iara', boneco: 'Boneco de Treino',
};

/** Como cada inimigo luta, em poucas palavras, para os avisos do mapa. */
const LEGACY_HINT: Partial<Record<EnemyKind, string>> = {
  sauva: 'Vem em bando e morde de perto.',
  queixada: 'Marca uma linha e avança. Fica tonta se bater.',
  cuspidor: 'Cospe de longe onde você está.',
  tronco: 'Lento e blindado. Só sente depois que bate.',
  urutau: 'Parece um galho até você chegar perto.',
  cogumelo: 'Corre até você e explode.',
  caipora: 'Duas investidas seguidas, depois cansa.',
  curupira: 'Some, deixa pegadas falsas e ataca do outro lado.',
  piranha: 'Rápida. Salta em linha reta para morder.',
  sapo: 'Cospe bolhas que viram poças.',
  arraia: 'Enterrada na areia. Atira o ferrão e some de novo.',
  caramujo: 'Protege os inimigos em volta. Mate primeiro.',
  jacare: 'Bote longo de frente, rabada se você fica atrás.',
  boto: 'Mergulha e sai debaixo de você.',
  iara: 'O canto te puxa para ela.',
  boneco: 'Não anda, não bate e não cai.',
};

export const ENEMY_NAMES = new Proxy({} as Record<EnemyKind, string>, {
  get: (_, k: string) => (isMonster(k as EnemyKind) ? MONSTERS[k as keyof typeof MONSTERS].name : isBossKind(k as EnemyKind) ? BOSSES[k as keyof typeof BOSSES].name : LEGACY_NAMES[k as EnemyKind] ?? k),
});
/** Como cada inimigo luta, em poucas palavras, para os avisos do mapa. */
export const ENEMY_HINT = new Proxy({} as Record<EnemyKind, string>, {
  get: (_, k: string) => (isMonster(k as EnemyKind) ? MONSTERS[k as keyof typeof MONSTERS].hint : isBossKind(k as EnemyKind) ? BOSSES[k as keyof typeof BOSSES].hint : LEGACY_HINT[k as EnemyKind] ?? ''),
});

export const MOD_NAMES: Record<EliteMod, string> = {
  blindado: 'Blindado', veloz: 'Veloz', vampirico: 'Vampírico', explosivo: 'Explosivo', regenerador: 'Regenerador',
};

export const MOD_HINT: Record<EliteMod, string> = {
  blindado: 'Recebe metade do dano, menos quando está caído ou preso.',
  veloz: 'Mais rápido e avisa por menos tempo.',
  vampirico: 'Recupera vida quando te acerta.',
  explosivo: 'Explode pouco depois de morrer.',
  regenerador: 'Recupera vida se ficar 3 s sem apanhar.',
};
