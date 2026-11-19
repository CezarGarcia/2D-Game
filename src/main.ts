import Phaser from 'phaser';
import { bakeAll } from './art/bake';
import { VIEW } from './data/balance';
import { RoomScene } from './game/RoomScene';

/** Espera a fonte do jogo e gera as texturas antes de abrir a sala. */
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
        this.scene.start('room');
      });
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#0a0f0a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true },
  scene: [BootScene, RoomScene],
});
