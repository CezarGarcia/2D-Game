// @ts-nocheck
/* O céu do Sonho: o fundo de todas as telas da noite. Noite alta, lua grande, serra ao longe e mata em silhueta. */
function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function paintDreamBackdrop(c, W, H) {
  var R = rng(4242), i, TAU = Math.PI * 2;
  var g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0d2a'); g.addColorStop(.45, '#1c1648'); g.addColorStop(.78, '#3a2466'); g.addColorStop(1, '#241238');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* estrelas: muitas miúdas, algumas em cruz */
  for (i = 0; i < 260; i++) { var x = R() * W, y = R() * H * .74, r = .5 + R() * 1.3; c.globalAlpha = .35 + R() * .6; c.fillStyle = R() < .2 ? '#ffe9a8' : '#e9e4ff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  for (i = 0; i < 16; i++) { var sx = R() * W, sy = R() * H * .6, sr = 3 + R() * 4; c.strokeStyle = 'rgba(255,244,214,.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx - sr, sy); c.lineTo(sx + sr, sy); c.moveTo(sx, sy - sr); c.lineTo(sx, sy + sr); c.stroke(); }
  /* lua cheia com halo */
  var mx = W * .82, my = H * .2, mr = 74;
  var q = c.createRadialGradient(mx, my, mr * .6, mx, my, mr * 4.6); q.addColorStop(0, 'rgba(255,240,190,.34)'); q.addColorStop(1, 'rgba(255,240,190,0)');
  c.fillStyle = q; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1c0f0a'; c.beginPath(); c.arc(mx, my, mr + 3, 0, TAU); c.fill();
  q = c.createRadialGradient(mx - 20, my - 22, 8, mx, my, mr); q.addColorStop(0, '#fffbe6'); q.addColorStop(1, '#f0d99a');
  c.fillStyle = q; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
  [[-22, -14, 15], [20, 12, 11], [-6, 30, 8], [30, -28, 7], [-36, 20, 6]].forEach(function (k) { c.fillStyle = 'rgba(170,130,70,.26)'; c.beginPath(); c.arc(mx + k[0], my + k[1], k[2], 0, TAU); c.fill(); });
  /* nuvens finas atravessando */
  for (i = 0; i < 7; i++) { var cx = R() * W, cy = H * (.12 + R() * .4), cw = 160 + R() * 260; c.fillStyle = 'rgba(190,170,255,' + (.05 + R() * .07) + ')'; c.beginPath(); c.ellipse(cx, cy, cw, 10 + R() * 14, 0, 0, TAU); c.fill(); }
  /* serras: três fileiras, cada vez mais escuras */
  [[.62, '#2c1d56', 46, 7], [.72, '#22154a', 60, 5], [.82, '#180e36', 40, 9]].forEach(function (ly, n) {
    c.fillStyle = ly[1]; c.beginPath(); c.moveTo(0, H);
    var px = 0;
    c.lineTo(0, H * ly[0]);
    while (px < W) { var step = W / ly[3] * (.6 + R() * .8), top = H * ly[0] - ly[2] * (.3 + R()); c.quadraticCurveTo(px + step / 2, top, px + step, H * ly[0] + (R() - .5) * 14); px += step; }
    c.lineTo(W, H); c.closePath(); c.fill();
    if (n === 1) { c.fillStyle = 'rgba(160,140,255,.06)'; c.fillRect(0, H * .7, W, H * .12); }
  });
  /* mata em silhueta nas bordas e embaixo */
  function tree(x, y, s) {
    c.fillStyle = '#0d0822';
    c.fillRect(x - 5 * s, y - 70 * s, 10 * s, 80 * s);
    for (var k = 0; k < 7; k++) { c.beginPath(); c.arc(x + (R() - .5) * 70 * s, y - 80 * s - R() * 60 * s, (26 + R() * 22) * s, 0, TAU); c.fill(); }
  }
  for (i = 0; i < 6; i++) tree(R() * 150 - 20, H + 10 - R() * 30, 1.2 + R() * .8);
  for (i = 0; i < 6; i++) tree(W - R() * 150 + 20, H + 10 - R() * 30, 1.2 + R() * .8);
  c.fillStyle = '#0d0822'; c.beginPath(); c.moveTo(0, H);
  for (i = 0; i <= 40; i++) c.lineTo(i * W / 40, H - 16 - R() * 22);
  c.lineTo(W, H); c.closePath(); c.fill();
  /* vaga-lumes */
  for (i = 0; i < 46; i++) { var fx = R() * W, fy = H * (.5 + R() * .48), fr = 1.2 + R() * 1.6; q = c.createRadialGradient(fx, fy, 0, fx, fy, fr * 5); q.addColorStop(0, 'rgba(255,238,150,.75)'); q.addColorStop(1, 'rgba(255,238,150,0)'); c.fillStyle = q; c.fillRect(fx - fr * 5, fy - fr * 5, fr * 10, fr * 10); c.fillStyle = '#fff6c4'; c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.fill(); }
  /* escurece as bordas, para os painéis lerem bem por cima */
  q = c.createRadialGradient(W / 2, H * .46, H * .3, W / 2, H / 2, W * .72); q.addColorStop(0, 'rgba(6,4,20,0)'); q.addColorStop(1, 'rgba(6,4,20,.6)');
  c.fillStyle = q; c.fillRect(0, 0, W, H);
}
