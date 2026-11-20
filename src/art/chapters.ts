/** Registro da arte dos capítulos 3 a 8 (cada um no seu arquivo). */
import type { ChapterArt, Sheet } from './kit';
import { ART as ch3 } from './ch3';
import { ART as ch4 } from './ch4';
import { ART as ch5 } from './ch5';
import { ART as ch6 } from './ch6';
import { ART as ch7 } from './ch7';
import { ART as ch8 } from './ch8';

export const CHAPTER_ART: Record<number, ChapterArt> = { 3: ch3, 4: ch4, 5: ch5, 6: ch6, 7: ch7, 8: ch8 };

/** Capítulo dono de cada folha de sprites dos capítulos 3 a 8. */
export const SHEET_CHAPTER: Record<string, number> = {};
export const CHAPTER_SHEETS: Record<string, Sheet> = {};
for (const [n, art] of Object.entries(CHAPTER_ART)) for (const [k, s] of Object.entries(art.sheets)) { SHEET_CHAPTER[k] = Number(n); CHAPTER_SHEETS[k] = s; }
