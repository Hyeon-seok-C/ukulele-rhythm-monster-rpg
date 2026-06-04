import { getMonster, getWorld } from './data.js';
import { generatePattern, getStrumHints } from './rhythm-generator.js';
import { renderScore } from './notation.js';
import { getComboBonus, addExp, saveGame } from './game-state.js';
import { sounds } from './sounds.js';

/** @typedef {import('./game-state.js').GameState} GameState */

/** @type {GameState} */
let state;

/** @type {ReturnType<typeof generatePattern>|null} */
let currentPattern = null;

let answerHidden = false;
let scoreZoom = 1;
let onVictory = () => {};
let onDefeat = () => {};
let onMessage = () => {};

const els = {};

export function initBattle(ui, callbacks) {
  Object.assign(els, ui);
  onVictory = callbacks.onVictory;
  onDefeat = callbacks.onDefeat;
  onMessage = callbacks.onMessage ?? (() => {});
}

/** @param {GameState} gameState */
export function startBattle(gameState) {
  state = gameState;
  state.inBattle = true;
  const monster = getCurrentMonster();
  state.monsterHp = monster.hp;

  if (monster.isBoss) {
    sounds.boss();
    els.battleMain?.classList.add('screen-shake');
    setTimeout(() => els.battleMain?.classList.remove('screen-shake'), 500);
  }

  updateBattleUI();
  newPattern();
  saveGame(state);
}

function getCurrentMonster() {
  return getMonster(state.player.worldId, state.player.monsterIndex);
}

function getDifficulty() {
  const world = getWorld(state.player.worldId);
  const monster = getCurrentMonster();
  if (monster.bossRule === 'max_difficulty') return 5;
  return world.difficulty;
}

export function newPattern() {
  const monster = getCurrentMonster();
  const difficulty = getDifficulty();
  currentPattern = generatePattern(
    difficulty,
    monster.bossRule ?? null,
    state.lastPatternKey
  );
  state.lastPatternKey = currentPattern.key;

  renderScore(els.vexflowOutput, currentPattern.events);
  renderStrumHints(currentPattern.events);
  applyScoreZoom();

  setMessage(`${monster.name}의 리듬! (${currentPattern.length}박) — 연주 후 교사가 판정하세요.`);
  saveGame(state);
}

function renderStrumHints(events) {
  const hints = getStrumHints(events);
  els.strumHints.innerHTML = hints
    .map(
      (h, i) =>
        `<div class="strum-item ${h.isRest ? 'rest' : ''}"><span>${h.strum}</span></div>`
    )
    .join('');

  if (answerHidden) {
    els.strumContainer.classList.add('strum-hidden');
  } else {
    els.strumContainer.classList.remove('strum-hidden');
  }
}

function setMessage(msg) {
  els.messageBox.textContent = msg;
  onMessage(msg);
}

function updateBattleUI() {
  const { player } = state;
  const monster = getCurrentMonster();
  const world = getWorld(player.worldId);

  els.playerHpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
  els.playerHpText.textContent = `${player.hp}/${player.maxHp}`;
  els.playerLevel.textContent = `Lv.${player.level}`;
  els.playerExp.textContent = String(player.exp);
  els.comboDisplay.textContent = `콤보 ${player.combo}`;

  els.monsterHpFill.style.width = `${(state.monsterHp / monster.hp) * 100}%`;
  els.monsterHpText.textContent = `${state.monsterHp}/${monster.hp}`;
  els.monsterSprite.textContent = monster.emoji;
  els.monsterName.textContent = monster.name;
  els.worldLabel.textContent = `월드 ${world.id} · ${world.name}`;

  els.battleMain.className = 'battle-main';
  els.battleMain.classList.add(world.theme);
  if (monster.isBoss) {
    els.battleMain.classList.remove('theme-beginner', 'theme-intermediate', 'theme-advanced');
    els.battleMain.classList.add('theme-boss');
    els.bossBadge.classList.remove('hidden');
  } else {
    els.bossBadge.classList.add('hidden');
  }

  if (player.duelMode) {
    els.duelIndicator.classList.remove('hidden');
    els.duelRole.textContent =
      player.duelAttacker === 'A' ? 'A 학생 공격 차례' : 'B 학생 방어 차례';
    els.playerName.textContent = player.duelAttacker === 'A' ? 'A 학생' : 'B 학생';
  } else {
    els.duelIndicator.classList.add('hidden');
    els.playerName.textContent = '플레이어';
  }
}

function showComboFlame() {
  if (state.player.combo < 3) return;
  const flame = document.createElement('div');
  flame.className = 'combo-flame';
  flame.textContent = '🔥'.repeat(Math.min(state.player.combo, 5));
  flame.style.left = `${40 + Math.random() * 40}%`;
  flame.style.top = '50%';
  document.body.appendChild(flame);
  setTimeout(() => flame.remove(), 800);
}

function showLightPillar() {
  const pillar = document.createElement('div');
  pillar.className = 'light-pillar';
  document.body.appendChild(pillar);
  setTimeout(() => pillar.remove(), 1500);
}

/**
 * @param {'perfect'|'good'|'miss'} judgment
 */
export function judge(judgment) {
  if (!state?.inBattle || !currentPattern) return;

  const monster = getCurrentMonster();
  const isAttackTurn = !state.player.duelMode || state.player.duelAttacker === 'A';

  if (judgment === 'miss') {
    sounds.miss();
    state.player.combo = 0;

    if (isAttackTurn) {
      const dmg = monster.atk;
      state.player.hp = Math.max(0, state.player.hp - dmg);
      setMessage(`${monster.name}의 반격! ${dmg} 데미지!`);
      els.monsterSprite.classList.add('shake');
      setTimeout(() => els.monsterSprite.classList.remove('shake'), 400);
    } else {
      setMessage('방어 실패! A 학생이 데미지를 받습니다!');
      const dmg = monster.atk;
      state.player.hp = Math.max(0, state.player.hp - dmg);
      els.battleMain.classList.add('shield-effect');
      setTimeout(() => els.battleMain.classList.remove('shield-effect'), 500);
    }
  } else {
    sounds.success();
    state.player.combo += judgment === 'perfect' ? 2 : 1;
    showComboFlame();

    if (isAttackTurn) {
      const bonus = getComboBonus(state.player.combo);
      const baseDmg = state.player.atk + bonus;
      const dmg = judgment === 'perfect' ? baseDmg + 1 : baseDmg;
      state.monsterHp = Math.max(0, state.monsterHp - dmg);
      setMessage(`공격 성공! ${dmg} 데미지! (콤보 보너스 +${bonus})`);
      els.monsterSprite.classList.add('shake');
      setTimeout(() => els.monsterSprite.classList.remove('shake'), 400);
      sounds.attack();
    } else {
      setMessage('방어 성공! A 학생을 보호했습니다!');
      els.battleMain.classList.add('shield-effect');
      setTimeout(() => els.battleMain.classList.remove('shield-effect'), 500);
    }
  }

  updateBattleUI();
  saveGame(state);

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

  if (state.player.duelMode) {
    state.player.duelAttacker = state.player.duelAttacker === 'A' ? 'B' : 'A';
    updateBattleUI();
  }

  setTimeout(() => newPattern(), 800);
}

/** @param {'burst'|'tempo'|'perfect'} skill */
export function useSkill(skill) {
  if (!state?.inBattle) return;

  const damages = { burst: 10, tempo: 15, perfect: 20 };
  const names = { burst: '리듬 버스트', tempo: '템포 브레이크', perfect: '퍼펙트 스트럼' };
  const dmg = damages[skill];

  sounds.skill();
  state.monsterHp = Math.max(0, state.monsterHp - dmg);
  setMessage(`${names[skill]}! ${dmg} 데미지!`);
  els.monsterSprite.classList.add('shake');
  setTimeout(() => els.monsterSprite.classList.remove('shake'), 400);
  updateBattleUI();
  saveGame(state);

  if (state.monsterHp <= 0) {
    handleVictory();
  }
}

function handleVictory() {
  state.inBattle = false;
  const monster = getCurrentMonster();
  sounds.victory();

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
  saveGame(state);
}

export function setAnswerHidden(hidden) {
  answerHidden = hidden;
  if (currentPattern) renderStrumHints(currentPattern.events);
}

export function setScoreZoom(zoom) {
  scoreZoom = zoom;
  applyScoreZoom();
}

function applyScoreZoom() {
  if (els.scoreContainer) {
    els.scoreContainer.style.transform = `scale(${scoreZoom})`;
    els.scoreContainer.style.marginBottom = scoreZoom > 1 ? `${(scoreZoom - 1) * 80}px` : '0';
  }
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export function getState() {
  return state;
}

export function advanceAfterVictory() {
  state.player.monsterIndex++;
  const monstersInWorld = 6;

  if (state.player.monsterIndex >= monstersInWorld) {
    state.player.monsterIndex = 0;
    if (state.player.worldId < 5) {
      state.player.worldId++;
      saveGame(state);
      return { nextWorld: true, cleared: false };
    }
    saveGame(state);
    return { nextWorld: false, cleared: true };
  }

  saveGame(state);
  return { nextWorld: false, cleared: false };
}
