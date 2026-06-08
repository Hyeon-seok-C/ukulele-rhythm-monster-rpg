import { getMonster, getWorld, getMonstersInWorld, getWorldCount } from './data.js?v=29';
import { generatePattern } from './rhythm-generator.js?v=29';
import { renderScore } from './notation.js?v=29';
import { getComboBonus, getDuelComboBonus, getDuelCombosFromState, addExp, saveGame, DUEL_HP, getDuelDifficultyLabel } from './game-state.js?v=29';
import { sounds } from './sounds.js?v=29';
import { renderRhythmCardSlots, spawnSuccessParticle, spawnComboFire, spawnBurstImpact } from './components/rhythm-card.js?v=29';
import {
  setupDuelFieldCharacters,
  setDuelFieldState,
  setDuelVictoryPose,
  highlightDuelTurn,
  shakeDuelFieldCharacter,
} from './components/duel-field.js?v=29';
import { initPlayerHero, setPlayerState, setVictoryPose } from './components/player-hero.js?v=29';
import { strumToPlayerState, DUEL_OPPONENT_META, DUEL_PLAYER_META, getDuelFighterName } from './player-meta.js?v=29';
import {
  renderBattleScene,
  renderDuelBattleScene,
  updateBattleStatsUI,
  hpBarColor,
  shakeMonster,
  shieldEffect,
  burstEffect,
  updateSkillButtonsUI,
} from './components/battle-ui.js?v=29';

/** @typedef {import('./game-state.js').GameState} GameState */

/** @type {GameState} */
let state;

/** @type {ReturnType<typeof generatePattern>|null} */
let currentPattern = null;

let answerHidden = false;
let showCounting = false;
let isPaused = false;
let scoreZoom = 1;
let shieldActive = false;
let guideActive = false;
/** @type {'A'|'B'|null} */
let duelShieldFor = null;
let onVictory = () => {};
let onDefeat = () => {};
let onMessage = () => {};

const els = {};

const DUEL_ATK = 3;

export function initBattle(ui, callbacks) {
  Object.assign(els, ui);
  onVictory = callbacks.onVictory;
  onDefeat = callbacks.onDefeat;
  onMessage = callbacks.onMessage ?? (() => {});
}

/** @param {GameState} gameState @param {{ forceDuel?: boolean }} [options] */
export function startBattle(gameState, options = {}) {
  state = gameState;
  if (options.forceDuel) state.player.duelMode = true;
  state.inBattle = true;
  isPaused = false;
  answerHidden = false;
  shieldActive = false;
  guideActive = false;
  duelShieldFor = null;

  if (state.player.duelMode) {
    state.player.duelMode = true;
    state.player.playerName = DUEL_PLAYER_META.name;
    state.player.skillPoints = state.player.maxSkillPoints ?? 3;
    state.monsterHp = 0;
    state.player.monsterIndex = 0;
    if (!state.duelOpponent) {
      state.duelOpponent = { hp: DUEL_HP, maxHp: DUEL_HP, name: DUEL_OPPONENT_META.name, combo: 0 };
    } else {
      state.duelOpponent.name = DUEL_OPPONENT_META.name;
      if (state.duelOpponent.combo == null) state.duelOpponent.combo = 0;
    }
    state.player.duelCombo = 0;
    state.player.combo = 0;
    if (!state.player.maxHp) state.player.maxHp = DUEL_HP;
  } else {
    const monster = getCurrentMonster();
    state.monsterHp = monster.hp;
    state.player.skillPoints = state.player.maxSkillPoints ?? 3;
    state.player.combo = 0;
  }

  applyBattleTheme();

  if (!state.player.duelMode) {
    const monster = getCurrentMonster();
    if (monster.isBoss || monster.isFinalBoss) {
      sounds.boss();
      els.battleMain?.classList.add('screen-shake');
      setTimeout(() => els.battleMain?.classList.remove('screen-shake'), 500);
    }
  }

  renderFullBattleUI();
  newPattern();
  saveGame(state);
}

function getCurrentMonster() {
  return getMonster(state.player.worldId, state.player.monsterIndex);
}

function getDifficulty() {
  if (state.player.duelMode) {
    return Math.min(3, Math.max(1, state.player.duelDifficulty ?? 2));
  }
  const world = getWorld(state.player.worldId);
  const monster = getCurrentMonster();
  if (monster.bossRule === 'max_difficulty') return 5;
  return world.difficulty;
}

function applyBattleTheme() {
  els.battleMain.className = 'battle-main';
  if (state.player.duelMode) {
    els.battleMain.classList.add('theme-duel');
    return;
  }
  const monster = getCurrentMonster();
  const world = getWorld(state.player.worldId);
  if (monster.isFinalBoss) els.battleMain.classList.add('theme-final-boss');
  else if (monster.isBoss) els.battleMain.classList.add('theme-boss');
  else els.battleMain.classList.add(world.theme);
}

function updateDuelIndicator() {
  if (!state.player.duelMode || !els.duelRole) return;
  const turn = state.player.duelAttacker;
  els.duelRole.textContent = `${getDuelFighterName(turn)} 차례`;
  const diffTag = document.getElementById('duel-difficulty-tag');
  if (diffTag) {
    const label = getDuelDifficultyLabel(state.player.duelDifficulty ?? 2);
    diffTag.textContent = `2인 대결 · ${label}`;
  }
  highlightDuelTurn(turn);
}

function renderFullBattleUI() {
  const { player } = state;
  const isDuel = Boolean(player.duelMode);

  if (isDuel) {
    renderDuelBattleScene(els.battleScene, els.battleHud, {
      opponentHp: state.duelOpponent?.hp ?? DUEL_HP,
      opponentMax: state.duelOpponent?.maxHp ?? DUEL_HP,
      player,
      duelCombos: getDuelCombosFromState(state),
      duelAttacker: player.duelAttacker,
    });

    setupDuelFieldCharacters();
    setDuelFieldState('A', 'IDLE', { autoResetMs: 0 });
    setDuelFieldState('B', 'IDLE', { autoResetMs: 0 });

    els.duelIndicator?.classList.remove('hidden');
    updateDuelIndicator();

    document.querySelector('.skill-btns')?.classList.remove('hidden');
    document.getElementById('skill-points-label')?.closest('p')?.classList.remove('hidden');
    document.getElementById('teacher-duel-diff')?.classList.remove('hidden');
    syncDuelDifficultyUI(player.duelDifficulty ?? 2);
  } else {
    const monster = getCurrentMonster();
    renderBattleScene(els.battleScene, els.battleHud, {
      worldId: player.worldId,
      monster,
      monsterHp: state.monsterHp,
      player: {
        ...player,
        name: '모험가 소년',
      },
    });

    initPlayerHero(document.getElementById('player-hero-mount'));
    setPlayerState('IDLE');

    els.duelIndicator?.classList.add('hidden');
    document.querySelector('.skill-btns')?.classList.remove('hidden');
    document.getElementById('skill-points-label')?.closest('p')?.classList.remove('hidden');
    document.getElementById('teacher-duel-diff')?.classList.add('hidden');
  }

  els.rhythmCardArea = document.getElementById('rhythm-card-area');
  els.messageBox = document.getElementById('message-box');
  els.particleZone = document.getElementById('particle-zone');

  updateSkillButtonsUI(state.player.skillPoints, state.player.maxSkillPoints);
}

function refreshStats() {
  if (state.player.duelMode) {
    updateBattleStatsUI(els.battleHud, {
      monsterHp: state.duelOpponent?.hp ?? 0,
      monsterMax: state.duelOpponent?.maxHp ?? DUEL_HP,
      player: state.player,
      duelMode: true,
      duelCombos: getDuelCombosFromState(state),
      duelAttacker: state.player.duelAttacker,
    });
    return;
  }

  const monster = getCurrentMonster();
  updateBattleStatsUI(els.battleHud, {
    monsterHp: state.monsterHp,
    monsterMax: monster.hp,
    player: state.player,
  });
  refreshSoloMonsterHpBar(monster);
}

/** @param {{ hp: number }} monster */
function refreshSoloMonsterHpBar(monster) {
  const fill = document.getElementById('enemy-hp-fill');
  const text = document.getElementById('enemy-hp-text');
  const hp = Math.max(0, state.monsterHp);
  const pct = Math.max(0, (hp / monster.hp) * 100);
  if (fill) {
    fill.style.width = `${pct}%`;
    fill.className = `rpg-bar-fill ${hpBarColor(hp, monster.hp)}`;
  }
  if (text) text.textContent = `${hp}/${monster.hp}`;
}

function renderPatternUI(successMeasure = undefined) {
  if (!currentPattern || !els.rhythmCardArea) return;
  renderRhythmCardSlots(els.rhythmCardArea, currentPattern.measureBeats, {
    hideStrum: answerHidden,
    showCounting,
    successMeasure,
  });
  if (els.vexflowOutput) {
    renderScore(els.vexflowOutput, currentPattern.events, currentPattern.measureBeats);
  }
  applyScoreZoom();
}

export function newPattern(options = {}) {
  if (isPaused && !options.force) return;
  guideActive = false;
  const difficulty = getDifficulty();
  const bossRule = state.player.duelMode ? null : (getCurrentMonster().bossRule ?? null);
  currentPattern = generatePattern(
    difficulty,
    bossRule,
    state.lastPatternKey
  );
  state.lastPatternKey = currentPattern.key;

  renderPatternUI();

  const duelLevelNames = { 1: '초급', 2: '중급', 3: '고급' };
  const lvl = state.player.duelMode
    ? (duelLevelNames[state.player.duelDifficulty ?? currentPattern.educationLevel] ?? '중급')
    : ({ 1: '초급', 2: '중급', 3: '상급', 4: '최상급', 5: '왕국급' })[currentPattern.educationLevel] ?? '초급';

  if (state.player.duelMode) {
    const turn = state.player.duelAttacker;
    setMessage(`${getDuelFighterName(turn)} 차례! ${currentPattern.measureCount}마디 · 4/4 · ${lvl}`);
  } else {
    const monster = getCurrentMonster();
    setMessage(`${monster.name}의 리듬! ${currentPattern.measureCount}마디 · 4/4 · ${lvl}`);
  }
  saveGame(state);
}

function setMessage(msg) {
  if (els.messageBox) els.messageBox.textContent = msg;
  onMessage(msg);
}

function showComboEffects(combo = state?.player?.combo ?? 0) {
  if (combo < 3) return;
  const zone = els.particleZone ?? document.getElementById('particle-zone');
  for (let i = 0; i < 3; i++) {
    setTimeout(() => spawnComboFire(zone), i * 120);
  }
}

function showLightPillar() {
  const pillar = document.createElement('div');
  pillar.className = 'light-pillar';
  document.body.appendChild(pillar);
  setTimeout(() => pillar.remove(), 1500);
}

function applyPlayerDamage(amount, reason) {
  if (guideActive) {
    setMessage('마스터 가이드! 선생님이 정답을 알려줘서 피해가 없습니다!');
    return false;
  }
  if (shieldActive) {
    shieldActive = false;
    shieldEffect(els.battleMain);
    setMessage('리듬 쉴드! 공격을 막았습니다!');
    return false;
  }
  state.player.hp = Math.max(0, state.player.hp - amount);
  if (reason) setMessage(reason);
  return true;
}

/** @param {'perfect'|'good'|'miss'} judgment @param {number} combo */
function getDuelDamage(judgment, combo) {
  const judgmentBonus = judgment === 'perfect' ? 2 : judgment === 'good' ? 1 : 0;
  const comboBonus = getDuelComboBonus(combo);
  return DUEL_ATK + judgmentBonus + comboBonus;
}

/** @param {'A'|'B'} side @returns {number} */
function getDuelCombo(side) {
  if (side === 'A') return state.player.duelCombo ?? 0;
  return state.duelOpponent?.combo ?? 0;
}

/** @param {'A'|'B'} side @param {number} value */
function setDuelCombo(side, value) {
  if (side === 'A') state.player.duelCombo = Math.max(0, value);
  else if (state.duelOpponent) state.duelOpponent.combo = Math.max(0, value);
}

/** @returns {boolean} duel ended */
function checkDuelEndAfterDamage() {
  if (state.duelOpponent && state.duelOpponent.hp <= 0) {
    handleDuelVictory('A');
    return true;
  }
  if (state.player.hp <= 0) {
    handleDuelVictory('B');
    return true;
  }
  return false;
}

/**
 * @param {'A'|'B'} attacker
 * @param {number} dmg
 * @returns {boolean} damage applied
 */
function applyDuelDamage(attacker, dmg) {
  const defender = attacker === 'A' ? 'B' : 'A';
  if (duelShieldFor === defender) {
    duelShieldFor = null;
    shieldEffect(els.battleMain);
    setMessage(`${getDuelFighterName(defender)} 리듬 쉴드! 공격을 막았습니다!`);
    return false;
  }
  if (attacker === 'A' && state.duelOpponent) {
    state.duelOpponent.hp = Math.max(0, state.duelOpponent.hp - dmg);
    shakeDuelFieldCharacter('B');
  } else {
    state.player.hp = Math.max(0, state.player.hp - dmg);
    shakeDuelFieldCharacter('A');
  }
  return true;
}

/** @param {'burst'|'shield'|'guide'} skill */
function useDuelSkill(skill) {
  const attacker = state.player.duelAttacker;

  if (skill === 'burst') {
    const comboBonus = Math.min(2, Math.floor(getDuelCombo(attacker) / 3));
    const dmg = 5 + comboBonus;
    sounds.burst();
    setDuelFieldState(attacker, 'STRUM_DOWN', { autoResetMs: 600 });
    if (applyDuelDamage(attacker, dmg)) {
      setMessage(`${getDuelFighterName(attacker)} 리듬 버스트! ${dmg} 데미지!`);
    }
    burstEffect(els.battleMain);
    const zone = els.particleZone ?? document.getElementById('particle-zone');
    spawnBurstImpact(zone);
    els.battleMain?.classList.add('screen-shake');
    setTimeout(() => els.battleMain?.classList.remove('screen-shake'), 500);
    sounds.attack();
  } else if (skill === 'shield') {
    duelShieldFor = attacker;
    sounds.shield();
    setDuelFieldState(attacker, 'IDLE', { autoResetMs: 0 });
    shieldEffect(els.battleMain);
    setMessage(`${getDuelFighterName(attacker)} 리듬 쉴드! 다음 피해 1회를 막습니다!`);
  } else if (skill === 'guide') {
    guideActive = true;
    answerHidden = false;
    renderPatternUI();
    sounds.guide();
    setDuelFieldState(attacker, 'PERFECT', { autoResetMs: 800 });
    setMessage(`${getDuelFighterName(attacker)} 마스터 가이드! 스트럼 정답을 확인하세요.`);
  }

  refreshStats();
  saveGame(state);
  if (skill === 'burst') checkDuelEndAfterDamage();
}

/** @param {'A'|'B'} winner */
function handleDuelVictory(winner) {
  state.inBattle = false;
  sounds.victory();
  setDuelVictoryPose(winner);
  saveGame(state);
  onVictory({ duel: true, winner });
}

/** @param {'perfect'|'good'|'miss'} judgment */
function judgeDuel(judgment) {
  const attacker = state.player.duelAttacker;
  const firstEvent = currentPattern.events[0];
  const strumGuide = firstEvent?.strum ?? '↓';

  if (judgment === 'miss') {
    sounds.miss();
    setDuelCombo(attacker, 0);
    setDuelFieldState(attacker, 'DAMAGE');
    shakeDuelFieldCharacter(attacker);
    setMessage(`${getDuelFighterName(attacker)} 실수! 공격 실패`);
  } else {
    sounds.success();
    setDuelCombo(attacker, getDuelCombo(attacker) + (judgment === 'perfect' ? 2 : 1));
    const attackerCombo = getDuelCombo(attacker);
    showComboEffects(attackerCombo);
    setDuelFieldState(attacker, strumToPlayerState(strumGuide, judgment));

    renderPatternUI(0);

    const zone = els.particleZone ?? document.getElementById('particle-zone');
    if (zone) spawnSuccessParticle(zone, zone.clientWidth / 2, zone.clientHeight / 2);

    const comboBonus = getDuelComboBonus(attackerCombo);
    const dmg = getDuelDamage(judgment, attackerCombo);
    applyDuelDamage(attacker, dmg);
    const comboNote = comboBonus > 0 ? ` (콤보 +${comboBonus})` : '';
    setMessage(`${getDuelFighterName(attacker)} 공격! ${dmg} 데미지!${comboNote}`);
    sounds.attack();
  }

  refreshStats();
  saveGame(state);

  if (checkDuelEndAfterDamage()) return;

  state.player.duelAttacker = attacker === 'A' ? 'B' : 'A';
  updateDuelIndicator();
  refreshStats();
  setTimeout(() => newPattern(), 900);
}

/**
 * @param {'perfect'|'good'|'miss'} judgment
 */
export function judge(judgment) {
  if (!state?.inBattle || !currentPattern || isPaused) return;

  if (state.player.duelMode) {
    judgeDuel(judgment);
    return;
  }

  const monster = getCurrentMonster();
  const firstEvent = currentPattern.events[0];
  const strumGuide = firstEvent?.strum ?? '↓';

  if (judgment === 'miss') {
    sounds.miss();
    state.player.combo = 0;
    setPlayerState('DAMAGE');

    applyPlayerDamage(monster.atk, `${monster.name}의 반격! ${monster.atk} 데미지!`);
    shakeMonster(document.getElementById('monster-field-sprite'));
  } else {
    sounds.success();
    state.player.combo += judgment === 'perfect' ? 2 : 1;
    state.player.combo = Number.isFinite(state.player.combo) ? state.player.combo : 0;
    showComboEffects();
    setPlayerState(strumToPlayerState(strumGuide, judgment));

    renderPatternUI(0);

    const zone = els.particleZone ?? document.getElementById('particle-zone');
    if (zone) spawnSuccessParticle(zone, zone.clientWidth / 2, zone.clientHeight / 2);

    const bonus = getComboBonus(state.player.combo);
    const dmg = (judgment === 'perfect' ? state.player.atk + bonus + 1 : state.player.atk + bonus);
    state.monsterHp = Math.max(0, state.monsterHp - dmg);
    const comboNote = bonus > 0 ? ` (콤보 +${bonus})` : '';
    setMessage(`공격 성공! ${dmg} 데미지!${comboNote}`);
    shakeMonster(document.getElementById('monster-field-sprite'));
    sounds.attack();
  }

  refreshStats();
  saveGame(state);
  guideActive = false;

  if (state.player.hp <= 0) {
    state.inBattle = false;
    sounds.gameOver();
    saveGame(state);
    onDefeat();
    return;
  }

  if (state.monsterHp <= 0) {
    handleVictory();
    return;
  }

  setTimeout(() => newPattern(), 900);
}

/** @param {'burst'|'shield'|'guide'} skill */
export function useSkill(skill) {
  if (!state?.inBattle) {
    setMessage('전투 중에만 스킬을 사용할 수 있습니다.');
    return;
  }
  if (isPaused) {
    setMessage('일시정지 중에는 스킬을 사용할 수 없습니다.');
    return;
  }
  if (state.player.skillPoints <= 0) {
    setMessage('스킬 포인트가 부족합니다!');
    return;
  }

  state.player.skillPoints -= 1;
  updateSkillButtonsUI(state.player.skillPoints, state.player.maxSkillPoints);

  if (state.player.duelMode) {
    useDuelSkill(skill);
    return;
  }

  if (skill === 'burst') {
    const monster = getCurrentMonster();
    const hpRef = Math.max(monster.hp, state.monsterHp, 1);
    const base = Math.max(4, Math.ceil(hpRef * 0.1));
    const combo = Number.isFinite(state.player.combo) ? state.player.combo : 0;
    const comboBonus = Math.min(4, Math.floor(combo / 2));
    const dmg = Math.max(4, Math.min(base + comboBonus, Math.ceil(hpRef * 0.22)));
    sounds.burst();
    setPlayerState('STRUM_DOWN', { autoResetMs: 600 });
    state.monsterHp = Math.max(0, state.monsterHp - dmg);
    const comboNote = comboBonus > 0 ? ` (콤보 +${comboBonus})` : '';
    setMessage(`리듬 버스트! ${dmg} 데미지!${comboNote}`);
    burstEffect(els.battleMain);
    const zone = els.particleZone ?? document.getElementById('particle-zone');
    spawnBurstImpact(zone);
    els.battleMain?.classList.add('screen-shake');
    setTimeout(() => els.battleMain?.classList.remove('screen-shake'), 500);
    shakeMonster(document.getElementById('monster-field-sprite'));
    showLightPillar();
    sounds.attack();
    refreshStats();
    saveGame(state);
    if (state.monsterHp <= 0) handleVictory();
    return;
  }

  if (skill === 'shield') {
    shieldActive = true;
    sounds.shield();
    setPlayerState('IDLE');
    shieldEffect(els.battleMain);
    setMessage('리듬 쉴드! 다음 피해 1회를 막습니다!');
  } else if (skill === 'guide') {
    guideActive = true;
    answerHidden = false;
    renderPatternUI();
    sounds.guide();
    setPlayerState('PERFECT', { autoResetMs: 800 });
    setMessage('마스터 가이드! 스트럼 정답을 확인하세요. (피해 없음)');
  }

  refreshStats();
  saveGame(state);
}

function handleVictory() {
  state.inBattle = false;
  const monster = getCurrentMonster();
  sounds.victory();
  setVictoryPose();

  const { leveledUp } = addExp(state.player, monster.exp);
  if (leveledUp) {
    sounds.levelUp();
    showLightPillar();
  }

  saveGame(state);
  onVictory({ leveledUp, monster });
}

export function fleeBattle() {
  state.inBattle = false;
  isPaused = false;
  saveGame(state);
}

export function setAnswerHidden(hidden) {
  answerHidden = hidden;
  renderPatternUI();
}

export function setShowCounting(show) {
  showCounting = show;
  renderPatternUI();
}

export function pauseBattle() {
  isPaused = true;
  saveGame(state);
}

export function resumeBattle() {
  isPaused = false;
}

export function isBattlePaused() {
  return isPaused;
}

export function setScoreZoom(zoom) {
  scoreZoom = zoom;
  applyScoreZoom();
}

/** @param {number} level 1=초급 2=중급 3=고급 */
export function setDuelDifficulty(level, options = {}) {
  if (!state?.player?.duelMode) return;
  const next = Math.min(3, Math.max(1, level));
  if (state.player.duelDifficulty === next && options.regenerate !== true) return;

  state.player.duelDifficulty = next;
  saveGame(state);
  updateDuelIndicator();
  syncDuelDifficultyUI(next);

  if (options.regenerate !== false) {
    newPattern({ force: true });
  }
}

/** @param {number} level */
export function syncDuelDifficultyUI(level) {
  document.querySelectorAll('[data-duel-diff]').forEach((btn) => {
    const n = Number(btn.getAttribute('data-duel-diff'));
    btn.classList.toggle('active', n === level);
  });
}

function applyScoreZoom() {
  if (els.scoreContainer) {
    els.scoreContainer.style.transform = `scale(${scoreZoom})`;
    els.scoreContainer.style.transformOrigin = 'top left';
  }
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

export function getState() {
  return state;
}

export function advanceAfterVictory() {
  state.player.monsterIndex++;
  const monstersInWorld = getMonstersInWorld(state.player.worldId);

  if (state.player.monsterIndex >= monstersInWorld) {
    const clearedWorldId = state.player.worldId;
    state.player.monsterIndex = 0;
    if (state.player.worldId < getWorldCount()) {
      state.player.worldId++;
      saveGame(state);
      return { nextWorld: true, cleared: false, clearedWorldId };
    }
    saveGame(state);
    return { nextWorld: false, cleared: true, clearedWorldId };
  }

  saveGame(state);
  return { nextWorld: false, cleared: false, clearedWorldId: null };
}
