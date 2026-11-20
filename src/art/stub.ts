// @ts-nocheck
/** Arte provisória de um capítulo: círculos com a inicial, para o jogo rodar antes da arte final. */
import { CREATURES } from './roster';

const COLORS = ['#c9c4bd', '#d9a441', '#e4572e', '#8fe36a', '#b98cff', '#3fa7e0'];

export function stubArt(chapter) {
  const list = CREATURES.filter((c) => c.chapter === chapter), sheets = {};
  for (const cr of list) {
    const r = cr.size / 2;
    const anims = cr.type === 'boss' ? { idle: 2, move: 2, atk: 2, cast: 2, down: 2, special: 2 } : cr.type === 'free' ? { idle: 2 } : cr.type === 'fx' ? { move: 2 } : cr.type === 'pet' ? (cr.fly ? { fly: 2, act: 2 } : { idle: 2, walk: 2, act: 2 }) : cr.type === 'tex' ? null : { move: 2, atk: 2, hide: 2 };
    if (!anims) continue;
    sheets[cr.key] = { key: cr.key, cellW: Math.ceil(r * 2.6), cellH: Math.ceil(r * 2.6), ox: Math.ceil(r * 1.3), oy: Math.ceil(r * 2.2), scale: 1, anims, fly: !!cr.fly };
  }
  return {
    chapter, sheets,
    bake(kit) {
      list.forEach((cr, i) => {
        const s = sheets[cr.key];
        if (!s) { kit.image(cr.key, cr.size, cr.size, (c) => { c.fillStyle = COLORS[i % 6]; c.globalAlpha = 0.7; c.fillRect(0, 0, cr.size, cr.size); }); return; }
        const r = cr.size / 2;
        kit.creature(s, (c, anim, k) => {
          c.save(); c.translate(0, -r);
          c.globalAlpha = anim === 'hide' ? 0.35 + 0.65 * k : 1;
          c.fillStyle = cr.type === 'pet' ? '#e8b04a' : COLORS[i % 6]; c.strokeStyle = '#22100a'; c.lineWidth = 3;
          const s2 = anim === 'atk' || anim === 'cast' ? 1 + 0.15 * k : 1;
          c.beginPath(); c.arc(0, 0, r * s2, 0, Math.PI * 2); c.fill(); c.stroke();
          c.fillStyle = cr.type === 'pet' ? '#22100a' : '#ff3d8a'; c.beginPath(); c.arc(r * 0.4, -r * 0.2, r * 0.14, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#22100a'; c.font = `900 ${Math.round(r * 0.8)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(cr.key.slice(0, 2).toUpperCase(), -r * 0.15, r * 0.25);
          c.restore();
        });
      });
    },
    ground(c, W, H) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, ['', '', '', '#8a6a3c', '#5a4a2a', '#1f2e1f', '#2a2f3a', '#2a3a2a', '#26232b'][chapter]); g.addColorStop(1, '#141210'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
    canopy() {},
    map(c, w, h, points) {
      c.fillStyle = ['', '', '', '#6b5232', '#4e3a20', '#163020', '#262c3a', '#21362a', '#1e1c22'][chapter]; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(233,226,200,.4)'; c.lineWidth = 6; c.setLineDash([4, 14]); c.beginPath(); points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke(); c.setLineDash([]);
    },
  };
}
