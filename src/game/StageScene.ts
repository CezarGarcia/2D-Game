/**
 * Cena de uma fase: lê os comandos, avança a simulação em passo fixo e desenha o resultado.
 * Nenhuma regra de combate mora aqui; a cena só mostra o que a simulação decidiu.
 */
import Phaser from 'phaser';
import { ALL_SHEETS, BAKE, SHEETS, ensureChapterArt, ensureHero, makeKit, sheetChapter, type Sheet } from '../art/bake';
import { paintTrainingGround } from '../art/treino';
import { ARENA, ENEMY, PLAYER, TICK, VIEW, enemyBase, isBossKind, isMonster } from '../data/balance';
import { BOSSES, MONSTERS, type BossKind } from '../data/bestiary';
import { artChaptersOf, findStage, isTowerId } from '../data/tower';
import { isTrainingId } from '../data/training';
import { AMULETS, type AmuletId } from '../data/amulets';
import { isDreamId, parseDreamId } from '../data/dream';
import type { DreamContext } from '../meta/dream';
import { weekKey, type Profile } from '../meta/profile';
import { brewBoost } from '../meta/afinidade';
import type { BrewId } from '../data/brews';
import { boitataBody } from '../sim/bosses';
import {
  BLESSINGS, BLESSING_TIER_COLOR, BLESSING_TIER_LABEL, COMPANIONS, ELEMENTS, ELEMENT_ORDER, PATRONS, PATRON_STEPS, PATRON_TIERS, REACTIONS, SPELLS, SUPREMOS, blessingCounts,
  type BlessingId, type ElementId,
} from '../data/content';
import { BUFFS, CHESTS, type BuffId, type ChestTier } from '../data/loot';
import { CHAPTERS, ENEMY_NAMES, MOD_NAMES, STAGE_BY_ID, type StageDef } from '../data/stages';
import { countEvent, newTally, type RunTally } from '../meta/daily';
import { AFFINITY, stageShells, towerElement } from '../data/affinity';
import { cleanOmens, omenFoes, omenWeight, type OmenPick } from '../data/omens';
import { deriveStats, type StatBoost } from '../meta/stats';
import { HUMAN, makeBot } from '../sim/bot';
import { isBoss } from '../sim/core';
import { challengeLeft } from '../sim/loot';
import { comboOf, spellCost } from '../sim/player';
import { quantize, Recorder } from '../sim/replay';
import { challengeSeed, type HeroSpec } from '../data/challenge';
import { challengeProfile, isChallengeId } from '../meta/challenge';
import { chooseBlessing, chooseOffer, createWorld, exitZone, step, type Buff, type Enemy, type Input, type SimEvent, type Telegraph, type World } from '../sim/world';
import { CARD, HUD_SCALE, SLOT, TIER_COLORS, VITALS, bakeHud, duoCardTexture, plateTexture } from './hudart';
import { music, unlockAudio } from './music';
import { session } from './session';
import { sfx } from './sfx';
import { trackFor } from './tracks';

const FONT = '"Londrina Solid", Impact, "Arial Black", sans-serif';
const INK = '#22100a';
const INV = 1 / BAKE;
/** Folhas de sprites por nome, para os bichos que podem ainda não ter arte. */
const SH = ALL_SHEETS;
const COLOR = (el: ElementId | null | undefined): number => (el ? Phaser.Display.Color.HexStringToColor(ELEMENTS[el].color).color : 0xe9e4d8);
/** O Eco dos Sete veste a folha de cada Encantado, em ordem. */
const ECHO_SHEETS = ['curupira', 'iara', 'saci', 'boitata', 'mapinguari', 'lobisomem', 'cuca'];
const WATER = 0x5cc8f0;

interface Fx {
  kind: 'arc' | 'ring' | 'spark' | 'puff' | 'spikes' | 'line' | 'prints' | 'roots';
  x: number; y: number; t: number; dur: number;
  r0?: number; r1?: number; color?: number; ang?: number; width?: number; n?: number; seed?: number; x2?: number; y2?: number;
}
/** Velocidades da Caçada automática (tecla V troca). */
const AUTO_SPEEDS = [1, 2, 3];

/** Medidor de dano do Terreiro: soma os golpes desde o primeiro até parar de bater. */
type MeterGroup = 'arma' | 'feitico' | 'pet' | 'reacao' | 'efeito';
interface Meter {
  /** Tempo de relógio do primeiro e do último golpe da medição (−1 = ainda não começou). */
  t0: number; last: number;
  total: number; max: number; hits: number; reactions: number;
  by: Record<MeterGroup, number>;
  /** Golpes recentes, para o dano por segundo "agora". */
  recent: { t: number; v: number }[];
}
function newMeter(): Meter { return { t0: -1, last: -1, total: 0, max: 0, hits: 0, reactions: 0, by: { arma: 0, feitico: 0, pet: 0, reacao: 0, efeito: 0 }, recent: [] }; }
const METER_GROUPS: { id: MeterGroup; name: string; color: number; css: string }[] = [
  { id: 'arma', name: 'Arma', color: 0xe9e4d4, css: '#e9e4d4' },
  { id: 'feitico', name: 'Feitiços', color: 0x5cc8f0, css: '#5cc8f0' },
  { id: 'pet', name: 'Companheiro', color: 0xf2a65a, css: '#f2a65a' },
  { id: 'reacao', name: 'Reações', color: 0xffd23f, css: '#ffd23f' },
  { id: 'efeito', name: 'Veneno e fogo', color: 0x8fe36a, css: '#8fe36a' },
];
const METER_OF: Record<string, MeterGroup> = { melee: 'arma', arrow: 'arma', roll: 'arma', spell: 'feitico', pet: 'pet', ally: 'pet', reaction: 'reacao', spark: 'reacao', poison: 'efeito', burn: 'efeito', blast: 'efeito', reflect: 'efeito' };
/** Sem bater por este tempo, a próxima pancada começa uma medição nova. */
const METER_IDLE = 5;
const METER_WINDOW = 4;
const big = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',')} mi` : n >= 1e4 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.', ',')} mil` : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));

interface EnemyView { spr: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image; sheet: string; label?: Phaser.GameObjects.Text }

export class StageScene extends Phaser.Scene {
  private stage!: StageDef;
  private world!: World;
  private acc = 0;
  private hitstop = 0;
  private slow = 0;
  private clock = 0;
  private paused = false;
  private ended = false;

  private bg!: Phaser.GameObjects.Image;
  private hero!: Phaser.GameObjects.Sprite;
  private heroShadow!: Phaser.GameObjects.Image;
  private heroSheet: Sheet = SHEETS.hero;
  private pet: Phaser.GameObjects.Sprite | null = null;
  private petShadow: Phaser.GameObjects.Image | null = null;
  private altar!: Phaser.GameObjects.Image;
  private views = new Map<number, EnemyView>();
  private shots = new Map<number, Phaser.GameObjects.Sprite>();
  private teleG!: Phaser.GameObjects.Graphics;
  private fxG!: Phaser.GameObjects.Graphics;
  private hudG!: Phaser.GameObjects.Graphics;
  private fx: Fx[] = [];
  private ghostT = 0;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private latch = { attack: false, dodge: false, spell: [false, false, false] as [boolean, boolean, boolean], pet: false, potion: false, supremo: false };
  private blessIcons: Phaser.GameObjects.GameObject[] = [];
  /** Imagens de aliados, redemoinhos, capim, muralha e chamas em órbita, por chave. */
  private extras = new Map<string, Phaser.GameObjects.Sprite>();
  private segs: Phaser.GameObjects.Image[] = [];
  private dark!: Phaser.GameObjects.Image;
  private blessShown = -1;
  private supIcon: Phaser.GameObjects.Image | null = null;
  /** Chão dos achados (brilho dos baús, sombra das moedas) e o HUD deles. */
  private lootG!: Phaser.GameObjects.Graphics;
  private buffIcons: Phaser.GameObjects.GameObject[] = [];
  private buffShown = '';
  private txtGold!: Phaser.GameObjects.Text;
  private goldIcon!: Phaser.GameObjects.Image;
  private txtChallenge!: Phaser.GameObjects.Text;
  /** Ouro das moedas recolhidas há pouco: sai num número só, em vez de um por moeda. */
  private goldAcc = 0;
  private goldAccT = 0;
  private coinSfxT = 0;

  private txtInfo!: Phaser.GameObjects.Text;
  private txtTime!: Phaser.GameObjects.Text;
  private txtHp!: Phaser.GameObjects.Text;
  private txtMana!: Phaser.GameObjects.Text;
  private txtBoss!: Phaser.GameObjects.Text;
  private txtHelp!: Phaser.GameObjects.Text;
  private txtBanner!: Phaser.GameObjects.Text;
  private txtSub!: Phaser.GameObjects.Text;
  private txtExit!: Phaser.GameObjects.Text;
  private txtPotion!: Phaser.GameObjects.Text;
  private slotIcons: (Phaser.GameObjects.Image | null)[] = [];
  private cards: Phaser.GameObjects.Container[] = [];
  private veil!: Phaser.GameObjects.Rectangle;
  private fade!: Phaser.GameObjects.Rectangle;

  /** Contagens para as missões do dia. */
  private tally: RunTally = newTally();
  /** Gravação dos comandos, para o ranking refazer a partida no servidor. */
  private rec = new Recorder();

  /** Caçada automática: o jogador automático guia o herói. `index` e `total` são a posição na fila. */
  private auto: { speed: number; index: number; total: number } | null = null;
  private bot: ((w: World) => Input) | null = null;
  private autoPickT = 0;
  private autoChip: Phaser.GameObjects.Text | null = null;
  private autoHint: Phaser.GameObjects.Text | null = null;
  /** Terreiro de treino: sem fim, com o medidor de dano. */
  private training = false;
  private meter = newMeter();
  private meterTxt: Phaser.GameObjects.Text[] = [];
  private meterLegend: Phaser.GameObjects.Text[] = [];
  /** Vida mostrada com atraso, para o dano recém-tomado ficar visível na barra. */
  private hpLag = 1;
  private slotCd: Phaser.GameObjects.Text[] = [];
  private roomDotsX = 0;
  /** Faixas de sinergia já avisadas, por padrinho. */
  private synTiers: Partial<Record<ElementId, number>> = {};
  private txtPause!: Phaser.GameObjects.Text;
  private pauseVeil!: Phaser.GameObjects.Rectangle;
  private synY = 170;
  /** O Sonho: o herói da noite e o que ele traz da sala anterior (nulo fora do Sonho). */
  private dream: DreamContext | null = null;
  private heroProfile!: Profile;
  private amulets: AmuletId[] = [];
  /** Quando cada monstro mostrou "Fraco!" ou "Resiste" pela última vez, para o aviso não repetir a cada golpe. */
  private affSaid = new Map<number, number>();
  /** A partir de quanto um golpe conta como enorme nesta fase. */
  private hugeHit = Infinity;
  private boost: StatBoost = {};
  private omens: OmenPick = {};
  /** Desafio com ranking: o herói escolhido (equipamento de referência) e a semente igual para todos. */
  private challenge: HeroSpec | null = null;

  constructor() { super('stage'); }

  init(data: { stageId?: string; auto?: { speed: number; index: number; total: number }; dream?: DreamContext; omens?: OmenPick; brew?: BrewId; challenge?: HeroSpec }): void {
    this.stage = findStage(data.stageId ?? '1-1') ?? STAGE_BY_ID.get('1-1')!;
    this.training = isTrainingId(this.stage.id);
    this.dream = isDreamId(this.stage.id) ? data.dream ?? null : null;
    this.challenge = isChallengeId(this.stage.id) ? data.challenge ?? null : null;
    const plain = !this.training && !this.dream && !this.challenge;
    this.auto = data.auto && plain ? { ...data.auto } : null;
    /* Presságios da campanha: só os de combate, e só em fase comum */
    this.omens = plain && !this.auto && this.stage.index >= 0 ? cleanOmens(data.omens, true) : {};
    /* Garrafada: só fora do Sonho, do treino e dos desafios, e nunca na Caçada automática */
    this.boost = this.dream?.boost ?? (data.brew && plain && !this.auto ? brewBoost(data.brew) : {});
  }

  create(): void {
    /* no Sonho o herói é o da noite (personagem de referência, bênçãos e amuletos que ele já juntou) */
    const D = this.dream, C = this.challenge, profile = D?.profile ?? (C ? challengeProfile(C) : session.profile!);
    this.heroProfile = profile; this.amulets = D?.amulets ?? [];
    /* a caçada automática muda de semente a cada partida, para não repetir a mesma luta dez vezes */
    const seed = D ? (parseDreamId(this.stage.id)?.seed ?? 1) | 1 : C ? challengeSeed(this.stage.id) : 7919 + this.stage.index * 131 + (this.auto ? (profile.life.runs + 1) * 977 : 0);
    this.world = createWorld({
      stageId: this.stage.id, level: this.stage.level, rooms: this.stage.rooms, stats: deriveStats(profile, D?.carry.blessings ?? [], this.amulets, this.boost), seed,
      ranked: isTowerId(this.stage.id) || !!D || !!C, ...(D ? { carry: D.carry, foes: D.foes } : omenWeight(this.omens) > 0 ? { foes: omenFoes(this.omens) } : {}),
      shells: D ? D.shells : this.training ? undefined : stageShells(this.stage, omenWeight(this.omens)),
      ...(isTowerId(this.stage.id) && stageShells(this.stage) ? { shellEl: towerElement(weekKey(), Number(this.stage.id.split('-')[1]) || 1) } : {}),
    });
    this.bot = this.auto ? makeBot(profile, { ...HUMAN, seed: seed & 0xffff }) : null;
    this.autoPickT = 0; this.autoChip = null; this.autoHint = null; this.meter = newMeter(); this.meterTxt = []; this.meterLegend = []; this.hpLag = 1; this.slotCd = []; this.synTiers = { ...this.world.stats.patronTiers };
    this.hugeHit = Math.max(60, this.world.stats.weaponDamage * this.world.stats.damageMult * 9);
    this.acc = 0; this.hitstop = 0; this.slow = 0; this.clock = 0; this.affSaid.clear(); this.fx = []; this.paused = false; this.ended = false; this.tally = newTally(); this.rec = new Recorder();
    if (this.auto) this.tally.auto = true;
    this.views.clear(); this.shots.clear(); this.cards = [];
    this.latch = { attack: false, dodge: false, spell: [false, false, false], pet: false, potion: false, supremo: false };
    this.blessIcons = []; this.blessShown = -1; this.supIcon = null;
    this.buffIcons = []; this.buffShown = ''; this.goldAcc = 0; this.goldAccT = 0;

    const tower = isTowerId(this.stage.id);
    const petChapter = this.heroProfile.companion ? sheetChapter(this.heroProfile.companion) : 0;
    const ecos = this.stage.rooms.some((r) => r.waves.some((wv) => wv.some((d) => d.kind === 'ecos')));
    ensureChapterArt(this, [...artChaptersOf(this.stage), ...(petChapter ? [petChapter] : [])], tower ? 'torre' : this.stage.chapter, ecos ? ECHO_SHEETS : []);
    this.extras.clear(); this.segs = [];
    bakeHud(this);
    if (!this.training && this.textures.exists('mata_bg9')) this.textures.remove('mata_bg9');
    if (this.training) makeKit(this).image('mata_bg9', VIEW.w, VIEW.h, (c) => paintTrainingGround(c, VIEW.w, VIEW.h, ARENA));
    this.bg = this.add.image(0, 0, 'bg0').setOrigin(0).setScale(INV).setDepth(-1000);
    const canopy = tower ? 'torre_canopy' : this.stage.chapter >= 3 ? `ch${this.stage.chapter}_canopy` : this.stage.chapter === 2 ? 'rio_canopy' : 'canopy';
    this.add.image(0, 0, this.textures.exists(canopy) ? canopy : 'canopy').setOrigin(0).setScale(INV).setDepth(9000);
    if (!this.textures.exists('darkmask')) {
      // degradê suave: um quarto da resolução, ampliado, ocupa 16 vezes menos memória
      const cv = document.createElement('canvas'); cv.width = VIEW.w / 2; cv.height = VIEW.h / 2;
      const c = cv.getContext('2d')!, g = c.createRadialGradient(VIEW.w / 4, VIEW.h / 4, 15, VIEW.w / 4, VIEW.h / 4, 82.5);
      g.addColorStop(0, 'rgba(4,8,6,0)'); g.addColorStop(0.55, 'rgba(4,8,6,0.55)'); g.addColorStop(1, 'rgba(4,8,6,0.93)');
      c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      this.textures.addCanvas('darkmask', cv);
    }
    this.dark = this.add.image(0, 0, 'darkmask').setScale(4).setDepth(8500).setVisible(false);
    const rays = this.add.image(0, 0, 'rays').setOrigin(0).setScale(INV).setDepth(9001).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: rays, alpha: { from: 0.65, to: 1 }, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.teleG = this.add.graphics().setDepth(1);
    this.lootG = this.add.graphics().setDepth(3);
    this.fxG = this.add.graphics().setDepth(8000);
    this.hudG = this.add.graphics().setDepth(10000);
    this.altar = this.add.image((ARENA.x0 + ARENA.x1) / 2, (ARENA.y0 + ARENA.y1) / 2 - 40, 'altar').setOrigin(0.5, 0.925).setScale(INV).setVisible(false);
    this.altar.setDepth(this.altar.y);
    this.heroSheet = ensureHero(this, this.world.stats.weapon);
    this.heroShadow = this.add.image(0, 0, 'shadow').setScale(INV * 0.95).setDepth(2);
    this.hero = this.makeSprite(this.heroSheet, 'idle0');
    if (this.world.pet) {
      const id = this.world.pet.id, s = this.sheet(id, 'capivara');
      this.petShadow = this.add.image(0, 0, 'shadow').setScale(INV * 0.8).setDepth(2);
      this.pet = this.makeSprite(s, s.key === 'arara' ? 'fly0' : 'idle0');
    } else { this.pet = null; this.petShadow = null; }
    this.veil = this.add.rectangle(0, 0, VIEW.w, VIEW.h, 0xb01818, 1).setOrigin(0).setDepth(9500).setAlpha(0);
    this.fade = this.add.rectangle(0, 0, VIEW.w, VIEW.h, 0x060c08, 1).setOrigin(0).setDepth(9600).setAlpha(1);
    this.tweens.add({ targets: this.fade, alpha: 0, duration: 350 });

    this.buildHud();
    this.bindInput();
    music.play(this.training ? 'acampamento' : trackFor(this.stage));
    this.handleEvents();
    (window as unknown as { __enc?: StageScene }).__enc = this;
  }

  /* ---------- entrada ---------- */

  private bindInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    // ao sair da fase, devolve essas teclas para os menus
    this.events.once('shutdown', () => { kb.removeCapture('SPACE,UP,DOWN,LEFT,RIGHT'); kb.removeAllListeners(); this.input.removeAllListeners(); });
    kb.on('keydown', () => unlockAudio());
    kb.on('keydown-SPACE', () => { this.latch.dodge = true; });
    kb.on('keydown-SHIFT', () => { this.latch.dodge = true; });
    (['Q', 'E', 'R'] as const).forEach((k, i) => kb.on('keydown-' + k, () => { this.latch.spell[i] = true; }));
    kb.on('keydown-F', () => { this.latch.pet = true; });
    kb.on('keydown-T', () => { this.latch.supremo = true; });
    kb.on('keydown-C', () => { this.latch.potion = true; });
    (['ONE', 'TWO', 'THREE', 'FOUR'] as const).forEach((k, i) => kb.on('keydown-' + k, () => { if (this.world.phase === 'altar' || this.world.offer) this.pickBlessing(i); else if (i === 0) this.latch.potion = true; }));
    kb.on('keydown-M', () => { sfx.muted = !sfx.muted; music.muted = sfx.muted; });
    kb.on('keydown-V', () => { if (this.auto && !this.ended) { this.auto.speed = this.auto.speed >= AUTO_SPEEDS[AUTO_SPEEDS.length - 1] ? AUTO_SPEEDS[0] : this.auto.speed + 1; session.autoSpeed = this.auto.speed; sfx.play('tele'); } });
    kb.on('keydown-Z', () => { if (this.training) { this.meter = newMeter(); sfx.play('tele'); } });
    kb.on('keydown-ESC', () => { if (!this.ended) this.setPaused(!this.paused); });
    kb.on('keydown-X', () => { if (this.paused) { this.setPaused(false); this.finish(false, 0); } });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      unlockAudio();
      if (!p.rightButtonDown() && !this.auto) this.latch.attack = true;
    });
  }

  private readInput(): Input {
    const k = this.keys, p = this.input.activePointer, l = this.latch;
    const inp: Input = {
      mx: (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0),
      my: (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0),
      aimX: p.worldX, aimY: p.worldY,
      attackPressed: l.attack, attackHeld: p.leftButtonDown(), altHeld: p.rightButtonDown(),
      dodgePressed: l.dodge, spell: [l.spell[0], l.spell[1], l.spell[2]], petPressed: l.pet, potionPressed: l.potion, supremoPressed: l.supremo,
    };
    l.attack = l.dodge = l.pet = l.potion = l.supremo = false; l.spell = [false, false, false];
    return inp;
  }

  private setPaused(v: boolean): void {
    this.paused = v;
    music.duck(v);
    if (v) this.banner('PAUSADO', this.training ? 'Esc continua  ·  X volta ao acampamento' : this.dream ? 'Esc continua  ·  X acorda (a noite acaba aqui)' : this.auto ? 'Esc continua  ·  X encerra a caçada' : 'Esc continua  ·  X abandona a fase', '#f1ebd8');
    else { this.txtBanner.setVisible(false); this.txtSub.setVisible(false); }
    /* pausado, o título sobe para a lista das sinergias caber embaixo dele */
    const list = v ? this.synergyText() : '';
    this.txtBanner.setY(v && list ? 150 : VIEW.h / 2 - 50);
    if (v && list) this.txtSub.setY(232);
    this.txtPause.setVisible(v).setText(list);
    this.pauseVeil.setVisible(v);
  }

  /** Para a tela de pausa: as bênçãos de cada padrinho, o que já está aceso e o que falta para a próxima faixa. */
  private synergyText(): string {
    const s = this.world.stats, lines: string[] = [];
    for (const el of ELEMENT_ORDER) {
      const n = s.patrons[el] ?? 0, t = s.patronTiers[el] ?? 0;
      if (n <= 0) continue;
      const on = PATRON_TIERS[el].slice(0, t).join('  ·  '), next = t < 3;
      lines.push(`${PATRONS[el].name} (${n}):  ${on || 'nenhuma faixa acesa'}${next ? `\n      com ${PATRON_STEPS[t]} bênçãos: ${PATRON_TIERS[el][t]}` : ''}`);
    }
    return lines.length ? `BÊNÇÃOS POR PADRINHO\n${lines.join('\n')}` : '';
  }

  /* ---------- laço ---------- */

  update(_time: number, deltaMs: number): void {
    const real = Math.min(0.05, deltaMs / 1000);
    this.clock += real;
    if (!this.paused) {
      if (this.hitstop > 0) this.hitstop -= real;
      else {
        this.slow = Math.max(0, this.slow - real);
        const speed = this.auto ? this.auto.speed : 1;
        this.acc += real * (this.slow > 0 && speed === 1 ? 0.35 : 1) * speed;
        let guard = 0;
        while (this.acc >= TICK && guard++ < 12) {
          this.acc -= TICK;
          const inp = quantize(this.auto ? this.autoInput(TICK / speed) : this.readInput());
          this.rec.input(inp);
          step(this.world, inp, TICK);
          this.handleEvents();
          /* acelerada, a caçada não para a cada golpe */
          if (speed > 1) this.hitstop = 0;
          if (this.hitstop > 0) break;
        }
        if (guard > 12) this.acc = 0;
      }
    }
    if (this.training) this.tickMeter(real);
    this.flushGold(real);
    this.syncHero(real);
    this.syncPet();
    this.syncEnemies();
    this.syncShots();
    this.syncExtras();
    this.drawGround();
    this.drawFx(this.paused ? 0 : real);
    this.drawHud();
  }

  /** Comandos do jogador automático. Altar e oferenda esperam um instante, para dar para ver a escolha. */
  private autoInput(real: number): Input {
    const w = this.world, opts = w.phase === 'altar' ? w.altar : w.offer;
    this.readInput();
    if (opts && opts.length) {
      this.autoPickT += real;
      if (this.autoPickT >= 0.75) {
        /* a mais rara; em empate, a primeira */
        let best = 0;
        opts.forEach((id, i) => { if (BLESSINGS[id].tier > BLESSINGS[opts[best]].tier) best = i; });
        this.autoPickT = 0;
        this.pickBlessing(best);
      }
      return { mx: 0, my: 0, aimX: w.player.x + 100, aimY: w.player.y, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false, spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false };
    }
    this.autoPickT = 0;
    return this.bot!(w);
  }

  private finish(won: boolean, delay: number): void {
    if (this.ended) return;
    this.ended = true;
    const w = this.world;
    this.time.delayedCall(delay, () => {
      this.tweens.add({
        targets: this.fade, alpha: 1, duration: 300,
        onComplete: () => session.onStageEnd({
          stageId: this.stage.id, won, time: w.time, deaths: w.deaths, roomsCleared: w.roomsCleared, kills: w.kills, perfects: w.perfects, hitsTaken: w.hitsTaken, blessings: w.blessings.slice(), tally: this.tally, foundGold: w.loot.gold, chests: w.loot.chests,
          omens: omenWeight(this.omens),
          left: { hpFrac: Math.max(0, w.player.hp) / w.stats.maxHp, potions: w.player.potions, supremo: w.player.supremo, revives: w.revives, altarDry: w.altarDry }, trial: w.challenge?.state ?? null,
          replay: this.auto ? undefined : this.rec.finish(), hero: this.challenge ?? undefined,
        }),
      });
    });
  }

  /* ---------- eventos da simulação ---------- */

  private handleEvents(): void {
    const ev = this.world.events;
    for (const e of ev) { countEvent(this.tally, e); if (this.training) this.meterEvent(e); this.onEvent(e); }
    ev.length = 0;
  }

  private onEvent(e: SimEvent): void {
    const w = this.world, p = w.player;
    switch (e.type) {
      case 'swing': {
        const third = e.value === 2;
        this.fx.push({ kind: 'arc', x: e.x + Math.cos(e.ang!) * 30, y: e.y - 34 + Math.sin(e.ang!) * 30, t: 0, dur: third ? 0.2 : 0.15, ang: e.ang, r0: third ? 78 : 64, width: third ? 16 : 11, n: e.value === 1 ? -1 : 1 });
        sfx.play('swing');
        break;
      }
      case 'shoot': sfx.play(e.value ? 'cast' : 'swing'); break;
      case 'hit': {
        const soft = e.kind === 'poison' || e.kind === 'reflect' || e.kind === 'blast', pet = e.kind === 'pet';
        /* afinidade: o número sai maior e na cor do elemento quando acerta a fraqueza, e menor e cinza quando o monstro resiste */
        /* golpe enorme (várias vezes o golpe de arma do herói): número maior e em brasa */
        const huge = (e.value ?? 0) >= this.hugeHit;
        const aff = e.aff ?? 0, affColor = aff > 0 ? (e.el ? ELEMENTS[e.el as ElementId].color : '#9dffb0') : '#8f949c';
        this.number(e.x, e.y - 70, String(e.value) + (e.crit ? '!' : ''), aff ? affColor : huge ? '#ff8a3c' : e.kind === 'poison' ? '#8fe36a' : e.armored ? '#c9c4bd' : e.crit ? '#ffd23f' : pet ? '#ffd9a0' : '#ffffff', (soft ? 20 : pet ? 22 : e.crit ? 38 : 28) * (aff > 0 ? 1.2 : aff < 0 ? 0.8 : 1) * (huge ? 1.5 : 1), huge ? 1.2 : 0.8);
        if (huge && !soft) { this.cameras.main.shake(110, 0.007); this.fx.push({ kind: 'ring', x: e.x, y: e.y - 30, t: 0, dur: 0.3, r0: 12, r1: 90, color: 0xff7a2a, width: 7 }); }
        if (aff && e.id != null) {
          const key = e.id * 2 + (aff > 0 ? 1 : 0), last = this.affSaid.get(key) ?? -9;
          if (this.clock - last > 1.1) { this.affSaid.set(key, this.clock); this.number(e.x, e.y - 104, aff > 0 ? 'FRACO!' : 'RESISTE', affColor, aff > 0 ? 24 : 19, 0.9); }
        }
        if (!soft) {
          this.fx.push({ kind: 'spark', x: e.x, y: e.y - 34, t: 0, dur: 0.18, color: e.armored ? 0xc9c4bd : 0xfff3c4, n: e.crit ? 9 : 6, seed: e.id! * 7 + w.tick });
          if (e.kind === 'melee' || e.kind === 'arrow') { this.hitstop = Math.max(this.hitstop, e.crit ? 0.08 : e.kind === 'melee' ? 0.045 : 0.02); this.cameras.main.shake(70, e.crit ? 0.006 : 0.003); }
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
        this.number(e.x, e.y - 100, '-' + e.value, '#ff6b5a', e.kind === 'soft' ? 22 : 32);
        if (e.kind !== 'soft') {
          this.cameras.main.shake(160, 0.011);
          this.hitstop = Math.max(this.hitstop, 0.08);
          this.veil.setAlpha(0.3);
          this.tweens.add({ targets: this.veil, alpha: 0, duration: 320 });
          sfx.play('hurt');
        }
        break;
      case 'death':
        sfx.play('death');
        this.banner('VOCÊ CAIU', w.revives > 0 ? (this.dream ? 'O Muiraquitã te levanta: a sala recomeça' : 'A sala recomeça com metade da vida') : this.dream ? 'Você vai acordar' : 'Fim da fase', '#ff6b5a');
        break;
      case 'revive':
        this.txtBanner.setVisible(false); this.txtSub.setVisible(false);
        this.number(p.x, p.y - 130, 'SEGUNDA CHANCE', '#ffd23f', 34, 1.4);
        sfx.play('wave');
        break;
      case 'lose': music.sting('derrota'); this.finish(false, 500); break;
      case 'win':
        /* altar do Sonho: escolher a bênção já encerra, sem festa */
        if (this.dream && this.stage.rooms[w.room]?.type === 'altar') { this.finish(true, 450); break; }
        this.banner(this.winTitle(), this.auto && this.auto.index < this.auto.total ? `Tempo ${this.fmt(w.time)}  ·  a próxima já começa` : `Tempo ${this.fmt(w.time)}`, '#ffb238');
        sfx.play('win');
        music.sting('vitoria');
        this.finish(true, this.auto ? Math.max(500, 1500 / this.auto.speed) : this.dream ? 1300 : 1900);
        break;
      case 'roomStart': this.onRoomStart(e.value!); break;
      case 'roomClear':
        this.number(VIEW.w / 2, 230, 'Sala limpa', '#ffb238', 46, 1.2);
        sfx.play('wave');
        break;
      case 'altar': sfx.play('perfect'); break;
      case 'blessing':
        if (e.text) this.clearCards();
        this.number(p.x, p.y - 140, BLESSINGS[e.kind as BlessingId].name, BLESSING_TIER_COLOR[BLESSINGS[e.kind as BlessingId].tier], 32, 1.5);
        this.fx.push({ kind: 'ring', x: p.x, y: p.y - 40, t: 0, dur: 0.5, r0: 20, r1: 130, color: 0x9be7c0, width: 7 });
        sfx.play('perfect');
        if (BLESSINGS[e.kind as BlessingId].tier === 4) {
          /* Despertar e Compadrio: a tela pisca e sobem anéis dourados */
          this.cameras.main.flash(220, 255, 226, 150);
          this.number(VIEW.w / 2, 200, BLESSINGS[e.kind as BlessingId].kind === 'desperta' ? 'DESPERTAR!' : 'COMPADRIO!', '#ffe27a', 60, 2);
          this.hitstop = Math.max(this.hitstop, 0.12);
          for (let i = 0; i < 3; i++) this.fx.push({ kind: 'ring', x: p.x, y: p.y - 40, t: -i * 0.14, dur: 0.6, r0: 24, r1: 190, color: 0xffd23f, width: 9 });
        }
        this.announceSynergy();
        break;
      case 'dodge':
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 4, t: 0, dur: 0.3, color: 0xcdbf9a, n: 5, seed: w.tick });
        sfx.play('dodge');
        break;
      case 'perfect':
        this.number(p.x, p.y - 150, 'ESQUIVA PERFEITA', '#8fe3ff', 30);
        this.fx.push({ kind: 'ring', x: p.x, y: p.y - 40, t: 0, dur: 0.4, r0: 20, r1: 110, color: 0x8fe3ff, width: 6 });
        this.slow = 0.28;
        sfx.play('perfect');
        break;
      case 'parry':
        this.number(p.x, p.y - 150, 'APAROU', '#ffd23f', 32);
        this.fx.push({ kind: 'spark', x: p.x + p.facing * 26, y: p.y - 50, t: 0, dur: 0.25, color: 0xffe9a8, n: 10, seed: w.tick });
        this.hitstop = Math.max(this.hitstop, 0.1); this.slow = 0.2;
        sfx.play('crit');
        break;
      case 'block': sfx.play('armor'); break;
      case 'jabuti': this.number(p.x, p.y - 150, 'CASCA DE JABUTI', '#ffd23f', 30, 1.4); sfx.play('perfect'); break;
      case 'stack': break;
      case 'cast': {
        const water = e.kind === 'jato' || e.kind === 'onda' || e.kind === 'bolha' || e.kind === 'correnteza' || e.kind === 'chuva';
        const col = e.kind === 'casca' ? 0xc9a26b : water ? WATER : 0x7bd45a;
        this.fx.push({ kind: 'ring', x: e.x + Math.cos(e.ang!) * 26, y: e.y - 44, t: 0, dur: 0.22, r0: 6, r1: e.kind === 'casca' ? 70 : 36, color: col, width: 5 });
        sfx.play('cast');
        break;
      }
      case 'sementes':
        this.fx.push({ kind: 'roots', x: e.x, y: e.y, t: 0, dur: 0.6, r0: e.value!, color: 0x4f9448 });
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.3, r0: e.value! * 0.4, r1: e.value!, color: 0x9be36a, width: 6 });
        sfx.play('splat');
        break;
      case 'cipo':
        this.fx.push({ kind: 'line', x: e.x, y: e.y - 40, x2: e.x2, y2: e.y2! - 30, t: 0, dur: 0.3, color: 0x4f9448, width: 6 });
        this.number(e.x2!, e.y2! - 90, 'PRESO', '#9be36a', 24);
        break;
      case 'heal': this.number(e.x, e.y - 110, '+' + e.value, '#7be08a', 22); break;
      case 'potion': this.number(e.x, e.y - 120, '+' + e.value, '#7be08a', 30); sfx.play('perfect'); break;
      case 'taunt':
        this.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, t: 0, dur: 0.5, r0: 30, r1: 300, color: 0xffd23f, width: 6 });
        this.number(e.x, e.y - 80, 'AQUI!', '#ffd23f', 28);
        sfx.play('wave');
        break;
      case 'pet':
        if (e.kind === 'bote') sfx.play('dodge');
        else if (e.kind === 'bicada') this.fx.push({ kind: 'line', x: e.x, y: e.y - 60, x2: e.x2, y2: e.y2! - 30, t: 0, dur: 0.16, color: 0xffd23f, width: 4 });
        else if (e.kind === 'volta') this.number(e.x, e.y - 70, 'De volta!', '#ffd9a0', 22);
        break;
      case 'petHurt': this.number(e.x, e.y - 60, '-' + e.value, '#ffb0a0', 20); break;
      case 'petDown': this.number(e.x, e.y - 70, w.stats.petFastRevive ? 'Caiu: volta em 8 s' : 'Caiu: volta na próxima sala', '#ffb0a0', 22, 1.4); break;
      case 'spawn': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 20, t: 0, dur: 0.6, color: 0x2a2a34, n: 10, seed: e.id! * 3 }); break;
      case 'wave':
        if (e.kind === 'onda') { this.number(VIEW.w / 2, 210, 'ONDA! Ache a passagem', '#8fe3ff', 36, 1.2); sfx.play('tele'); }
        else if (Number(e.kind) > 1) this.number(VIEW.w / 2, 210, `Onda ${e.value! + 1} de ${e.kind}`, '#ffb238', 40, 1.1);
        break;
      case 'telegraph': sfx.play('tele'); break;
      case 'bite': this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.18, r0: 14, r1: ENEMY.sauva.biteRadius, color: 0xffe2d0, width: 4 }); break;
      case 'charge': sfx.play('dodge'); break;
      case 'crash':
        this.cameras.main.shake(160, 0.009);
        this.fx.push({ kind: 'spark', x: e.x, y: e.y - 30, t: 0, dur: 0.3, color: 0xfff6d2, n: 10, seed: w.tick });
        this.number(e.x, e.y - 120, e.text ?? 'TONTA', '#ffd23f', 30);
        sfx.play('crash');
        break;
      case 'reveal': this.number(e.x, e.y - 90, '!', '#ffd23f', 40); sfx.play('tele'); break;
      case 'spit': sfx.play('spit'); break;
      case 'splat':
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.3, r0: 12, r1: e.value!, color: 0xaac86e, width: 5 });
        sfx.play('splat');
        break;
      case 'explode':
        this.cameras.main.shake(180, 0.01);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.4, r0: 20, r1: e.value! * 1.2, color: 0xc8e86a, width: 9 });
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 10, t: 0, dur: 0.6, color: 0xa8c86a, n: 12, seed: w.tick });
        sfx.play('slam');
        break;
      case 'slam':
        this.cameras.main.shake(260, 0.016);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.5, r0: e.value! * 0.6, r1: e.value! * 1.5, color: 0xfff0cd, width: 8 });
        this.fx.push({ kind: 'spikes', x: e.x, y: e.y, t: 0, dur: 0.5, r0: e.value! });
        sfx.play('slam');
        break;
      case 'hazard':
        if (e.kind === 'roots') { this.fx.push({ kind: 'roots', x: e.x, y: e.y, x2: e.x2, y2: e.y2, t: 0, dur: 0.6, r0: e.value!, color: 0x5a4a3a }); this.cameras.main.shake(120, 0.006); sfx.play('slam'); }
        else if (e.kind === 'lane') sfx.play('dodge');
        else if (e.kind === 'jet') { this.fx.push({ kind: 'line', x: e.x, y: e.y, x2: e.x2, y2: e.y2, t: 0, dur: 0.28, color: 0xbfeaff, width: e.value! * 0.8 }); sfx.play('splat'); }
        else if (e.kind === 'dive') { this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.45, r0: 20, r1: e.value! * 1.2, color: 0xbfeaff, width: 10 }); this.fx.push({ kind: 'puff', x: e.x, y: e.y - 20, t: 0, dur: 0.5, color: 0xbfeaff, n: 12, seed: w.tick }); this.cameras.main.shake(160, 0.01); sfx.play('slam'); }
        else { this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.4, r0: 20, r1: e.value! * 1.15, color: 0xffb070, width: 8 }); this.cameras.main.shake(140, 0.008); sfx.play('slam'); }
        break;
      case 'cloneBurst': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 40, t: 0, dur: 0.5, color: 0x9aa39a, n: 12, seed: w.tick }); sfx.play('kill'); break;
      case 'vanish': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 50, t: 0, dur: 0.5, color: 0xffb060, n: 12, seed: w.tick }); sfx.play('dodge'); break;
      case 'appear': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 50, t: 0, dur: 0.4, color: 0xffb060, n: 10, seed: w.tick + 3 }); break;
      case 'footprints': this.fx.push({ kind: 'prints', x: e.x, y: e.y, x2: e.x2, y2: e.y2, t: 0, dur: 2.2 }); break;
      case 'whistle': this.number(e.x, e.y - 190, 'ASSOBIO', '#ffb060', 30); sfx.play('perfect'); break;
      case 'downed': this.number(e.x, e.y - 190, 'POSTURA QUEBRADA', '#ffd23f', 36, 1.4); this.cameras.main.shake(200, 0.012); this.slow = 0.3; sfx.play('crit'); break;
      case 'phase':
        this.number(VIEW.w / 2, 250, this.stage.chapter === 2 ? (e.value === 1 ? 'O rio sobe' : 'A cheia') : e.value === 1 ? 'A mata acorda' : 'Ele monta', '#ffb060', 54, 1.6);
        this.cameras.main.shake(400, 0.012); sfx.play('slam');
        break;
      case 'shrink': break;
      case 'enrage': this.number(e.x, e.y - 190, 'FÚRIA', '#ff6b5a', 44, 1.6); sfx.play('slam'); break;
      case 'call': this.number(e.x, e.y - 170, 'CHAMADO', '#ffb060', 30); sfx.play('perfect'); break;
      case 'supremo': {
        const el = e.kind as keyof typeof SUPREMOS, col = el === 'agua' ? WATER : 0x7bd45a;
        this.banner(SUPREMOS[el].name.toUpperCase() + '!', '', el === 'agua' ? '#8fe3ff' : '#9be36a');
        this.time.delayedCall(900, () => { if (!this.ended && !this.paused && this.world.phase === 'fight') { this.txtBanner.setVisible(false); this.txtSub.setVisible(false); } });
        for (let i = 0; i < 4; i++) this.fx.push({ kind: 'ring', x: VIEW.w / 2, y: (ARENA.y0 + ARENA.y1) / 2, t: -i * 0.1, dur: 0.7, r0: 40, r1: 720, color: col, width: 14 });
        this.cameras.main.shake(420, 0.014); this.cameras.main.flash(260, 255, 255, 255); this.slow = 0.5;
        sfx.play('win');
        break;
      }
      case 'brotar':
        this.fx.push({ kind: 'roots', x: e.x, y: e.y, t: 0, dur: 0.6, r0: e.value!, color: 0x4f9448 });
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.35, r0: 10, r1: e.value!, color: 0x9be36a, width: 8 });
        this.number(e.x, e.y - 110, 'BROTOU!', '#9be36a', 28);
        sfx.play('splat');
        break;
      case 'nova': this.fx.push({ kind: 'ring', x: e.x, y: e.y - 30, t: 0, dur: 0.3, r0: 10, r1: 90, color: 0x9be36a, width: 5 }); sfx.play('cast'); break;
      case 'shield': this.number(e.x, e.y - 150, 'AMPARO', '#ffe9a8', 30); this.fx.push({ kind: 'ring', x: e.x, y: e.y - 40, t: 0, dur: 0.4, r0: 30, r1: 100, color: 0xffe9a8, width: 7 }); sfx.play('armor'); break;
      case 'mark': this.number(e.x, e.y - 110, 'MARCADO', '#ffd23f', 26); sfx.play('perfect'); break;
      case 'bubble': this.number(e.x, e.y - 100, 'PRESO', '#8fe3ff', 24); break;
      case 'splash': this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.3, r0: 12, r1: e.value!, color: 0xbfeaff, width: 5 }); sfx.play('splat'); break;
      case 'dive': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 10, t: 0, dur: 0.5, color: 0xbfeaff, n: 12, seed: w.tick }); this.number(e.x, e.y - 150, 'MERGULHO', '#8fe3ff', 28); sfx.play('dodge'); break;
      case 'sing': this.number(e.x, e.y - 200, 'O CANTO: corra para longe!', '#ffb0e0', 30, 1.6); sfx.play('perfect'); break;
      case 'onda': this.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, t: 0, dur: 0.3, r0: 30, r1: e.value!, color: WATER, width: 12 }); sfx.play('splat'); break;
      case 'correnteza': this.fx.push({ kind: 'line', x: e.x, y: e.y - 30, x2: e.x + Math.cos(e.ang!) * 250, y2: e.y - 30 + Math.sin(e.ang!) * 250, t: 0, dur: 0.35, color: WATER, width: 26 }); sfx.play('dodge'); break;
      case 'pop': this.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, t: 0, dur: 0.3, r0: 14, r1: e.value!, color: 0xffb070, width: 8 }); sfx.play('splat'); break;
      case 'freecast': this.number(e.x, e.y - 150, e.kind === 'eco' ? 'ECO' : 'FLUXO', '#8fe3ff', 22); break;
      case 'shellBreak': {
        this.number(e.x, e.y - 140, 'CASCA QUEBRADA!', '#fff3c4', 32, 1.3);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y - 30, t: 0, dur: 0.45, r0: 20, r1: 130, color: COLOR(e.el as ElementId | undefined), width: 10 });
        this.hitstop = Math.max(this.hitstop, 0.09); this.cameras.main.shake(160, 0.008); sfx.play('crit');
        break;
      }
      case 'shellBack': {
        this.number(e.x, e.y - 120, 'A CASCA VOLTOU', '#c9c4bd', 22, 1.1);
        break;
      }
      case 'reaction': {
        const r = REACTIONS.find((x) => x.id === e.kind);
        if (r) this.number(e.x, e.y - 130, r.name.toUpperCase() + '!', '#ffe9a8', 30, 1.1);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y - 30, t: 0, dur: 0.4, r0: 16, r1: 110, color: 0xffe9a8, width: 8 });
        this.cameras.main.shake(120, 0.006); sfx.play('crit');
        break;
      }
      case 'spark': case 'zap':
        if (e.x2 != null) this.fx.push({ kind: 'line', x: e.x, y: e.y - 40, x2: e.x2, y2: (e.y2 ?? e.y) - 30, t: 0, dur: 0.18, color: 0xfff09a, width: 5 });
        else this.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, t: 0, dur: 0.3, r0: 10, r1: e.value ?? 60, color: 0xfff09a, width: 7 });
        sfx.play('hit');
        break;
      case 'blink':
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 30, t: 0, dur: 0.4, color: COLOR(e.kind as ElementId), n: 10, seed: w.tick });
        this.fx.push({ kind: 'puff', x: e.x2 ?? e.x, y: (e.y2 ?? e.y) - 30, t: 0, dur: 0.4, color: COLOR(e.kind as ElementId), n: 10, seed: w.tick + 5 });
        sfx.play('dodge');
        break;
      case 'erase': this.number(p.x, p.y - 150, `${SPELLS[w.spells[e.value ?? 0] ?? 'dardo'].name} apagado`, '#e9e4d8', 26, 1.4); sfx.play('armor'); break;
      case 'restore': this.number(p.x, p.y - 150, 'Feitiço de volta!', '#9be7c0', 28, 1.2); sfx.play('perfect'); break;
      case 'steal': this.number(p.x, p.y - 150, `O Saci roubou ${SPELLS[w.spells[e.value ?? 0] ?? 'dardo'].name}! Bata nele`, '#ff6b5a', 26, 1.8); sfx.play('armor'); break;
      case 'dream': this.banner('SONHO', 'Os feitiços trocaram de tecla', '#ff9ae6'); this.time.delayedCall(1300, () => { if (!this.ended && !this.paused) { this.txtBanner.setVisible(false); this.txtSub.setVisible(false); } }); sfx.play('perfect'); break;
      case 'help': {
        const name = SUPREMOS[e.kind as ElementId]?.name ?? '';
        this.number(VIEW.w / 2, 260, `${name} veio ajudar!`, '#ffd23f', 40, 1.8);
        sfx.play('win');
        break;
      }
      case 'grab': this.number(e.x, e.y - 130, 'AGARRADO', '#ff6b5a', 28); this.cameras.main.shake(140, 0.008); sfx.play('hurt'); break;
      case 'ignite': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 10, t: 0, dur: 0.4, color: 0xff8a2a, n: 6, seed: w.tick }); break;
      case 'moon': if ((e.value ?? 0) >= 0.5) this.number(VIEW.w - 140, 120, (e.value ?? 0) >= 1 ? 'LUA CHEIA' : 'A lua cresce', '#c8a8ff', 26, 1.2); break;
      case 'transform': this.number(e.x, e.y - 200, 'A LUA ENCHEU', '#c8a8ff', 40, 1.6); this.cameras.main.shake(400, 0.012); sfx.play('slam'); break;
      case 'petAct': this.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, t: 0, dur: 0.4, r0: 20, r1: 160, color: 0xffd9a0, width: 6 }); if (e.kind === 'afanou') this.number(e.x, e.y - 90, 'AFANOU!', '#ffd23f', 26); sfx.play('perfect'); break;
      case 'heavy': this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.35, r0: 20, r1: e.value ?? 130, color: 0xfff0cd, width: 10 }); this.fx.push({ kind: 'spikes', x: e.x, y: e.y, t: 0, dur: 0.4, r0: (e.value ?? 130) * 0.7 }); this.cameras.main.shake(200, 0.012); sfx.play('slam'); break;
      case 'thrust': this.fx.push({ kind: 'line', x: e.x, y: e.y - 40, x2: e.x2, y2: (e.y2 ?? e.y) - 40, t: 0, dur: 0.2, color: 0xffffff, width: 12 }); this.cameras.main.shake(100, 0.005); sfx.play('swing'); break;
      case 'devil': this.fx.push({ kind: 'puff', x: e.x, y: e.y - 20, t: 0, dur: 0.5, color: 0xd9b98a, n: 10, seed: w.tick }); sfx.play('dodge'); break;
      case 'roar': this.fx.push({ kind: 'ring', x: e.x, y: e.y - 40, t: 0, dur: 0.5, r0: 30, r1: 260, color: e.kind === 'uivo' ? 0xb98cff : 0xfff0cd, width: 9 }); this.cameras.main.shake(260, 0.01); sfx.play('slam'); break;
      case 'miss': this.number(p.x, p.y - 140, w.player.stolen === e.value ? 'ROUBADO' : 'APAGADO', '#c9c4bd', 22, 0.6); break;
      case 'chest': case 'chestOpen': case 'offer': case 'pickup': case 'buff': case 'buffEnd': case 'guard': case 'pot': case 'wisp': case 'challenge':
        this.onLootEvent(e);
        break;
      case 'status': if (e.kind === 'dormindo') this.number(e.x, e.y - 130, 'Zz', '#c8d4ff', 30); else if (e.kind === 'erro') this.number(e.x, e.y - 60, 'errou', '#c9c4bd', 18, 0.5); break;
    }
  }

  private winTitle(): string {
    if (isTowerId(this.stage.id)) return 'ANDARES VENCIDOS';
    if (this.dream) return this.stage.final === 'chefao' ? 'CHEFE VENCIDO' : 'SALA VENCIDA';
    if (this.stage.number !== 12) return 'FASE VENCIDA';
    if (this.stage.chapter === 8) return 'O ESQUECIMENTO SE DESFEZ';
    const name = CHAPTERS[this.stage.chapter - 1]?.encantado ?? '';
    const art = ['Iara', 'Cuca'].includes(name) ? 'A' : 'O';
    return `${art} ${name.toUpperCase()} LEMBROU`;
  }

  private onRoomStart(index: number): void {
    const room = this.stage.rooms[index];
    const art = room.artChapter ?? this.stage.chapter, tower = isTowerId(this.stage.id);
    const key = this.training ? 'mata_bg9' : tower ? `torre_bg${room.bg}` : art >= 3 ? `ch${art}_bg${room.bg}` : art === 2 ? `rio_bg${room.bg}` : `mata_bg${room.bg}`;
    this.bg.setTexture(this.textures.exists(key) ? key : 'bg0');
    this.dark.setVisible(!!room.dark).setAlpha(room.type === 'boss' ? 0.55 : 0.9);
    this.altar.setVisible(room.type === 'altar');
    music.setBoss(room.type === 'boss');
    for (const [, v] of this.views) { v.spr.destroy(); v.shadow.destroy(); v.label?.destroy(); }
    this.views.clear();
    this.clearCards();
    if (index > 0) { this.fade.setAlpha(1); this.tweens.add({ targets: this.fade, alpha: 0, duration: 320 }); }
    if (room.type === 'altar') this.showCards(this.world.altar ?? [], 'Escolha uma bênção');
    if (room.type === 'boss') this.number(VIEW.w / 2, 230, ENEMY_NAMES[room.waves[0][0].kind], '#ffb238', 64, 2);
    else if (room.type === 'elite') this.number(VIEW.w / 2, 230, 'Elite', '#ffb238', 54, 1.6);
  }

  /* ---------- achados: baús, moedas, potes, Mãe-do-Ouro, desafio ---------- */

  private buffName(b: { id: BuffId; el?: ElementId }): string {
    return b.id === 'elemento' && b.el ? `Golpe de ${ELEMENTS[b.el].name}` : BUFFS[b.id].name;
  }

  private onLootEvent(e: SimEvent): void {
    const w = this.world, p = w.player;
    const tierCol = (k?: string) => Phaser.Display.Color.HexStringToColor(CHESTS[(k ?? 'madeira') as ChestTier].color).color;
    switch (e.type) {
      case 'chest':
        this.number(e.x, e.y - 90, CHESTS[e.kind as ChestTier].name, CHESTS[e.kind as ChestTier].color, 24, 1.1);
        this.time.delayedCall(480, () => { if (!this.ended) { this.fx.push({ kind: 'puff', x: e.x, y: e.y, t: 0, dur: 0.35, color: 0xcdbf9a, n: 6, seed: e.id! }); sfx.play('splat'); } });
        break;
      case 'chestOpen': {
        const col = tierCol(e.kind);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y - 26, t: 0, dur: 0.45, r0: 14, r1: 110, color: col, width: 8 });
        this.fx.push({ kind: 'spark', x: e.x, y: e.y - 34, t: 0, dur: 0.35, color: 0xfff0b0, n: 10, seed: e.id! });
        if (e.text === 'auto') { this.number(e.x, e.y - 80, `+${Math.round(e.value ?? 0)} de ouro`, '#f2c14e', 26, 1.2); sfx.play('coin'); break; }
        sfx.play('chest');
        if (e.text === 'cura') this.number(e.x, e.y - 100, 'Fruta do mato: vida!', '#7be08a', 28, 1.3);
        else if (e.text === 'oferenda') this.number(e.x, e.y - 100, 'OFERENDA!', '#c99cff', 32, 1.2);
        break;
      }
      case 'offer':
        this.showCards(w.offer ?? [], 'Oferenda do baú: escolha uma bênção');
        break;
      case 'pickup':
        if (e.kind === 'moeda') {
          this.goldAcc += e.value ?? 0;
          if (this.coinSfxT <= 0) { sfx.play('coin'); this.coinSfxT = 0.06; }
        } else {
          this.number(p.x, p.y - 112, '+' + e.value, e.kind === 'vida' ? '#7be08a' : '#8fd0ff', 24);
          this.fx.push({ kind: 'ring', x: p.x, y: p.y - 40, t: 0, dur: 0.3, r0: 10, r1: 60, color: e.kind === 'vida' ? 0x7be08a : 0x5cb8ff, width: 5 });
          sfx.play('orb');
        }
        break;
      case 'buff': {
        const b = BUFFS[e.kind as BuffId], col = Phaser.Display.Color.HexStringToColor(b.color).color;
        const cx = Phaser.Math.Clamp(p.x, 290, VIEW.w - 290);
        this.number(cx, p.y - 150, this.buffName({ id: e.kind as BuffId, el: e.text as ElementId | undefined }).toUpperCase(), b.color, 32, 1.6);
        this.number(cx, p.y - 118, `${b.desc} · ${b.duration} s`, '#f1ebd8', 19, 1.8);
        for (let i = 0; i < 2; i++) this.fx.push({ kind: 'ring', x: p.x, y: p.y - 40, t: -i * 0.12, dur: 0.5, r0: 20, r1: 120, color: col, width: 7 });
        sfx.play('buff');
        break;
      }
      case 'buffEnd': this.number(p.x, p.y - 130, `${BUFFS[e.kind as BuffId].name} acabou`, '#c9c4bd', 18, 1); break;
      case 'guard':
        this.number(e.x, e.y - 100, e.kind === 'quebrou' ? 'CARAPAÇA QUEBROU' : `−${e.value} na carapaça`, '#e3c68a', e.kind === 'quebrou' ? 26 : 20);
        sfx.play('armor');
        break;
      case 'pot':
        this.fx.push({ kind: 'puff', x: e.x, y: e.y - 20, t: 0, dur: 0.45, color: 0xb8693a, n: 9, seed: e.id! });
        this.fx.push({ kind: 'spikes', x: e.x, y: e.y + 4, t: 0, dur: 0.3, r0: 26, color: 0xa85a30 });
        sfx.play('pot');
        break;
      case 'wisp':
        if (e.kind === 'appear') { this.number(VIEW.w / 2, 160, 'MÃE-DO-OURO! Acerte antes que ela fuja', '#ffd23f', 34, 2); sfx.play('perfect'); }
        else if (e.kind === 'hit') { this.fx.push({ kind: 'spark', x: e.x, y: e.y, t: 0, dur: 0.25, color: 0xffd23f, n: 8, seed: w.tick }); this.number(e.x, e.y - 50, String(e.value), '#ffd23f', 28, 0.6); sfx.play('coin'); }
        else if (e.kind === 'caught') {
          this.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.5, r0: 20, r1: 160, color: 0xffd23f, width: 10 });
          this.fx.push({ kind: 'puff', x: e.x, y: e.y, t: 0, dur: 0.6, color: 0xffc93f, n: 12, seed: w.tick });
          this.number(e.x, e.y - 60, 'PEGOU A MÃE-DO-OURO!', '#ffd23f', 34, 1.6);
          this.cameras.main.flash(160, 255, 220, 120); sfx.play('chest');
        } else { this.fx.push({ kind: 'puff', x: e.x, y: e.y, t: 0, dur: 0.5, color: 0xffc93f, n: 10, seed: w.tick }); this.number(e.x, e.y - 40, 'A Mãe-do-Ouro fugiu', '#c9c4bd', 24, 1.2); }
        break;
      case 'challenge':
        if (e.kind === 'start') {
          const what = e.text === 'ligeiro' ? `Vença a sala em até ${e.value} s` : `Vença a sala tomando no máximo ${e.value} golpes`;
          this.number(VIEW.w / 2, 290, 'DESAFIO DO TOTEM', '#ffd23f', 40, 2.2);
          this.number(VIEW.w / 2, 334, `${what}: baú dourado`, '#f1ebd8', 26, 2.4);
          sfx.play('tele');
        } else if (e.kind === 'won') { this.number(VIEW.w / 2, 230, 'DESAFIO VENCIDO!', '#ffd23f', 44, 1.6); sfx.play('win'); }
        else { this.number(e.x, e.y - 60, 'Desafio perdido', '#c9c4bd', 26, 1.4); sfx.play('armor'); }
        break;
    }
  }

  /** Ouro das moedas: um número só a cada instante, sobre o herói. */
  private flushGold(real: number): void {
    this.coinSfxT -= real;
    if (this.goldAcc <= 0) return;
    this.goldAccT += real;
    if (this.goldAccT < 0.22) return;
    const p = this.world.player, v = Math.round(this.goldAcc);
    if (v > 0) this.number(p.x + 26, p.y - 96, `+${v}`, '#f2c14e', 22, 0.7);
    this.goldAcc -= v; this.goldAccT = 0;
    if (this.goldAcc < 0.5) this.goldAcc = 0;
  }

  private syncLoot(seen: Set<string>): void {
    const w = this.world, g = this.lootG, t = this.clock, p = w.player;
    g.clear();
    /* potes */
    for (const pt of w.pots) this.extra('pt' + pt.id, 'pote', seen)?.setOrigin(0.5, 0.94).setPosition(pt.x, pt.y).setDepth(pt.y);
    /* totem do desafio */
    const ch = w.challenge;
    if (ch) {
      const img = this.extra('totem', 'totem', seen);
      img?.setOrigin(0.5, 0.96).setPosition(ch.x, ch.y).setDepth(ch.y);
      if (ch.state === 'ativo') { img?.clearTint().setAlpha(1); g.fillStyle(0xffd23f, 0.16 + 0.08 * Math.sin(t * 4)).fillEllipse(ch.x, ch.y, 90, 26); }
      else if (ch.state === 'vencido') img?.setTint(0xffe9a0).setAlpha(1);
      else img?.setTint(0x7a7a7a).setAlpha(0.75);
    }
    /* baús: saltam de onde o monstro caiu, brilham no chão e abrem */
    for (const c of w.chests) {
      const k = Math.min(1, c.t / 0.5), x = c.sx + (c.x - c.sx) * k, y = c.sy + (c.y - c.sy) * k - Math.sin(k * Math.PI) * 70;
      const col = Phaser.Display.Color.HexStringToColor(CHESTS[c.tier].color).color, opened = c.open >= 0;
      if (!opened && k >= 1) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 4 + c.id);
        g.fillStyle(col, 0.18 + 0.12 * pulse).fillEllipse(c.x, c.y + 2, 84, 26);
        g.lineStyle(3, col, 0.5 + 0.3 * pulse).strokeEllipse(c.x, c.y + 2, 70 + 10 * pulse, 20 + 3 * pulse);
        if (c.tier === 'dourado' || c.tier === 'encantado') { g.fillStyle(col, 0.1 + 0.06 * pulse).fillRect(c.x - 14, c.y - 150, 28, 150); g.fillStyle(col, 0.12).fillRect(c.x - 6, c.y - 170, 12, 170); }
      }
      const img = this.extra('c' + c.id, `bau_${c.tier}${opened ? '_aberto' : ''}`, seen);
      if (!img) continue;
      const squash = k < 1 ? 1 : opened ? 1 + 0.12 * Math.max(0, 1 - c.open * 5) : 1 + 0.03 * Math.sin(t * 5 + c.id);
      img.setOrigin(0.5, 0.92).setPosition(x, y).setDepth(c.y).setScale(INV * 1.2 * (2 - squash), INV * 1.2 * squash).setAlpha(opened ? Math.max(0, Math.min(1, (1.6 - c.open) / 0.5)) : 1);
    }
    /* moedas e orbes */
    for (const kp of w.pickups) {
      const hop = kp.t < 0.45 ? Math.sin((kp.t / 0.45) * Math.PI) * 30 : 0;
      g.fillStyle(0x0a0f0a, 0.3).fillEllipse(kp.x, kp.y + 6, 14, 5);
      if (kp.kind === 'moeda') {
        const spin = Math.max(0.2, Math.abs(Math.cos(t * 9 + kp.id)));
        this.extra('k' + kp.id, 'moeda', seen)?.setOrigin(0.5).setPosition(kp.x, kp.y - 6 - hop).setDepth(kp.y + 1).setScale(INV * 1.3 * spin, INV * 1.3);
      } else {
        const bob = Math.sin(t * 5 + kp.id) * 3;
        this.extra('k' + kp.id, kp.kind === 'vida' ? 'orbe_vida' : 'orbe_mana', seen)?.setOrigin(0.5).setPosition(kp.x, kp.y - 12 - hop + bob).setDepth(kp.y + 1).setScale(INV * 1.3 * (1 + 0.08 * Math.sin(t * 8)));
      }
    }
    /* Mãe-do-Ouro: chama que foge; o anel mostra quanto tempo falta */
    const m = w.wisp;
    if (m) {
      const y = m.y - 40 + Math.sin(t * 6) * 5, left = 1 - m.t / m.dur;
      g.fillStyle(0xffb030, 0.25).fillEllipse(m.x, m.y + 4, 46, 14);
      const img = this.extra('wisp', 'maedoouro' + (Math.floor(t * 12) % 4), seen);
      if (img) { img.setOrigin(0.5).setPosition(m.x, y).setDepth(m.y + 40).setScale(INV * (m.vx < 0 ? -1 : 1), INV); if (m.flash > 0) img.setTintFill(0xffffff); else img.clearTint(); }
      g.lineStyle(4, 0x22100a, 0.6).beginPath().arc(m.x, y, 40, -Math.PI / 2, Math.PI * 1.5).strokePath();
      g.lineStyle(3, left < 0.3 ? 0xff6b5a : 0xffd23f, 0.9).beginPath().arc(m.x, y, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left).strokePath();
      for (let i = 0; i < m.need; i++) g.fillStyle(i < m.hits ? 0xffd23f : 0x3a2a14, 1).fillCircle(m.x - (m.need - 1) * 7 + i * 14, y - 50, 4.5);
    }
    /* efeitos ativos no herói */
    const guard = w.buffs.find((b) => b.id === 'jabuti');
    if (guard && guard.value > 0) this.fxG.lineStyle(4, 0xc9a26b, 0.55 + 0.2 * Math.sin(t * 6)).strokeEllipse(p.x, p.y - 40, 70, 100);
    const last = w.buffs[w.buffs.length - 1];
    if (last) g.lineStyle(3, Phaser.Display.Color.HexStringToColor(BUFFS[last.id].color).color, 0.55 + 0.25 * Math.sin(t * 7)).strokeEllipse(p.x, p.y + 2, 60, 20);
  }

  /** Efeitos de baú ativos: ícone, anel do tempo que falta e os segundos. */
  private drawBuffs(g: Phaser.GameObjects.Graphics): void {
    const w = this.world, key = w.buffs.map((b) => b.id + (b.el ?? '')).join(',');
    const pos = (i: number) => ({ x: 44 + i * 52, y: VIEW.h - 166 });
    if (key !== this.buffShown) {
      this.buffShown = key;
      for (const o of this.buffIcons) o.destroy();
      this.buffIcons = [];
      w.buffs.forEach((b: Buff, i) => {
        const { x, y } = pos(i);
        this.buffIcons.push(this.add.image(x, y, 'buff_' + b.id).setScale(INV * 0.9).setDepth(10002));
        this.buffIcons.push(this.label(x, y + 18, 14).setOrigin(0.5, 0).setDepth(10003));
      });
    }
    w.buffs.forEach((b, i) => {
      const { x, y } = pos(i), col = Phaser.Display.Color.HexStringToColor(BUFFS[b.id].color).color, left = Math.max(0, 1 - b.t / b.dur);
      g.fillStyle(0x0a0f0a, 0.85).fillCircle(x, y, 22);
      g.lineStyle(4, col, 0.95).beginPath().arc(x, y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left).strokePath();
      const txt = this.buffIcons[i * 2 + 1] as Phaser.GameObjects.Text | undefined;
      txt?.setText(b.id === 'jabuti' ? `${Math.ceil(b.value)}` : `${Math.ceil(b.dur - b.t)}s`).setColor(left < 0.25 ? '#ff9a8a' : '#ffffff');
    });
  }

  /* ---------- altar ---------- */

  private showCards(opts: BlessingId[], title: string): void {
    const have = blessingCounts(this.world.blessings);
    const cw = CARD.w, ch = CARD.h, gap = opts.length > 3 ? 4 : 14;
    const style = (size: number, color: string, stroke = 5) => ({ fontFamily: FONT, fontStyle: '900', fontSize: size + 'px', color, stroke: INK, strokeThickness: stroke, align: 'center' });
    /* selo do padrinho: o ícone do elemento numa bolinha */
    const seal = (el: ElementId, x: number, y: number): Phaser.GameObjects.GameObject[] => [
      this.add.circle(x, y, 17, 0x1c0f0a, 1), this.add.circle(x, y, 15, 0x3a2416, 1).setStrokeStyle(2, COLOR(el)),
      ...(this.textures.exists('ui_' + el) ? [this.add.image(x, y, 'ui_' + el).setScale(INV * 0.4)] : []),
    ];
    opts.forEach((id, i) => {
      const b = BLESSINGS[id], x = VIEW.w / 2 + (i - (opts.length - 1) / 2) * (cw + gap), y = 448, top = -ch / 2;
      const duo = b.pair ? [ELEMENTS[b.pair[0]].color, ELEMENTS[b.pair[1]].color] : null;
      const color = duo ? '#ffe9a8' : TIER_COLORS[b.tier - 1] ?? BLESSING_TIER_COLOR[b.tier];
      /* a faixa diz a raridade e de quem é: "RARA · SACI", "DESPERTAR · FÚRIA", "COMPADRIO" */
      const band = b.kind === 'desperta' ? `DESPERTAR · ${BLESSINGS[b.awakens!].name}` : b.kind === 'compadrio' ? `COMPADRIO · ${PATRONS[b.pair![0]].name} e ${PATRONS[b.pair![1]].name}`
        : b.patron ? `${BLESSING_TIER_LABEL[b.tier]} · ${PATRONS[b.patron].name}` : BLESSING_TIER_LABEL[b.tier];
      const back = this.add.image(0, 0, duo ? duoCardTexture(this, duo[0], duo[1]) : `hud_card${b.tier}`).setScale(HUD_SCALE);
      const tier = this.add.text(0, top + 23, band.toUpperCase(), { fontFamily: FONT, fontStyle: '900', fontSize: band.length > 24 ? '14px' : '17px', color: INK }).setOrigin(0.5).setResolution(2);
      const key = this.add.text(-cw / 2 + 24, top + 44, String(i + 1), style(28, '#f1ebd8', 6)).setResolution(2);
      const parts: Phaser.GameObjects.GameObject[] = [back, tier, key];
      if (this.textures.exists('ui_' + b.icon)) parts.push(this.add.image(0, top + 92, 'ui_' + b.icon).setScale(INV * 0.92));
      if (b.pair) parts.push(...seal(b.pair[0], -44, top + 118), ...seal(b.pair[1], 44, top + 118));
      else if (b.patron) parts.push(...seal(b.patron, 36, top + 120));
      parts.push(this.add.text(0, top + 140, b.name, style(b.name.length > 18 ? 23 : 27, color)).setOrigin(0.5, 0).setResolution(2));
      parts.push(this.add.text(0, top + 176, b.desc, { fontFamily: FONT, fontSize: b.desc.length > 70 ? '17px' : '19px', color: '#f6ead0', align: 'center', wordWrap: { width: cw - 50 }, lineSpacing: -2 }).setOrigin(0.5, 0).setResolution(2));
      const n = have[id] ?? 0;
      if (b.max > 1 && b.max < 9) {
        /* pontinhos: quantas vezes já foi escolhida e quantas cabem */
        const g = this.add.graphics(), dots = b.max, dx = 12, x0 = cw / 2 - 26 - (dots - 1) * dx;
        for (let k = 0; k < dots; k++) { g.fillStyle(0x1c0f0a, 1).fillCircle(x0 + k * dx, top + 58, 5.5); g.fillStyle(k < n ? Phaser.Display.Color.HexStringToColor(color).color : 0x4a3220, 1).fillCircle(x0 + k * dx, top + 58, 3.8); }
        parts.push(g);
      }
      const card = this.add.container(x, y + 34, parts).setDepth(10004).setSize(cw - 16, ch - 20).setInteractive({ useHandCursor: true }).setAlpha(0);
      this.tweens.add({ targets: card, y, alpha: 1, duration: 280, delay: i * 70, ease: 'Back.easeOut' });
      card.on('pointerover', () => { this.tweens.add({ targets: card, scale: 1.05, y: y - 8, duration: 110, ease: 'Quad.easeOut' }); });
      card.on('pointerout', () => { this.tweens.add({ targets: card, scale: 1, y, duration: 110, ease: 'Quad.easeOut' }); });
      card.on('pointerdown', () => this.pickBlessing(i));
      this.cards.push(card);
    });
    const special = opts.some((id) => BLESSINGS[id].kind === 'desperta') ? 'Uma bênção despertou: escolha uma das duas formas, ou outra bênção' : opts.some((id) => BLESSINGS[id].kind === 'compadrio') ? 'Dois padrinhos se juntaram: há um Compadrio no altar' : title;
    this.txtSub.setText(special).setPosition(VIEW.w / 2, 286).setVisible(true).setAlpha(1);
  }

  /** Uma faixa de sinergia acabou de acender: avisa no meio da tela qual é e o que ela dá. */
  private announceSynergy(): void {
    const tiers = this.world.stats.patronTiers;
    let row = 0;
    for (const el of ELEMENT_ORDER) {
      const now = tiers[el] ?? 0, was = this.synTiers[el] ?? 0;
      if (now > was) {
        /* se duas acendem juntas, a segunda sai mais embaixo */
        const y = 176 + row++ * 78;
        this.number(VIEW.w / 2, y, `SINERGIA ${PATRONS[el].of.toUpperCase()} · ${PATRON_STEPS[now - 1]}`, ELEMENTS[el].color, 38, 2.6);
        this.number(VIEW.w / 2, y + 38, PATRON_TIERS[el][now - 1], '#f6ead0', 22, 2.8);
        sfx.play('win');
      }
      this.synTiers[el] = now;
    }
  }

  private clearCards(): void {
    for (const c of this.cards) c.destroy();
    this.cards = [];
    this.txtSub.setVisible(false).setPosition(VIEW.w / 2, VIEW.h / 2 + 50);
  }

  private pickBlessing(i: number): void {
    const profile = this.heroProfile, amulets = this.amulets, boost = this.boost, restat = (b: BlessingId[]) => deriveStats(profile, b, amulets, boost);
    const kind = this.world.offer ? 'o' : 'a';
    if (kind === 'o' ? chooseOffer(this.world, i, restat) : chooseBlessing(this.world, i, restat)) { this.rec.pick(kind, i); this.latch.attack = false; this.clearCards(); this.handleEvents(); }
  }

  /* ---------- sprites ---------- */

  /** Folha de sprites pelo nome; se a arte ainda não existe, usa a reserva. */
  private sheet(key: string, fallback: string): Sheet {
    return SH[key] && this.textures.exists(key) ? SH[key] : SH[fallback];
  }

  private makeSprite(s: Sheet, frame: string): Phaser.GameObjects.Sprite {
    return this.add.sprite(0, 0, s.key, frame).setOrigin(s.ox / s.cellW, s.oy / s.cellH).setScale(INV);
  }

  private syncHero(real: number): void {
    const w = this.world, p = w.player, h = this.hero, A = this.heroSheet.anims, bow = w.stats.weapon === 'arco';
    let frame: string, sy = 1, rot = 0;
    if (p.state === 'attack') {
      const combo = comboOf(w.stats.weapon), a = combo[Math.min(p.combo, combo.length - 1)];
      frame = 'atk' + Math.min(A.atk - 1, Math.floor((p.stateT / (a.total * 0.8)) * A.atk));
    } else if (p.state === 'charge') frame = 'atk' + Math.min(A.atk - 2, Math.round(p.charge * (A.atk - 2) * 0.6));
    else if (bow && p.shotCd > 0.1 && p.state === 'idle') frame = 'atk' + Math.min(A.atk - 1, Math.max(0, A.atk - 1 - Math.floor(p.shotCd * 10)));
    else if (p.state === 'dodge') {
      frame = 'walk' + (Math.floor(this.clock * 30) % A.walk);
      sy = 0.86; rot = p.dx * 0.3;
      this.ghostT -= real;
      if (this.ghostT <= 0) { this.ghostT = 0.045; this.ghost(); }
    } else if (p.moving) frame = 'walk' + (Math.floor((p.walk / (Math.PI * 2)) * A.walk) % A.walk);
    else frame = 'idle' + (Math.floor((this.clock / 2.618) * A.idle) % A.idle);
    h.setFrame(frame).setPosition(p.x, p.y).setDepth(p.y).setScale(INV * p.facing, INV * sy).setRotation(rot);
    this.heroShadow.setPosition(p.x + 4, p.y + 2);
    if (p.state === 'dead') { h.setRotation(-1.4 * p.facing).setAlpha(0.8).setTint(0x8a8a8a); return; }
    h.setAlpha(p.hurtInv > 0 && p.state !== 'dodge' ? (Math.floor(this.clock * 20) % 2 ? 0.45 : 1) : 1);
    if (p.state === 'hurt') h.setTintFill(0xffffff);
    else if (p.perfectT > 0 || p.contraT > 0) h.setTint(Math.floor(this.clock * 10) % 2 ? 0xbff0ff : 0xffffff);
    else if (p.cascaT > 0) h.setTint(0xd9b98a);
    else if (p.slowT > 0) h.setTint(0x9ab08a);
    else h.clearTint();
  }

  private ghost(): void {
    const h = this.hero;
    const g = this.add.sprite(h.x, h.y, this.heroSheet.key, h.frame.name).setOrigin(h.originX, h.originY).setScale(h.scaleX, h.scaleY).setRotation(h.rotation).setDepth(h.depth - 1).setAlpha(0.45).setTint(0x9fe8ff);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  private syncPet(): void {
    const pet = this.world.pet, spr = this.pet;
    if (!pet || !spr) return;
    const A = this.sheet(pet.id, 'capivara').anims as Record<string, number>;
    let frame: string;
    if (A.fly) frame = 'fly' + (Math.floor(this.clock * 14) % A.fly);
    else if (pet.state === 'pounce' && A.pounce) frame = 'pounce' + Math.min(A.pounce - 1, Math.floor((pet.stateT / 0.28) * A.pounce));
    else if (pet.moving) frame = 'walk' + (Math.floor((pet.walk / (Math.PI * 2)) * A.walk) % A.walk);
    else frame = 'idle' + (Math.floor(this.clock * 3) % A.idle);
    const down = pet.state === 'down';
    spr.setFrame(frame).setPosition(pet.x, pet.y - (pet.state === 'pounce' ? Math.sin(Math.min(1, pet.stateT / 0.28) * Math.PI) * 40 : 0)).setDepth(pet.y + (A.fly ? 60 : 0))
      .setScale(INV * pet.facing, INV * (down ? 0.6 : 1)).setAlpha(down ? 0.45 : 1);
    if (pet.flash > 0) spr.setTintFill(0xffffff); else if (pet.tauntT > 0) spr.setTint(Math.floor(this.clock * 8) % 2 ? 0xffe9a8 : 0xffffff); else spr.clearTint();
    this.petShadow!.setPosition(pet.x + 4, pet.y + 2).setAlpha(down ? 0.4 : 1);
  }

  /** Folha de sprites, quadro e ajustes de exibição para um inimigo neste instante. */
  private pose(e: Enemy): { sheet: Sheet; frame: string; sx: number; sy: number; ox: number; oy: number; alpha: number; rot: number; lift: number } {
    const t = this.clock, cyc = (n: number, phase: number) => Math.floor((((phase / (Math.PI * 2)) % 1) + 1) % 1 * n) % n;
    const jit = Math.floor(t * 40) % 2 ? 1.5 : -1.5;
    let sheet: Sheet = SHEETS.sauva, frame = 'walk0', sx = 1, sy = 1, ox = 0, oy = 0, alpha = 1, rot = 0, lift = 0;
    if (isMonster(e.kind) || isBossKind(e.kind)) return this.poseNew(e, jit);
    if (e.kind === 'boneco') {
      /* balança com a pancada e para aos poucos */
      const k = Math.exp(-e.sinceHit * 4.5), wob = Math.sin(e.sinceHit * 26) * k;
      return { sheet: SHEETS.boneco, frame: e.elite ? 'elite0' : e.mods.includes('blindado') ? 'armor0' : 'idle0', sx: 1 + 0.05 * k, sy: 1 - 0.07 * k, ox: 0, oy: 0, alpha: 1, rot: wob * 0.16, lift: 0 };
    }
    if (e.kind === 'sauva') {
      frame = 'walk' + cyc(SHEETS.sauva.anims.walk, e.walk);
      if (e.state === 'windup' && e.tele) { const k = e.stateT / e.tele.dur; sx = sy = 1 + 0.16 * k; ox = jit * k; }
    } else if (e.kind === 'queixada') {
      sheet = SHEETS.queixada; const n = sheet.anims.run;
      if (e.state === 'charge' || e.moving) frame = 'run' + cyc(n, e.walk);
      else if (e.state === 'aim') { frame = 'run' + (Math.floor(t * 14) % n); ox = jit; }
      else frame = 'idle' + (Math.floor(t * 4) % sheet.anims.idle);
      if (e.state === 'stunned') sy = 0.94;
    } else if (e.kind === 'tronco') {
      sheet = SHEETS.tronco; const n = sheet.anims.raise;
      const raise = e.state === 'windup' && e.tele ? Math.min(1, e.stateT / (e.tele.dur * 0.8)) : e.state === 'exposed' ? Math.max(0, 1 - e.stateT / 0.12) : 0;
      frame = 'raise' + Math.min(n - 1, Math.round(raise * (n - 1)));
      oy = e.moving ? Math.abs(Math.sin(e.walk * 0.5)) * -5 : 0;
      if (e.state === 'exposed') sy = 0.95;
    } else if (e.kind === 'cuspidor') {
      sheet = SHEETS.cuspidor; const n = sheet.anims.open;
      const open = e.state === 'spit' ? Math.sin(Math.min(1, e.stateT / 0.5) * Math.PI) : 0.2 + 0.12 * Math.sin(t * 3 + e.id);
      frame = 'open' + Math.min(n - 1, Math.round(open * (n - 1)));
      sx = sy = 1 + 0.03 * Math.sin(t * 2 + e.id);
    } else if (e.kind === 'urutau') {
      sheet = SHEETS.urutau;
      if (e.state === 'perched' || e.state === 'spawn') frame = 'perch0';
      else if (e.state === 'reveal') frame = 'perch' + Math.min(sheet.anims.perch - 1, 1 + Math.floor((e.stateT / ENEMY.urutau.revealTime) * 2));
      else { frame = 'fly' + (Math.floor(t * 16 + e.id) % sheet.anims.fly); lift = 34 + Math.sin(t * 5 + e.id) * 5; if (e.state === 'aim') ox = jit; }
    } else if (e.kind === 'cogumelo') {
      sheet = SHEETS.cogumelo;
      if (e.state === 'fuse' && e.tele) { frame = 'swell' + Math.min(sheet.anims.swell - 1, Math.floor((e.stateT / e.tele.dur) * sheet.anims.swell)); ox = jit; }
      else frame = 'walk' + cyc(sheet.anims.walk, e.walk);
    } else if (e.kind === 'caipora') {
      sheet = SHEETS.caipora; const n = sheet.anims.run;
      if (e.state === 'charge' || e.moving) frame = 'run' + cyc(n, e.walk);
      else if (e.state === 'aim') { frame = 'run' + (Math.floor(t * 14) % n); ox = jit; }
      else if (e.state === 'call') frame = 'raise1';
      else frame = 'idle' + (Math.floor(t * 4) % sheet.anims.idle);
      if (e.state === 'tired') sy = 0.93;
    } else if (e.kind !== 'curupira') {
      const k = e.kind, has = !!SH[k] && this.textures.exists(k);
      sheet = has ? SH[k] : k === 'jacare' ? SHEETS.queixada : k === 'boto' || k === 'iara' ? SHEETS.caipora : SHEETS.sauva;
      const A = sheet.anims as Record<string, number>, ramp = (name: string, v: number) => name + Math.min(A[name] - 1, Math.max(0, Math.floor(v * A[name])));
      if (!has) { const n0 = Object.keys(A)[0]; frame = n0 + (Math.floor(t * 8 + e.id) % A[n0]); if (e.hidden) alpha = 0.25; }
      else if (k === 'piranha') {
        if (e.state === 'leap') { frame = 'leap' + (A.leap - 1); lift = 16; rot = -0.2; }
        else if (e.state === 'windup' && e.tele) { frame = ramp('leap', (e.stateT / e.tele.dur) * 0.6); ox = jit; }
        else frame = 'swim' + (Math.floor(t * 12 + e.id) % A.swim);
      } else if (k === 'sapo') {
        if (e.state === 'hop') { const q = Math.min(1, e.stateT / ENEMY.sapo.hopTime); frame = ramp('hop', Math.sin(q * Math.PI)); lift = Math.sin(q * Math.PI) * 46; }
        else if (e.state === 'spit') frame = ramp('spit', Math.min(0.99, e.stateT / 0.35));
        else frame = 'idle' + (Math.floor(t * 4 + e.id) % A.idle);
      } else if (k === 'arraia') {
        if (e.state === 'buried' || e.state === 'spawn') { frame = 'reveal0'; alpha = 0.55 + 0.1 * Math.sin(t * 2 + e.id); }
        else if (e.state === 'reveal') frame = ramp('reveal', Math.min(0.99, e.stateT / ENEMY.arraia.revealTime));
        else if (e.state === 'aim' && e.tele) { frame = ramp('sting', Math.min(0.99, e.stateT / e.tele.dur)); ox = jit * 0.6; }
        else frame = 'swim' + (Math.floor(t * 8 + e.id) % A.swim);
      } else if (k === 'caramujo') {
        frame = 'walk' + (Math.floor(t * 5 + e.id) % A.walk);
        if (e.state === 'windup' && e.tele) { const q = e.stateT / e.tele.dur; sx = sy = 1 + 0.14 * q; ox = jit * q; }
      } else if (k === 'jacare') {
        if (e.state === 'windup' && e.tele) { frame = ramp('bite', Math.min(0.7, (e.stateT / e.tele.dur) * 0.7)); ox = jit; }
        else if (e.state === 'charge') frame = 'bite' + (A.bite - 1);
        else if (e.state === 'tail' && e.tele) { frame = ramp('tail', Math.min(0.99, e.stateT / e.tele.dur)); ox = jit; }
        else frame = e.moving ? 'walk' + cyc(A.walk, e.walk) : 'walk0';
      } else if (k === 'boto') {
        if (e.state === 'dive') frame = ramp('dive', Math.min(0.99, e.stateT / ENEMY.boto.mergulho.dive));
        else if (e.hidden) alpha = 0;
        else if (e.state === 'tired') { frame = 'tired' + (Math.floor(t * 3) % A.tired); }
        else if (e.state === 'cast' || e.state === 'call') frame = ramp('cast', Math.min(0.99, e.stateT / 0.4));
        else frame = 'idle' + (Math.floor(t * 7) % A.idle);
      } else {
        if (e.state === 'dive') frame = ramp('dive', Math.min(0.99, e.stateT / ENEMY.iara.mergulho.dive));
        else if (e.hidden) alpha = 0;
        else if (e.state === 'downed') frame = 'down' + (Math.floor(t * 3) % A.down);
        else if (e.state === 'sing') frame = 'sing' + (Math.floor(t * 6) % A.sing);
        else if (e.state === 'cast') frame = ramp('cast', Math.min(0.99, e.stateT / 0.4));
        else frame = 'idle' + (Math.floor(t * 7) % A.idle);
        if (e.state === 'exposed') sy = 0.95;
        if (e.state === 'roar') sx = sy = 1 + 0.08 * Math.sin(t * 30);
      }
      if (has && e.hidden && (k === 'boto' || k === 'iara')) alpha = 0;
    } else {
      const mounted = e.phase === 2 && !e.fake;
      sheet = mounted ? SHEETS.curupira_m : SHEETS.curupira;
      if (mounted) frame = (e.state === 'charge' || e.moving ? 'run' + (Math.floor(t * 14) % sheet.anims.run) : e.state === 'aim' ? 'run' + (Math.floor(t * 12) % sheet.anims.run) : 'idle' + (Math.floor(t * 5) % sheet.anims.idle));
      else if (e.fake) frame = 'fake' + (Math.floor(t * 8 + e.id) % SHEETS.curupira.anims.fake);
      else if (e.state === 'cast' || e.state === 'volley') frame = 'cast' + Math.min(SHEETS.curupira.anims.cast - 1, Math.floor(e.stateT * 4));
      else frame = 'idle' + (Math.floor(t * 8) % SHEETS.curupira.anims.idle);
      if (e.state === 'aim') ox = jit;
      if (e.state === 'vanish') alpha = Math.max(0, 1 - e.stateT / 0.25);
      else if (e.hidden) alpha = 0;
      if (e.state === 'downed') { rot = 1.35; oy = -14; }
      if (e.state === 'roar') sx = sy = 1 + 0.08 * Math.sin(t * 30);
      if (e.fake) alpha = 0.94;
    }
    return { sheet, frame, sx, sy, ox, oy, alpha, rot, lift };
  }

  /** Pose dos monstros e chefes dos capítulos 3 a 8, só pelos nomes padrão das animações (src/art/kit.ts). */
  private poseNew(e: Enemy, jit: number): { sheet: Sheet; frame: string; sx: number; sy: number; ox: number; oy: number; alpha: number; rot: number; lift: number } {
    const t = this.clock, boss = isBossKind(e.kind);
    let key: string = e.kind;
    if (e.kind === 'lobisomem' && e.phase === 0) key = 'lobisomem_h';
    if (e.kind === 'ecos') key = ECHO_SHEETS[Math.min(6, e.phase)];
    const has = !!SH[key] && this.textures.exists(key);
    const sheet = has ? SH[key] : boss ? SHEETS.caipora : SHEETS.sauva;
    const A = sheet.anims as Record<string, number>;
    const cycle = (name: string, speed: number) => { const n = A[name] ? name : Object.keys(A)[0]; return n + (Math.floor(t * speed + e.id * 0.37) % A[n]); };
    const ramp = (name: string, k: number) => { const n = A[name] ? name : A.atk ? 'atk' : Object.keys(A)[0]; return n + Math.min(A[n] - 1, Math.max(0, Math.floor(k * A[n]))); };
    let frame = cycle(A.idle ? 'idle' : 'move', 6), sx = 1, sy = 1, ox = 0, oy = 0, alpha = 1, rot = 0, lift = 0;
    const tk = e.tele ? Math.min(1, e.stateT / Math.max(0.05, e.tele.dur)) : Math.min(1, e.stateT / 0.6);
    const fly = isMonster(e.kind) ? !!MONSTERS[e.kind].fly : false;
    if (!has) {
      frame = cycle(Object.keys(A)[0], 8);
    } else if (!boss) {
      const arch = MONSTERS[e.kind as keyof typeof MONSTERS].arch;
      if (e.state === 'buried' || (e.hidden && A.hide)) { frame = 'hide0'; alpha = arch === 'emboscada' ? 0.45 : 0.25; }
      else if (e.state === 'reveal' && A.hide) frame = ramp('hide', Math.min(0.99, e.stateT / 0.4));
      else if (e.state === 'windup' || e.state === 'aim' || e.state === 'fuse' || e.state === 'cast') { frame = ramp('atk', tk * 0.75); ox = jit * tk * 0.6; if (arch === 'explosivo') sx = sy = 1 + 0.25 * tk; }
      else if (e.state === 'charge' || e.state === 'dash') frame = 'atk' + (A.atk - 1);
      else if (e.state === 'recover' && e.stateT < 0.2) frame = 'atk' + (A.atk - 1);
      else if (e.state === 'stunned' || e.state === 'exposed') { frame = 'move0'; sy = 0.92; }
      else frame = e.moving ? 'move' + (Math.floor((e.walk / (Math.PI * 2)) * A.move) % A.move + A.move) % A.move : cycle('move', 4);
      if (fly) lift = 30 + Math.sin(t * 4 + e.id) * 5;
    } else {
      const physical = ['chute', 'facada', 'colherada', 'patada', 'varrer', 'garras', 'agarrar', 'salto', 'pisar', 'investida', 'brilho'];
      if (e.hidden) alpha = 0;
      if (e.state === 'downed' || e.state === 'exposed' || e.state === 'tired') frame = cycle('down', 3);
      else if (e.state === 'roar') { frame = ramp('cast', 0.99); sx = sy = 1 + 0.06 * Math.sin(t * 30); }
      else if (e.state === 'cast') {
        const pat = e.pattern;
        if (pat === 'redemoinho') frame = cycle(A.special ? 'special' : 'move', 12);
        else if (pat === 'serpente' || pat === 'cruzar' || (pat === 'investida' && e.flag)) frame = cycle(A.special && e.kind === 'mula' ? 'special' : 'move', 14);
        else if (pat === 'rugido') frame = ramp('cast', e.flag ? 0.99 : tk);
        else if (pat === 'enterrar' && A.special && !e.hidden) frame = cycle('special', 8);
        else if (physical.includes(pat)) { frame = ramp('atk', e.flag && pat !== 'garras' ? 0.99 : tk * 0.8); if (!e.flag) ox = jit * tk * 0.5; }
        else frame = ramp('cast', Math.min(0.99, e.stateT / 0.6));
        if (pat === 'salto' && e.flag) lift = Math.sin(Math.min(1, e.stateT / 0.45) * Math.PI) * 60;
      } else if (e.moving) frame = cycle('move', 10);
      if (e.kind === 'ecos') alpha *= 0.78;
    }
    return { sheet, frame, sx, sy, ox, oy, alpha, rot, lift };
  }

  private syncEnemies(): void {
    const w = this.world;
    if (this.views.size > w.enemies.length) {
      const live = new Set(w.enemies.map((e) => e.id));
      for (const [id, v] of this.views) if (!live.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.label?.destroy(); this.views.delete(id); }
    }
    for (const e of w.enemies) {
      const po = this.pose(e);
      let v = this.views.get(e.id);
      if (!v) {
        v = { spr: this.makeSprite(po.sheet, po.frame), shadow: this.add.image(0, 0, 'shadow').setDepth(2), sheet: po.sheet.key };
        if (e.kind === 'boneco') v.label = this.add.text(0, 0, e.elite ? 'Elite' : e.mods.length ? 'Blindado' : 'Comum', { fontFamily: FONT, fontStyle: '900', fontSize: '18px', color: '#f6ead0', stroke: INK, strokeThickness: 5 }).setOrigin(0.5).setResolution(2);
        else if ((e.elite || e.champion) && !isBoss(e) && e.mods.length) v.label = this.add.text(0, 0, e.mods.map((m) => MOD_NAMES[m]).join(' · '), { fontFamily: FONT, fontStyle: '900', fontSize: e.elite ? '20px' : '16px', color: '#c9c4bd', stroke: INK, strokeThickness: 5 }).setOrigin(0.5).setResolution(2);
        this.views.set(e.id, v);
      }
      const spr = v.spr;
      if (e.frogT > 0 && this.textures.exists('sapinho')) {
        if (v.sheet !== 'sapinho') { spr.setTexture('sapinho').setOrigin(0.5, 0.9); v.sheet = 'sapinho'; }
        spr.setPosition(e.x, e.y - Math.abs(Math.sin(this.clock * 6 + e.id)) * 8).setDepth(e.y).setScale(INV * e.facing, INV).setAlpha(1).setRotation(0).clearTint();
        v.shadow.setPosition(e.x + 5, e.y + 2);
        continue;
      }
      if (v.sheet !== po.sheet.key) { spr.setTexture(po.sheet.key, po.frame).setOrigin(po.sheet.ox / po.sheet.cellW, po.sheet.oy / po.sheet.cellH); v.sheet = po.sheet.key; }
      const base = enemyBase(e.kind).radius, big = e.radius / base;
      const spawn = e.state === 'spawn' ? e.stateT / ENEMY.spawnTime : 1, grow = 0.6 + 0.4 * spawn;
      spr.setFrame(po.frame).setPosition(e.x + po.ox, e.y + po.oy - po.lift).setDepth(e.y)
        .setScale(INV * po.sx * e.facing * grow * big, INV * po.sy * grow * big).setAlpha(po.alpha * spawn).setRotation(po.rot * e.facing);
      v.shadow.setPosition(e.x + 5, e.y + 2).setScale(INV * (e.radius / 20)).setAlpha(po.alpha * spawn);
      if (e.flash > 0) spr.setTintFill(0xffffff);
      else if (e.state === 'exposed' || e.state === 'tired' || e.state === 'downed' || e.stunT > 0) spr.setTint(0xffe9a8);
      else if (e.illusion) spr.setTint(Math.floor(this.clock * 6 + e.id) % 2 ? 0xffc8f0 : 0xffffff).setAlpha(spr.alpha * 0.8);
      else if (e.kind === 'ecos') spr.setTint(0xd8d4e8);
      else if (e.sleepT > 0) spr.setTint(0x9aa4c8);
      else if (e.charmT > 0) spr.setTint(0xff9ae6);
      else if (e.burnT > 0) spr.setTint(0xffb27a);
      else if (e.bubbleT > 0) spr.setTint(0x9fe0ff);
      else if (e.rootT > 0 || e.slowT > 0) spr.setTint(0x9fd08a);
      else if (e.poisonT > 0) spr.setTint(0xa6e08a);
      else if (e.wetT > 0) spr.setTint(0xa8d4f0);
      else if (e.curseT > 0) spr.setTint(0xc8a8ff);
      else if (e.chargeT > 0) spr.setTint(Math.floor(this.clock * 12) % 2 ? 0xfff09a : 0xffffff);
      else if (e.crackT > 0) spr.setTint(0xd8b890);
      else if (e.confuseT > 0) spr.setTint(0xffb8e8);
      else if (e.champion) spr.setTint(0xffd0d8);
      else spr.clearTint();
      if (v.label) {
        const open = e.state === 'exposed' || e.state === 'stunned' || e.stunT > 0;
        if (e.kind === 'boneco') v.label.setPosition(e.x, e.y + 22).setDepth(e.y + 1).setAlpha(spawn);
        else v.label.setColor(open ? '#ffd23f' : '#c9c4bd').setPosition(e.x, e.y - po.sheet.oy * 0.8 * big).setDepth(e.y + 1).setAlpha(spawn);
      }
    }
  }

  /** Uma imagem reaproveitada por chave; `seen` guarda quem continua na tela neste quadro. */
  private extra(key: string, tex: string, seen: Set<string>, frame?: string): Phaser.GameObjects.Sprite | null {
    if (!this.textures.exists(tex)) return null;
    seen.add(key);
    let img = this.extras.get(key);
    if (!img) { img = this.add.sprite(0, 0, tex, frame).setScale(INV); this.extras.set(key, img); }
    else if (img.texture.key !== tex) img.setTexture(tex, frame);
    else if (frame) img.setFrame(frame);
    return img;
  }

  private syncExtras(): void {
    const w = this.world, p = w.player, t = this.clock, seen = new Set<string>();
    /* escuridão da Selva: luz só em volta do herói */
    if (this.dark.visible) this.dark.setPosition(p.x, p.y - 30);
    /* capim do Cerrado */
    w.grass.forEach((g, i) => {
      const img = this.extra('g' + i, 'capim', seen);
      img?.setPosition(g.x, g.y).setDepth(0).setTint(g.burnt ? 0x4a3a2a : 0xffffff).setAlpha(g.burnt ? 0.7 : 1);
      if (g.burnT > 0) {
        const s = SH.chama, f = s && this.textures.exists('chama') ? 'move' + (Math.floor(t * 12 + i) % s.anims.move) : undefined;
        const fl = f ? this.extra('gf' + i, 'chama', seen, f) : null;
        if (fl && s) fl.setOrigin(s.ox / s.cellW, s.oy / s.cellH).setPosition(g.x, g.y + 10).setDepth(g.y + 5).setScale(INV * 0.9);
      }
    });
    /* redemoinhos de poeira do Sertão */
    for (const d of w.devils) {
      const s = SH.poeira, f = s ? 'move' + (Math.floor(t * 14 + d.id) % s.anims.move) : undefined;
      const img = s ? this.extra('d' + d.id, 'poeira', seen, f) : null;
      if (img && s) img.setOrigin(s.ox / s.cellW, s.oy / s.cellH).setPosition(d.x, d.y + 20).setDepth(d.y + 20).setScale(INV * 1.1).setAlpha(0.9);
      else this.fxG.fillStyle(0xd9b98a, 0.35).fillCircle(d.x, d.y, d.r);
    }
    /* muralha */
    w.walls.forEach((b, i) => { this.extra('w' + i, 'muralha', seen)?.setOrigin(0.5, 0.85).setPosition(b.x, b.y + 12).setDepth(b.y).setAlpha(Math.min(1, b.t * 2)); });
    /* chamas em órbita */
    if (p.orbT > 0) for (let i = 0; i < 3; i++) { const a = w.time * 3.2 + (i / 3) * Math.PI * 2; this.extra('o' + i, 'orb_fatuo', seen)?.setPosition(p.x + Math.cos(a) * 72, p.y - 30 + Math.sin(a) * 58).setDepth(p.y + Math.sin(a) * 58 + 1); }
    /* aliados */
    for (const a of w.allies) {
      const k = 'a' + a.id;
      if (a.kind === 'cloud') this.extra(k, 'nuvem', seen)?.setPosition(a.x, a.y - 60 + Math.sin(t * 3) * 4).setDepth(9100).setAlpha(0.95);
      else if (a.kind === 'turret') this.extra(k, 'estaca', seen)?.setOrigin(0.5, 0.92).setPosition(a.x, a.y).setDepth(a.y).setScale(INV * a.facing, INV);
      else if (a.kind === 'decoy') {
        const img = this.extra(k, this.heroSheet.key, seen, 'idle' + (Math.floor(t * 4.6) % this.heroSheet.anims.idle));
        img?.setOrigin(this.heroSheet.ox / this.heroSheet.cellW, this.heroSheet.oy / this.heroSheet.cellH).setPosition(a.x, a.y).setDepth(a.y).setScale(INV * a.facing, INV).setAlpha(0.6 + 0.15 * Math.sin(t * 6)).setTint(0xffb8f0);
      } else {
        const s = SH.graxaim && this.textures.exists('graxaim') ? SH.graxaim : SHEETS.onca, A = s.anims as Record<string, number>;
        const f = a.moving && A.walk ? 'walk' + (Math.floor((a.walk / (Math.PI * 2)) * A.walk) % A.walk) : 'idle' + (Math.floor(t * 4) % (A.idle ?? 1));
        this.extra(k, s.key, seen, f)?.setOrigin(s.ox / s.cellW, s.oy / s.cellH).setPosition(a.x, a.y).setDepth(a.y).setScale(INV * a.facing * 1.15, INV * 1.15).setTint(0x7a5ab8).setAlpha(0.9);
      }
    }
    /* corpo do Boitatá e caldeirão da Cuca */
    const boi = w.enemies.find((e) => e.kind === 'boitata');
    const body = boi ? boitataBody(w, boi) : [];
    while (this.segs.length < body.length) this.segs.push(this.add.image(0, 0, this.textures.exists('boitata_seg') ? 'boitata_seg' : 'shadow').setScale(INV));
    this.segs.forEach((img, i) => {
      const sgm = body[i];
      if (!sgm || i === 0) { img.setVisible(false); return; }
      const last = i === body.length - 1;
      if (last && this.textures.exists('boitata_cauda')) img.setTexture('boitata_cauda'); else if (this.textures.exists('boitata_seg')) img.setTexture('boitata_seg');
      img.setVisible(true).setPosition(sgm.x, sgm.y - 24).setRotation(sgm.a + (last ? Math.PI : 0)).setDepth(sgm.y - 1).setScale(INV * (1 - i * 0.025));
    });
    const cuca = w.enemies.find((e) => e.kind === 'cuca' && e.state === 'cast' && (e.pattern === 'pocoes' || e.pattern === 'ninar' || e.pattern === 'sonho'));
    if (cuca) this.extra('caldeirao', 'caldeirao', seen)?.setOrigin(0.5, 0.9).setPosition(cuca.x + cuca.facing * 62, cuca.y + 4).setDepth(cuca.y + 2);
    this.syncLoot(seen);
    for (const [k, img] of this.extras) if (!seen.has(k)) { img.destroy(); this.extras.delete(k); }
  }

  private syncShots(): void {
    const live = new Set<number>(), p = this.world.player;
    for (const pr of this.world.projectiles) {
      live.add(pr.id);
      let img = this.shots.get(pr.id);
      if (pr.kind === 'wall') {
        /* onda da Iara: coluna d'água com uma passagem */
        const a = this.world.arena, g = this.fxG, w2 = pr.t;
        g.fillStyle(0x2f8fc0, 0.55).fillRect(pr.x - w2 / 2, a.y0 - 30, w2, pr.sx - pr.sy - a.y0 + 30).fillRect(pr.x - w2 / 2, pr.sx + pr.sy, w2, a.y1 + 30 - pr.sx - pr.sy);
        g.fillStyle(0xdff6ff, 0.8).fillRect(pr.x + (pr.vx > 0 ? w2 / 2 - 8 : -w2 / 2), a.y0 - 30, 8, pr.sx - pr.sy - a.y0 + 30).fillRect(pr.x + (pr.vx > 0 ? w2 / 2 - 8 : -w2 / 2), pr.sx + pr.sy, 8, a.y1 + 30 - pr.sx - pr.sy);
        g.lineStyle(4, 0xffd23f, 0.9).strokeRect(pr.x - w2 / 2 - 6, pr.sx - pr.sy, w2 + 12, pr.sy * 2);
        continue;
      }
      const want = pr.tex ?? (pr.kind === 'staff' ? 'p_cajado' : pr.kind === 'stampede' ? 'queixada' : pr.kind === 'cipo' ? 'thorn' : pr.kind === 'glob' ? 'spit' : pr.kind);
      const tex = this.textures.exists(want) ? want : pr.kind === 'glob' || pr.kind === 'elob' ? 'seed' : pr.kind === 'sting' || pr.kind === 'eproj' || pr.kind === 'spin' ? 'ethorn' : 'thorn';
      if (!img) {
        img = pr.kind === 'stampede' ? this.makeSprite(SHEETS.queixada, 'run0') : this.add.sprite(0, 0, tex).setScale(INV);
        this.shots.set(pr.id, img);
      }
      const ang = Math.atan2(pr.vy, pr.vx);
      if (pr.kind === 'staff') img.setTint(COLOR(pr.element));
      if (pr.kind === 'spin') { img.setPosition(pr.x, pr.y - 40).setRotation(this.clock * 14).setDepth(pr.y); continue; }
      if (pr.kind === 'seed' || pr.kind === 'glob' || pr.kind === 'elob') {
        const k = Math.min(1, pr.t / pr.dur);
        img.setPosition(pr.x, pr.y - 90 * (1 - k) - Math.sin(k * Math.PI) * 170).setRotation(this.clock * 9).setDepth(pr.y + 400).setScale(INV * (1.2 + Math.sin(k * Math.PI) * 0.7));
      } else if (pr.kind === 'stampede') {
        img.setFrame('run' + (Math.floor(this.clock * 18) % SHEETS.queixada.anims.run)).setPosition(pr.x, pr.y).setDepth(pr.y).setScale(INV * (pr.vx >= 0 ? 1 : -1), INV).setAlpha(0.92);
      } else {
        img.setPosition(pr.x, pr.y - 44).setRotation(ang).setDepth(pr.y).setScale(INV * (pr.charged ? 1.5 : 1));
        if (pr.kind === 'cipo') this.fxG.lineStyle(5, 0x4f9448, 0.9).lineBetween(p.x, p.y - 44, pr.x, pr.y - 44);
        if (pr.charged) img.setTint(0xfff0a8);
      }
    }
    for (const [id, img] of this.shots) if (!live.has(id)) { img.destroy(); this.shots.delete(id); }
  }

  /* ---------- chão: marcas, zonas, saída ---------- */

  private drawGround(): void {
    const g = this.teleG, w = this.world, t = this.clock;
    g.clear();
    this.fxG.clear();
    const tele = (tl: Telegraph, base = 0xd62a1e, fill = 0xf03c28, line = 0xf5462d) => {
      if (tl.t < 0) return;
      const k = Math.min(1, tl.t / tl.dur);
      if (tl.shape === 'circle') {
        g.fillStyle(base, 0.2).fillCircle(tl.x, tl.y, tl.r);
        g.fillStyle(fill, 0.36).fillCircle(tl.x, tl.y, tl.r * k);
        g.lineStyle(3, line, 0.95).strokeCircle(tl.x, tl.y, tl.r);
      } else {
        const dx = tl.x2 - tl.x, dy = tl.y2 - tl.y, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * tl.w * 0.5, ny = (dx / len) * tl.w * 0.5;
        const quad = (f: number) => [
          new Phaser.Math.Vector2(tl.x + nx, tl.y + ny), new Phaser.Math.Vector2(tl.x + dx * f + nx, tl.y + dy * f + ny),
          new Phaser.Math.Vector2(tl.x + dx * f - nx, tl.y + dy * f - ny), new Phaser.Math.Vector2(tl.x - nx, tl.y - ny),
        ];
        g.fillStyle(base, 0.2).fillPoints(quad(1), true);
        g.fillStyle(fill, 0.36).fillPoints(quad(k), true);
        g.lineStyle(3, line, 0.95).strokePoints(quad(1), true);
      }
    };
    /* borda de espinhos quando a arena encolhe */
    const a = w.arena;
    if (a.x0 !== ARENA.x0) {
      g.fillStyle(0x0a0f0a, 0.5);
      g.fillRect(ARENA.x0 - 40, ARENA.y0 - 40, a.x0 - ARENA.x0 + 40, ARENA.y1 - ARENA.y0 + 80).fillRect(a.x1, ARENA.y0 - 40, ARENA.x1 - a.x1 + 40, ARENA.y1 - ARENA.y0 + 80);
      g.fillRect(a.x0, ARENA.y0 - 40, a.x1 - a.x0, a.y0 - ARENA.y0 + 40).fillRect(a.x0, a.y1, a.x1 - a.x0, ARENA.y1 - a.y1 + 40);
      g.fillStyle(0x4a3a2c, 1).lineStyle(2, 0x22100a, 1);
      for (let x = a.x0; x < a.x1; x += 26) { g.fillTriangle(x, a.y0, x + 13, a.y0 - 24, x + 26, a.y0).strokeTriangle(x, a.y0, x + 13, a.y0 - 24, x + 26, a.y0); g.fillTriangle(x, a.y1, x + 13, a.y1 + 24, x + 26, a.y1).strokeTriangle(x, a.y1, x + 13, a.y1 + 24, x + 26, a.y1); }
      for (let y = a.y0; y < a.y1; y += 26) { g.fillTriangle(a.x0, y, a.x0 - 24, y + 13, a.x0, y + 26).strokeTriangle(a.x0, y, a.x0 - 24, y + 13, a.x0, y + 26); g.fillTriangle(a.x1, y, a.x1 + 24, y + 13, a.x1, y + 26).strokeTriangle(a.x1, y, a.x1 + 24, y + 13, a.x1, y + 26); }
    }
    if (w.flooded) g.fillStyle(0x2f8fc0, 0.2 + 0.04 * Math.sin(t * 2)).fillRect(a.x0 - 40, a.y0 - 40, a.x1 - a.x0 + 80, a.y1 - a.y0 + 80);
    for (const q of w.puddles) {
      g.fillStyle(0x2f8fc0, 0.3).fillEllipse(q.x, q.y, q.r * 2, q.r * 1.7);
      g.lineStyle(3, 0xbfeaff, 0.35 + 0.15 * Math.sin(t * 2 + q.x)).strokeEllipse(q.x, q.y, q.r * 2 - 14 - 6 * Math.sin(t * 1.6 + q.y), q.r * 1.7 - 12);
    }
    if (w.current) {
      const dir = Math.sign(w.current);
      for (let i = 0; i < 14; i++) { const y = a.y0 + 20 + ((i * 37) % (a.y1 - a.y0 - 40)), span = a.x1 - a.x0, x = a.x0 + ((((i * 173 + t * Math.abs(w.current) * 2.2 * dir) % span) + span) % span); g.lineStyle(3, 0xdff6ff, 0.28).lineBetween(x, y, x - dir * 46, y); }
    }
    for (const z of w.zones) {
      if (z.kind === 'pop' || z.kind === 'firelane') continue;
      const life = 1 - z.t / z.dur;
      if (z.kind === 'fire') {
        g.fillStyle(0xff6a1a, 0.22 * Math.min(1, life * 3)).fillCircle(z.x, z.y, z.r);
        for (let i = 0; i < 4; i++) { const a = i * 1.7 + t * 2, rr = z.r * 0.5; g.fillStyle(i % 2 ? 0xffb84a : 0xff7a2a, 0.55 * Math.min(1, life * 3)).fillTriangle(z.x + Math.cos(a) * rr - 8, z.y + Math.sin(a) * rr * 0.6, z.x + Math.cos(a) * rr + 8, z.y + Math.sin(a) * rr * 0.6, z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr * 0.6 - 26 - 8 * Math.sin(t * 9 + i)); }
        if (z.hostile) g.lineStyle(2, 0xff4a2a, 0.5).strokeCircle(z.x, z.y, z.r);
        continue;
      }
      if (z.kind === 'curse' || z.kind === 'void') { g.fillStyle(z.kind === 'void' ? 0x101018 : 0x6a3aa8, 0.3 * Math.min(1, life * 3)).fillCircle(z.x, z.y, z.r); g.lineStyle(3, z.kind === 'void' ? 0xffffff : 0xb98cff, 0.5).strokeCircle(z.x, z.y, z.r * (0.6 + 0.4 * Math.sin(t * 4))); continue; }
      if (z.kind === 'redemoinho' || z.kind === 'tornado') {
        g.fillStyle(0xffe08a, 0.12).fillCircle(z.x, z.y, z.r);
        for (let i = 0; i < 3; i++) { g.lineStyle(4, 0xfff0b0, 0.55); g.beginPath(); g.arc(z.x, z.y, z.r * (0.3 + i * 0.3), t * 7 + i * 2, t * 7 + i * 2 + 3.4); g.strokePath(); }
        continue;
      }
      if (z.kind === 'coivara') { g.lineStyle(z.r * 2, 0xff7a2a, 0.3 * Math.min(1, life * 3)).lineBetween(z.x, z.y, z.x2 ?? z.x, z.y2 ?? z.y); g.lineStyle(4, 0xffd27a, 0.6).lineBetween(z.x, z.y, z.x2 ?? z.x, z.y2 ?? z.y); continue; }
      if (z.kind === 'vapor' || z.kind === 'dust') { for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 0.5; g.fillStyle(z.kind === 'vapor' ? 0xe8f4ff : 0xd9c08a, 0.22 * life).fillCircle(z.x + Math.cos(a) * z.r * 0.4, z.y + Math.sin(a) * z.r * 0.3, z.r * 0.55); } continue; }
      if (z.kind === 'trovao' || z.kind === 'explosao' || z.kind === 'borbulhante') {
        const col = z.kind === 'trovao' ? 0xffe066 : z.kind === 'explosao' ? 0xff7a2a : 0xff7ad9, k = Math.min(1, z.t / z.dur);
        g.fillStyle(col, 0.12).fillCircle(z.x, z.y, z.r); g.lineStyle(3, col, 0.7).strokeCircle(z.x, z.y, z.r); g.fillStyle(col, 0.2).fillCircle(z.x, z.y, z.r * k);
        continue;
      }
      if (z.kind === 'chuva') {
        const k = 1 - z.t / z.dur;
        g.fillStyle(WATER, 0.12).fillCircle(z.x, z.y, z.r); g.lineStyle(3, 0xbfeaff, 0.3 + 0.4 * k).strokeCircle(z.x, z.y, z.r);
        for (let i = 0; i < 16; i++) { const an = i * 2.4, d = z.r * (0.15 + ((i * 0.37) % 0.8)), fall = ((t * 2.2 + i * 0.21) % 1); const x = z.x + Math.cos(an) * d, y = z.y + Math.sin(an) * d * 0.8; this.fxG.lineStyle(2.5, 0xdff6ff, 0.7 * (1 - fall)).lineBetween(x + 6, y - 150 + fall * 150, x, y - 130 + fall * 150); }
        continue;
      }
      if (z.kind === 'puddle') { const k = 1 - z.t / z.dur; g.fillStyle(0x6f8fa0, 0.32 * Math.min(1, k * 3)).fillEllipse(z.x, z.y, z.r * 2, z.r * 1.7); g.lineStyle(2, 0xc9d8e0, 0.4 * Math.min(1, k * 3)).strokeEllipse(z.x, z.y, z.r * 2, z.r * 1.7); continue; }
      if (z.kind === 'whirl') {
        if (z.t < 0) { tele({ shape: 'circle', x: z.x, y: z.y, r: z.r, t: z.t + ENEMY.iara.redemoinho.delay, dur: ENEMY.iara.redemoinho.delay }, 0x2f6fc0, 0x3f8fe0, 0x8fe3ff); continue; }
        g.fillStyle(0x1f5f90, 0.45).fillCircle(z.x, z.y, z.r);
        for (let i = 0; i < 3; i++) { g.lineStyle(4, 0xdff6ff, 0.6); g.beginPath(); g.arc(z.x, z.y, z.r * (0.3 + i * 0.28), t * 5 + i * 2, t * 5 + i * 2 + 3.2); g.strokePath(); }
        g.lineStyle(2, 0x8fe3ff, 0.25).strokeCircle(z.x, z.y, z.r * 2.4);
        continue;
      }
      if (z.kind === 'sementes') tele({ shape: 'circle', x: z.x, y: z.y, r: z.r, t: z.t, dur: z.dur }, 0x3f7a40, 0x6fbf5a, 0x9be36a);
      else if (z.kind === 'broto') {
        const k = 1 - z.t / z.dur, pulse = 0.5 + 0.5 * Math.sin(t * 4);
        g.fillStyle(0x6fdc8a, 0.1 + 0.06 * pulse).fillCircle(z.x, z.y, z.r);
        g.lineStyle(3, 0x9be7c0, 0.5 * k + 0.2).strokeCircle(z.x, z.y, z.r);
        g.fillStyle(0x4f9448, 1).fillTriangle(z.x - 7, z.y, z.x + 7, z.y, z.x, z.y - 26 - pulse * 4);
        g.fillStyle(0xb9f0a0, 1).fillCircle(z.x, z.y - 30 - pulse * 4, 6);
      } else {
        const k = 1 - z.t / z.dur;
        for (let i = 0; i < 7; i++) { const an = i * 0.9 + t * 0.6; g.fillStyle(i % 2 ? 0x8aa84a : 0x6f8a3a, 0.2 * k + 0.08).fillCircle(z.x + Math.cos(an) * z.r * 0.45, z.y + Math.sin(an) * z.r * 0.35, z.r * 0.55); }
      }
    }
    for (const e of w.enemies) if (e.tele) tele(e.tele);
    for (const pr of w.projectiles) if (pr.tele) tele(pr.tele);
    for (const h of w.hazards) { if (h.kind === 'jet' || h.kind === 'dive') tele(h.tele, 0x2f6fc0, 0x3f8fe0, 0x8fe3ff); else tele(h.tele); }
    /* concha do caramujo: quem está dentro apanha menos */
    for (const e of w.enemies) if (e.kind === 'caramujo' && e.state !== 'spawn') g.lineStyle(3, 0xff7ab0, 0.3 + 0.15 * Math.sin(t * 4)).strokeCircle(e.x, e.y, ENEMY.caramujo.aura * (e.elite ? 1.3 : 1));
    /* aura de quem chama a atenção e do escudo erguido */
    const pet = w.pet;
    if (pet && pet.tauntT > 0) g.lineStyle(3, 0xffd23f, 0.5 + 0.3 * Math.sin(t * 10)).strokeCircle(pet.x, pet.y, 34);
    /* saída */
    const vis = w.phase === 'cleared';
    this.txtExit.setVisible(vis);
    if (vis) {
      const z = exitZone(w), pulse = 0.5 + 0.5 * Math.sin(t * 5);
      g.fillStyle(0xffb238, 0.14 + 0.1 * pulse).fillRect(z.x, z.y - z.h, 60, z.h * 2);
      for (let i = 0; i < 3; i++) { const x = z.x - 70 + i * 26 + pulse * 10; g.fillStyle(0xffb238, 0.35 + i * 0.2).fillTriangle(x, z.y - 16, x + 18, z.y, x, z.y + 16); }
      this.txtExit.setPosition(z.x - 40, z.y - 56).setAlpha(0.7 + 0.3 * pulse);
    }
  }

  /* ---------- efeitos ---------- */

  private drawFx(dt: number): void {
    const g = this.fxG, w = this.world, p = w.player;
    this.fx = this.fx.filter((f) => (f.t += dt) < f.dur);
    for (const f of this.fx) {
      if (f.t < 0) continue;
      const k = f.t / f.dur, a = 1 - k;
      if (f.kind === 'ring') g.lineStyle(f.width! * a + 1, f.color!, a).strokeCircle(f.x, f.y, f.r0! + (f.r1! - f.r0!) * k);
      else if (f.kind === 'arc') {
        const sweep = 1.25, dir = f.n!, start = f.ang! - sweep * dir, end = start + sweep * 2 * dir * Math.min(1, k * 1.8);
        g.lineStyle(f.width! * a + 2, 0xffffff, a);
        g.beginPath(); g.arc(f.x, f.y, f.r0!, start, end, dir < 0); g.strokePath();
        g.lineStyle(f.width! * 0.4 * a + 1, 0xffe9a8, a * 0.8);
        g.beginPath(); g.arc(f.x, f.y, f.r0! - 9, start, end, dir < 0); g.strokePath();
      } else if (f.kind === 'spark') {
        g.lineStyle(4 * a + 1, f.color!, a);
        for (let i = 0; i < f.n!; i++) { const an = (i / f.n!) * Math.PI * 2 + f.seed!, r0 = 8 + k * 16, r1 = 18 + k * 40; g.lineBetween(f.x + Math.cos(an) * r0, f.y + Math.sin(an) * r0 * 0.8, f.x + Math.cos(an) * r1, f.y + Math.sin(an) * r1 * 0.8); }
      } else if (f.kind === 'puff') {
        for (let i = 0; i < f.n!; i++) { const an = (i / f.n!) * Math.PI * 2 + f.seed! * 1.7, d = 6 + k * (22 + (i % 3) * 10); g.fillStyle(f.color!, 0.55 * a).fillCircle(f.x + Math.cos(an) * d, f.y + Math.sin(an) * d * 0.6 - k * 14, 5 + k * 9); }
      } else if (f.kind === 'line') g.lineStyle(f.width! * a + 1, f.color!, a).lineBetween(f.x, f.y, f.x2!, f.y2!);
      else if (f.kind === 'prints') {
        const n = 7, show = Math.min(n, Math.floor(f.t / 0.07) + 1), an = Math.atan2(f.y2! - f.y, f.x2! - f.x);
        for (let i = 0; i < show; i++) {
          const q = (i + 1) / (n + 1), x = f.x + (f.x2! - f.x) * q + (i % 2 ? 9 : -9) * Math.sin(an), y = f.y + (f.y2! - f.y) * q - (i % 2 ? 9 : -9) * Math.cos(an);
          g.fillStyle(0xffaa46, 0.85 * Math.min(1, a * 2)).fillEllipse(x, y, 20, 11);
          // os dedos ficam para trás: a pegada aponta para o lado contrário
          for (let d = -1; d <= 1; d++) g.fillCircle(x - Math.cos(an) * 13 + Math.sin(an) * d * 5, y - Math.sin(an) * 13 - Math.cos(an) * d * 5, 2.6);
        }
      } else if (f.kind === 'roots' || f.kind === 'spikes') {
        const up = Math.sin(k * Math.PI), col = f.color ?? 0x4a3a2c, line = f.x2 != null && (f.x2 !== f.x || f.y2 !== f.y), n = line ? Math.max(6, Math.floor(Math.hypot(f.x2! - f.x, f.y2! - f.y) / 44)) : 9;
        for (let i = 0; i < n; i++) {
          let x: number, y: number;
          if (line) { const q = (i + 0.5) / n; x = f.x + (f.x2! - f.x) * q; y = f.y + (f.y2! - f.y) * q + (i % 2 ? 8 : -8); }
          else { const an = (i / n) * Math.PI * 2 + 0.3, d = f.r0! * (0.35 + (i % 3) * 0.24); x = f.x + Math.cos(an) * d; y = f.y + Math.sin(an) * d; }
          g.fillStyle(col, 1).fillTriangle(x - 9, y, x + 9, y, x + (i % 2 ? 4 : -4), y - 46 * up);
          g.lineStyle(2.5, 0x22100a, 1).strokeTriangle(x - 9, y, x + 9, y, x + (i % 2 ? 4 : -4), y - 46 * up);
        }
      }
    }
    /* escudo erguido, tiro sendo carregado, casca */
    if (p.state === 'block') { const parry = p.blockT <= PLAYER.shield.parryWindow; g.lineStyle(parry ? 7 : 4, parry ? 0xffe9a8 : 0xc9a26b, 0.9); g.beginPath(); g.arc(p.x, p.y - 40, 44, p.aim - 0.9, p.aim + 0.9); g.strokePath(); }
    if (p.state === 'charge') { g.lineStyle(5, p.charge >= 0.6 ? 0xfff0a8 : 0xffffff, 0.85); g.beginPath(); g.arc(p.x, p.y - 44, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.charge); g.strokePath(); g.lineStyle(2, 0xffffff, 0.25).lineBetween(p.x, p.y - 44, p.x + Math.cos(p.aim) * 320, p.y - 44 + Math.sin(p.aim) * 320); }
    if (p.cascaT > 0) g.lineStyle(5, 0xc9a26b, 0.55 + 0.25 * Math.sin(this.clock * 8)).strokeEllipse(p.x, p.y - 40, 62, 96);
    if (p.shield) g.lineStyle(3, 0xffe9a8, 0.5 + 0.2 * Math.sin(this.clock * 5)).strokeEllipse(p.x, p.y - 40, 74, 108);
    for (const e of w.enemies) {
      if (e.hidden || e.fake) continue;
      const sh = this.views.get(e.id), top = sh ? sh.spr.displayHeight * 0.62 + 6 : 60, boss = isBoss(e);
      if (e.bubbleT > 0) { g.fillStyle(0xbfeaff, 0.25).fillCircle(e.x, e.y - top * 0.45, e.radius + 22); g.lineStyle(3, 0xffffff, 0.8).strokeCircle(e.x, e.y - top * 0.45, e.radius + 22); }
      if (e.markT > 0) { g.lineStyle(4, 0xffd23f, 0.9).strokeCircle(e.x, e.y - top - 22, 9); g.lineBetween(e.x - 14, e.y - top - 22, e.x + 14, e.y - top - 22).lineBetween(e.x, e.y - top - 36, e.x, e.y - top - 8); }
      if (e.wetT > 0) for (let i = 0; i < 3; i++) { const fall = (this.clock * 1.6 + i * 0.33 + e.id * 0.1) % 1; g.fillStyle(0xbfeaff, 0.9 * (1 - fall)).fillCircle(e.x - 14 + i * 14, e.y - top * 0.8 + fall * 34, 3.5); }
      if (e.guarded) { g.lineStyle(3, 0xff7ab0, 0.7); g.beginPath(); g.arc(e.x, e.y - top * 0.45, e.radius + 14, -2.4, -0.7); g.strokePath(); }
      if ((e.kind === 'queixada' && e.state === 'stunned') || e.stunT > 0 || e.exposeT > 0 || e.state === 'tired' || e.state === 'downed' || (e.kind === 'iara' && e.state === 'exposed')) {
        for (let i = 0; i < 3; i++) { const an = this.clock * 5 + i * 2.09; g.fillStyle(0xffd23f, 1).fillCircle(e.x + Math.cos(an) * 24, e.y - top + 4 + Math.sin(an) * 7, 5); }
      }
      if (!boss && (e.hp < e.maxHp || e.shellMax > 0) && e.state !== 'spawn') {
        const bw = e.elite ? 80 : e.champion ? 62 : 46, x = e.x - bw / 2, y = e.y - top - 8;
        g.fillStyle(0x0a0f0a, 0.8).fillRect(x - 2, y - 2, bw + 4, 9);
        g.fillStyle(e.elite ? 0xffb238 : e.champion ? 0xff7ab0 : 0xd6402b, 1).fillRect(x, y, bw * Math.max(0, e.hp / e.maxHp), 5);
        /* Casca elemental: uma barra da cor do elemento, por cima da vida */
        if (e.shellMax > 0) {
          g.fillStyle(0x0a0f0a, 0.8).fillRect(x - 2, y - 10, bw + 4, 8);
          if (e.shell > 0) { g.fillStyle(COLOR(e.shellEl), 1).fillRect(x, y - 8, bw * (e.shell / e.shellMax), 4); g.lineStyle(1.5, 0xffffff, 0.75).strokeRect(x - 1, y - 9, bw + 2, 6); }
          else g.fillStyle(0xffffff, 0.35 + 0.3 * Math.sin(this.clock * 10)).fillRect(x, y - 8, bw * Math.max(0, 1 - e.shellT / AFFINITY.exposed.regrow), 4);
        }
      }
      /* com a Casca de pé, um aro da cor dela em volta do monstro */
      if (e.shell > 0 && e.state !== 'spawn') { g.lineStyle(3, COLOR(e.shellEl), 0.55 + 0.2 * Math.sin(this.clock * 4 + e.id)); g.strokeEllipse(e.x, e.y - top * 0.45, (e.radius + 16) * 2, (e.radius + 16) * 1.5); }
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

  private slotX(i: number): number { return VIEW.w - 84 - (7 - i) * 66; }

  private buildHud(): void {
    const w = this.world, bow = w.stats.weapon === 'arco';
    const VX = 14, VY = VIEW.h - VITALS.h - 12, SY = VIEW.h - 106;
    const img = (x: number, y: number, key: string, scale: number, depth = 10001) => this.add.image(x, y, key).setScale(scale).setDepth(depth);

    /* vida, mana e poção numa placa só */
    this.add.image(VX, VY, 'hud_vitals').setOrigin(0).setScale(HUD_SCALE).setDepth(9999);
    img(VX + 24, VY + VITALS.hp.y + VITALS.hp.h / 2, 'ui_vida', INV * 0.44, 10002);
    img(VX + 24, VY + VITALS.mana.y + VITALS.mana.h / 2, 'ui_mana', INV * 0.36, 10002);
    img(VX + VITALS.potion.x, VY + VITALS.potion.y - 2, 'ic_pocao', INV * 0.78);
    this.txtHp = this.label(VX + VITALS.hp.x + VITALS.hp.w / 2, VY + VITALS.hp.y + VITALS.hp.h / 2 - 1, 18).setOrigin(0.5).setDepth(10002);
    this.txtMana = this.label(VX + VITALS.mana.x + VITALS.mana.w / 2, VY + VITALS.mana.y + VITALS.mana.h / 2 - 1, 14).setOrigin(0.5).setDepth(10002);
    this.txtPotion = this.label(VX + VITALS.potion.x + 10, VY + VITALS.potion.y + 6, 19, '#f6ead0').setDepth(10003);

    /* cabeçalho: nome da fase numa placa, com as salas embaixo */
    const title = this.training ? 'Terreiro de treino' : this.dream ? `${this.stage.name} · trecho ${this.dream.trecho} de ${this.dream.of}` : isTowerId(this.stage.id) ? 'Torre · andar 100' : this.challenge ? this.stage.name : this.stage.index < 0 ? `Expedição · ${this.stage.name}` : `${this.stage.id} · ${this.stage.name}`;
    this.txtInfo = this.label(30, 16, 22, '#f6ead0').setText(title);
    const single = this.training || !!this.dream;
    const tw = Math.max(170, Math.ceil(this.txtInfo.width) + 34, single ? 0 : 44 + this.stage.rooms.length * 26), th = single ? 42 : 64;
    this.add.image(14, 8, plateTexture(this, tw, th)).setOrigin(0).setScale(HUD_SCALE).setDepth(9999);
    this.roomDotsX = 32;
    /* relógio (ou, no treino, as teclas) */
    const rw = this.training ? 276 : 240;
    this.add.image(VIEW.w - 14 - rw, 8, plateTexture(this, rw, 42)).setOrigin(0).setScale(HUD_SCALE).setDepth(9999);
    if (!this.training) img(VIEW.w - rw + 6, 29, 'ui_relogio', INV * 0.36, 10001);
    this.txtTime = this.label(VIEW.w - 30, 16, this.training ? 19 : 21, '#f6ead0').setOrigin(1, 0);

    this.txtBoss = this.label(VIEW.w / 2, 70, 23, '#ffb238').setOrigin(0.5);
    this.txtExit = this.label(0, 0, 26, '#ffb238').setOrigin(1, 0.5).setText('Siga em frente').setVisible(false);
    this.txtHelp = this.label(VIEW.w / 2, VIEW.h - 132, 19, '#f1ebd8').setOrigin(0.5)
      .setText(['WASD mover', 'clique atacar', bow ? 'botão direito carrega o tiro' : w.stats.hasShield ? 'botão direito defende' : '', 'Espaço esquiva', 'Q feitiço', '1 poção'].filter(Boolean).join('  ·  '));
    this.txtBanner = this.add.text(VIEW.w / 2, VIEW.h / 2 - 50, '', { fontFamily: FONT, fontStyle: '900', fontSize: '92px', color: '#ffb238', stroke: INK, strokeThickness: 12 }).setOrigin(0.5).setDepth(10005).setResolution(2).setVisible(false);
    this.txtSub = this.add.text(VIEW.w / 2, VIEW.h / 2 + 50, '', { fontFamily: FONT, fontSize: '28px', color: '#f1ebd8', stroke: INK, strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(10005).setResolution(2).setVisible(false);
    this.pauseVeil = this.add.rectangle(0, 0, VIEW.w, VIEW.h, 0x0a0604, 0.68).setOrigin(0).setDepth(10004).setVisible(false);
    this.txtPause = this.add.text(VIEW.w / 2, 276, '', { fontFamily: FONT, fontSize: '17px', color: '#f6ead0', stroke: INK, strokeThickness: 4, align: 'center', lineSpacing: 2, wordWrap: { width: 1100 } }).setOrigin(0.5, 0).setDepth(10005).setResolution(2).setVisible(false);

    /* barra de ações: uma moldura por espaço, o ícone, a tecla e os segundos de recarga */
    const alt = bow || w.stats.hasShield || w.stats.weapon === 'borduna' || w.stats.weapon === 'zagaia';
    const names = ['Clique', alt ? 'Dir.' : '', 'Espaço', 'Q', 'E', 'R', 'F', 'T'];
    const shown = [true, alt, true, !!w.spells[0], !!w.spells[1], !!w.spells[2], !!w.pet, !!w.supremo];
    names.forEach((s, i) => {
      const x = this.slotX(i) + SLOT / 2;
      if (shown[i]) { img(x - SLOT / 2, SY, 'hud_slot', HUD_SCALE, 9999).setOrigin(0); img(x, VIEW.h - 30, 'hud_key', HUD_SCALE, 9999); }
      this.label(x, VIEW.h - 31, 14, '#f6ead0').setOrigin(0.5).setText(s).setVisible(shown[i]);
    });
    this.slotCd = names.map((_, i) => this.label(this.slotX(i) + SLOT / 2, SY + SLOT / 2, 22, '#ffffff').setOrigin(0.5).setDepth(10003).setVisible(false));
    const icon = (i: number, key: string, scale = 0.74) => (this.textures.exists(key) ? this.add.image(this.slotX(i) + SLOT / 2, SY + SLOT / 2, key).setScale(INV * scale).setDepth(10001) : null);
    this.slotIcons = [
      icon(0, this.textures.exists('ui_' + w.stats.weapon) ? 'ui_' + w.stats.weapon : bow ? 'ui_projetil' : 'ui_dano'),
      alt ? icon(1, bow ? 'ui_perfurar' : w.stats.weapon === 'borduna' ? 'ui_tremor' : w.stats.weapon === 'zagaia' ? 'ui_perfurar' : 'ui_defesa') : null, icon(2, 'ui_esquiva'),
      ...w.spells.map((id, i) => (id ? icon(3 + i, this.textures.exists('ui_' + id) ? 'ui_' + id : 'ic_' + id, this.textures.exists('ui_' + id) ? 0.74 : 0.98) : null)),
      w.pet ? icon(6, 'ui_companheiro') : null, null,
    ];
    this.supIcon = w.supremo ? icon(7, 'ui_' + w.supremo) : null;

    this.synY = th + 108;
    this.goldIcon = this.add.image(36, th + 30, 'moeda').setScale(INV * 1.1).setDepth(10001).setVisible(false);
    this.txtGold = this.label(52, th + 18, 22, '#f2c14e').setVisible(false);
    this.txtChallenge = this.label(24, th + 46, 19, '#ffd23f').setVisible(false);

    if (this.auto) {
      /* aviso da caçada automática, no alto e no meio */
      this.add.image(VIEW.w / 2, 29, plateTexture(this, 330, 42, true)).setScale(HUD_SCALE).setDepth(9999);
      img(VIEW.w / 2 - 140, 29, 'ui_auto', INV * 0.42, 10001);
      this.autoChip = this.label(VIEW.w / 2 + 14, 16, 21, '#ffd23f').setOrigin(0.5, 0);
      this.autoHint = this.label(VIEW.w / 2, 56, 15, '#d9cdb4').setOrigin(0.5, 0).setText('V muda a velocidade  ·  Esc pausa');
    }
    if (this.training) this.buildMeter();
    /* amuletos da noite: uma fileira de medalhas embaixo do relógio */
    this.amulets.forEach((id, i) => {
      const moon = this.stage.rooms.some((r) => r.moon) ? 84 : 0, a = AMULETS[id], x = VIEW.w - 36 - moon - (i % 9) * 38, y = 76 + Math.floor(i / 9) * 38, col = Phaser.Display.Color.HexStringToColor(a.color).color;
      this.add.circle(x, y, 17, 0x1c0f0a, 1).setDepth(10000);
      this.add.circle(x, y, 15, 0x3a2416, 1).setStrokeStyle(2, col).setDepth(10001);
      if (this.textures.exists('ui_' + a.icon)) this.add.image(x, y, 'ui_' + a.icon).setScale(INV * 0.36).setDepth(10002);
    });
  }

  /* ---------- medidor de dano do Terreiro ---------- */

  private readonly MX = 258; private readonly MW = 730; private readonly MY = 8; private readonly MH = 128;

  private buildMeter(): void {
    const x = this.MX, w = this.MW, y = this.MY;
    this.add.image(x, y, plateTexture(this, w, this.MH)).setOrigin(0).setScale(HUD_SCALE).setDepth(9999);
    const cells = ['Dano por segundo', 'Média', 'Total', 'Maior golpe', 'Reações'], cw = w / cells.length;
    this.meterTxt = cells.map((name, i) => {
      this.label(x + cw * (i + 0.5), y + 10, 15, '#d9cdb4').setOrigin(0.5, 0).setText(name);
      return this.label(x + cw * (i + 0.5), y + 28, i === 0 ? 34 : 28, i === 0 ? '#ffd23f' : '#f6ead0').setOrigin(0.5, 0).setText('0');
    });
    this.meterLegend = METER_GROUPS.map((g, i) => this.label(x + 22 + i * ((w - 30) / METER_GROUPS.length) + 16, y + 98, 15, g.css).setText(g.name));
  }

  private meterEvent(e: SimEvent): void {
    const m = this.meter;
    if (e.type === 'reaction') { m.reactions++; return; }
    if (e.type !== 'hit' || !e.value) return;
    if (m.t0 < 0 || this.clock - m.last > METER_IDLE) { const r = m.reactions; this.meter = newMeter(); this.meter.t0 = this.clock; if (m.t0 < 0) this.meter.reactions = r; }
    const mm = this.meter;
    mm.last = this.clock; mm.total += e.value; mm.hits++;
    if (e.value > mm.max) mm.max = e.value;
    mm.by[METER_OF[e.kind ?? ''] ?? 'efeito'] += e.value;
    mm.recent.push({ t: this.clock, v: e.value });
  }

  private tickMeter(_real: number): void {
    const m = this.meter, t = this.clock;
    while (m.recent.length && t - m.recent[0].t > METER_WINDOW) m.recent.shift();
  }

  private drawMeter(g: Phaser.GameObjects.Graphics): void {
    const m = this.meter, x = this.MX, w = this.MW, y = this.MY;
    const span = m.t0 < 0 ? 0 : Math.max(1, m.last - m.t0), now = m.recent.reduce((a, r) => a + r.v, 0) / METER_WINDOW;
    const vals = [big(now), big(span ? m.total / span : 0), big(m.total), big(m.max), String(m.reactions)];
    this.meterTxt.forEach((txt, i) => { if (txt.text !== vals[i]) txt.setText(vals[i]); });
    /* divisórias entre as células */
    for (let i = 1; i < 5; i++) g.fillStyle(0x1c0f0a, 0.5).fillRect(x + (w / 5) * i - 1, y + 14, 2, 54);
    /* barra empilhada: de onde veio o dano */
    const bx = x + 16, bw = w - 32, by = y + 76, bh = 14;
    g.fillStyle(0x1c0f0a, 1).fillRoundedRect(bx - 2, by - 2, bw + 4, bh + 4, 6);
    g.fillStyle(0x140b07, 1).fillRoundedRect(bx, by, bw, bh, 4);
    let at = bx;
    const step = (w - 30) / METER_GROUPS.length;
    METER_GROUPS.forEach((gr, i) => {
      const share = m.total > 0 ? m.by[gr.id] / m.total : 0, sw = bw * share;
      if (sw > 0.5) { g.fillStyle(gr.color, 1).fillRect(at, by, sw, bh); g.fillStyle(0xffffff, 0.2).fillRect(at, by, sw, bh * 0.4); at += sw; }
      const lx = x + 22 + i * step;
      g.fillStyle(0x1c0f0a, 1).fillRoundedRect(lx - 1, y + 101, 13, 13, 3);
      g.fillStyle(gr.color, share > 0 ? 1 : 0.35).fillRoundedRect(lx + 1, y + 103, 9, 9, 2);
      const label = `${gr.name} ${Math.round(share * 100)}%`;
      const txt = this.meterLegend[i];
      if (txt.text !== label) txt.setText(label);
      txt.setAlpha(share > 0 ? 1 : 0.5);
    });
  }

  private banner(title: string, sub: string, color: string): void {
    this.txtBanner.setText(title).setColor(color).setVisible(true).setScale(0.6).setAlpha(0);
    this.txtSub.setText(sub).setPosition(VIEW.w / 2, VIEW.h / 2 + 50).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.txtBanner, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.txtSub, alpha: 1, duration: 320, delay: 200 });
  }

  private fmt(t: number): string {
    const m = Math.floor(t / 60), s = t - m * 60;
    return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
  }

  private drawHud(): void {
    const g = this.hudG, w = this.world, p = w.player, s = w.stats, real = this.game.loop.delta / 1000;
    g.clear();
    const VX = 14, VY = VIEW.h - VITALS.h - 12, SY = VIEW.h - 106;
    /* barra com brilho em cima e sombra embaixo; `lag` mostra em claro o que acabou de sair */
    const bar = (x: number, y: number, bw: number, bh: number, k: number, color: number, lag = 0) => {
      const f = Phaser.Math.Clamp(k, 0, 1), l = Phaser.Math.Clamp(lag, 0, 1);
      if (l > f) g.fillStyle(0xffe6b0, 0.85).fillRoundedRect(x, y, Math.max(6, bw * l), bh, 4);
      if (f <= 0) return;
      const fw = Math.max(6, bw * f);
      g.fillStyle(color, 1).fillRoundedRect(x, y, fw, bh, 4);
      g.fillStyle(0xffffff, 0.22).fillRoundedRect(x + 2, y + 2, Math.max(2, fw - 4), bh * 0.3, 2);
      g.fillStyle(0x000000, 0.2).fillRect(x + 2, y + bh * 0.72, Math.max(2, fw - 4), bh * 0.22);
    };
    const hpK = p.hp / s.maxHp;
    this.hpLag = hpK >= this.hpLag ? hpK : Math.max(hpK, this.hpLag - real * 0.45);
    const low = hpK < 0.3 && p.hp > 0;
    bar(VX + VITALS.hp.x, VY + VITALS.hp.y, VITALS.hp.w, VITALS.hp.h, hpK, low ? 0xf04a34 : 0xd6402b, this.hpLag);
    if (low) g.lineStyle(3, 0xff6b5a, 0.45 + 0.4 * Math.sin(this.clock * 9)).strokeRoundedRect(VX + VITALS.hp.x - 3, VY + VITALS.hp.y - 3, VITALS.hp.w + 6, VITALS.hp.h + 6, 7);
    bar(VX + VITALS.mana.x, VY + VITALS.mana.y, VITALS.mana.w, VITALS.mana.h, p.mana / s.maxMana, 0x3fa7e0);
    this.txtHp.setText(`${Math.ceil(p.hp)} / ${s.maxHp}`);
    this.txtMana.setText(`${Math.floor(p.mana)} / ${s.maxMana}`);
    this.txtPotion.setText(String(p.potions)).setColor(p.potions > 0 ? '#f6ead0' : '#ff9a8a');
    if (p.potionCd > 0) { const pc = VITALS.potion; g.fillStyle(0x140b07, 0.6).slice(VX + pc.x, VY + pc.y, pc.r - 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.potionCd / PLAYER.potionCooldown), false).fillPath(); }
    /* bênçãos ativas: um ícone por bênção, com o número de vezes */
    if (this.blessShown !== w.blessings.length) {
      this.blessShown = w.blessings.length;
      for (const o of this.blessIcons) o.destroy();
      this.blessIcons = [];
      const counts = blessingCounts(w.blessings);
      /* a forma desperta fica no lugar da bênção de que veio */
      const awoke = new Set((Object.keys(counts) as BlessingId[]).map((id) => BLESSINGS[id].awakens).filter(Boolean));
      const shown = (Object.keys(counts) as BlessingId[]).filter((id) => !awoke.has(id as never)), step = Math.min(40, 660 / Math.max(1, shown.length));
      shown.forEach((id, i) => {
        const b = BLESSINGS[id], x = 36 + i * step, y = VY - 24, col = Phaser.Display.Color.HexStringToColor(BLESSING_TIER_COLOR[b.tier]).color;
        this.blessIcons.push(this.add.circle(x, y, 18, 0x1c0f0a, 1).setDepth(10000));
        this.blessIcons.push(this.add.circle(x, y, 16, 0x3a2416, 1).setStrokeStyle(b.tier === 4 ? 3 : 2, col).setDepth(10001));
        if (this.textures.exists('ui_' + b.icon)) this.blessIcons.push(this.add.image(x, y, 'ui_' + b.icon).setScale(INV * 0.4).setDepth(10002));
        if (counts[id]! > 1) this.blessIcons.push(this.add.text(x + 8, y + 3, String(counts[id]), { fontFamily: FONT, fontStyle: '900', fontSize: '16px', color: '#ffffff', stroke: INK, strokeThickness: 4 }).setDepth(10003).setResolution(2));
      });
      /* sinergias: uma medalha por padrinho com bênção, com a contagem e as três faixas */
      const pat = ELEMENT_ORDER.filter((el) => (s.patrons[el] ?? 0) > 0).sort((a, b) => s.patrons[b] - s.patrons[a]);
      pat.forEach((el, i) => {
        const x = 38, y = this.synY + i * 52, col = COLOR(el), n = s.patrons[el], tier = s.patronTiers[el];
        this.blessIcons.push(this.add.image(x, y, 'hud_patron').setScale(HUD_SCALE).setDepth(10000));
        this.blessIcons.push(this.add.circle(x, y, 20, 0, 0).setStrokeStyle(tier > 0 ? 3 : 2, col, tier > 0 ? 1 : 0.55).setDepth(10001));
        if (this.textures.exists('ui_' + el)) this.blessIcons.push(this.add.image(x, y, 'ui_' + el).setScale(INV * 0.5).setDepth(10002).setAlpha(tier > 0 ? 1 : 0.75));
        this.blessIcons.push(this.add.text(x + 26, y - 21, String(n), { fontFamily: FONT, fontStyle: '900', fontSize: '22px', color: tier > 0 ? ELEMENTS[el].color : '#f6ead0', stroke: INK, strokeThickness: 5 }).setDepth(10003).setResolution(2));
        const pips = this.add.graphics().setDepth(10003);
        PATRON_STEPS.forEach((need, k) => { pips.fillStyle(0x1c0f0a, 1).fillCircle(x + 31 + k * 11, y + 12, 5); pips.fillStyle(n >= need ? col : 0x4a3220, 1).fillCircle(x + 31 + k * 11, y + 12, 3.4); });
        this.blessIcons.push(pips);
      });
    }

    /* espaços de ação: a borda acende quando dá para usar; a recarga desce como uma cortina e mostra os segundos */
    const slot = (i: number, color: number, cd: number, ok: boolean, show = true, seconds = 0) => {
      const txt = this.slotCd[i];
      if (!show) { txt?.setVisible(false); return; }
      const x = this.slotX(i), k = Phaser.Math.Clamp(cd, 0, 1);
      g.fillStyle(color, ok ? 0.2 : 0.07).fillRoundedRect(x + 5, SY + 5, SLOT - 10, SLOT - 10, 7);
      if (k > 0) g.fillStyle(0x0a0604, 0.74).fillRoundedRect(x + 5, SY + 5, SLOT - 10, Math.max(8, (SLOT - 10) * k), 7);
      g.lineStyle(3, color, ok ? 1 : 0.3).strokeRoundedRect(x + 2.5, SY + 2.5, SLOT - 5, SLOT - 5, 9);
      if (txt) { const on = seconds >= 0.95; txt.setVisible(on); if (on) txt.setText(String(Math.ceil(seconds))); }
    };
    const bow = s.weapon === 'arco';
    slot(0, 0xe9e4d4, bow ? p.shotCd / PLAYER.bow.interval : 0, true);
    slot(1, bow ? 0xfff0a8 : 0xd9a66b, 0, true, bow || s.hasShield || s.weapon === 'borduna' || s.weapon === 'zagaia');
    slot(2, 0x8fe3ff, p.dodgeCharges > 0 ? 0 : 1 - p.dodgeTimer / s.dodgeCooldown, p.dodgeCharges > 0);
    for (let i = 0; i < s.dodgeCharges; i++) { const dx = this.slotX(2) + SLOT / 2 - (s.dodgeCharges - 1) * 7 + i * 14; g.fillStyle(0x1c0f0a, 1).fillCircle(dx, SY - 8, 6); g.fillStyle(i < p.dodgeCharges ? 0x8fe3ff : 0x3a4a52, 1).fillCircle(dx, SY - 8, 4); }
    for (let i = 0; i < 3; i++) {
      const id = w.spells[i];
      const gone = !!id && (p.erased[i] > 0 || p.stolen === i), ready = !!id && !gone && p.mana >= spellCost(w, i, id);
      slot(3 + i, gone ? 0x5a5a5a : id ? COLOR(SPELLS[id].element) : 0x5a5a5a, id ? p.cds[i] / p.cdMax[i] : 0, ready, !!id, id ? p.cds[i] : 0);
      if (gone) { const sx = this.slotX(3 + i); g.lineStyle(5, p.stolen === i ? 0xff6b5a : 0xe9e4d8, 0.9).lineBetween(sx + 12, SY + 12, sx + SLOT - 12, SY + SLOT - 12).lineBetween(sx + SLOT - 12, SY + 12, sx + 12, SY + SLOT - 12); }
      if (id && p.dreamT > 0) { const sx = this.slotX(3 + i); g.fillStyle(0xff9ae6, 0.3 + 0.2 * Math.sin(this.clock * 6 + i)).fillRoundedRect(sx + 5, SY + 5, SLOT - 10, SLOT - 10, 7); }
      this.slotIcons[3 + i]?.setAlpha(id && p.cds[i] <= 0 && ready ? 1 : 0.38);
    }
    const pet = w.pet, petCd = pet ? COMPANIONS[pet.id].cooldown * s.petCooldownMult : 1;
    slot(6, 0xf2a65a, pet ? pet.cd / petCd : 0, !!pet && pet.state !== 'down', !!pet, pet ? pet.cd : 0);
    this.slotIcons[6]?.setAlpha(pet && pet.cd <= 0 && pet.state !== 'down' ? 1 : 0.4);
    /* Supremo: enche com a luta; cheio, pisca */
    const full = p.supremo >= 100, sc = w.supremo ? Phaser.Display.Color.HexStringToColor(ELEMENTS[w.supremo].color).color : 0;
    slot(7, full && Math.floor(this.clock * 6) % 2 ? 0xffffff : sc, w.supremo ? 1 - p.supremo / 100 : 0, full, !!w.supremo);
    this.supIcon?.setAlpha(full ? 1 : 0.45);
    if (w.supremo && full) g.lineStyle(4, 0xffd23f, 0.6 + 0.4 * Math.sin(this.clock * 8)).strokeRoundedRect(this.slotX(7) - 3, SY - 3, SLOT + 6, SLOT + 6, 13);

    /* cabeçalho: fase, salas e tempo */
    const fl = this.stage.rooms[w.room]?.floor;
    if (isTowerId(this.stage.id)) this.txtInfo.setText(`Torre · andar ${fl ?? this.stage.rooms[Math.max(0, w.room - 1)]?.floor ?? ''}`);
    if (!this.training) {
      const x0 = this.roomDotsX, y0 = 56;
      if (!this.dream) this.stage.rooms.forEach((r, i) => {
        const x = x0 + i * 26, done = i < w.room || (i === w.room && (w.phase === 'cleared' || w.phase === 'won')), cur = i === w.room;
        const col = done ? 0xffb238 : cur ? 0xffffff : 0x8a6a4a, bigDot = r.type === 'boss' || r.type === 'elite';
        if (r.type === 'altar') { g.fillStyle(0x1c0f0a, 1).fillCircle(x, y0, 10); g.fillStyle(done ? 0xffb238 : cur ? 0x9be7c0 : 0x8a6a4a, 1).fillTriangle(x - 6, y0, x, y0 - 7, x + 6, y0).fillTriangle(x - 6, y0, x, y0 + 7, x + 6, y0); }
        else { g.fillStyle(0x1c0f0a, 1).fillCircle(x, y0, bigDot ? 10 : 7.5); g.fillStyle(col, 1).fillCircle(x, y0, bigDot ? 8 : 5.5); }
        if (cur) g.lineStyle(2, 0xffffff, 0.9).strokeCircle(x, y0, bigDot ? 12 : 10);
      });
      const late = w.time > this.stage.starTime, target = this.stage.starTime > 0 ? `   alvo ${this.fmt(this.stage.starTime).slice(0, 5)}` : '';
      this.txtTime.setText(`${this.fmt(w.time)}${target}`).setColor(late && target ? '#c9bfa6' : '#f6ead0');
    } else this.txtTime.setText('Z zera o medidor  ·  Esc pausa');

    /* ouro achado, desafio da sala e efeitos de baú */
    const found = Math.round(w.loot.gold - this.goldAcc);
    /* no Sonho o ouro da sala não vale: o que conta são os vinténs da noite */
    if (this.dream) { this.goldIcon.setVisible(true); this.txtGold.setVisible(true).setText(`${this.dream.vintem} vinténs`); }
    else { this.goldIcon.setVisible(found > 0); this.txtGold.setVisible(found > 0).setText(String(found)); }
    const ch = w.challenge;
    if (ch) {
      const now = ch.kind === 'ligeiro' ? `${Math.ceil(challengeLeft(w))} s` : `${Math.min(ch.limit + 1, w.hitsTaken - ch.hits0)}/${ch.limit} golpes`;
      const txt = ch.state === 'ativo' ? `Desafio: ${now}` : ch.state === 'vencido' ? 'Desafio vencido' : 'Desafio perdido';
      this.txtChallenge.setVisible(true).setText(txt).setColor(ch.state === 'ativo' ? '#ffd23f' : ch.state === 'vencido' ? '#9be7c0' : '#c9c4bd').setY(found > 0 ? this.goldIcon.y + 16 : this.goldIcon.y - 10);
    } else this.txtChallenge.setVisible(false);
    this.drawBuffs(g);

    /* lua do Pampa */
    if (w.moon > 0) {
      const mx = VIEW.w - 60, my = 96, r = 26;
      g.fillStyle(0x1a1830, 0.85).fillCircle(mx, my, r + 4);
      g.fillStyle(0xe8e0ff, 1).fillCircle(mx, my, r);
      g.fillStyle(0x1a1830, 1).fillCircle(mx - r * 2 * w.moon, my, r);
      g.lineStyle(3, 0xc8a8ff, 0.9).strokeCircle(mx, my, r + 4);
    }
    /* barra de elite ou de chefão, numa moldura */
    const boss = this.training ? undefined : w.enemies.find((e) => isBoss(e) && !e.fake) ?? w.enemies.find((e) => e.elite);
    if (boss) {
      const bw = 480, x = VIEW.w / 2 - bw / 2, y = 88, bigBoss = isBoss(boss);
      const nb = isBossKind(boss.kind) ? BOSSES[boss.kind as BossKind] : null;
      const legacy = boss.kind === 'curupira' || boss.kind === 'iara' ? ENEMY[boss.kind] : null;
      const posture = nb?.posture ?? legacy?.posture ?? null, fh = posture ? 68 : 52;
      g.fillStyle(0x1c0f0a, 0.94).fillRoundedRect(x - 14, y - 34, bw + 28, fh, 12);
      g.fillStyle(0x4a2c1a, 0.96).fillRoundedRect(x - 12, y - 32, bw + 24, fh - 4, 10);
      g.lineStyle(1.5, bigBoss ? 0xf2c14e : 0xb98352, 0.8).strokeRoundedRect(x - 11.5, y - 31.5, bw + 23, fh - 5, 10);
      g.fillStyle(0x1c0f0a, 1).fillRoundedRect(x - 2, y - 2, bw + 4, 18, 6);
      g.fillStyle(0x140b07, 1).fillRoundedRect(x, y, bw, 14, 4);
      bar(x, y, bw, 14, boss.hp / boss.maxHp, 0xd6402b);
      /* Casca elemental do chefe: uma faixa da cor do elemento sobre a vida */
      if (boss.shellMax > 0 && boss.shell > 0) {
        /* uma faixa própria, logo acima da vida, para não se confundir com ela */
        g.fillStyle(0x1c0f0a, 1).fillRoundedRect(x - 2, y - 11, bw + 4, 10, 4);
        g.fillStyle(COLOR(boss.shellEl), 1).fillRoundedRect(x, y - 9, bw * (boss.shell / boss.shellMax), 6, 2);
        g.lineStyle(1.5, 0xffffff, 0.8).strokeRoundedRect(x - 0.5, y - 9.5, bw + 1, 7, 2);
      }
      else if (boss.exposeT > 0) { g.fillStyle(0xffffff, 0.25 + 0.2 * Math.sin(this.clock * 12)).fillRoundedRect(x, y, bw, 14, 4); }
      for (const f of nb?.phases ?? legacy?.phases ?? []) g.fillStyle(0xf6ead0, 0.95).fillRect(x + bw * f - 1.5, y - 3, 3, 20);
      if (posture) {
        const down = boss.state === 'downed';
        g.fillStyle(0x1c0f0a, 1).fillRoundedRect(x - 2, y + 18, bw + 4, 12, 5);
        g.fillStyle(0x140b07, 1).fillRoundedRect(x, y + 20, bw, 8, 3);
        bar(x, y + 20, bw, 8, down ? Math.max(0, 1 - boss.stateT / posture.downed) : boss.posture / posture.max, down ? 0xffffff : 0xffd23f);
      }
      this.txtBoss.setText(bigBoss ? ENEMY_NAMES[boss.kind] : `${ENEMY_NAMES[boss.kind]} · elite`).setVisible(true);
    } else this.txtBoss.setVisible(false);
    this.txtHelp.setAlpha(this.stage.number === 1 && w.room === 0 && !this.auto ? Math.max(0, 1 - Math.max(0, w.time - 12) / 3) : 0);

    if (this.auto && this.autoChip) {
      this.autoChip.setText(`AUTOMÁTICO  ·  ${this.auto.speed}x${this.auto.total > 1 ? `  ·  ${this.auto.index} de ${this.auto.total}` : ''}`);
      this.autoHint?.setVisible(!boss);
    }
    if (this.training) this.drawMeter(g);
  }
}
