/** Tela de resultado da fase: o que você ganhou, o que mudou e para onde ir agora. */
import { COMPANIONS, SPELLS } from '../data/content';
import { RARITIES, UNIQUES } from '../data/items';
import { FIRST_CLEAR_XP_BONUS, xpNeeded } from '../data/progression';
import { STAGES, type StageDef } from '../data/stages';
import { ATTR_PER_LEVEL, MATERIAL_LABEL, talentFree, type Materials } from '../meta/profile';
import { isUnlocked, recordOf, stageInfo, type StageRewards } from '../meta/rewards';
import type { Ctx } from './ctx';
import { btn, clock, h, icon, num, pct, plural, star } from './dom';
import { itemCard, itemRow } from './itens';

const MAT_ICON: Record<keyof Materials, string> = { mata: 'material', po: 'po', lagrima: 'lagrima' };

function card(title: string, cls: string, ...kids: Parameters<typeof h>[2][]): HTMLElement {
  return h('section', `panel rcard ${cls}`, h('h2', 'k', title), kids);
}

export function renderResultado(c: Ctx, stageId: string, r: StageRewards): HTMLElement {
  const p = c.p;
  const stage: StageDef = STAGES.find((s) => s.id === stageId) ?? STAGES[0];
  const rec = recordOf(p, stage.id), next = STAGES[stage.index + 1];
  const goals = ['Terminar a fase', 'Terminar sem cair', `Terminar em até ${clock(stage.starTime)}`];
  const fresh = freshStars(r);
  const mats = (Object.keys(r.materials) as (keyof Materials)[]).filter((k) => r.materials[k] > 0);
  const unique = stage.named ? UNIQUES[stage.named.unique] : null;
  const need = xpNeeded(p.level), free = talentFree(p);
  const nextOpen = !!next && isUnlocked(p, next);
  const info = stageInfo(p, stage);

  const extras: HTMLElement[] = [];
  if (r.won) extras.push(h('li', r.bestTime ? 'hot' : null, h('b', null, r.bestTime ? 'Novo melhor tempo: ' : 'Melhor tempo: '), h('span', 'num', rec.bestTime != null ? clock(rec.bestTime) : 'sem registro'), !r.bestTime && h('span', 'muted', ' (não foi batido desta vez)')));
  if (r.rescued) extras.push(h('li', 'hot', h('b', null, `Novo companheiro: ${COMPANIONS[r.rescued].name}. `), `Luta ao seu lado a partir de agora. Passivo: ${COMPANIONS[r.rescued].passive}.`));
  for (const sp of r.spells) extras.push(h('li', 'hot', icon('misc', sp, 22), h('b', null, `Feitiço novo: ${SPELLS[sp].name}. `), SPELLS[sp].desc));
  if (r.talentPoints > 0) extras.push(h('li', 'hot', h('b', null, `+${plural(r.talentPoints, 'ponto de talento', 'pontos de talento')} `), 'por vencer o chefão pela primeira vez.'));
  if (r.starChest) extras.push(h('li', 'hot', h('b', null, `Baú de ${r.starChest.stars} estrelas aberto: `),
    `+${num(r.starChest.gold)} de ouro, +${num(r.starChest.mata)} ${MATERIAL_LABEL.mata}${r.starChest.talent ? ' e +1 ponto de talento' : ''}.`));

  const shortcuts = [
    p.attrPoints > 0 && btn(`Distribuir ${plural(p.attrPoints, 'ponto de atributo', 'pontos de atributo')}`, () => c.go('heroi'), { cls: 'hot', fk: 'ir-atributos' }),
    free > 0 && btn(`Usar ${plural(free, 'ponto de talento', 'pontos de talento')}`, () => c.go('talentos'), { cls: 'hot', fk: 'ir-talentos' }),
  ];

  return h('div', { class: `results ${r.won ? 'won' : 'lost'}`, 'data-sk': 'results' },
    h('div', 'results-in',
      h('header', 'results-head',
        h('div', null,
          h('div', 'eyebrow', `Fase ${stage.id} · ${stage.name}`),
          h('h1', 'logo', r.won ? 'Fase vencida' : 'Você caiu'),
          !r.won && h('p', 'muted', 'Você fica com parte do XP e do ouro das salas que venceu. Itens e estrelas só vêm com a vitória.')),
        h('ul', { class: 'big-stars', 'aria-label': 'Estrelas da fase' }, goals.map((g, i) => {
          const isNew = fresh[i];
          return h('li', `${r.stars[i] ? 'on' : 'off'}${isNew ? ' fresh' : ''}`, star(r.stars[i], 44), h('span', null, g), isNew && h('b', 'chip hot', 'nova'));
        })),
        r.won && r.newStars > 0 && !fresh.some(Boolean) && h('p', 'chip hot', `+${plural(r.newStars, 'estrela nova', 'estrelas novas')}`)),

      h('div', 'results-grid',
        h('div', 'results-col',
          card('Experiência', 'xp',
            h('div', 'rbig', icon('misc', 'xp', 30), h('b', 'num', `+${num(r.xp)} XP`)),
            h('p', 'muted small', `XP desta fase em ${pct(r.xpMult)} pelo seu nível.`, r.firstClear && ` Inclui o bônus de primeira vitória (×${num(FIRST_CLEAR_XP_BONUS, 1)}).`),
            r.levels > 0 && h('div', 'levelup',
              h('strong', null, r.levels === 1 ? `Subiu de nível: agora é nível ${p.level}` : `Subiu ${r.levels} níveis: agora é nível ${p.level}`),
              h('span', null, `+${num(ATTR_PER_LEVEL * r.levels)} pontos de atributo e +${plural(r.levels, 'ponto de talento', 'pontos de talento')}`)),
            h('div', 'xpbar', h('span', 'num', `Nível ${p.level}`), h('div', { class: 'bar', role: 'img', 'aria-label': `${p.xp} de ${need} de XP` }, h('i', { style: `width:${Math.min(100, (p.xp / need) * 100)}%` })), h('span', 'num muted', `${num(p.xp)}/${num(need)}`))),
          h('div', 'results-pair',
            card('Ouro', 'gold',
              h('div', 'rbig', icon('misc', 'ouro', 30), h('b', 'num', `+${num(r.gold)}`)),
              h('p', 'muted small', `Ouro desta fase em ${pct(r.goldMult)}.`)),
            card('Materiais', 'mats',
              mats.length
                ? h('ul', 'mat-list', mats.map((k) => h('li', null, icon('misc', MAT_ICON[k], 24), h('b', 'num', `+${num(r.materials[k])}`), h('span', null, MATERIAL_LABEL[k]))))
                : h('p', 'muted small', 'Nenhum desta vez.'))),
          extras.length > 0 && card('Também aconteceu', 'extras', h('ul', 'extras', extras)),
        ),
        h('div', 'results-col',
          card(r.items.length ? `Itens recebidos · ${r.items.length}` : 'Itens', 'items',
            r.named && h('div', 'named-drop', h('div', 'named-flag', 'Caiu o item com nome!'), itemCard(r.named, true)),
            r.items.filter((it) => it !== r.named).map((it) => itemRow(it)),
            r.items.length === 0 && h('p', 'muted', r.won ? 'Nenhum item coube na mochila.' : 'Nenhum item: é preciso vencer a fase para abrir o baú.'),
            r.won && unique && !r.named && h('p', { class: 'pity', style: `--rar:${RARITIES[unique.rarity].color}` },
              h('b', null, unique.name), ` não caiu desta vez. A chance era de ${num(r.namedChance, 1)}%; como não caiu, sobe 0,5 ponto e na próxima vitória será de `, h('b', 'num', `${num(info.namedChance, 1)}%`), '.'),
            r.soldOverflow.length > 0 && h('div', 'overflow',
              h('p', 'warn-text small', `Mochila cheia: ${plural(r.soldOverflow.length, 'item foi vendido', 'itens foram vendidos')} na hora (o ouro já está somado).`),
              r.soldOverflow.map((o) => itemRow(o.item, `+${num(o.gold)} de ouro`)))),
          !r.won && card('Antes de tentar de novo', 'tips',
            h('div', 'chips', h('span', 'chip', `Seu Poder ${num(info.power)} × recomendado ${num(info.recommended)}`), h('span', `chip tag tag-${info.tag}`, info.tagText)),
            h('ul', 'tips',
              h('li', null, 'Use os pontos de atributo e de talento que estiverem sobrando.'),
              h('li', null, 'Troque itens pelos melhores da mochila e aprimore a arma no ferreiro.'),
              h('li', null, 'Fases anteriores com etiqueta verde ou amarela ainda rendem XP, ouro e resina.'))),
        ),
      ),
    ),
    h('footer', 'results-foot',
      h('div', 'shortcuts', shortcuts),
      h('div', 'actions',
        btn('Voltar ao acampamento', () => c.go('mapa'), { kind: r.won && nextOpen ? undefined : 'primary', fk: 'voltar' }),
        btn(r.won ? 'Jogar de novo' : 'Tentar de novo', () => c.host.startStage(stage.id), { fk: 'de-novo' }),
        nextOpen && btn(`Próxima fase · ${next.id}`, () => c.host.startStage(next.id), { kind: r.won ? 'primary' : undefined, fk: 'proxima' }))),
  );
}

/**
 * As regras dizem quantas estrelas são novas, não quais. Dá para deduzir: na primeira vitória todas
 * as conquistadas são novas; depois, a primeira nunca é nova. Só fica em dúvida "uma nova, com a
 * segunda e a terceira já acesas": nesse caso nenhuma é marcada e a tela mostra só a contagem.
 */
function freshStars(r: StageRewards): boolean[] {
  const none = [false, false, false];
  if (!r.won || r.newStars === 0) return none;
  if (r.firstClear) return [r.stars[0], r.stars[1], r.stars[2]];
  const later = [r.stars[1], r.stars[2]].filter(Boolean).length;
  return later === r.newStars ? [false, r.stars[1], r.stars[2]] : none;
}
