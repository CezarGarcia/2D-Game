import type { BrewId } from './data/brews';
import type { OmenPick } from './data/omens';
import { payBrew } from './meta/afinidade';
import Phaser from 'phaser';
import { ALL_SHEETS, BAKE, SHEETS, bakeAll, bakeChapterSprites, ensureHero, sheetChapter, type Sheet } from './art/bake';
import { VIEW } from './data/balance';
import { StageScene } from './game/StageScene';
import { music, unlockAudio } from './game/music';
import { session } from './game/session';
import { ACHIEVEMENT_BY_ID } from './data/achievements';
import { isDreamId } from './data/dream';
import type { HeroSpec } from './data/challenge';
import { ENCANTADOS_ID, dailyChallengeId, dailyOpen, dailySpec, encantadosOpen, encantadosSpec, isChallengeId, settleChallenge, touchChallengeDay, type ChallengeSettled } from './meta/challenge';
import { isTrainingId, trainingId } from './data/training';
import { currentStageId, dreamContext, settleNode, type DreamContext } from './meta/dream';
import { checkAchievements } from './meta/achievements';
import { inventoryFull, loadProfile, newProfile, saveProfile, wipeSave } from './meta/profile';
import { settleStage, touchDay } from './meta/daily';
import { mountUi } from './ui/app';
import type { HuntSummary } from './ui/host';

let ready = false;
let pendingStage: string | null = null;

/** Espera a fonte do jogo e gera as texturas antes de abrir o acampamento. */
class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create(): void {
    this.add.text(VIEW.w / 2, VIEW.h / 2, 'Carregando…', { fontFamily: 'sans-serif', fontSize: '28px', color: '#f1ebd8' }).setOrigin(0.5);
    const fonts = document.fonts
      ? Promise.race([
          Promise.all([document.fonts.load('900 24px "Londrina Solid"'), document.fonts.load('400 24px "Londrina Solid"')]),
          new Promise((r) => setTimeout(r, 1500)),
        ])
      : Promise.resolve();
    void fonts.catch(() => undefined).then(() => {
      // um quadro de respiro para o texto de carregamento aparecer antes do trabalho pesado
      this.time.delayedCall(30, () => {
        bakeAll(this);
        ready = true;
        if (pendingStage) { const id = pendingStage; pendingStage = null; this.scene.start('stage', { stageId: id }); }
        else this.scene.start('camp');
      });
    });
  }
}

/** Fundo do acampamento: a clareira com o herói parado, por trás dos menus. */
class CampScene extends Phaser.Scene {
  constructor() { super('camp'); }

  create(): void {
    const inv = 1 / BAKE, p = session.profile;
    music.play('acampamento');
    this.add.image(0, 0, 'bg0').setOrigin(0).setScale(inv);
    const sheet = ensureHero(this, p?.equipped.arma?.type ?? 'facao');
    const x = VIEW.w * 0.5, y = VIEW.h * 0.62;
    this.add.image(x + 4, y + 2, 'shadow').setScale(inv * 0.95);
    const hero = this.add.sprite(x, y, sheet.key, 'idle0').setOrigin(sheet.ox / sheet.cellW, sheet.oy / sheet.cellH).setScale(inv);
    this.time.addEvent({ delay: 218, loop: true, callback: () => hero.setFrame('idle' + (Math.floor(this.time.now / 218) % sheet.anims.idle)) });
    if (p?.companion) {
      if (sheetChapter(p.companion)) bakeChapterSprites(this, [sheetChapter(p.companion)]);
      const all: Record<string, Sheet> = ALL_SHEETS, s = all[p.companion] && this.textures.exists(p.companion) ? all[p.companion] : SHEETS.capivara;
      const A = s.anims as Record<string, number>, anim = A.fly ? 'fly' : 'idle', n = A[anim], lift = A.fly ? 70 : 0;
      this.add.image(x - 66, y + 20, 'shadow').setScale(inv * 0.8);
      const pet = this.add.sprite(x - 70, y + 18 - lift, s.key, anim + '0').setOrigin(s.ox / s.cellW, s.oy / s.cellH).setScale(inv);
      this.time.addEvent({ delay: A.fly ? 90 : 330, loop: true, callback: () => pet.setFrame(anim + (Math.floor(this.time.now / (A.fly ? 90 : 330)) % n)) });
    }
    this.add.image(0, 0, 'canopy').setOrigin(0).setScale(inv);
    this.add.image(0, 0, 'rays').setOrigin(0).setScale(inv).setBlendMode(Phaser.BlendModes.ADD);
  }
}

session.profile = loadProfile();
/* conquistas que um save antigo já cumpria entram caladas: ficam à espera no Almanaque */
const hadNews = checkAchievements(session.profile).length > 0;
if (touchDay(session.profile) || hadNews) saveProfile(session.profile);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#0a0f0a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true },
  scene: [BootScene, CampScene, StageScene],
});

/** Caçada automática em andamento: quantas partidas faltam e o que já rendeu. */
let hunt: { stageId: string; left: number; total: number; sum: HuntSummary } | null = null;

function launch(stageId: string, auto?: { speed: number; index: number; total: number }, dream?: DreamContext, omens?: OmenPick, brew?: BrewId, challenge?: HeroSpec): void {
  if (!ready) { pendingStage = stageId; return; }
  game.scene.stop('camp');
  game.scene.stop('stage');
  game.scene.start('stage', { stageId, auto, dream, omens, brew, challenge });
}

const ui = mountUi(document.getElementById('ui')!, {
  getProfile: () => session.profile!,
  save: () => { saveProfile(session.profile!); },
  startStage: (stageId, opts) => {
    ui.hide();
    const a = opts?.auto;
    if (a && a.runs >= 1) {
      session.autoSpeed = a.speed;
      hunt = { stageId, left: a.runs, total: a.runs, sum: { runs: 0, wins: 0, xp: 0, gold: 0, items: 0, dismantled: 0, mata: 0, po: 0, tomo: 0, levels: 0, stopped: 'fim' } };
      launch(stageId, { speed: a.speed, index: 1, total: a.runs });
    } else {
      hunt = null;
      /* Garrafada: o material é gasto ao entrar na fase */
      const brew = opts?.brew && payBrew(session.profile!, opts.brew) ? opts.brew : undefined;
      if (brew) saveProfile(session.profile!);
      launch(stageId, undefined, undefined, opts?.omens, brew);
    }
  },
  startTraining: () => { ui.hide(); hunt = null; launch(trainingId(session.profile!.level)); },
  startDreamNode: () => {
    /* a sala do nó em que o herói do Sonho está, com o que ele traz das salas anteriores */
    const run = session.profile!.dream.run, id = run ? currentStageId(run) : null;
    if (!run || !id || !ready) return;
    ui.hide(); hunt = null;
    launch(id, undefined, dreamContext(run));
  },
  startChallenge: (kind, weapon) => {
    const p = session.profile!;
    if (!ready || (kind === 'dia' ? !dailyOpen(p) : !encantadosOpen(p))) return;
    touchChallengeDay(p);
    const id = kind === 'dia' ? dailyChallengeId(p.challenges.daily.day) : ENCANTADOS_ID;
    const spec = kind === 'dia' ? dailySpec(p.challenges.daily.day) : encantadosSpec(p, weapon);
    ui.hide(); hunt = null;
    launch(id, undefined, undefined, undefined, undefined, spec);
  },
  resetGame: () => {
    wipeSave();
    session.profile = newProfile();
    saveProfile(session.profile);
    ui.showCamp('mapa');
  },
});

/** Aviso do fim de um desafio: resultado, se vale para o ranking e se é recorde. */
function challengeNote(r: ChallengeSettled): string {
  const name = r.kind === 'dia' ? 'Desafio do Dia' : 'Desafio dos Encantados';
  const t = Math.floor(r.result.time / 60) + ':' + String(Math.floor(r.result.time % 60)).padStart(2, '0');
  const how = r.result.won ? `vitória em ${t}` : `caiu na sala ${r.result.rooms + 1}`;
  const tag = r.kind === 'dia' ? (r.ranked ? ' · vale para o ranking' : ' · treino') : '';
  return `${name}: ${how}${tag}${r.newBest ? ' · recorde!' : ''}`;
}

const afterStep = (fn: () => void) => game.events.once(Phaser.Core.Events.POST_STEP, fn);

session.onStageEnd = (outcome) => {
  const profile = session.profile!;
  /* o Terreiro não paga nada nem entra em contador nenhum: só volta para a tela do herói */
  if (isTrainingId(outcome.stageId)) {
    afterStep(() => { game.scene.stop('stage'); game.scene.start('camp'); ui.showCamp('heroi'); });
    return;
  }
  /* um nó do Sonho: volta para o mapa da noite, ou para o resumo se a noite acabou */
  if (isDreamId(outcome.stageId)) {
    const result = settleNode(profile, outcome);
    saveProfile(profile);
    afterStep(() => {
      game.scene.stop('stage'); game.scene.start('camp');
      ui.showDream(result);
      for (const id of result?.end?.achievements ?? []) { const a = ACHIEVEMENT_BY_ID.get(id); if (a) ui.notify(`Conquista: ${a.name}`); }
    });
    return;
  }
  /* desafio com ranking: guarda a tentativa e volta para a aba dele */
  if (isChallengeId(outcome.stageId)) {
    const r = settleChallenge(profile, outcome);
    saveProfile(profile);
    afterStep(() => {
      game.scene.stop('stage'); game.scene.start('camp');
      ui.showCamp(r?.kind === 'encantados' ? 'torre' : 'diario');
      if (r) ui.notify(challengeNote(r));
    });
    return;
  }
  const rewards = settleStage(profile, outcome);
  saveProfile(profile);
  const h = hunt;
  if (h) {
    const s = h.sum;
    s.runs++; s.wins += outcome.won ? 1 : 0; s.xp += rewards.xp; s.gold += rewards.gold; s.items += rewards.items.length; s.levels += rewards.levels;
    s.dismantled += rewards.dismantled?.count ?? 0; s.mata += rewards.materials.mata; s.po += rewards.materials.po; s.tomo += rewards.materials.tomo;
    h.left--;
    /* continua enquanto houver partidas, o herói vencer e couber item na mochila */
    const full = inventoryFull(profile);
    if (outcome.won && h.left > 0 && !full) {
      afterStep(() => launch(h.stageId, { speed: session.autoSpeed, index: h.total - h.left + 1, total: h.total }));
      return;
    }
    s.stopped = !outcome.won ? (outcome.roomsCleared >= 0 && outcome.deaths > 0 ? 'queda' : 'parou') : h.left > 0 && full ? 'mochila' : 'fim';
    hunt = null;
  }
  // troca de cena só depois do passo atual do Phaser, para não destruir objetos no meio da atualização
  afterStep(() => {
    game.scene.stop('stage');
    game.scene.start('camp');
    ui.showResults(outcome.stageId, rewards, h && h.total > 1 ? h.sum : undefined);
    for (const id of rewards.achievements ?? []) { const a = ACHIEVEMENT_BY_ID.get(id); if (a) ui.notify(`Conquista: ${a.name}`); }
  });
};

ui.showCamp('mapa');
music.play('acampamento');
// o som só pode começar depois de um gesto do jogador: o primeiro clique ou tecla, nos menus ou na fase
window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('keydown', unlockAudio, true);

// acesso para depuração e testes automatizados
(window as unknown as { __app?: unknown }).__app = { game, ui, session };
