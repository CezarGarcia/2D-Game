/**
 * Resumo da noite como imagem (docs/gdd/09, "momentos de exagero"): desenha num canvas o que a tela de acordar mostra
 * e entrega um PNG para o jogador guardar ou compartilhar.
 */
import { paintDreamBackdrop } from '../art/sonho';
import { drawUiIcon } from '../art/uiicons';
import { AMULETS, AMULET_RARITY } from '../data/amulets';
import { BLESSINGS, BLESSING_TIER_COLOR, blessingCounts, type BlessingId } from '../data/content';
import { ITEM_TYPES } from '../data/items';
import type { NightEnd } from '../meta/dream';

const W = 1200, H = 630, FONT = '"Londrina Solid", Impact, "Arial Black", sans-serif', INK = '#1c0f0a';

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center'): void {
  c.font = `900 ${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = Math.max(4, size * 0.16); c.strokeStyle = INK; c.strokeText(s, x, y);
  c.fillStyle = color; c.fillText(s, x, y);
}
function icon(c: CanvasRenderingContext2D, key: string, x: number, y: number, size: number): void {
  c.save(); c.translate(x - size / 2, y - size / 2); drawUiIcon(c, key, size); c.restore();
}
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Desenha o resumo. Devolve o canvas (o chamador decide o que fazer com ele). */
export function drawNightSummary(e: NightEnd, level: number): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!;
  paintDreamBackdrop(c, W, H);
  c.fillStyle = 'rgba(10,8,34,.45)'; c.fillRect(0, 0, W, H);
  text(c, e.won ? 'NOITE VENCIDA' : 'UMA NOITE NO SONHO', W / 2, 62, 62, e.won ? '#ffe27a' : '#fff3c4');
  text(c, `${ITEM_TYPES[e.weapon].label} · nível ${level}${e.weight ? ` · Peso ${e.weight}` : ''}`, W / 2, 116, 28, '#cdb8ff');
  /* números */
  const facts: [string, string, string][] = [['coroa', `${e.trechos}/${e.of}`, e.of === 1 ? 'trecho' : 'trechos'], ['dano', String(e.tally.rooms), 'salas'], ['elite', String(e.tally.elites), 'elites'], ['execucao', String(e.tally.kills), 'monstros'], ['relogio', clock(e.tally.time), 'de luta'], ['lembranca', `+${e.memories}`, 'Lembranças']];
  facts.forEach(([ic, value, label], i) => {
    const x = 110 + i * 196, y = 216;
    c.fillStyle = 'rgba(8,6,28,.6)'; c.beginPath(); c.roundRect(x - 86, y - 62, 172, 124, 16); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    icon(c, ic, x, y - 30, 40); text(c, value, x, y + 12, 36, '#ffffff'); text(c, label, x, y + 44, 20, '#d8c49a');
  });
  /* bênçãos, com o nível de cada uma */
  const counts = blessingCounts(e.blessings), woke = new Set(e.blessings.map((id) => BLESSINGS[id].awakens).filter(Boolean) as BlessingId[]);
  const ids = (Object.keys(counts) as BlessingId[]).filter((id) => !woke.has(id)).slice(0, 26);
  text(c, ids.length ? `${e.blessings.length} bênçãos` : 'Sem bênçãos nesta noite', W / 2, 322, 26, '#cdb8ff');
  const per = 13, cell = 78;
  ids.forEach((id, i) => {
    const row = Math.floor(i / per), n = Math.min(per, ids.length - row * per), x = W / 2 - ((n - 1) * cell) / 2 + (i % per) * cell, y = 380 + row * 80, b = BLESSINGS[id];
    c.fillStyle = '#15102e'; c.beginPath(); c.roundRect(x - 32, y - 32, 64, 64, 14); c.fill(); c.lineWidth = 4; c.strokeStyle = BLESSING_TIER_COLOR[b.tier]; c.stroke(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    icon(c, b.icon, x, y, 44);
    if (counts[id]! > 1) text(c, String(counts[id]), x + 26, y + 26, 22, BLESSING_TIER_COLOR[b.tier]);
  });
  /* amuletos */
  const amus = e.amulets.slice(0, 14);
  amus.forEach((id, i) => {
    const x = W / 2 - ((amus.length - 1) * 66) / 2 + i * 66, y = 548, a = AMULETS[id];
    c.fillStyle = a.color; c.beginPath(); c.arc(x, y, 27, 0, Math.PI * 2); c.fill(); c.lineWidth = 5; c.strokeStyle = AMULET_RARITY[a.rarity].color; c.stroke(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    icon(c, a.icon, x, y, 34);
  });
  text(c, 'Encantados', W - 28, H - 26, 26, 'rgba(255,243,196,.85)', 'right');
  return cv;
}

/** Baixa o resumo como PNG. */
export function saveNightSummary(e: NightEnd, level: number): void {
  const cv = drawNightSummary(e, level), a = document.createElement('a');
  a.download = `encantados-noite-${e.won ? 'vencida' : 'sonho'}.png`;
  a.href = cv.toDataURL('image/png');
  document.body.appendChild(a); a.click(); a.remove();
}
