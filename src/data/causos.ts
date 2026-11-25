/**
 * Causos do Sonho (docs/gdd/09): encontros do folclore com duas ou três escolhas.
 * Um causo é só dado: o texto, a figura e, em cada escolha, uma lista fechada de efeitos (`DreamEffect`),
 * que src/meta/dream.ts sabe aplicar. Um causo novo não pede código.
 */
import type { AmuletRarity } from './amulets';
import type { ElementId } from './content';

export type DreamEffect =
  /** Ganha (ou perde) vinténs. */
  | { t: 'vintem'; n: number }
  /** Ganha (ou perde) esta fração da vida máxima. A vida nunca cai abaixo de 1. */
  | { t: 'vida'; frac: number }
  /** Ganha (ou perde) poções. */
  | { t: 'pocao'; n: number }
  /** Recebe uma bênção sorteada: de um padrinho (ou de qualquer um), de uma raridade exata (ou qualquer). */
  | { t: 'bencao'; patron?: ElementId; tier?: 1 | 2 | 3 }
  /** Uma das suas bênçãos sobe um nível. */
  | { t: 'subir' }
  /** Perde uma bênção sorteada. */
  | { t: 'esquecer' }
  /** Recebe um amuleto sorteado, da raridade dada (ou qualquer). */
  | { t: 'amuleto'; rarity?: AmuletRarity }
  /** Maldição até o fim do trecho: os monstros ganham esta fração a mais de vida e de dano. */
  | { t: 'maldicao'; hp?: number; damage?: number }
  /** Ganha Lembranças. */
  | { t: 'lembrancas'; n: number };

export interface CausoChoice {
  label: string;
  /** O que a escolha dá, em poucas palavras, quando não é óbvio pelos efeitos. */
  note?: string;
  effects: DreamEffect[];
}

export type CausoId = 'matinta' | 'fulozinha' | 'boto' | 'pisadeira' | 'saci' | 'maeDoOuro' | 'mula' | 'iara' | 'lobisomem' | 'cuca'
  /* fase 4 */
  | 'pegadas' | 'boitata' | 'mapinguari' | 'corpoSeco' | 'capelobo' | 'teiniagua' | 'almaPenada' | 'boiBarroso' | 'cobraGrande' | 'espantalho';

export interface CausoDef {
  id: CausoId;
  title: string;
  text: string;
  /** Figura do retrato (chave de src/ui/retratos.ts) e a cor do luar atrás dela. */
  figure: string;
  color: string;
  /** Só aparece depois que este padrinho foi libertado. */
  needs?: ElementId;
  choices: CausoChoice[];
  /** Um parágrafo sobre a lenda, para o Almanaque. */
  lore: string;
}

export const CAUSOS: Record<CausoId, CausoDef> = {
  matinta: {
    id: 'matinta', title: 'Matinta Perera', figure: 'coruja', color: '#9a6aff',
    text: 'Um assobio comprido corta a noite, de cima do telhado. É a velha que vira pássaro. Amanhã cedo ela bate na porta para cobrar o que foi prometido.',
    choices: [
      { label: 'Prometer café e fumo', effects: [{ t: 'vintem', n: -30 }, { t: 'bencao', tier: 2 }] },
      { label: 'Fechar a janela', note: 'O assobio fica na cabeça.', effects: [{ t: 'maldicao', hp: 0.15 }, { t: 'lembrancas', n: 6 }] },
    ],
    lore: 'No Norte, quem ouve o assobio da Matinta grita da janela: “Vem buscar café amanhã!”. De manhã aparece uma velha pedindo café e fumo. Quem não dá, a casa não tem sossego.',
  },
  fulozinha: {
    id: 'fulozinha', title: 'Comadre Fulozinha', figure: 'caipora', color: '#7bd45a',
    text: 'Uma menina de cabelo comprido olha de trás de um tronco. O cipó na mão dela estala no ar. Ela gosta de mingau e não gosta de quem maltrata bicho.',
    choices: [
      { label: 'Deixar o mingau no toco', effects: [{ t: 'pocao', n: -1 }, { t: 'bencao', patron: 'natureza' }] },
      { label: 'Assobiar de volta', note: 'Ela não gosta. O cipó estala.', effects: [{ t: 'vida', frac: -0.15 }, { t: 'vintem', n: 40 }] },
      { label: 'Passar quieto', effects: [] },
    ],
    lore: 'Na Zona da Mata nordestina, a Comadre Fulozinha protege a mata e os bichos. Trança a crina dos cavalos, açoita caçador com cipó e aceita mingau e fumo de presente.',
  },
  boto: {
    id: 'boto', title: 'O moço de chapéu branco', figure: 'boto', color: '#4fb6f0', needs: 'agua',
    text: 'Tem festa na beira do rio. Um moço de terno e chapéu branco, que ninguém viu chegar, chama para dançar. Ele não tira o chapéu por nada.',
    choices: [
      { label: 'Dançar até cansar', note: 'Ele some antes do sol, e a sua bolsa fica mais leve.', effects: [{ t: 'vida', frac: 0.35 }, { t: 'vintem', n: -20 }] },
      { label: 'Derrubar o chapéu dele', note: 'O furo no alto da cabeça aparece. Ele foge e larga uma coisa.', effects: [{ t: 'amuleto', rarity: 'comum' }, { t: 'maldicao', damage: 0.12 }] },
      { label: 'Ficar só olhando', effects: [{ t: 'lembrancas', n: 5 }] },
    ],
    lore: 'Em noite de festa junina, o boto sai do rio como um moço elegante. O chapéu esconde o furo por onde ele respira. Antes de amanhecer ele volta para a água.',
  },
  pisadeira: {
    id: 'pisadeira', title: 'Passos no telhado', figure: 'pisadeira', color: '#ff7ad9',
    text: 'Você achou um rancho para descansar. Lá em cima, as telhas rangem devagar. Alguém magro, de unha comprida, espera você pegar no sono.',
    choices: [
      { label: 'Dormir assim mesmo', note: 'Ela desce e pisa no seu peito a noite inteira.', effects: [{ t: 'vida', frac: 1 }, { t: 'maldicao', damage: 0.15 }] },
      { label: 'Ficar de vigia', note: 'Sem dormir, sobra tempo para treinar.', effects: [{ t: 'subir' }] },
    ],
    lore: 'A Pisadeira mora no telhado e desce quando alguém dorme de barriga cheia, de costas. Senta no peito da pessoa, que acorda sem ar e sem conseguir se mexer.',
  },
  saci: {
    id: 'saci', title: 'Redemoinho na encruzilhada', figure: 'saci_free', color: '#ffd23f', needs: 'tempestade',
    text: 'Um redemoinho de folhas para na sua frente e, de dentro dele, sai uma risada. O Saci quer fazer uma troca. Ele sempre quer.',
    choices: [
      { label: 'Aceitar a troca', note: 'Ele leva uma bênção sua e deixa duas das dele.', effects: [{ t: 'esquecer' }, { t: 'bencao', patron: 'tempestade' }, { t: 'bencao', patron: 'tempestade' }] },
      { label: 'Pegar o gorro dele', note: 'Com o gorro na mão, ele paga para ter de volta. E esconde uma poção sua, de pirraça.', effects: [{ t: 'vintem', n: 45 }, { t: 'pocao', n: -1 }] },
      { label: 'Jogar uma peneira no redemoinho', effects: [{ t: 'lembrancas', n: 5 }] },
    ],
    lore: 'Dizem que em todo redemoinho de vento mora um Saci. Quem joga uma peneira de cruzeta ou um rosário em cima prende o moleque, e quem fica com o gorro manda nele.',
  },
  maeDoOuro: {
    id: 'maeDoOuro', title: 'A luz que anda', figure: 'fatuo', color: '#f2c14e',
    text: 'Uma bola de fogo dourado cruza o céu devagar e desce atrás do morro. Onde ela pousa, dizem, tem ouro enterrado. O caminho até lá é de espinho.',
    choices: [
      { label: 'Seguir a luz', effects: [{ t: 'vintem', n: 55 }, { t: 'vida', frac: -0.2 }] },
      { label: 'Marcar o lugar e seguir viagem', effects: [{ t: 'lembrancas', n: 6 }] },
    ],
    lore: 'A Mãe-do-Ouro é uma bola de fogo que voa de uma serra para outra e mostra onde há jazida. Quem a segue por cobiça costuma se perder no mato.',
  },
  mula: {
    id: 'mula', title: 'Tropel na estrada', figure: 'mula', color: '#ff7a2a', needs: 'fogo',
    text: 'Um galope vem pela estrada, soltando faísca nas pedras. É noite de quinta para sexta. Quem tira o freio de ferro da boca dela quebra o encanto.',
    choices: [
      { label: 'Arrancar o freio de ferro', note: 'O fogo queima a mão, mas ela deixa um presente.', effects: [{ t: 'vida', frac: -0.25 }, { t: 'amuleto', rarity: 'raro' }] },
      { label: 'Deitar de bruços e esconder as unhas', note: 'Ela passa por cima e não vê você.', effects: [{ t: 'lembrancas', n: 4 }] },
    ],
    lore: 'A Mula-sem-Cabeça corre sete freguesias numa noite. Quem a encontra deve deitar e esconder unhas e dentes, que brilham no escuro. Tirar o freio ou tirar sangue dela desfaz a maldição.',
  },
  iara: {
    id: 'iara', title: 'Canto na beira d’água', figure: 'iara', color: '#4fb6f0', needs: 'agua',
    text: 'A Iara, que você libertou, canta numa pedra do rio. Desta vez o canto não puxa ninguém para o fundo. Mas ainda custa alguma coisa parar para ouvir.',
    choices: [
      { label: 'Sentar e ouvir até o fim', note: 'Você esquece a hora, e metade da bolsa.', effects: [{ t: 'vida', frac: 0.5 }, { t: 'pocao', n: 1 }, { t: 'vintem', n: -25 }] },
      { label: 'Pedir a bênção e seguir', effects: [{ t: 'bencao', patron: 'agua', tier: 1 }] },
    ],
    lore: 'A mãe-d’água mora no fundo dos rios. O canto dela enfeitiça os pescadores, que mergulham atrás e não voltam. Quem escapa fica com o juízo fraco.',
  },
  lobisomem: {
    id: 'lobisomem', title: 'O sétimo filho', figure: 'lobisomem', color: '#9a6aff', needs: 'sombra',
    text: 'Um homem pálido, de olheiras fundas, divide o fogo com você. Ele olha para a lua, que está quase cheia, e pede um pouco de comida antes que seja tarde.',
    choices: [
      { label: 'Dividir a comida', effects: [{ t: 'pocao', n: -1 }, { t: 'bencao', patron: 'sombra', tier: 2 }] },
      { label: 'Ficar para ver a lua subir', note: 'Ele vira. Você aprende alguma coisa, e leva umas unhadas.', effects: [{ t: 'vida', frac: -0.2 }, { t: 'lembrancas', n: 12 }] },
    ],
    lore: 'O sétimo filho homem de um casal vira lobisomem nas noites de lua cheia de sexta-feira. Corre sete cemitérios, sete vilas e sete encruzilhadas antes de o galo cantar.',
  },
  cuca: {
    id: 'cuca', title: 'O caldeirão da Cuca', figure: 'cuca_free', color: '#ff7ad9', needs: 'encanto',
    text: 'A Cuca mexe um caldeirão que muda de cor a cada volta da colher. Ela oferece uma concha, sorrindo com dente demais. Nem ela sabe direito o que tem ali hoje.',
    choices: [
      { label: 'Provar', note: 'É forte. Fica um gosto que atiça os bichos.', effects: [{ t: 'bencao', tier: 3 }, { t: 'maldicao', hp: 0.2 }] },
      { label: 'Agradecer e recusar', note: 'Ela ri e joga umas moedas, pela educação.', effects: [{ t: 'vintem', n: 15 }] },
    ],
    lore: 'A Cuca das cantigas de ninar pega criança que não quer dormir. Tem cara de jacaré, cabelo desgrenhado e voz de assustar. Dorme uma noite a cada sete anos.',
  },
  /* ---- fase 4 ---- */
  pegadas: {
    id: 'pegadas', title: 'Pegadas ao contrário', figure: 'curupira', color: '#7bd45a', needs: 'natureza',
    text: 'O rastro no barro vai para um lado, mas o riso vem do outro. O Curupira, que você libertou, ainda gosta de ver gente andando em círculo.',
    choices: [
      { label: 'Seguir as pegadas', note: 'Você roda a mata inteira. Ele acha graça e paga a brincadeira.', effects: [{ t: 'vida', frac: -0.15 }, { t: 'bencao', patron: 'natureza', tier: 2 }] },
      { label: 'Ir pelo lado contrário', effects: [{ t: 'vintem', n: 20 }] },
      { label: 'Deixar fumo num toco', effects: [{ t: 'pocao', n: -1 }, { t: 'amuleto', rarity: 'comum' }] },
    ],
    lore: 'O Curupira tem os pés virados para trás. Quem segue o rastro dele anda para longe de onde ele está, e se perde. Fumo e cachaça num toco compram a passagem.',
  },
  boitata: {
    id: 'boitata', title: 'O fogo que corre', figure: 'boitata_free', color: '#ff7a2a', needs: 'fogo',
    text: 'Uma cobra de fogo atravessa o campo queimado sem queimar mais nada. Ela para e olha para você com olhos demais.',
    choices: [
      { label: 'Olhar de volta', note: 'Dizem que cega. Só arde, e fica alguma coisa acesa em você.', effects: [{ t: 'vida', frac: -0.2 }, { t: 'bencao', patron: 'fogo', tier: 2 }] },
      { label: 'Fechar os olhos e ficar parado', effects: [{ t: 'lembrancas', n: 6 }] },
    ],
    lore: 'O Boitatá é a cobra de fogo que guarda os campos de quem põe fogo à toa. Comeu os olhos dos bichos mortos na grande enchente, e por isso brilha.',
  },
  mapinguari: {
    id: 'mapinguari', title: 'Um grito na mata fechada', figure: 'mapinguari_free', color: '#c99a5a', needs: 'terra',
    text: 'Um grito parecido com o de gente vem do fundo da mata, e o cheiro chega antes. O Mapinguari, de volta ao que era, cobra respeito de quem passa.',
    choices: [
      { label: 'Responder ao grito', note: 'Ele vem ver quem é. Os bichos da mata vêm atrás.', effects: [{ t: 'amuleto', rarity: 'raro' }, { t: 'maldicao', damage: 0.15 }] },
      { label: 'Deixar uma oferenda', effects: [{ t: 'pocao', n: -1 }, { t: 'subir' }] },
      { label: 'Tapar o nariz e seguir', effects: [{ t: 'lembrancas', n: 4 }] },
    ],
    lore: 'Na Amazônia, o Mapinguari é um bicho peludo, de um olho só e a boca na barriga. Quem responde ao grito dele na mata não volta para contar.',
  },
  corpoSeco: {
    id: 'corpoSeco', title: 'O que a terra não quis', figure: 'corposeco', color: '#c99a5a',
    text: 'Encostado numa cerca, um homem seco como couro curtido segura um embrulho contra o peito. A terra o devolveu duas vezes.',
    choices: [
      { label: 'Pegar o embrulho', note: 'Tem moeda dentro. Ele vem atrás, devagar, o trecho inteiro.', effects: [{ t: 'vintem', n: 55 }, { t: 'maldicao', hp: 0.2 }] },
      { label: 'Cavar uma cova para ele', note: 'Dá trabalho, e desta vez a terra aceita.', effects: [{ t: 'vida', frac: -0.1 }, { t: 'lembrancas', n: 12 }] },
      { label: 'Passar longe', effects: [] },
    ],
    lore: 'O Corpo-Seco foi tão ruim em vida, com a mãe principalmente, que nem a terra o aceita. Fica vagando, seco, agarrado nas árvores da beira da estrada.',
  },
  capelobo: {
    id: 'capelobo', title: 'Focinho de tamanduá', figure: 'capelobo', color: '#9a6aff', needs: 'terra',
    text: 'Perto do seu fogo, um bicho alto, de focinho comprido, fareja o ar. Ele gosta de miolo de cachorro novo e de quem dorme pesado.',
    choices: [
      { label: 'Mirar no umbigo', note: 'É o único lugar em que ele sente. Ele larga o que carregava e some.', effects: [{ t: 'vida', frac: -0.15 }, { t: 'amuleto' }] },
      { label: 'Apagar o fogo e esperar', effects: [{ t: 'vintem', n: -15 }, { t: 'vida', frac: 0.2 }] },
      { label: 'Subir numa árvore', effects: [{ t: 'lembrancas', n: 5 }] },
    ],
    lore: 'O Capelobo do Maranhão e do Pará tem corpo de homem, focinho de tamanduá e pé redondo como fundo de garrafa. Só morre com um golpe no umbigo.',
  },
  teiniagua: {
    id: 'teiniagua', title: 'A lagartixa de rubi', figure: 'teiniagua', color: '#ff7ad9', needs: 'sombra',
    text: 'Uma lagartixa com uma pedra vermelha acesa na cabeça bebe água na lagoa. Dizem que é uma princesa moura, e que a pedra vale um reino.',
    choices: [
      { label: 'Pegar a pedra', note: 'Ela deixa. O preço vem depois, e você nem lembra qual foi.', effects: [{ t: 'amuleto', rarity: 'raro' }, { t: 'esquecer' }] },
      { label: 'Guardar a lagartixa numa guampa', note: 'De noite ela conversa, e ensina.', effects: [{ t: 'vintem', n: -25 }, { t: 'bencao', tier: 2 }] },
      { label: 'Deixar ela beber', effects: [{ t: 'lembrancas', n: 5 }] },
    ],
    lore: 'A Teiniaguá da Salamanca do Jarau, no Rio Grande do Sul, é uma princesa moura virada em lagartixa, com um carbúnculo na cabeça. Quem se encanta por ela fica preso na furna.',
  },
  almaPenada: {
    id: 'almaPenada', title: 'Alma na porteira', figure: 'almapenada', color: '#9fe0fa', needs: 'sombra',
    text: 'A porteira abre e fecha sozinha. Do lado de lá, uma claridade com forma de gente pede uma vela e uma reza, e aponta para o pé de um mourão.',
    choices: [
      { label: 'Rezar por ela', note: 'Custa uma parte do seu sossego. Ela vai embora em paz.', effects: [{ t: 'pocao', n: -1 }, { t: 'lembrancas', n: 14 }] },
      { label: 'Cavar onde ela aponta', note: 'Tem um pote de moedas. E agora ela não tem mais motivo para ficar longe de você.', effects: [{ t: 'vintem', n: 50 }, { t: 'maldicao', damage: 0.12 }] },
    ],
    lore: 'Quem morre deixando dinheiro enterrado não descansa. A alma aparece para alguém de coragem, mostra o lugar e pede missa em troca.',
  },
  boiBarroso: {
    id: 'boiBarroso', title: 'O boi que ninguém laça', figure: 'boibarroso', color: '#c99a5a', needs: 'sombra',
    text: 'Um boi barroso, enorme, pasta sozinho no meio do campo. Tem sete laços partidos pendurados nos chifres.',
    choices: [
      { label: 'Tentar laçar', note: 'Ele arrasta você por meia légua. No fim, um dos laços velhos fica na sua mão.', effects: [{ t: 'vida', frac: -0.2 }, { t: 'amuleto', rarity: 'raro' }] },
      { label: 'Abrir a porteira para ele', note: 'Ele passa devagar. Dá tempo de descansar.', effects: [{ t: 'vida', frac: 0.2 }] },
    ],
    lore: 'O Boi Barroso das cantigas gaúchas é o boi que nenhum laçador segura. "Meu boi barroso, que eu já contava perdido, deixando o rastro na areia, logo foi reconhecido."',
  },
  cobraGrande: {
    id: 'cobraGrande', title: 'Dois faróis no rio', figure: 'sucuri', color: '#4fb6f0', needs: 'agua',
    text: 'No meio do rio, de noite, duas luzes vêm contra a correnteza. Não é barco. A canoa balança antes de a onda chegar.',
    choices: [
      { label: 'Atravessar assim mesmo', note: 'A Cobra Grande passa por baixo. Quem atravessa com ela aprende o rio.', effects: [{ t: 'vida', frac: -0.25 }, { t: 'bencao', patron: 'agua', tier: 3 }] },
      { label: 'Esperar amanhecer', note: 'Você descansa. Os bichos do trecho também se juntam.', effects: [{ t: 'vida', frac: 0.3 }, { t: 'maldicao', hp: 0.15 }] },
    ],
    lore: 'A Boiuna, ou Cobra Grande, mora no fundo dos rios da Amazônia. De noite os olhos dela parecem dois faróis, e ela vira embarcação para enganar quem está na margem.',
  },
  espantalho: {
    id: 'espantalho', title: 'O dono da roça', figure: 'espantalho', color: '#ffd23f',
    text: 'No meio de uma roça abandonada, um espantalho de chapéu de palha segura um saco de estopa. O milho em volta dele está todo de pé.',
    choices: [
      { label: 'Trocar de chapéu com ele', effects: [{ t: 'vintem', n: -20 }, { t: 'amuleto', rarity: 'comum' }] },
      { label: 'Colher o milho', note: 'Dá para o caminho todo. Ele vira a cabeça quando você sai.', effects: [{ t: 'pocao', n: 1 }, { t: 'maldicao', hp: 0.1 }] },
      { label: 'Endireitar o espantalho', effects: [{ t: 'lembrancas', n: 6 }] },
    ],
    lore: 'Espantalho bem feito guarda a roça de passarinho. Mal feito, dizem os antigos, guarda de gente também, e cobra de quem colhe sem plantar.',
  },
};

export const CAUSO_ORDER = Object.keys(CAUSOS) as CausoId[];
