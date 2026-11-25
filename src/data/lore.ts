/**
 * Textos do Almanaque do Folclore (docs/gdd/09): um parágrafo curto sobre cada monstro, chefe e companheiro.
 * Onde o bicho ou a lenda existe de verdade, o texto conta o que o povo conta; onde é invenção do jogo, diz o que ele virou.
 */
import { LEGACY_KINDS, type EnemyKind, type LegacyKind } from './balance';
import { BOSSES, MONSTERS, type BossKind, type MonsterKind } from './bestiary';
import type { CompanionId } from './content';

export type BestiaryRole = 'comum' | 'elite' | 'chefe';

export interface BestiaryEntry { kind: EnemyKind; chapter: number; role: BestiaryRole }

const LEGACY_CHAPTER: Record<LegacyKind, number> = {
  sauva: 1, queixada: 1, cuspidor: 1, tronco: 1, urutau: 1, cogumelo: 1, caipora: 1, curupira: 1,
  piranha: 2, sapo: 2, arraia: 2, caramujo: 2, jacare: 2, boto: 2, iara: 2,
};
/** Chefes que fecham o capítulo (a fase 12): os Encantados e o Esquecimento. */
const ENCANTADOS: EnemyKind[] = ['curupira', 'iara', 'saci', 'boitata', 'mapinguari', 'lobisomem', 'cuca', 'esquecimento'];
/** Grandes elites da fase 11. */
const GRANDES: EnemyKind[] = ['caipora', 'boto', 'corposeco', 'mula', 'capelobo', 'teiniagua', 'pisadeira', 'ecos'];

const roleOf = (k: EnemyKind): BestiaryRole => (ENCANTADOS.includes(k) ? 'chefe' : GRANDES.includes(k) ? 'elite' : 'comum');
const ROLE_ORDER: Record<BestiaryRole, number> = { comum: 0, elite: 1, chefe: 2 };

/** Todos os bichos do jogo, por capítulo: os comuns primeiro, depois o grande elite e o chefão. */
export const BESTIARY: BestiaryEntry[] = [
  ...LEGACY_KINDS.map((kind) => ({ kind: kind as EnemyKind, chapter: LEGACY_CHAPTER[kind], role: roleOf(kind) })),
  ...(Object.keys(MONSTERS) as MonsterKind[]).map((kind) => ({ kind: kind as EnemyKind, chapter: MONSTERS[kind].chapter, role: 'comum' as BestiaryRole })),
  ...(Object.keys(BOSSES) as BossKind[]).map((kind) => ({ kind: kind as EnemyKind, chapter: BOSSES[kind].chapter, role: roleOf(kind) })),
].sort((a, b) => a.chapter - b.chapter || ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

export const BESTIARY_KINDS: EnemyKind[] = BESTIARY.map((b) => b.kind);

export const ENEMY_LORE: Record<string, string> = {
  /* 1 · Mata Atlântica */
  sauva: 'A saúva corta folha para cultivar o fungo que come. “Ou o Brasil acaba com a saúva, ou a saúva acaba com o Brasil”, dizia o ditado antigo.',
  queixada: 'Porco-do-mato que anda em varas de dezenas e bate os dentes quando se irrita. Dizem que a Caipora monta a maior delas.',
  cuspidor: 'Na mata de verdade, planta carnívora só pega mosquito. Esta perdeu a cor e aprendeu a cuspir.',
  tronco: 'Árvore velha que o Esquecimento levantou do chão. Por dentro, ainda guarda ninho de bicho.',
  urutau: 'A ave-fantasma passa o dia imóvel, imitando um galho quebrado. O canto triste dela, de noite, deu origem a muita história de assombração.',
  cogumelo: 'Cogumelo solta esporo ao vento e espera. Este não tem paciência: corre atrás de quem passa.',
  caipora: 'Protetora dos bichos, anda montada num porco-do-mato. Quem deixa fumo de presente num toco passa em paz; quem caça além da conta se perde na mata.',
  curupira: 'Menino de cabelo de fogo e pés virados para trás, que confundem quem tenta seguir o rastro. Guarda a mata contra quem derruba e caça sem precisão.',
  /* 2 · Rios do Norte */
  piranha: 'A fama é maior que o perigo: a piranha ataca mais quando o rio seca e a comida falta. Aqui, a comida é você.',
  sapo: 'O sapo-cururu da cantiga, “na beira do rio”. A pele solta um leite amargo que faz qualquer bicho largar a mordida.',
  arraia: 'A arraia de rio fica enterrada na areia do raso. Ribeirinho entra na água arrastando o pé, para não pisar no ferrão.',
  caramujo: 'Carrega a casa nas costas. Depois que perdeu a cor, passou a dividir a casca com quem estiver por perto.',
  jacare: 'O jacaré-açu passa de quatro metros e é o maior caçador dos rios do Norte. Este saiu do lodo sem lembrar que já teve cor.',
  boto: 'Em noite de festa, o boto vira um moço de chapéu branco, que nunca tira para esconder o furo na cabeça. Dança, encanta e volta para o rio antes de o sol nascer.',
  iara: 'A mãe-d’água canta na beira do rio. Quem ouve larga tudo e vai atrás dela, até o fundo.',
  /* 3 · Sertão */
  calango: 'Lagarto pequeno que balança a cabeça como quem concorda com tudo. Aguenta um sol de rachar pedra.',
  cascavel: 'O chocalho ganha um anel a cada troca de pele. É um aviso: ela prefere não gastar o bote.',
  mandacaru: 'O cacto alto da caatinga. “Mandacaru quando fulora na seca é sinal que a chuva chega no sertão”, canta o baião.',
  bode: 'No sertão, bode preto parado em encruzilhada à meia-noite nunca é só um bode.',
  urubu: 'Plana por horas sem bater asa, subindo no ar quente. O povo diz que urubu pousado no telhado é aviso.',
  corposeco: 'Foi tão ruim em vida que nem a terra quis: o chão devolveu o corpo. Seco, só pele e osso, vaga pelas estradas agarrando quem passa.',
  saci: 'Moleque de uma perna só, gorro vermelho e cachimbo, que viaja dentro do redemoinho. Trança crina de cavalo, esconde as coisas da casa e ri. Quem pega o gorro manda nele.',
  /* 4 · Cerrado em chamas */
  formiga: 'A lava-pés. A ferroada arde como brasa, e nunca vem uma só.',
  seriema: 'Ave de pernas compridas que corre mais do que voa. Mata cobra batendo com ela no chão.',
  pequizeiro: 'O pequi tem cheiro forte e um caroço cheio de espinhos finos. Quem morde sem saber aprende na hora.',
  cupinzeiro: 'Montes de terra dura que os cupins levantam no cerrado. Em noite de chuva, alguns se acendem com larvas de vaga-lume.',
  taturana: 'A lagarta de fogo: os pelos queimam a pele de quem encosta. O nome vem do tupi e quer dizer “parecido com fogo”.',
  mula: 'Mulher amaldiçoada que, na noite de quinta para sexta, vira mula e galopa soltando fogo pelo pescoço. O tropel se ouve de longe.',
  boitata: 'A cobra de fogo. Escapou de um dilúvio comendo os olhos dos bichos mortos e, de tanta luz guardada, pegou fogo. Queima quem incendeia o campo.',
  /* 5 · Selva Profunda */
  morcego: 'Enxerga com o ouvido e sai em bando quando escurece. Na selva fechada, quase nunca é dia para ele.',
  besouro: 'O besouro-rinoceronte levanta centenas de vezes o próprio peso. A carapaça deste virou pedra.',
  aranha: 'A caranguejeira não faz teia para caçar: espera no escuro e desce de uma vez.',
  macaco: 'O macaco-prego quebra coco batendo pedra em pedra. Aprendeu que pedra também serve para outras coisas.',
  totem: 'Barro moldado por mãos que ninguém mais lembra. Sem dono, protege qualquer um que fique perto.',
  capelobo: 'Corpo de gente, focinho de tamanduá e pé redondo como fundo de garrafa. Ronda os acampamentos de noite, e só cai com um golpe no umbigo.',
  mapinguari: 'Gigante peludo de um olho só e boca na barriga. O couro não deixa passar faca nem bala, e o cheiro chega antes dele.',
  /* 6 · Pampa de lua cheia */
  queroquero: 'A sentinela do pampa: grita e dá rasante em quem chega perto do ninho.',
  boibarroso: 'O boi da cantiga gaúcha, que nenhum peão consegue laçar.',
  almapenada: 'Alma que ficou devendo alguma coisa e não consegue ir embora. Pede reza em beira de estrada.',
  fatuo: 'Luz azulada que aparece em brejo e em cemitério. A ciência diz que é gás; o povo sabe que é alma.',
  espantalho: 'Foi feito para assustar passarinho. Depois que o Esquecimento passou, ninguém mais lembra quem o plantou ali.',
  teiniagua: 'Princesa moura transformada em lagartixa, com uma pedra de brilho no lugar da cabeça. Guarda os tesouros da Salamanca do Jarau.',
  lobisomem: 'O sétimo filho homem, em noite de lua cheia de sexta-feira, vira lobo e corre sete cemitérios antes de o galo cantar.',
  /* 7 · Pantanal da Cuca */
  ariranha: 'A onça-d’água: a maior lontra do mundo caça em família e enfrenta até jacaré.',
  soco: 'Garça parda que fica imóvel na beira d’água até o peixe passar. Depois, é um golpe só.',
  jararaca: 'Some no capim seco por causa do desenho das costas. Só se vê depois do bote.',
  cururu: 'O sapo que mexe o caldeirão da Cuca. De tanto respirar o vapor, aprendeu algumas receitas.',
  tracaja: 'Tartaruga de rio com manchas amarelas na cabeça. Toma sol empilhada nas outras, sem pressa nenhuma.',
  pisadeira: 'Velha magra de unhas compridas que mora no telhado. Quando alguém dorme de barriga cheia, ela desce e pisa no peito até faltar o ar.',
  cuca: 'A bruxa com cara de jacaré das cantigas de ninar: “Dorme, neném, que a Cuca vem pegar”. Dorme uma noite a cada sete anos.',
  /* 8 · Terra Sem Nome */
  vulto: 'Alguém que foi esquecido por inteiro. Sobrou só o contorno.',
  vazio: 'O lugar onde havia uma história. Puxa para dentro o que estiver perto, tentando se encher de novo.',
  lembranca: 'Um retrato rasgado que ainda procura quem olhe para ele.',
  esquecido: 'Uma estátua sem rosto. Já teve nome, e alguém já contou a história dela.',
  silencio: 'O que fica quando a última pessoa que sabia a cantiga para de cantar.',
  ecos: 'O que sobrou dos sete Encantados na memória do Esquecimento: a forma de cada um, sem a história.',
  esquecimento: 'Não é lenda nenhuma. É o que acontece quando ninguém mais conta.',
};

export const COMPANION_LORE: Record<CompanionId, string> = {
  capivara: 'O maior roedor do mundo se dá bem com todo bicho. Onde tem água e capim, tem capivara.',
  onca: 'A onça-pintada é o maior felino das Américas. Filhote ainda, já tem a mordida mais forte da mata.',
  arara: 'A arara-vermelha escolhe um par para a vida toda e avisa a mata inteira de tudo o que vê.',
  botinho: 'Filhote de boto-cor-de-rosa. Nasce cinzento e vai ficando rosado com a idade.',
  tatu: 'O tatu-bola é o único tatu que se fecha inteiro, feito uma bola. Nem onça consegue abrir.',
  carcara: '“Carcará pega, mata e come”, diz a canção. É o gavião que não tem medo de nada no sertão.',
  loboguara: 'Pernas compridas para enxergar por cima do capim do cerrado. Come mais fruta do que carne, e a preferida é a lobeira.',
  tamandua: 'O tamanduá-bandeira não tem dentes. Quando se sente ameaçado, fica de pé e abre os braços: o abraço dele derruba onça.',
  vagalume: 'Acende e apaga para ser encontrado. No escuro da selva, é quem mostra o caminho.',
  preguica: 'Desce da árvore uma vez por semana. Tudo o que faz, faz devagar, e quem fica perto acaba pegando o jeito.',
  sucuri: 'A maior cobra do Brasil vive mais na água do que na terra. Não tem veneno: aperta.',
  graxaim: 'A raposinha do pampa. Leva embora tudo o que fica fora do lugar no acampamento.',
  coruja: 'A coruja-buraqueira mora num buraco no chão e vigia de dia, girando a cabeça para acompanhar quem passa.',
  jacarezinho: 'Filhote de jacaré-do-pantanal. Pequeno ainda, mas a mordida já nasce pronta.',
  tuiuiu: 'A ave-símbolo do Pantanal, com quase três metros de uma ponta da asa à outra.',
  mico: 'O mico-leão-dourado quase desapareceu, e voltou porque muita gente se lembrou dele.',
};
