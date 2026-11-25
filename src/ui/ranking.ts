/**
 * Janela de ranking: o topo, a sua posição e o percentil. Os números vêm do servidor,
 * que refez cada partida (docs/gdd/12-online.md).
 */
import { ITEM_TYPES, type ItemType } from '../data/items';
import type { MyRank, RankMode, RankRow } from '../online/backend';
import type { CloudSync } from '../online/sync';
import type { Ctx } from './ctx';
import { clock, h, itemIcon, ui } from './dom';

export interface RankingState {
  modo: RankMode; chave: string; title: string;
  /** Total de salas do desafio, para escrever "caiu na sala 3". */
  unit: string;
  rows: RankRow[] | null; me: MyRank | null; error: string | null; loading: boolean;
}

/** Abre a janela e busca os dados. */
export function openRanking(c: Ctx, o: CloudSync, modo: RankMode, chave: string, title: string, unit: string): void {
  c.st.ranking = { modo, chave, title, unit, rows: null, me: null, error: null, loading: false };
  load(c, o);
  c.redraw('ranking-fechar');
}

function load(c: Ctx, o: CloudSync): void {
  const r = c.st.ranking;
  if (!r || r.loading) return;
  r.loading = true;
  const mine = o.ranked ? o.backend.myRank(r.modo, r.chave).catch(() => null) : Promise.resolve(null);
  void Promise.all([o.backend.ranking(r.modo, r.chave), mine]).then(([rows, me]) => {
    if (c.st.ranking !== r) return;
    r.rows = rows; r.me = me; r.error = null; r.loading = false; c.redraw();
  }, () => {
    if (c.st.ranking !== r) return;
    r.rows = []; r.error = 'Não deu para buscar o ranking agora.'; r.loading = false; c.redraw();
  });
}

function result(r: { venceu: boolean; salas: number; tempo_ms: number }, unit: string): string {
  return r.venceu ? clock(r.tempo_ms / 1000) : `${unit} ${r.salas + 1}`;
}

function row(r: RankRow | (MyRank & { apelido: string }), unit: string, me: boolean): HTMLElement {
  const medal = r.posicao <= 3 ? ` top${r.posicao}` : '';
  return h('div', { class: `rk-row${me ? ' me' : ''}${medal}`, role: 'row' },
    h('b', 'rk-pos', `${r.posicao}º`),
    h('span', 'rk-weapon', ITEM_TYPES[r.arma as ItemType] ? itemIcon(r.arma, 26) : null),
    h('span', 'rk-name', r.apelido),
    h('span', `rk-res${r.venceu ? ' won' : ''}`, r.venceu ? ui('relogio', 18) : ui('caveira', 18), result(r, unit)));
}

export function rankingModal(c: Ctx, o: CloudSync): HTMLElement | null {
  const r = c.st.ranking;
  if (!r) return null;
  if (r.rows === null && !r.loading) load(c, o);
  const close = () => { c.st.ranking = null; c.redraw(); };
  const myName = o.account?.apelido ?? '';
  const inTop = !!r.me && !!r.rows?.some((x) => x.posicao === r.me!.posicao && x.apelido === myName);
  const pct = r.me && r.me.total >= 10 ? Math.max(1, Math.ceil((r.me.posicao / r.me.total) * 100)) : null;
  return h('div', { class: 'modal-back', onclick: (e: Event) => { if (e.target === e.currentTarget) close(); } },
    h('div', { class: 'modal rk', role: 'dialog', 'aria-modal': 'true', 'aria-label': r.title },
      h('button', { type: 'button', class: 'mini-btn acc-close', 'aria-label': 'Fechar', 'data-fk': 'ranking-fechar', onclick: close }, ui('fechar', 18)),
      h('div', 'modal-title', ui('coroa', 34), r.title),
      r.rows === null
        ? h('div', 'rk-empty', 'Buscando…')
        : r.error
          ? h('div', 'rk-empty', r.error)
          : r.rows.length === 0
            ? h('div', 'rk-empty', 'Ninguém entrou ainda. O primeiro lugar está vago.')
            : h('div', { class: 'rk-list', role: 'table' }, r.rows.map((x) => row(x, r.unit, x.apelido === myName && x.posicao === r.me?.posicao))),
      r.me && !inTop && h('div', 'rk-mine', row({ ...r.me, apelido: myName }, r.unit, true)),
      h('div', 'rk-foot',
        r.me
          ? `Você: ${r.me.posicao}º de ${r.me.total}${pct ? ` · top ${pct}%` : ''}`
          : o.ranked ? 'Você ainda não entrou neste ranking.' : 'Entre na conta (Opções) para jogar valendo.',
        h('i', null, 'Cada partida é refeita pelo servidor.'))));
}
