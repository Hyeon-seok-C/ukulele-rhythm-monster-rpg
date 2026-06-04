import { EXP_TABLE } from './data.js';

const SAVE_KEY = 'ukulele-rhythm-monster-save';

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
 *   playerName: string,
 * }} PlayerState */

/** @typedef {{
 *   player: PlayerState,
 *   monsterHp: number,
 *   lastPatternKey: string|null,
 *   inBattle: boolean,
 * }} GameState */

export function createInitialPlayer(duelMode = false) {
  return {
    level: 1,
    hp: 20,
    maxHp: 20,
    atk: 3,
    exp: 0,
    combo: 0,
    worldId: 1,
    monsterIndex: 0,
    duelMode,
    duelAttacker: /** @type {'A'} */ ('A'),
    playerName: duelMode ? 'A 학생' : '플레이어',
  };
}

/** @returns {GameState} */
export function createNewGame(duelMode = false) {
  return {
    player: createInitialPlayer(duelMode),
    monsterHp: 0,
    lastPatternKey: null,
    inBattle: false,
  };
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return /** @type {GameState} */ (JSON.parse(raw));
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
