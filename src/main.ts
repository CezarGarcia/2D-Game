import Phaser from 'phaser';
import { ALL_SHEETS, BAKE, HERO_SHEET, SHEETS, bakeAll, bakeChapterSprites, sheetChapter, type Sheet } from './art/bake';
import { VIEW } from './data/balance';
import { StageScene } from './game/StageScene';
import { music, unlockAudio } from './game/music';
import { session } from './game/session';
import { loadProfile, newProfile, saveProfile, wipeSave } from './meta/profile';
import { applyOutcome } from './meta/rewards';
import { mountUi } from './ui/app';

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
    const sheet = HERO_SHEET[p?.equipped.arma?.type ?? 'facao'] ?? SHEETS.hero;
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

const ui = mountUi(document.getElementById('ui')!, {
  getProfile: () => session.profile!,
  save: () => { saveProfile(session.profile!); },
  startStage: (stageId) => {
    ui.hide();
    if (!ready) { pendingStage = stageId; return; }
    game.scene.stop('camp');
    game.scene.stop('stage');
    game.scene.start('stage', { stageId });
  },
  resetGame: () => {
    wipeSave();
    session.profile = newProfile();
    saveProfile(session.profile);
    ui.showCamp('mapa');
  },
});

session.onStageEnd = (outcome) => {
  const rewards = applyOutcome(session.profile!, outcome);
  saveProfile(session.profile!);
  // troca de cena só depois do passo atual do Phaser, para não destruir objetos no meio da atualização
  game.events.once(Phaser.Core.Events.POST_STEP, () => {
    game.scene.stop('stage');
    game.scene.start('camp');
    ui.showResults(outcome.stageId, rewards);
  });
};

ui.showCamp('mapa');
music.play('acampamento');
// o som só pode começar depois de um gesto do jogador: o primeiro clique ou tecla, nos menus ou na fase
window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('keydown', unlockAudio, true);

// acesso para depuração e testes automatizados
(window as unknown as { __app?: unknown }).__app = { game, ui, session };
