/**
 * Cena da sala: lê os comandos, avança a simulação em passo fixo e desenha o resultado.
 * Nenhuma regra de combate mora aqui; a cena só mostra o que a simulação decidiu.
 */
import Phaser from 'phaser';
import { BAKE, SHEETS, type Sheet } from '../art/bake';
import { ENEMY, PLAYER, TICK, VIEW, WAVES } from '../data/balance';
import { createWorld, step, type Enemy, type Input, type SimEvent, type Telegraph, type World } from '../sim/world';
import { Sfx } from './sfx';

const FONT = '"Londrina Solid", Impact, "Arial Black", sans-serif';
const INK = '#22100a';
const NAMES: Record<string, string> = { sauva: 'Saúva-Cinza', queixada: 'Queixada Sombria', cuspidor: 'Cuspidor', tronco: 'Tronco-Oco' };

interface Fx {
  kind: 'arc' | 'ring' | 'spark' | 'puff' | 'spikes';
  x: number; y: number; t: number; dur: number;
  r0?: number; r1?: number; color?: number; ang?: number; width?: number; n?: number; seed?: number;
}
interface EnemyView { spr: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image; kind: Enemy['kind']; label?: Phaser.GameObjects.Text }

const sfx = new Sfx();

export class RoomScene extends Phaser.Scene {
  private world!: World;
  private acc = 0;
  private hitstop = 0;
  private slow = 0;
  private clock = 0;

  private hero!: Phaser.GameObjects.Sprite;
  private heroShadow!: Phaser.GameObjects.Image;
  private views = new Map<number, EnemyView>();
  private shots = new Map<number, Phaser.GameObjects.Image>();
  private teleG!: Phaser.GameObjects.Graphics;
  private fxG!: Phaser.GameObjects.Graphics;
  private hudG!: Phaser.GameObjects.Graphics;
  private fx: Fx[] = [];
  private ghostT = 0;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private latch = { attack: false, dodge: false, spell: false };
  private touched = false;

  private txtHp!: Phaser.GameObjects.Text;
  private txtMana!: Phaser.GameObjects.Text;
  private txtInfo!: Phaser.GameObjects.Text;
  private txtElite!: Phaser.GameObjects.Text;
  private txtTime!: Phaser.GameObjects.Text;
  private txtHelp!: Phaser.GameObjects.Text;
  private txtBanner!: Phaser.GameObjects.Text;
  private txtSub!: Phaser.GameObjects.Text;
  private slotLabels: Phaser.GameObjects.Text[] = [];
  private hurtVeil!: Phaser.GameObjects.Rectangle;

  constructor() { super('room'); }

  create(): void {
    this.world = createWorld((Date.now() & 0xffff) | 1);
    this.acc = 0; this.hitstop = 0; this.slow = 0; this.clock = 0; this.fx = [];
    this.views.clear(); this.shots.clear(); this.touched = false;
    this.latch = { attack: false, dodge: false, spell: false };

    const inv = 1 / BAKE;
    this.add.image(0, 0, 'bg').setOrigin(0).setScale(inv).setDepth(-1000);
    this.add.image(0, 0, 'canopy').setOrigin(0).setScale(inv).setDepth(9000);
    const rays = this.add.image(0, 0, 'rays').setOrigin(0).setScale(inv).setDepth(9001).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: rays, alpha: { from: 0.65, to: 1 }, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.teleG = this.add.graphics().setDepth(1);
    this.fxG = this.add.graphics().setDepth(8000);
    this.hudG = this.add.graphics().setDepth(10000);
    this.heroShadow = this.add.image(0, 0, 'shadow').setScale(inv * 0.95).setDepth(2);
    this.hero = this.makeSprite(SHEETS.hero, 'idle0');
    this.hurtVeil = this.add.rectangle(0, 0, VIEW.w, VIEW.h, 0xb01818, 1).setOrigin(0).setDepth(9500).setAlpha(0);

    this.buildHud();
    this.bindInput();
    (window as unknown as { __enc?: RoomScene }).__enc = this;
  }

  /* ---------- entrada ---------- */

  private bindInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    const touch = () => { this.touched = true; sfx.unlock(); };
    kb.on('keydown', touch);
    kb.on('keydown-SPACE', () => { this.latch.dodge = true; });
    kb.on('keydown-SHIFT', () => { this.latch.dodge = true; });
    kb.on('keydown-Q', () => { this.latch.spell = true; });
    kb.on('keydown-R', () => { if (this.world.phase !== 'fight') this.scene.restart(); });
    kb.on('keydown-M', () => { sfx.muted = !sfx.muted; });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      touch();
      if (p.rightButtonDown()) this.latch.spell = true; else this.latch.attack = true;
    });
  }

  private readInput(): Input {
    const k = this.keys, p = this.input.activePointer;
    const inp: Input = {
      mx: (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0),
      my: (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0),
      aimX: p.worldX, aimY: p.worldY,
      attackPressed: this.latch.attack, attackHeld: p.isDown && !p.rightButtonDown(),
      dodgePressed: this.latch.dodge, spellPressed: this.latch.spell,
    };
    this.latch.attack = this.latch.dodge = this.latch.spell = false;
    return inp;
  }

  /* ---------- laço ---------- */

  update(_time: number, deltaMs: number): void {
    const real = Math.min(0.05, deltaMs / 1000);
    this.clock += real;
    if (this.hitstop > 0) this.hitstop -= real;
    else {
      this.slow = Math.max(0, this.slow - real);
      this.acc += real * (this.slow > 0 ? 0.35 : 1);
      while (this.acc >= TICK) {
        this.acc -= TICK;
        step(this.world, this.readInput(), TICK);
        this.handleEvents();
        if (this.hitstop > 0) break;
      }
    }
    this.syncHero(real);
    this.syncEnemies();
    this.syncShots();
    this.drawTelegraphs();
    this.drawFx(real);
    this.drawHud();
  }

  /* ---------- eventos da simulação ---------- */

  private handleEvents(): void {
    const ev = this.world.events;
    for (const e of ev) this.onEvent(e);
    ev.length = 0;
  }

  private onEvent(e: SimEvent): void {
    const p = this.world.player;
    switch (e.type) {
      case 'swing': {
        const third = e.value === 2;
        this.fx.push({ kind: 'arc', x: e.x + Math.cos(e.ang!) * 30, y: e.y - 34 + Math.sin(e.ang!) * 30, t: 0, dur: third ? 0.2 : 0.15, ang: e.ang, r0: third ? 78 : 64, width: third ? 16 : 11, n: e.value === 1 ? -1 : 1 });
        sfx.play('swing');
        break;
      }
      case 'hit': {
        const poison = e.kind === 'poison';
        this.number(e.x, e.y - 70, String(e.value) + (e.crit ? '!' : ''), poison ? '#8fe36a' : e.armored ? '#c9c4bd' : e.crit ? '#ffd23f' : '#ffffff', poison ? 20 : e.crit ? 38 : 28);
        if (!poison) {
          this.fx.push({ kind: 'spark', x: e.x, y: e.y - 34, t: 0, dur: 0.18, color: e.armored ? 0xc9c4bd : 0xfff3c4, n: e.crit ? 9 : 6, seed: e.id! * 7 + this.world.tick });
          if (e.kind === 'melee') { this.hitstop = Math.max(this.hitstop, e.crit ? 0.09 : 0.045); this.cameras.main.shake(70, e.crit ? 0.006 : 0.003); }
          sfx.play(e.armored ? 'armor' : e.crit ? 'crit' : 'hit');
        }
        break;
      }
      case 'kill': {
        const v = this.views.get(e.id!);
        if (v) {
          this.views.delete(e.id!);
          v.label?.destroy();
          v.spr.clearTint();
          this.tweens.add({ targets: [v.spr, v.shadow], alpha: 0, duration: 260, onComplete: () => { v.spr.destroy(); v.shadow.destroy(); } });
          this.tweens.add({ targets: v.spr, scaleY: v.spr.scaleY * 0.7, y: v.spr.y + 6, duration: 260 });
        }
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 30, t: 0, dur: 0.45, color: 0xd9d6e2, n: 9, seed: e.id! });
        this.fx.push({ kind: 'ring', x: e.x, y: e.y - 26, t: 0, dur: 0.3, r0: 10, r1: 62, color: 0xffffff, width: 5 });
        sfx.play('kill');
        break;
      }
      case 'hurt':
        this.number(e.x, e.y - 100, '-' + e.value, '#ff6b5a', 32);
        this.cameras.main.shake(160, 0.011);
        this.hitstop = Math.max(this.hitstop, 0.08);
        this.hurtVeil.setAlpha(0.3);
        this.tweens.add({ targets: this.hurtVeil, alpha: 0, duration: 320 });
        sfx.play('hurt');
        break;
      case 'death':
        sfx.play('death');
        this.banner('VOCÊ CAIU', 'Aperte R para tentar de novo', '#ff6b5a');
        break;
      case 'dodge':
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 4, t: 0, dur: 0.3, color: 0xcdbf9a, n: 5, seed: this.world.tick });
        sfx.play('dodge');
        break;
      case 'perfect':
        this.number(p.x, p.y - 150, 'ESQUIVA PERFEITA', '#8fe3ff', 30);
        this.fx.push({ kind: 'ring', x: p.x, y: p.y - 40, t: 0, dur: 0.4, r0: 20, r1: 110, color: 0x8fe3ff, width: 6 });
        this.slow = 0.28;
        sfx.play('perfect');
        break;
      case 'cast':
        this.fx.push({ kind: 'ring', x: e.x + Math.cos(e.ang!) * 26, y: e.y - 44, t: 0, dur: 0.22, r0: 6, r1: 36, color: 0x7bd45a, width: 5 });
        sfx.play('cast');
        break;
      case 'spawn':
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 20, t: 0, dur: 0.6, color: 0x2a2a34, n: 10, seed: e.id! * 3 });
        break;
      case 'wave':
        this.number(VIEW.w / 2, 210, `Onda ${e.value! + 1} de ${WAVES.length}`, '#ffb238', 46, 1.3);
        sfx.play('wave');
        break;
      case 'win': {
        const w = this.world;
        this.banner('SALA LIMPA', `Tempo ${this.fmt(w.time)} · golpes recebidos ${w.hitsTaken} · esquivas perfeitas ${w.perfects}\nAperte R para jogar de novo`, '#ffb238');
        sfx.play('win');
        break;
      }
      case 'telegraph': sfx.play('tele'); break;
      case 'bite': this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.18, r0: 14, r1: ENEMY.sauva.biteRadius, color: 0xffe2d0, width: 4 }); break;
      case 'charge': sfx.play('dodge'); break;
      case 'crash':
        this.cameras.main.shake(160, 0.009);
        this.fx.push({ kind: 'spark', x: e.x, y: e.y - 30, t: 0, dur: 0.3, color: 0xfff6d2, n: 10, seed: this.world.tick });
        this.number(e.x, e.y - 120, 'TONTA', '#ffd23f', 30);
        sfx.play('crash');
        break;
      case 'spit': sfx.play('spit'); break;
      case 'splat':
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.3, r0: 12, r1: e.value!, color: 0xaac86e, width: 5 });
        sfx.play('splat');
        break;
      case 'slam':
        this.cameras.main.shake(260, 0.016);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.5, r0: e.value! * 0.6, r1: e.value! * 1.5, color: 0xfff0cd, width: 8 });
        this.fx.push({ kind: 'spikes', x: e.x, y: e.y, t: 0, dur: 0.5, r0: e.value! });
        sfx.play('slam');
        break;
    }
  }

  /* ---------- sprites ---------- */

  private makeSprite(s: Sheet, frame: string): Phaser.GameObjects.Sprite {
    return this.add.sprite(0, 0, s.key, frame).setOrigin(s.ox / s.cellW, s.oy / s.cellH).setScale(1 / BAKE);
  }

  private syncHero(real: number): void {
    const p = this.world.player, h = this.hero, A = SHEETS.hero.anims, inv = 1 / BAKE;
    let frame: string, sy = 1, rot = 0;
    if (p.state === 'attack') {
      const a = PLAYER.combo[p.combo];
      frame = 'atk' + Math.min(A.atk - 1, Math.floor((p.stateT / (a.total * 0.8)) * A.atk));
    } else if (p.state === 'dodge') {
      frame = 'walk' + (Math.floor(this.clock * 30) % A.walk);
      sy = 0.86; rot = p.dx * 0.3;
      this.ghostT -= real;
      if (this.ghostT <= 0) { this.ghostT = 0.045; this.ghost(); }
    } else if (p.moving) frame = 'walk' + (Math.floor((p.walk / (Math.PI * 2)) * A.walk) % A.walk);
    else frame = 'idle' + (Math.floor((this.clock / 2.618) * A.idle) % A.idle);
    h.setFrame(frame).setPosition(p.x, p.y).setDepth(p.y).setScale(inv * p.facing, inv * sy).setRotation(rot);
    this.heroShadow.setPosition(p.x + 4, p.y + 2);
    if (p.state === 'dead') { h.setRotation(-1.4 * p.facing).setAlpha(0.8).setTint(0x8a8a8a); return; }
    h.setAlpha(p.hurtInv > 0 && p.state !== 'dodge' ? (Math.floor(this.clock * 20) % 2 ? 0.45 : 1) : 1);
    if (p.state === 'hurt') h.setTintFill(0xffffff);
    else if (p.perfectT > 0) h.setTint(Math.floor(this.clock * 10) % 2 ? 0xbff0ff : 0xffffff);
    else h.clearTint();
  }

  private ghost(): void {
    const h = this.hero;
    const g = this.add.sprite(h.x, h.y, 'hero', h.frame.name).setOrigin(h.originX, h.originY).setScale(h.scaleX, h.scaleY).setRotation(h.rotation).setDepth(h.depth - 1).setAlpha(0.45).setTint(0x9fe8ff);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  private syncEnemies(): void {
    const inv = 1 / BAKE, t = this.clock;
    if (this.views.size > this.world.enemies.length) {
      // sobrou sprite de um inimigo que saiu da simulação sem evento de morte
      const live = new Set(this.world.enemies.map((e) => e.id));
      for (const [id, v] of this.views) if (!live.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.label?.destroy(); this.views.delete(id); }
    }
    for (const e of this.world.enemies) {
      let v = this.views.get(e.id);
      if (!v) {
        const s = SHEETS[e.kind];
        v = { spr: this.makeSprite(s, Object.keys(s.anims)[0] + '0'), shadow: this.add.image(0, 0, 'shadow').setDepth(2).setScale(inv * (e.radius / 20)), kind: e.kind };
        if (e.elite) v.label = this.add.text(0, 0, '', { fontFamily: FONT, fontStyle: '900', fontSize: '22px', color: '#ffb238', stroke: INK, strokeThickness: 5 }).setOrigin(0.5).setResolution(2);
        this.views.set(e.id, v);
      }
      const spr = v.spr;
      let frame = '', sx = 1, sy = 1, ox = 0, oy = 0;
      if (e.kind === 'sauva') {
        const n = SHEETS.sauva.anims.walk;
        frame = 'walk' + (Math.floor((e.walk / (Math.PI * 2)) * n) % n);
        if (e.state === 'windup') { const k = e.stateT / ENEMY.sauva.windup; sx = sy = 1 + 0.16 * k; ox = (Math.floor(t * 40) % 2 ? 1.5 : -1.5) * k; }
      } else if (e.kind === 'queixada') {
        const n = SHEETS.queixada.anims.run;
        if (e.state === 'charge') frame = 'run' + (Math.floor((e.walk / (Math.PI * 2)) * n) % n);
        else if (e.state === 'aim') { frame = 'run' + (Math.floor(t * 14) % n); ox = Math.floor(t * 40) % 2 ? 1.5 : -1.5; }
        else if (e.moving) frame = 'run' + (Math.floor((e.walk / (Math.PI * 2)) * n) % n);
        else frame = 'idle' + (Math.floor(t * 4) % SHEETS.queixada.anims.idle);
        if (e.state === 'stunned') sy = 0.94;
      } else if (e.kind === 'tronco') {
        const n = SHEETS.tronco.anims.raise;
        const raise = e.state === 'windup' ? Math.min(1, e.stateT / (ENEMY.tronco.windup * 0.8)) : e.state === 'exposed' ? Math.max(0, 1 - e.stateT / 0.12) : 0;
        frame = 'raise' + Math.min(n - 1, Math.round(raise * (n - 1)));
        oy = e.moving ? Math.abs(Math.sin(e.walk * 0.5)) * -5 : 0;
        if (e.state === 'exposed') sy = 0.95;
      } else {
        const n = SHEETS.cuspidor.anims.open;
        const open = e.state === 'spit' ? Math.sin(Math.min(1, e.stateT / 0.5) * Math.PI) : 0.2 + 0.12 * Math.sin(t * 3 + e.id);
        frame = 'open' + Math.min(n - 1, Math.round(open * (n - 1)));
        sx = sy = 1 + 0.03 * Math.sin(t * 2 + e.id);
      }
      const spawn = e.state === 'spawn' ? e.stateT / ENEMY.spawnTime : 1;
      spr.setFrame(frame).setPosition(e.x + ox, e.y + oy).setDepth(e.y).setScale(inv * sx * e.facing * (0.6 + 0.4 * spawn), inv * sy * (0.6 + 0.4 * spawn)).setAlpha(spawn);
      v.shadow.setPosition(e.x + 5, e.y + 2).setAlpha(spawn);
      if (e.flash > 0) spr.setTintFill(0xffffff);
      else if (e.kind === 'tronco' && e.state === 'exposed') spr.setTint(0xffe9a8);
      else if (e.poisonT > 0) spr.setTint(0xa6e08a);
      else spr.clearTint();
      if (v.label) {
        const exposed = e.state === 'exposed';
        v.label.setText(exposed ? 'EXPOSTO' : 'Blindado').setColor(exposed ? '#ffd23f' : '#c9c4bd').setPosition(e.x, e.y - SHEETS[e.kind].oy * 0.78).setDepth(e.y + 1);
      }
    }
  }

  private syncShots(): void {
    const inv = 1 / BAKE, live = new Set<number>();
    for (const pr of this.world.projectiles) {
      live.add(pr.id);
      let img = this.shots.get(pr.id);
      if (!img) { img = this.add.image(0, 0, pr.kind).setScale(inv); this.shots.set(pr.id, img); }
      if (pr.kind === 'thorn') img.setPosition(pr.x, pr.y - 44).setRotation(Math.atan2(pr.vy, pr.vx)).setDepth(pr.y);
      else {
        const k = Math.min(1, pr.t / pr.dur);
        img.setPosition(pr.x, pr.y - 90 * (1 - k) - Math.sin(k * Math.PI) * 170).setRotation(this.clock * 9).setDepth(pr.y + 400).setScale(inv * (1.2 + Math.sin(k * Math.PI) * 0.7));
      }
    }
    for (const [id, img] of this.shots) if (!live.has(id)) { img.destroy(); this.shots.delete(id); }
  }

  /* ---------- marcas no chão ---------- */

  private drawTelegraphs(): void {
    const g = this.teleG;
    g.clear();
    const draw = (t: Telegraph) => {
      const k = Math.min(1, t.t / t.dur);
      if (t.shape === 'circle') {
        g.fillStyle(0xd62a1e, 0.2).fillCircle(t.x, t.y, t.r);
        g.fillStyle(0xf03c28, 0.36).fillCircle(t.x, t.y, t.r * k);
        g.lineStyle(3, 0xf5462d, 0.95).strokeCircle(t.x, t.y, t.r);
      } else {
        const dx = t.x2 - t.x, dy = t.y2 - t.y, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * t.w * 0.5, ny = (dx / len) * t.w * 0.5;
        const quad = (f: number) => [
          new Phaser.Math.Vector2(t.x + nx, t.y + ny), new Phaser.Math.Vector2(t.x + dx * f + nx, t.y + dy * f + ny),
          new Phaser.Math.Vector2(t.x + dx * f - nx, t.y + dy * f - ny), new Phaser.Math.Vector2(t.x - nx, t.y - ny),
        ];
        g.fillStyle(0xd62a1e, 0.2).fillPoints(quad(1), true);
        g.fillStyle(0xf03c28, 0.36).fillPoints(quad(k), true);
        g.lineStyle(3, 0xf5462d, 0.95).strokePoints(quad(1), true);
      }
    };
    for (const e of this.world.enemies) if (e.tele) draw(e.tele);
    for (const p of this.world.projectiles) if (p.tele) draw(p.tele);
  }

  /* ---------- efeitos ---------- */

  private drawFx(dt: number): void {
    const g = this.fxG;
    g.clear();
    this.fx = this.fx.filter((f) => (f.t += dt) < f.dur);
    for (const f of this.fx) {
      const k = f.t / f.dur, a = 1 - k;
      if (f.kind === 'ring') {
        g.lineStyle(f.width! * a + 1, f.color!, a).strokeCircle(f.x, f.y, f.r0! + (f.r1! - f.r0!) * k);
      } else if (f.kind === 'arc') {
        const sweep = 1.25, dir = f.n!, start = f.ang! - sweep * dir, end = start + sweep * 2 * dir * Math.min(1, k * 1.8);
        g.lineStyle(f.width! * a + 2, 0xffffff, a);
        g.beginPath(); g.arc(f.x, f.y, f.r0!, start, end, dir < 0); g.strokePath();
        g.lineStyle(f.width! * 0.4 * a + 1, 0xffe9a8, a * 0.8);
        g.beginPath(); g.arc(f.x, f.y, f.r0! - 9, start, end, dir < 0); g.strokePath();
      } else if (f.kind === 'spark') {
        g.lineStyle(4 * a + 1, f.color!, a);
        for (let i = 0; i < f.n!; i++) {
          const an = (i / f.n!) * Math.PI * 2 + f.seed!, r0 = 8 + k * 16, r1 = 18 + k * 40;
          g.lineBetween(f.x + Math.cos(an) * r0, f.y + Math.sin(an) * r0 * 0.8, f.x + Math.cos(an) * r1, f.y + Math.sin(an) * r1 * 0.8);
        }
      } else if (f.kind === 'puff') {
        for (let i = 0; i < f.n!; i++) {
          const an = (i / f.n!) * Math.PI * 2 + f.seed! * 1.7, d = 6 + k * (22 + (i % 3) * 10);
          g.fillStyle(f.color!, 0.55 * a).fillCircle(f.x + Math.cos(an) * d, f.y + Math.sin(an) * d * 0.6 - k * 14, 5 + k * 9);
        }
      } else {
        const up = Math.sin(k * Math.PI);
        for (let i = 0; i < 9; i++) {
          const an = (i / 9) * Math.PI * 2 + 0.3, d = f.r0! * (0.35 + (i % 3) * 0.24), x = f.x + Math.cos(an) * d, y = f.y + Math.sin(an) * d;
          g.fillStyle(0x4a3a2c, 1).fillTriangle(x - 9, y, x + 9, y, x + (i % 2 ? 4 : -4), y - 46 * up);
          g.lineStyle(2.5, 0x22100a, 1).strokeTriangle(x - 9, y, x + 9, y, x + (i % 2 ? 4 : -4), y - 46 * up);
        }
      }
    }
    /* estrelas sobre a queixada tonta e barras de vida dos inimigos feridos */
    for (const e of this.world.enemies) {
      const top = SHEETS[e.kind].oy * 0.5 + 6;
      if (e.kind === 'queixada' && e.state === 'stunned') {
        for (let i = 0; i < 3; i++) { const an = this.clock * 5 + i * 2.09; g.fillStyle(0xffd23f, 1).fillCircle(e.x + e.facing * 30 + Math.cos(an) * 22, e.y - top + 10 + Math.sin(an) * 7, 5); }
      }
      if (!e.elite && e.hp < e.maxHp && e.state !== 'spawn') {
        const w = 46, x = e.x - w / 2, y = e.y - top - 8;
        g.fillStyle(0x0a0f0a, 0.8).fillRect(x - 2, y - 2, w + 4, 9);
        g.fillStyle(0xd6402b, 1).fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 5);
      }
    }
  }

  private number(x: number, y: number, s: string, color: string, size: number, hold = 0.8): void {
    const t = this.add.text(x + (Math.random() - 0.5) * 16, y, s, { fontFamily: FONT, fontStyle: '900', fontSize: size + 'px', color, stroke: INK, strokeThickness: Math.max(4, size * 0.18) })
      .setOrigin(0.5).setDepth(9200).setResolution(2).setScale(1.3);
    this.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: hold * 1000, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  }

  /* ---------- HUD ---------- */

  private label(x: number, y: number, size: number, color = '#ffffff'): Phaser.GameObjects.Text {
    return this.add.text(x, y, '', { fontFamily: FONT, fontSize: size + 'px', color, stroke: INK, strokeThickness: 4 }).setDepth(10001).setResolution(2);
  }

  private buildHud(): void {
    this.txtInfo = this.label(24, 18, 22);
    this.txtHp = this.label(30, VIEW.h - 77, 18).setDepth(10002);
    this.txtMana = this.label(30, VIEW.h - 45, 15).setDepth(10002);
    this.txtTime = this.label(VIEW.w - 24, 18, 22).setOrigin(1, 0);
    this.txtElite = this.label(VIEW.w / 2, 62, 24, '#ffb238').setOrigin(0.5);
    this.txtHelp = this.label(VIEW.w / 2, VIEW.h - 132, 20, '#f1ebd8').setOrigin(0.5)
      .setText('WASD mover  ·  mouse mirar  ·  clique atacar  ·  Espaço esquivar  ·  Q feitiço  ·  M som');
    this.txtBanner = this.add.text(VIEW.w / 2, VIEW.h / 2 - 50, '', { fontFamily: FONT, fontStyle: '900', fontSize: '96px', color: '#ffb238', stroke: INK, strokeThickness: 12 }).setOrigin(0.5).setDepth(10005).setResolution(2).setVisible(false);
    this.txtSub = this.add.text(VIEW.w / 2, VIEW.h / 2 + 50, '', { fontFamily: FONT, fontSize: '28px', color: '#f1ebd8', stroke: INK, strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(10005).setResolution(2).setVisible(false);
    this.slotLabels = ['Clique', 'Espaço', 'Q'].map((s, i) => this.label(VIEW.w - 226 + i * 72 + 29, VIEW.h - 30, 16).setOrigin(0.5).setText(s));
  }

  private banner(title: string, sub: string, color: string): void {
    this.txtBanner.setText(title).setColor(color).setVisible(true).setScale(0.6).setAlpha(0);
    this.txtSub.setText(sub).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.txtBanner, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.txtSub, alpha: 1, duration: 320, delay: 200 });
  }

  private fmt(t: number): string {
    const m = Math.floor(t / 60), s = t - m * 60;
    return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
  }

  private drawHud(): void {
    const g = this.hudG, w = this.world, p = w.player;
    g.clear();
    /* vida e mana */
    const bar = (x: number, y: number, bw: number, bh: number, k: number, color: number) => {
      g.fillStyle(0x0a0f0a, 0.82).fillRoundedRect(x - 3, y - 3, bw + 6, bh + 6, 5);
      g.fillStyle(color, 1).fillRect(x, y, bw * Phaser.Math.Clamp(k, 0, 1), bh);
      g.fillStyle(0xffffff, 0.16).fillRect(x, y, bw * Phaser.Math.Clamp(k, 0, 1), bh * 0.38);
    };
    bar(24, VIEW.h - 80, 280, 24, p.hp / PLAYER.maxHp, 0xd6402b);
    bar(24, VIEW.h - 46, 210, 16, p.mana / PLAYER.maxMana, 0x3fa7e0);
    this.txtHp.setText(`${Math.ceil(p.hp)} / ${PLAYER.maxHp}`);
    this.txtMana.setText(`${Math.floor(p.mana)} / ${PLAYER.maxMana}`);
    /* atalhos com recarga */
    const slot = (i: number, color: number, cd: number, ok: boolean) => {
      const x = VIEW.w - 226 + i * 72, y = VIEW.h - 104, s = 58;
      g.fillStyle(0x0a0f0a, 0.82).fillRoundedRect(x - 3, y - 3, s + 6, s + 6, 10);
      g.fillStyle(color, ok ? 1 : 0.35).fillRoundedRect(x, y, s, s, 8);
      if (cd > 0) g.fillStyle(0x0a0f0a, 0.72).fillRect(x, y, s, s * Phaser.Math.Clamp(cd, 0, 1));
    };
    slot(0, 0xe9e4d4, 0, true);
    slot(1, 0x8fe3ff, p.dodgeCd / PLAYER.dodge.cooldown, p.dodgeCd <= 0);
    slot(2, 0x5fbf5a, p.spellCd / PLAYER.spell.cooldown, p.mana >= PLAYER.spell.cost);
    /* cabeçalho */
    const wave = Math.max(0, w.wave) + 1;
    this.txtInfo.setText(`Capítulo 1 · Mata Atlântica · sala de teste  ·  Onda ${wave} de ${WAVES.length}`);
    this.txtTime.setText(this.fmt(w.time));
    /* barra do elite */
    const elite = w.enemies.find((e) => e.elite);
    if (elite) {
      const bw = 460, x = VIEW.w / 2 - bw / 2, y = 82;
      g.fillStyle(0x0a0f0a, 0.82).fillRoundedRect(x - 4, y - 4, bw + 8, 24, 6);
      g.fillStyle(0xd6402b, 1).fillRect(x, y, bw * Math.max(0, elite.hp / elite.maxHp), 16);
      this.txtElite.setText(`${NAMES[elite.kind]} · elite`).setVisible(true);
    } else this.txtElite.setVisible(false);
    this.txtHelp.setAlpha(this.touched ? Math.max(0, 1 - Math.max(0, w.time - 10) / 3) : 1);
    this.slotLabels.forEach((l) => l.setAlpha(1));
  }
}
