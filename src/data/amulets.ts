/**
 * Amuletos do Sonho (docs/gdd/09): relíquias que valem a noite inteira. Saem de elites, chefes, Feiras e Causos.
 * Os que mexem no combate entram em `deriveStats` (src/meta/stats.ts); os que mudam as regras da noite
 * (Fonte, Feira, Provação, vintém, Lembranças) são lidos em src/meta/dream.ts.
 */

export type AmuletId =
  | 'patua' | 'denteDeOnca' | 'penaDeArara' | 'contaDeLagrima' | 'cabacaDePolvora' | 'moringa' | 'bolsaDeMascate' | 'peDeMeia'
  | 'carranca' | 'sanfona' | 'espora' | 'chocalho' | 'couroDeJacare' | 'redeDeDormir' | 'chapeuDeCouro' | 'velaBenta' | 'olhoDeBoi'
  | 'muiraquita' | 'figaTorta' | 'ferraduraVirada';

/** Comum, raro, lendário, ou figa torta (dá muito e cobra um preço). */
export type AmuletRarity = 'comum' | 'raro' | 'lendario' | 'figa';

export interface AmuletDef {
  id: AmuletId;
  name: string;
  desc: string;
  /** Glifo de dentro do medalhão (chave de src/art/uiicons.ts) e a cor dele. */
  icon: string;
  color: string;
  rarity: AmuletRarity;
  /** Uma linha sobre a tradição de onde o objeto vem, para o Almanaque. */
  lore: string;
}

const A = (id: AmuletId, name: string, rarity: AmuletRarity, icon: string, color: string, desc: string, lore: string): AmuletDef => ({ id, name, rarity, icon, color, desc, lore });

export const AMULETS: Record<AmuletId, AmuletDef> = {
  /* comuns */
  patua: A('patua', 'Patuá', 'comum', 'vida', '#d9a441', '+15% de vida máxima', 'Saquinho de pano com reza dentro, usado no pescoço para fechar o corpo.'),
  denteDeOnca: A('denteDeOnca', 'Dente de Onça', 'comum', 'critico', '#f1ead8', '+10% de chance de crítico', 'Quem carrega um dente de onça pega um pouco da coragem dela.'),
  penaDeArara: A('penaDeArara', 'Pena de Arara', 'comum', 'movimento', '#e8452c', '+12% de velocidade de movimento', 'Pena vermelha, leve, de quem atravessa a mata sem encostar no chão.'),
  contaDeLagrima: A('contaDeLagrima', 'Conta-de-Lágrima', 'comum', 'mana', '#9fe0fa', '+25% de recuperação de mana, e feitiços custam 10% menos', 'Semente cinzenta e lisa, enfiada em terço e em colar de benzedeira.'),
  cabacaDePolvora: A('cabacaDePolvora', 'Cabaça de Pólvora', 'comum', 'explosao', '#ff7a2a', 'Inimigos derrotados têm 10% de chance de explodir', 'Sobrou das festas de São João. Não chegue com brasa perto.'),
  moringa: A('moringa', 'Moringa', 'comum', 'pocao', '#b5613a', 'Depois de cada combate, você recupera uma poção', 'O barro deixa a água fresca mesmo no sol do sertão.'),
  bolsaDeMascate: A('bolsaDeMascate', 'Bolsa de Mascate', 'comum', 'vender', '#c9a26b', 'Os preços da Feira ficam 25% menores', 'O mascate anda de vila em vila e sabe o preço de tudo.'),
  peDeMeia: A('peDeMeia', 'Pé-de-Meia', 'comum', 'ouro', '#f2c14e', '+50% de vinténs dos combates', 'Dinheiro guardado na meia, embaixo do colchão.'),
  /* raros */
  carranca: A('carranca', 'Carranca', 'raro', 'caveira', '#96562b', 'Inimigos com mais de 90% de vida recebem 30% mais dano', 'A cara feia na proa dos barcos do São Francisco espanta o que mora no rio.'),
  sanfona: A('sanfona', 'Sanfona', 'raro', 'som', '#cf3b28', 'A cada 10 inimigos derrotados, uma onda de som empurra todos os outros', 'Quando o fole abre no forró, ninguém fica parado.'),
  espora: A('espora', 'Espora de Vaqueiro', 'raro', 'velAtaque', '#d9d6cc', '+15% de velocidade de ataque', 'Tine a cada passo, para o boi saber quem vem.'),
  chocalho: A('chocalho', 'Chocalho de Cascavel', 'raro', 'reacao', '#e8c48e', 'Reações de elementos causam 30% mais dano', 'Um anel para cada troca de pele. Balança antes do bote.'),
  couroDeJacare: A('couroDeJacare', 'Couro de Jacaré', 'raro', 'defesa', '#5fbf8e', 'Recebe 12% menos dano', 'Casco que nem dente de piranha atravessa.'),
  redeDeDormir: A('redeDeDormir', 'Rede de Dormir', 'raro', 'descanso', '#ff7a2a', 'As Fontes curam toda a vida', 'Dormir na rede, dentro do sonho, descansa em dobro.'),
  chapeuDeCouro: A('chapeuDeCouro', 'Chapéu de Couro', 'raro', 'heroi', '#96562b', 'As Provações pagam o triplo de Lembranças, mas você entra nelas com 70% da vida que tinha', 'Chapéu de vaqueiro, de quem entra na caatinga atrás do boi sem olhar para trás.'),
  velaBenta: A('velaBenta', 'Vela Benta', 'raro', 'altar', '#fff3c4', 'Vencer um chefe cura toda a vida', 'Acesa na hora do aperto, para iluminar o caminho de volta.'),
  olhoDeBoi: A('olhoDeBoi', 'Olho-de-Boi', 'raro', 'sorte', '#7a4424', '+30% de Lembranças nesta noite', 'Semente escura e redonda, levada no bolso contra mau-olhado.'),
  /* lendário */
  muiraquita: A('muiraquita', 'Muiraquitã', 'lendario', 'gema', '#3fae5a', 'Uma vez nesta noite, você se levanta depois de cair, com metade da vida', 'Sapinho de pedra verde das icamiabas, as guerreiras do rio. Quem ganha um não perde a sorte.'),
  /* figas tortas */
  figaTorta: A('figaTorta', 'Figa Torta', 'figa', 'furia', '#9a6aff', '+40% de dano de arma e de feitiço, mas as Fontes não curam', 'Figa é para dar sorte. Esta entortou, e a sorte veio de lado.'),
  ferraduraVirada: A('ferraduraVirada', 'Ferradura Virada', 'figa', 'ferreiro', '#a9a6a0', 'Bênçãos comuns sobem 2 níveis de uma vez, mas os altares só trazem bênçãos comuns', 'Com as pontas para cima a ferradura guarda a sorte. Virada, ela escorre.'),
};

export const AMULET_ORDER = Object.keys(AMULETS) as AmuletId[];
export const AMULET_RARITY: Record<AmuletRarity, { label: string; color: string; weight: number; price: number }> = {
  comum: { label: 'Comum', color: '#9BE7C0', weight: 60, price: 55 },
  raro: { label: 'Raro', color: '#6AA5FF', weight: 30, price: 85 },
  lendario: { label: 'Lendário', color: '#FFB238', weight: 4, price: 150 },
  figa: { label: 'Figa torta', color: '#BC8CFF', weight: 10, price: 60 },
};
