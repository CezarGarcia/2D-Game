/**
 * Terreiro de treino (docs/gdd/09): uma sala só, com três bonecos que não andam, não batem e não caem.
 * Serve para testar a build com o medidor de dano; não paga nada e não entra em nenhum contador.
 */
import type { StageDef } from './stages';

export const TRAINING_PREFIX = 'treino-';
export function isTrainingId(id: string): boolean { return id.startsWith(TRAINING_PREFIX); }
export function trainingId(level: number): string { return `${TRAINING_PREFIX}${Math.max(1, Math.round(level))}`; }

/** Onde ficam os bonecos: comum, blindado e elite (as marcas de giz do chão usam as mesmas posições). */
export const TRAINING_SPOTS = [{ x: 720, y: 262 }, { x: 860, y: 396 }, { x: 720, y: 530 }];

/** A fase de treino no nível dado (o do herói). */
export function trainingStage(id: string): StageDef {
  const level = Math.max(1, Math.min(80, Number(id.slice(TRAINING_PREFIX.length)) || 1)), [a, b, c] = TRAINING_SPOTS;
  return {
    id: trainingId(level), chapter: 1, index: -1, number: 0, name: 'Terreiro de treino',
    intro: 'Bonecos de palha para testar golpes, feitiços e reações. Nada aqui vale ouro nem experiência.',
    level, starTime: 0, kinds: ['boneco'], final: 'normal', map: { x: 0, y: 0 },
    rooms: [{
      type: 'combat', bg: 9, training: true,
      waves: [[{ kind: 'boneco', ...a }, { kind: 'boneco', ...b, mods: ['blindado'] }, { kind: 'boneco', ...c, elite: true }]],
    }],
  };
}
