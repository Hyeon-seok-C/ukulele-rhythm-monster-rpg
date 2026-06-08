import { EXP_TABLE, PLAYER_CHARACTER } from './data.js';
import { DUEL_OPPONENT_META, DUEL_PLAYER_META } from './player-meta.js';

const SAVE_KEY = 'rhythm-monster-rpg-save';
const DUEL_SAVE_KEY = 'rhythm-monster-rpg-duel-save';
const LEGACY_SAVE_KEY = 'ukulele-rhythm-monster-save';

/** @typedef {{
 *   level: number,
 *   hp: number,
 *   maxHp: number,
 *   atk: number,
 *   exp: number,
 *   combo: number,
 *   worldId: number,
 *   monsterIndex: number,
 *   duelMode: boolean,
 *   duelAttacker: 'A'|'B',
 *   duelDifficulty: number,
 *   playerName: string,
 *   skillPoints: number,
 *   maxSkillPoints: number,
 *   duelCombo?: number,
 * }} PlayerState */

/** @typedef {{ hp: number, maxHp: number, name: string, combo?: number }} DuelOpponent */

/** @typedef {{
 *   player: PlayerState,
 *   monsterHp: number,
 *   duelOpponent: DuelOpponent|null,
 *   lastPatternKey: string|null,
 *   inBattle: boolean,
 * }} GameState */

export const DUEL_HP = 20;

/** @param {number} level 1=초급 2=중급 3=고급 */
export function getDuelDifficultyLabel(level) {
  return ({ 1: '초급', 2: '중급', 3: '고급' })[level] ?? '중급';
}

export function createInitialPlayer(duelMode = false, duelDifficulty = 2) {
  return {
    level: 1,
    hp: DUEL_HP,
    maxHp: DUEL_HP,
    atk: 3,
    exp: 0,
    combo: 0,
    worldId: 1,
    monsterIndex: 0,
    duelMode,
    duelAttacker: /** @type {'A'} */ ('A'),
    duelDifficulty: duelMode ? Math.min(3, Math.max(1, duelDifficulty)) : 2,
    playerName: duelMode ? DUEL_PLAYER_META.name : PLAYER_CHARACTER.name,
    skillPoints: 3,
    maxSkillPoints: 3,
    duelCombo: duelMode ? 0 : undefined,
  };
}

/** @returns {GameState} */
export function createNewGame(duelMode = false, duelDifficulty = 2) {
  return {
    player: createInitialPlayer(duelMode, duelDifficulty),
    monsterHp: 0,
    duelOpponent: duelMode
      ? { hp: DUEL_HP, maxHp: DUEL_HP, name: DUEL_OPPONENT_META.name, combo: 0 }
      : null,
    lastPatternKey: null,
    inBattle: false,
  };
}

/** @param {GameState} data */
function normalizeSave(data) {
  if (data.player.duelMode == null) data.player.duelMode = false;
  if (data.player.duelDifficulty == null) data.player.duelDifficulty = 2;
  if (data.player.maxSkillPoints == null) data.player.maxSkillPoints = 3;
  if (data.player.skillPoints == null) data.player.skillPoints = data.player.maxSkillPoints;
  if (data.player.duelMode && data.player.playerName === 'A 학생') {
    data.player.playerName = DUEL_PLAYER_META.name;
  }
  if (data.player.duelMode && !data.duelOpponent) {
    data.duelOpponent = { hp: DUEL_HP, maxHp: DUEL_HP, name: DUEL_OPPONENT_META.name, combo: 0 };
  } else if (data.duelOpponent?.name === 'B 학생') {
    data.duelOpponent.name = DUEL_OPPONENT_META.name;
  }
  if (data.player.duelMode) {
    if (data.player.duelCombo == null) {
      data.player.duelCombo = /** @type {{ A?: number }} */ (data).duelCombos?.A ?? 0;
    }
    if (data.duelOpponent && data.duelOpponent.combo == null) {
      data.duelOpponent.combo = /** @type {{ B?: number }} */ (data).duelCombos?.B ?? 0;
    }
  }
  delete /** @type {{ duelCombos?: unknown }} */ (data).duelCombos;
  return data;
}

export function getExpForLevel(level) {
  if (level <= 1) return 0;
  if (level > EXP_TABLE.length) return EXP_TABLE[EXP_TABLE.length - 1];
  return EXP_TABLE[level - 1];
}

export function getNextLevelExp(level) {
  if (level >= EXP_TABLE.length) return EXP_TABLE[EXP_TABLE.length - 1] + 100;
  return EXP_TABLE[level];
}

/** @param {number} combo */
export function getComboBonus(combo) {
  if (combo >= 10) return 5;
  if (combo >= 7) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1;
  return 0;
}

/** 2인 대결 — 콤보 보너스 (턴제라 기준을 낮춤) */
export function getDuelComboBonus(combo) {
  if (combo >= 10) return 5;
  if (combo >= 7) return 4;
  if (combo >= 5) return 3;
  if (combo >= 3) return 2;
  if (combo >= 2) return 1;
  return 0;
}

/** @param {GameState} gameState @returns {{ A: number, B: number }} */
export function getDuelCombosFromState(gameState) {
  return {
    A: gameState.player.duelCombo ?? 0,
    B: gameState.duelOpponent?.combo ?? 0,
  };
}

/**
 * @param {PlayerState} player
 * @returns {{ leveledUp: boolean, newLevel: number }}
 */
export function addExp(player, amount) {
  player.exp += amount;
  let leveledUp = false;
  while (player.level < 10 && player.exp >= getNextLevelExp(player.level)) {
    player.level++;
    player.maxHp += 5;
    player.hp = player.maxHp;
    player.atk += 1;
    leveledUp = true;
  }
  return { leveledUp, newLevel: player.level };
}

export function saveGame(state) {
  try {
    const key = state.player.duelMode ? DUEL_SAVE_KEY : SAVE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
    if (state.player.duelMode) {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    } else {
      localStorage.removeItem(DUEL_SAVE_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

/** @param {'solo'|'duel'} [mode] */
export function loadGame(mode = 'solo') {
  try {
    let raw = null;
    if (mode === 'duel') {
      raw = localStorage.getItem(DUEL_SAVE_KEY);
    } else {
      raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
    }
    if (!raw) return null;
    const data = normalizeSave(/** @type {GameState} */ (JSON.parse(raw)));
    if (mode === 'solo' && data.player.duelMode) return null;
    if (mode === 'duel' && !data.player.duelMode) return null;
    return data;
  } catch {
    return null;
  }
}

/** 싱글 RPG 이어하기용 — 2인 대결 저장은 제외 */
export function hasSave() {
  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
  if (!raw) return false;
  try {
    const data = normalizeSave(JSON.parse(raw));
    return !data.player.duelMode;
  } catch {
    return false;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(DUEL_SAVE_KEY);
  localStorage.removeItem(LEGACY_SAVE_KEY);
}
