/**
 * Conquistas (docs/gdd/09). Cada uma tem um identificador fixo (pronto para virar conquista da Steam),
 * uma meta e uma função que lê o progresso do perfil. O prêmio é pequeno de propósito: ouro e material, nunca poder grande.
 * As regras (conferir e pegar o prêmio) estão em src/meta/achievements.ts.
 */
import { AMULET_ORDER } from './amulets';
import { CAUSO_ORDER } from './causos';
import { BLESSING_ORDER, COMPANION_ORDER } from './content';
import { GEM_MAX, MAX_RARITY, UNIQUES, type Item } from './items';
import { BESTIARY_KINDS } from './lore';
import { STAGES } from './stages';
import type { Profile } from '../meta/profile';

export type AchievementGroup = 'campanha' | 'combate' | 'colecao' | 'oficio' | 'sonho' | 'segredos';

export const ACHIEVEMENT_GROUPS: { id: AchievementGroup; name: string; icon: string }[] = [
  { id: 'campanha', name: 'Campanha', icon: 'mapa' },
  { id: 'combate', name: 'Combate', icon: 'dano' },
  { id: 'colecao', name: 'Coleção', icon: 'almanaque' },
  { id: 'oficio', name: 'Ofício', icon: 'ferreiro' },
  { id: 'sonho', name: 'Sonho', icon: 'sonho' },
  { id: 'segredos', name: 'Segredos', icon: 'cadeado' },
];

export interface AchievementReward { gold: number; mata?: number; po?: number; tomo?: number; lagrima?: number }

export interface AchievementDef {
  id: string;
  group: AchievementGroup;
  name: string;
  desc: string;
  /** Chave do ícone em src/art/uiicons.ts. */
  icon: string;
  target: number;
  /** Quanto o jogador já fez (pode passar da meta). */
  progress: (p: Profile) => number;
  reward: AchievementReward;
  /** Escondida: o nome e o que pede só aparecem depois de alcançada. */
  hidden?: boolean;
}

const cleared = (p: Profile, id: string) => (p.stages[id]?.cleared ? 1 : 0);
const stars = (p: Profile) => STAGES.reduce((n, s) => n + (p.stages[s.id]?.stars.filter(Boolean).length ?? 0), 0);
const kills = (p: Profile) => Object.values(p.life.kills).reduce((a, b) => a + b, 0);
const owned = (p: Profile): Item[] => [...p.inventory, ...(Object.values(p.equipped).filter(Boolean) as Item[])];
const known = (p: Profile, at: number) => BESTIARY_KINDS.filter((k) => (p.life.kills[k] ?? 0) >= at).length;

type Row = [id: string, name: string, desc: string, icon: string, target: number, progress: (p: Profile) => number, reward: AchievementReward, hidden?: boolean];
const G = (group: AchievementGroup, rows: Row[]): AchievementDef[] =>
  rows.map(([id, name, desc, icon, target, progress, reward, hidden]) => ({ id, group, name, desc, icon, target, progress, reward, ...(hidden ? { hidden } : {}) }));

const FREED: [string, string, string, string][] = [
  ['1-12', 'curupira', 'Pés para a frente', 'Liberte o Curupira'],
  ['2-12', 'iara', 'Canto de volta', 'Liberte a Iara'],
  ['3-12', 'saci', 'Gorro devolvido', 'Liberte o Saci'],
  ['4-12', 'boitata', 'Fogo que guarda', 'Liberte o Boitatá'],
  ['5-12', 'mapinguari', 'O guardião da selva', 'Liberte o Mapinguari'],
  ['6-12', 'lobisomem', 'Depois da lua', 'Liberte o Lobisomem'],
  ['7-12', 'cuca', 'Fim da cantiga', 'Liberte a Cuca'],
];
const FREED_ICON = ['natureza', 'agua', 'tempestade', 'fogo', 'terra', 'sombra', 'encanto'];

export const ACHIEVEMENTS: AchievementDef[] = [
  ...G('campanha', [
    ['primeira_trilha', 'Primeira trilha', 'Vença a fase 1-1', 'mapa', 1, (p) => cleared(p, '1-1'), { gold: 40 }],
    ...FREED.map(([stage, key, name, desc], i): Row => [`livre_${key}`, name, desc, FREED_ICON[i], 1, (p) => cleared(p, stage), { gold: 150 + i * 100, mata: 10 + i * 5, tomo: 1 }]),
    ['fim_do_esquecimento', 'Ninguém esquece', 'Vença o Esquecimento', 'credito', 1, (p) => cleared(p, '8-12'), { gold: 1500, mata: 80, lagrima: 1 }],
    ['estrelas_36', 'Céu de roça', 'Junte 36 estrelas', 'estrela', 36, stars, { gold: 200, mata: 12 }],
    ['estrelas_144', 'Céu de sertão', 'Junte 144 estrelas', 'estrela', 144, stars, { gold: 700, mata: 40, tomo: 2 }],
    ['estrelas_288', 'Todas as estrelas', 'Junte as 288 estrelas da campanha', 'estrela', 288, stars, { gold: 2500, mata: 120, lagrima: 1 }],
    ['nivel_20', 'Andarilho', 'Chegue ao nível 20', 'xp', 20, (p) => p.level, { gold: 250, mata: 15 }],
    ['nivel_40', 'Veterano de estrada', 'Chegue ao nível 40', 'xp', 40, (p) => p.level, { gold: 700, mata: 40 }],
    ['nivel_60', 'Mestre andarilho', 'Chegue ao nível 60', 'xp', 60, (p) => p.level, { gold: 2000, mata: 100, lagrima: 1 }],
  ]),
  ...G('combate', [
    ['abates_500', 'Mão na massa', 'Derrote 500 monstros', 'dano', 500, kills, { gold: 150, mata: 10 }],
    ['abates_5000', 'Limpa-trilha', 'Derrote 5.000 monstros', 'dano', 5000, kills, { gold: 800, mata: 45 }],
    ['abates_25000', 'Lenda viva', 'Derrote 25.000 monstros', 'dano', 25000, kills, { gold: 3000, mata: 150, lagrima: 1 }],
    ['elites_25', 'Caça grossa', 'Derrote 25 elites', 'elite', 25, (p) => p.life.elites, { gold: 300, po: 4 }],
    ['elites_150', 'Terror dos elites', 'Derrote 150 elites', 'elite', 150, (p) => p.life.elites, { gold: 1200, po: 15, tomo: 2 }],
    ['chefes_10', 'Derruba-gigante', 'Derrote 10 chefões', 'caveira', 10, (p) => p.life.bosses, { gold: 400, tomo: 2 }],
    ['chefes_50', 'Pesadelo de chefão', 'Derrote 50 chefões', 'caveira', 50, (p) => p.life.bosses, { gold: 1600, tomo: 5, lagrima: 1 }],
    ['perfeitas_50', 'Por um triz', 'Faça 50 esquivas perfeitas', 'esquiva', 50, (p) => p.life.perfects, { gold: 200, mata: 12 }],
    ['perfeitas_500', 'Pé de vento', 'Faça 500 esquivas perfeitas', 'esquiva', 500, (p) => p.life.perfects, { gold: 1200, mata: 60 }],
    ['aparadas_25', 'Escudo certeiro', 'Apare 25 golpes com o escudo', 'defesa', 25, (p) => p.life.parries, { gold: 300, mata: 15 }],
    ['reacoes_100', 'Mistura boa', 'Cause 100 reações de elementos', 'reacao', 100, (p) => p.life.reactions, { gold: 250, po: 4 }],
    ['reacoes_1000', 'Alquimia da mata', 'Cause 1.000 reações de elementos', 'reacao', 1000, (p) => p.life.reactions, { gold: 1400, po: 18, tomo: 3 }],
    ['supremos_30', 'Chamado atendido', 'Chame o Supremo 30 vezes', 'supremo', 30, (p) => p.life.supremos, { gold: 400, tomo: 2 }],
    ['sem_cair_25', 'Não caio, não', 'Vença 25 partidas sem cair', 'vida', 25, (p) => p.life.flawless, { gold: 350, mata: 20 }],
    ['golpe_5000', 'Mão pesada', 'Cause 5.000 de dano num golpe só', 'danoCritico', 5000, (p) => p.life.maxHit, { gold: 500, po: 6 }],
  ]),
  ...G('colecao', [
    ['companheiros_4', 'Boa companhia', 'Resgate 4 companheiros', 'companheiros', 4, (p) => COMPANION_ORDER.filter((id) => p.companions[id]).length, { gold: 250, mata: 15 }],
    ['companheiros_10', 'Arca da mata', 'Resgate 10 companheiros', 'companheiros', 10, (p) => COMPANION_ORDER.filter((id) => p.companions[id]).length, { gold: 800, mata: 45 }],
    ['companheiros_16', 'Ninguém fica para trás', 'Resgate os 16 companheiros', 'companheiros', 16, (p) => COMPANION_ORDER.filter((id) => p.companions[id]).length, { gold: 2500, mata: 120, lagrima: 1 }],
    ['unicos_5', 'Coisa com nome', 'Encontre 5 itens com nome', 'item', 5, (p) => p.uniquesFound.length, { gold: 400, po: 6 }],
    ['unicos_todos', 'Museu do andarilho', 'Encontre todos os itens com nome', 'item', Object.keys(UNIQUES).length, (p) => p.uniquesFound.length, { gold: 3000, po: 30, lagrima: 1 }],
    ['bestiario_20', 'Olho treinado', 'Derrote 20 tipos de monstro', 'almanaque', 20, (p) => known(p, 1), { gold: 300, mata: 18 }],
    ['bestiario_todo', 'Bestiário completo', 'Derrote todos os tipos de monstro', 'almanaque', BESTIARY_KINDS.length, (p) => known(p, 1), { gold: 2500, mata: 120, tomo: 5 }],
    ['conhecer_5', 'Conheço esse bicho', 'Derrote 100 de 5 tipos de monstro', 'execucao', 5, (p) => known(p, 100), { gold: 400, mata: 20 }],
    ['conhecer_20', 'Sabe de cor', 'Derrote 100 de 20 tipos de monstro', 'execucao', 20, (p) => known(p, 100), { gold: 1500, mata: 70, tomo: 3 }],
    ['armas_6', 'Serve qualquer uma', 'Vença com as seis armas', 'aprimorar', 6, (p) => Object.keys(p.life.winsBy).length, { gold: 600, mata: 30 }],
    ['bencaos_todas', 'Abençoado', 'Escolha cada bênção de altar pelo menos uma vez', 'altar', BLESSING_ORDER.length, (p) => BLESSING_ORDER.filter((b) => p.life.blessings[b]).length, { gold: 900, po: 10 }],
  ]),
  ...G('oficio', [
    ['forja_25', 'Aprendiz de ferreiro', 'Use o ferreiro 25 vezes', 'ferreiro', 25, (p) => p.life.forges, { gold: 250, mata: 20 }],
    ['forja_200', 'Mestre de bigorna', 'Use o ferreiro 200 vezes', 'ferreiro', 200, (p) => p.life.forges, { gold: 1500, mata: 90, po: 12 }],
    ['mitico', 'Coisa de lenda', 'Tenha um item Mítico', 'fundir', 1, (p) => (owned(p).some((it) => it.rarity >= MAX_RARITY) ? 1 : 0), { gold: 1500, po: 15, lagrima: 1 }],
    ['mais_15', 'Fio perfeito', 'Aprimore um item até +15', 'aprimorar', 15, (p) => Math.max(0, ...owned(p).map((it) => it.plus)), { gold: 1200, mata: 80 }],
    ['gema_max', 'Pedra sem jaça', 'Tenha uma gema do nível máximo', 'gema', GEM_MAX, (p) => Math.max(0, ...Object.keys(p.gems).map((k) => Number(k.split(':')[1])), ...owned(p).map((it) => it.gem?.lvl ?? 0)), { gold: 1200, po: 15 }],
    ['feitico_10', 'Reza forte', 'Leve um feitiço ao nível 10', 'feiticos', 10, (p) => Math.max(1, ...Object.values(p.spellLevels).map((v) => v ?? 1)), { gold: 1000, tomo: 4 }],
    ['torre_30', 'Trinta degraus', 'Chegue ao andar 30 da Torre', 'torre', 30, (p) => p.tower.best, { gold: 500, mata: 30, tomo: 2 }],
    ['torre_100', 'O topo', 'Chegue ao andar 100 da Torre', 'torre', 100, (p) => p.tower.best, { gold: 3000, mata: 150, lagrima: 1 }],
    ['expedicoes_10', 'Pé na estrada', 'Vença 10 expedições', 'expedicao', 10, (p) => p.life.expeditions, { gold: 350, mata: 25 }],
    ['expedicoes_50', 'Bússola gasta', 'Vença 50 expedições', 'expedicao', 50, (p) => p.life.expeditions, { gold: 1500, mata: 90, po: 10 }],
    ['cacada_10', 'Deixa comigo', 'Vença 10 fases na Caçada automática', 'auto', 10, (p) => p.life.autoWins, { gold: 300, mata: 20 }],
  ]),
  ...G('sonho', [
    ['primeira_noite', 'Boa noite', 'Durma pela primeira vez', 'sonho', 1, (p) => p.dream.nights, { gold: 150, mata: 10 }],
    ['noite_vencida', 'Sonho inteiro', 'Vença uma noite completa', 'sonho', 1, (p) => p.dream.wins, { gold: 500, mata: 30, tomo: 1 }],
    ['noites_5', 'Sono pesado', 'Vença 5 noites', 'sonho', 5, (p) => p.dream.wins, { gold: 1200, mata: 60, tomo: 2 }],
    ['noites_20', 'Dono do sonho', 'Vença 20 noites', 'sonho', 20, (p) => p.dream.wins, { gold: 3000, mata: 150, lagrima: 1 }],
    ['trecho_2', 'Mais fundo', 'Vença o chefe do segundo trecho', 'coroa', 2, (p) => p.dream.bestTrecho, { gold: 300, mata: 20 }],
    ['lembrancas_500', 'Boa memória', 'Traga 500 Lembranças do Sonho', 'lembranca', 500, (p) => p.dream.total, { gold: 600, mata: 40 }],
    ['lembrancas_3000', 'Memória de elefante', 'Traga 3.000 Lembranças do Sonho', 'lembranca', 3000, (p) => p.dream.total, { gold: 2500, mata: 120, lagrima: 1 }],
    ['armas_sonho_3', 'Três jeitos de sonhar', 'Vença noites com 3 armas diferentes', 'aprimorar', 3, (p) => p.dream.weaponsWon.length, { gold: 800, mata: 40 }],
    ['armas_sonho_6', 'Seis jeitos de sonhar', 'Vença uma noite com cada uma das seis armas', 'aprimorar', 6, (p) => p.dream.weaponsWon.length, { gold: 2500, mata: 120, lagrima: 1 }],
    ['despertar_1', 'Despertou', 'Desperte uma bênção', 'altar', 1, (p) => p.dream.awakened, { gold: 400, po: 5 }],
    ['despertar_10', 'Olhos abertos', 'Desperte 10 bênçãos', 'altar', 10, (p) => p.dream.awakened, { gold: 1500, po: 15, tomo: 3 }],
    ['compadrio_1', 'Compadres', 'Receba um Compadrio', 'companheiros', 1, (p) => p.dream.compadrios, { gold: 500, po: 6 }],
    ['sinergia_7', 'Afilhado querido', 'Junte 7 bênçãos do mesmo padrinho numa noite', 'supremo', 1, (p) => p.dream.synergy7, { gold: 900, po: 10, tomo: 2 }],
    ['amuletos_10', 'Pescoço pesado', 'Encontre 10 amuletos diferentes', 'amuleto', 10, (p) => p.dream.amuletsSeen.length, { gold: 600, mata: 30 }],
    ['amuletos_todos', 'Corpo fechado', 'Encontre todos os amuletos', 'amuleto', AMULET_ORDER.length, (p) => p.dream.amuletsSeen.length, { gold: 2000, mata: 100, lagrima: 1 }],
    ['causos_todos', 'Contador de causo', 'Viva todos os causos', 'credito', CAUSO_ORDER.length, (p) => p.dream.causosSeen.length, { gold: 1200, mata: 60, tomo: 3 }],
    ['provacoes_5', 'Provado', 'Vença 5 Provações', 'caveira', 5, (p) => p.dream.trials, { gold: 800, po: 10 }],
    ['aldeia_3', 'Primeiras casas', 'Faça 3 melhorias na Aldeia', 'descanso', 3, (p) => Object.values(p.village).reduce((n, v) => n + (v ?? 0), 0), { gold: 500, mata: 30 }],
    ['roda_1', 'O Saci deve uma', 'Gire a Roda do Saci', 'roda', 1, (p) => p.dream.spins, { gold: 300, mata: 20 }],
    ['roda_50', 'Freguês da Roda', 'Gire a Roda do Saci 50 vezes', 'roda', 50, (p) => p.dream.spins, { gold: 1200, mata: 60, tomo: 2 }],
    ['sorte_grande', 'Sorte grande', 'Feche 4 linhas do mesmo padrinho num giro só', 'gorro', 1, (p) => p.dream.jackpots, { gold: 1500, po: 15, lagrima: 1 }],
    ['peso_8', 'Noite pesada', 'Vença uma noite com Peso 8 de Presságios', 'olho', 8, (p) => p.dream.bestWeight, { gold: 900, po: 10, tomo: 2 }],
    ['peso_16', 'Noite sem lua', 'Vença uma noite com Peso 16 de Presságios', 'olho', 16, (p) => p.dream.bestWeight, { gold: 2500, mata: 120, lagrima: 1 }],
    ['cordeis_5', 'Leitor de feira', 'Tenha 5 Cordéis', 'cordel', 5, (p) => Object.values(p.cordeis.levels).filter((n) => (n ?? 0) > 0).length, { gold: 500, mata: 30 }],
    ['cordeis_20', 'Varal cheio', 'Tenha os 20 Cordéis', 'cordel', 20, (p) => Object.values(p.cordeis.levels).filter((n) => (n ?? 0) > 0).length, { gold: 2500, mata: 120, lagrima: 1 }],
    ['aspecto_1', 'Outro jeito de bater', 'Compre um Aspecto de arma', 'aprimorar', 1, (p) => p.aspects.owned.length, { gold: 400, po: 5 }],
    ['aspectos_12', 'Doze jeitos de bater', 'Tenha os 12 Aspectos de arma', 'aprimorar', 12, (p) => p.aspects.owned.length, { gold: 3000, mata: 150, lagrima: 1 }],
    ['pressagio_campanha', 'De propósito', 'Vença uma fase da campanha com Presságios ligados', 'olho', 1, (p) => Math.max(0, ...Object.values(p.stages).map((r) => r.omen ?? 0)), { gold: 400, mata: 20 }],
  ]),
  ...G('segredos', [
    ['mae_do_ouro', 'Mãe-do-Ouro', 'Alcance a Mãe-do-Ouro 10 vezes', 'ouro', 10, (p) => p.life.wisps, { gold: 800 }, true],
    ['quebra_potes', 'Não sobrou um pote', 'Quebre 300 potes de barro', 'bau', 300, (p) => p.life.pots, { gold: 500, mata: 25 }, true],
    ['cantil_furado', 'Cantil furado', 'Beba 200 poções', 'pocao', 200, (p) => p.life.potions, { gold: 400, mata: 20 }, true],
    ['teimosia', 'Teimosia', 'Caia 50 vezes e continue', 'cura', 50, (p) => p.life.deaths, { gold: 400, mata: 20 }, true],
    ['pote_de_ouro', 'Pote de ouro', 'Ganhe 100.000 de ouro na jornada', 'ouro', 100000, (p) => p.life.gold, { gold: 2000 }, true],
    ['dez_horas', 'Dez horas de peleja', 'Passe 10 horas em combate', 'relogio', 36000, (p) => p.life.seconds, { gold: 1500, mata: 80 }, true],
  ]),
];

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
