import { PLAYER_CHARACTER } from './data.js';

/** @typedef {'IDLE'|'STRUM_DOWN'|'STRUM_UP'|'PERFECT'|'DAMAGE'|'VICTORY'} PlayerAnimState */

export const PLAYER_BOY_META = {
  id: PLAYER_CHARACTER.id,
  name: PLAYER_CHARACTER.name,
  nameEn: PLAYER_CHARACTER.nameEn,
  gender: PLAYER_CHARACTER.gender,
  role: PLAYER_CHARACTER.role,
  appearance: PLAYER_CHARACTER.appearance,
  personality: PLAYER_CHARACTER.personality,
  imagePath: PLAYER_CHARACTER.battleSpritePath ?? PLAYER_CHARACTER.imagePath,
  titleHeroPath: PLAYER_CHARACTER.titleHeroPath ?? PLAYER_CHARACTER.imagePath,
  states: {
    IDLE: { desc: '우쿨렐레를 잡고 박자에 맞춰 대기', icon: '👦🎵' },
    STRUM_DOWN: { desc: '다운 스트럼', icon: '🎸↓' },
    STRUM_UP: { desc: '업 스트럼', icon: '🎸↑' },
    PERFECT: { desc: '완벽한 리듬!', icon: '✨👦✨' },
    DAMAGE: { desc: '노트를 놓침', icon: '💥🤕' },
    VICTORY: { desc: '승리 포즈', icon: '🏆' },
  },
};

export const PLAYER_SPRITE_SHEET = {
  imagePath: 'assets/images/player_sheet.png',
  sheetWidth: 1024,
  sheetHeight: 558,
  frameCount: 3,
  displayHeight: 64,
  chromaKey: { r: 255, g: 0, b: 255 },
  frames: {
    IDLE: 2,
    STRUM_DOWN: 0,
    STRUM_UP: 1,
    PERFECT: 0,
    DAMAGE: 2,
    VICTORY: 0,
  },
};

/** 2인 대결 플레이어 A — 드럼 소년 */
export const DUEL_PLAYER_META = {
  id: 'duel_drum_boy',
  name: '드럼 소년',
  nameEn: 'Drummer Boy',
  imagePath: 'assets/images/duel/drummer_idle.png',
  displayHeight: 118,
  hudPortraitHeight: 44,
};

/** 드럼 소년 모션 (idle / attack PNG) */
export const DUEL_DRUM_MOTIONS = {
  idle: 'assets/images/duel/drummer_idle.png',
  attack: 'assets/images/duel/drummer_attack.png',
  displayHeight: 118,
  /** @type {Record<PlayerAnimState, 'idle'|'attack'>} */
  stateMap: {
    IDLE: 'idle',
    DAMAGE: 'idle',
    STRUM_DOWN: 'attack',
    STRUM_UP: 'attack',
    PERFECT: 'attack',
    VICTORY: 'idle',
  },
};

/** 2인 대결 상대 B — 피아노 소년 */
export const DUEL_OPPONENT_META = {
  id: 'piano_boy',
  name: '피아노 소년',
  nameEn: 'Piano Boy',
  imagePath: 'assets/images/duel/piano_idle.png',
  displayHeight: 136,
  hudPortraitHeight: 44,
};

/** 피아노 소년 모션 (idle / attack PNG) */
export const DUEL_PIANO_MOTIONS = {
  idle: 'assets/images/duel/piano_idle.png',
  attack: 'assets/images/duel/piano_attack.png',
  displayHeight: 136,
  /** @type {Record<PlayerAnimState, 'idle'|'attack'>} */
  stateMap: {
    IDLE: 'idle',
    DAMAGE: 'idle',
    STRUM_DOWN: 'attack',
    STRUM_UP: 'attack',
    PERFECT: 'attack',
    VICTORY: 'attack',
  },
};

/** @param {'A'|'B'} side */
export function getDuelFighterName(side) {
  return side === 'A' ? DUEL_PLAYER_META.name : DUEL_OPPONENT_META.name;
}

/** @param {string} strumGuide */
export function strumToPlayerState(strumGuide, judgment) {
  if (judgment === 'miss') return 'DAMAGE';
  if (judgment === 'perfect') return 'PERFECT';
  if (strumGuide.includes('↑') && !strumGuide.startsWith('↓↑↓')) return 'STRUM_UP';
  return 'STRUM_DOWN';
}
