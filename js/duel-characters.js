/** @typedef {'idle'|'attack'|'skill'|'hit'|'victory'} CharacterAnimState */

/** @typedef {{
 *   id: string,
 *   name: string,
 *   nameEn: string,
 *   class: string,
 *   weapon: string,
 *   element: string,
 *   role: string,
 *   skills: string[],
 *   appearance: object,
 *   sheetPath: string,
 *   portraitPath: string,
 *   displayHeight: number,
 *   sheet: CharacterSheetConfig,
 * }} DuelCharacter */

/** @typedef {{
 *   sheetWidth: number,
 *   sheetHeight: number,
 *   frameWidth: number,
 *   frameHeight: number,
 *   columns: number,
 *   rows: number,
 *   displayHeight: number,
 *   states: Record<CharacterAnimState, number[]>,
 *   gameStateMap: Record<string, CharacterAnimState>,
 * }} CharacterSheetConfig */

const SHEET_LAYOUT = {
  sheetWidth: 1024,
  sheetHeight: 1280,
  frameWidth: 256,
  frameHeight: 256,
  columns: 4,
  rows: 5,
  displayHeight: 160,
  states: {
    idle: [0, 1, 2, 3],
    attack: [4, 5, 6, 7],
    skill: [8, 9, 10, 11],
    hit: [12, 13, 14, 15],
    victory: [16, 17, 18, 19],
  },
  gameStateMap: {
    IDLE: 'idle',
    STRUM_DOWN: 'attack',
    STRUM_UP: 'attack',
    PERFECT: 'skill',
    DAMAGE: 'hit',
    VICTORY: 'victory',
  },
};

/** @type {DuelCharacter} */
export const DRUMMER_BOY = {
  id: 'drummer_boy',
  name: '드럼 소년',
  nameEn: 'Drummer Boy',
  class: 'Percussion Hero',
  weapon: 'Drum',
  element: 'Rhythm',
  role: 'Attack',
  skills: ['리듬 스타트', '비트 러시', '더블 스트라이크', '피날레 브레이크'],
  appearance: { hair: 'brown', eyes: 'large', cape: 'black_gold', style: 'cute_rpg' },
  sheetPath: 'assets/characters/drummer_boy/sheet.png',
  portraitPath: 'assets/images/duel/drummer_idle.png',
  displayHeight: 160,
  sheet: { ...SHEET_LAYOUT },
};

/** @type {DuelCharacter} */
export const PIANO_BOY = {
  id: 'piano_boy',
  name: '피아노 소년',
  nameEn: 'Piano Boy',
  class: 'Harmony Mage',
  weapon: 'Magic Piano',
  element: 'Melody',
  role: 'Support',
  skills: ['리듬 스타트', '멜로디 플레이', '하모니 웨이브', '피날레 포르테'],
  appearance: { hair: 'black', eyes: 'large', cape: 'black_gold', style: 'cute_rpg' },
  sheetPath: 'assets/characters/piano_boy/sheet.png',
  portraitPath: 'assets/images/duel/piano_idle.png',
  displayHeight: 160,
  sheet: { ...SHEET_LAYOUT },
};

/** @type {Record<'A'|'B', DuelCharacter>} */
export const DUEL_FIGHTERS = {
  A: DRUMMER_BOY,
  B: PIANO_BOY,
};

/** @param {'A'|'B'} side */
export function getDuelFighter(side) {
  return DUEL_FIGHTERS[side];
}

/** @param {'A'|'B'} side */
export function getDuelFighterName(side) {
  return DUEL_FIGHTERS[side].name;
}

/** @param {import('./player-meta.js').PlayerAnimState} gameState */
export function gameStateToAnim(gameState) {
  return SHEET_LAYOUT.gameStateMap[gameState] ?? 'idle';
}
