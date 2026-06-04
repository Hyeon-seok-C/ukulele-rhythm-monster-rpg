import { WORLDS, getWorld } from './data.js';
import {
  createNewGame,
  loadGame,
  hasSave,
  saveGame,
  clearSave,
} from './game-state.js';
import {
  initBattle,
  startBattle,
  judge,
  useSkill,
  fleeBattle,
  setAnswerHidden,
  setScoreZoom,
  toggleFullscreen,
  newPattern,
  advanceAfterVictory,
  getState,
} from './battle.js';
import { sounds, resumeAudio } from './sounds.js';

/** @type {import('./game-state.js').GameState} */
let gameState = createNewGame();

const screens = {
  title: document.getElementById('screen-title'),
  world: document.getElementById('screen-world'),
  battle: document.getElementById('screen-battle'),
  result: document.getElementById('screen-result'),
};

const battleEls = {
  battleMain: document.querySelector('.battle-main'),
  playerHpFill: document.getElementById('player-hp-fill'),
  playerHpText: document.getElementById('player-hp-text'),
  playerLevel: document.getElementById('player-level'),
  playerExp: document.getElementById('player-exp'),
  comboDisplay: document.getElementById('combo-display'),
  playerName: document.getElementById('player-name'),
  monsterHpFill: document.getElementById('monster-hp-fill'),
  monsterHpText: document.getElementById('monster-hp-text'),
  monsterSprite: document.getElementById('monster-sprite'),
  monsterName: document.getElementById('monster-name'),
  worldLabel: document.getElementById('world-label'),
  bossBadge: document.getElementById('boss-badge'),
  messageBox: document.getElementById('message-box'),
  vexflowOutput: document.getElementById('vexflow-output'),
  strumHints: document.getElementById('strum-hints'),
  strumContainer: document.getElementById('strum-container'),
  scoreContainer: document.getElementById('score-container'),
  duelIndicator: document.getElementById('duel-indicator'),
  duelRole: document.getElementById('duel-role'),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s?.classList.remove('active'));
  screens[name]?.classList.add('active');
}

function bindClick(id, fn) {
  document.getElementById(id)?.addEventListener('click', () => {
    resumeAudio();
    sounds.click();
    fn();
  });
}

function renderWorldList() {
  const list = document.getElementById('world-list');
  if (!list) return;
  list.innerHTML = WORLDS.map(
    (w) => `
    <div class="world-card w${w.id}" data-world="${w.id}">
      <h3>월드 ${w.id}</h3>
      <p>${w.name}</p>
      <p style="margin-top:8px;font-size:10px;">난이도 ${w.difficulty}</p>
    </div>`
  ).join('');

  list.querySelectorAll('.world-card').forEach((card) => {
    card.addEventListener('click', () => {
      resumeAudio();
      sounds.click();
      const worldId = Number(card.getAttribute('data-world'));
      gameState.player.worldId = worldId;
      gameState.player.monsterIndex = 0;
      saveGame(gameState);
      enterBattle();
    });
  });
}

function enterBattle() {
  showScreen('battle');
  gameState = getState() ?? gameState;
  startBattle(gameState);
}

function startNewGame(duelMode = false) {
  gameState = createNewGame(duelMode);
  saveGame(gameState);
  if (duelMode) {
    enterBattle();
  } else {
    showScreen('world');
    renderWorldList();
  }
}

function showResult(title, message, leveledUp = false) {
  showScreen('result');
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-message').textContent = message;
  const lvlFx = document.getElementById('levelup-effect');
  if (leveledUp) {
    lvlFx.classList.remove('hidden');
  } else {
    lvlFx.classList.add('hidden');
  }
}

initBattle(battleEls, {
  onVictory: ({ leveledUp, monster }) => {
    const msg = leveledUp
      ? `${monster.name}을(를) 물리쳤습니다! 레벨업!`
      : `${monster.name}을(를) 물리쳤습니다! +${monster.exp} EXP`;
    showResult('승리!', msg, leveledUp);
  },
  onDefeat: () => {
    showResult('게임 오버', 'HP가 0이 되었습니다. 다시 도전하세요!');
  },
});

bindClick('btn-new-game', () => startNewGame(false));
bindClick('btn-duel-mode', () => startNewGame(true));
bindClick('btn-continue', () => {
  const saved = loadGame();
  if (saved) {
    gameState = saved;
    saveGame(gameState);
    enterBattle();
  }
});

bindClick('btn-world-back', () => showScreen('title'));

bindClick('btn-judge-perfect', () => judge('perfect'));
bindClick('btn-judge-good', () => judge('good'));
bindClick('btn-judge-miss', () => judge('miss'));
bindClick('btn-skill-burst', () => useSkill('burst'));
bindClick('btn-skill-tempo', () => useSkill('tempo'));
bindClick('btn-skill-perfect', () => useSkill('perfect'));
bindClick('btn-regenerate', () => newPattern());
bindClick('btn-hide-answer', () => setAnswerHidden(true));
bindClick('btn-show-answer', () => setAnswerHidden(false));
bindClick('btn-zoom-100', () => setScoreZoom(1));
bindClick('btn-zoom-200', () => setScoreZoom(2));
bindClick('btn-zoom-300', () => setScoreZoom(3));
bindClick('btn-fullscreen', () => toggleFullscreen());
bindClick('btn-flee', () => {
  fleeBattle();
  showScreen('world');
  renderWorldList();
});

document.getElementById('btn-result-continue')?.addEventListener('click', handleResultContinue);

function handleResultContinue() {
  resumeAudio();
  sounds.click();

  const st = getState() ?? gameState;
  if (st.player.hp <= 0) {
    clearSave();
    gameState = createNewGame(st.player.duelMode);
    showScreen('title');
    updateContinueButton();
    return;
  }

  const { nextWorld, cleared } = advanceAfterVictory();
  if (cleared) {
    document.getElementById('result-title').textContent = '축하합니다!';
    document.getElementById('result-message').textContent =
      '모든 몬스터를 물리쳤습니다! 우쿨렐레 마스터!';
    document.getElementById('levelup-effect').classList.add('hidden');
    return;
  }

  if (nextWorld) {
    const w = getWorld(st.player.worldId);
    showResult('월드 클리어!', `${w.name}을(를) 정복했습니다!`);
    return;
  }

  enterBattle();
}

function updateContinueButton() {
  const btn = document.getElementById('btn-continue');
  if (btn) btn.disabled = !hasSave();
}

updateContinueButton();
renderWorldList();
