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
  toggleFullscreen,
  newPattern,
  advanceAfterVictory,
  getState,
  pauseBattle,
  resumeBattle,
  setShowCounting,
  setDuelDifficulty,
} from './battle.js';
import { sounds, resumeAudio } from './sounds.js';
import { renderPauseMap, showPauseOverlay } from './pause-menu.js';
import { renderWorldMap } from './components/world-map-ui.js';
import { renderBestiaryGrid } from './components/bestiary-ui.js';
import { initTitleHero } from './components/title-hero.js';
import { getDuelFighterName } from './player-meta.js';
import { DUEL_HP } from './game-state.js';

/** @type {import('./game-state.js').GameState} */
let gameState = createNewGame();
let selectedWorldId = 1;
/** @type {boolean} 5월드 클리어 축하 화면 → 타이틀 복귀 대기 */
let awaitingClearToTitle = false;

const screens = {
  title: document.getElementById('screen-title'),
  world: document.getElementById('screen-world'),
  battle: document.getElementById('screen-battle'),
  result: document.getElementById('screen-result'),
};

const battleEls = {
  battleMain: document.getElementById('battle-main'),
  battleScene: document.getElementById('battle-scene'),
  battleHud: document.getElementById('battle-hud'),
  vexflowOutput: document.getElementById('vexflow-output'),
  scoreContainer: document.getElementById('score-container'),
  duelIndicator: document.getElementById('duel-indicator'),
  duelRole: document.getElementById('duel-role'),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s?.classList.remove('active'));
  screens[name]?.classList.add('active');
  if (name === 'title') showDuelSetup(false);
}

function bindClick(id, fn) {
  document.getElementById(id)?.addEventListener('click', () => {
    resumeAudio();
    sounds.click();
    fn();
  });
}

function renderWorldScreen() {
  const root = document.getElementById('world-map-root');
  const startBtn = document.getElementById('btn-world-start');
  if (!root) return;

  selectedWorldId = gameState.player.worldId || 1;

  renderWorldMap(root, {
    currentWorldId: selectedWorldId,
    maxUnlockedWorldId: 5,
    mode: 'select',
    showDetail: true,
    onSelectWorld: (worldId) => {
      selectedWorldId = worldId;
      startBtn?.classList.remove('hidden');
    },
  });

  startBtn?.classList.toggle('hidden', !selectedWorldId);
  renderBestiaryGrid(document.getElementById('bestiary-root'));
}

function enterBattle() {
  showScreen('battle');
  syncBattleChromeForMode();
  startBattle(gameState);
}

function syncBattleChromeForMode() {
  const duel = gameState.player.duelMode;
  document.getElementById('pause-tab-map')?.classList.toggle('hidden', duel);
  const fleeBtn = document.getElementById('btn-flee');
  if (fleeBtn) fleeBtn.textContent = duel ? '🚪 나가기' : '🏃 도망';
}

function startWorldBattle(worldId) {
  gameState.player.worldId = worldId;
  gameState.player.monsterIndex = 0;
  saveGame(gameState);
  enterBattle();
}

function showDuelSetup(show) {
  document.getElementById('title-buttons')?.classList.toggle('hidden', show);
  document.getElementById('duel-setup')?.classList.toggle('hidden', !show);
}

function startDuelWithDifficulty(difficulty) {
  clearSave();
  gameState = createNewGame(true, difficulty);
  saveGame(gameState);
  showDuelSetup(false);
  enterDuelBattle();
}

function startNewGame(duelMode = false, duelDifficulty = 2) {
  clearSave();
  gameState = createNewGame(duelMode, duelDifficulty);
  saveGame(gameState);
  if (duelMode) enterDuelBattle();
  else {
    showScreen('world');
    renderWorldScreen();
  }
}

function enterDuelBattle() {
  gameState.player.duelMode = true;
  if (!gameState.duelOpponent) {
    gameState.duelOpponent = { hp: DUEL_HP, maxHp: DUEL_HP, name: '피아노 소년' };
  }
  saveGame(gameState);
  showScreen('battle');
  syncBattleChromeForMode();
  startBattle(gameState, { forceDuel: true });
}

function showResult(title, message, leveledUp = false, icon = '🎉') {
  showScreen('result');
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-message').textContent = message;
  const iconEl = document.getElementById('result-icon');
  if (iconEl) iconEl.textContent = icon;
  document.getElementById('levelup-effect')?.classList.toggle('hidden', !leveledUp);
}

initBattle(battleEls, {
  onVictory: (result) => {
    if (result.duel) {
      showResult(
        '대결 종료!',
        `${getDuelFighterName(result.winner)} 승리! 🎉`,
        false,
        '🏆'
      );
      return;
    }
    showResult(
      '승리!',
      result.leveledUp
        ? `${result.monster.name}을(를) 물리쳤습니다! 레벨업!`
        : `${result.monster.name}을(를) 물리쳤습니다! +${result.monster.exp} EXP`,
      result.leveledUp,
      '🎉'
    );
  },
  onDefeat: () => showResult('게임 오버', 'HP가 0이 되었습니다. 다시 도전하세요!', false, '🏳️'),
});

bindClick('btn-new-game', () => startNewGame(false));
bindClick('btn-duel-mode', () => showDuelSetup(true));
bindClick('btn-duel-easy', () => startDuelWithDifficulty(1));
bindClick('btn-duel-normal', () => startDuelWithDifficulty(2));
bindClick('btn-duel-hard', () => startDuelWithDifficulty(3));
bindClick('btn-duel-setup-back', () => showDuelSetup(false));
bindClick('btn-continue', () => {
  const saved = loadGame('solo');
  if (saved) {
    gameState = saved;
    saveGame(gameState);
    enterBattle();
  }
});

bindClick('btn-world-back', () => showScreen('title'));
bindClick('btn-world-start', () => startWorldBattle(selectedWorldId));
bindClick('btn-judge-perfect', () => judge('perfect'));
bindClick('btn-judge-good', () => judge('good'));
bindClick('btn-judge-miss', () => judge('miss'));
bindClick('btn-skill-burst', () => useSkill('burst'));
bindClick('btn-skill-shield', () => useSkill('shield'));
bindClick('btn-skill-guide', () => useSkill('guide'));
bindClick('btn-regenerate', () => newPattern());
bindClick('btn-hide-answer', () => setAnswerHidden(true));
bindClick('btn-show-answer', () => setAnswerHidden(false));
let countingOn = false;
bindClick('btn-toggle-counting', () => {
  countingOn = !countingOn;
  setShowCounting(countingOn);
  document.getElementById('btn-toggle-counting')?.classList.toggle('active', countingOn);
});
bindClick('btn-pause', openPauseMenu);
bindClick('btn-resume', closePauseMenu);

document.getElementById('pause-tab-menu')?.addEventListener('click', () => switchPauseTab('menu'));
document.getElementById('pause-tab-map')?.addEventListener('click', () => switchPauseTab('map'));

function getPauseCallbacks() {
  return {
    onResume: closePauseMenu,
    onDuelDifficultyChange: (level) => {
      resumeAudio();
      sounds.click();
      setDuelDifficulty(level);
    },
  };
}

function openPauseMenu() {
  resumeAudio();
  sounds.click();
  pauseBattle();
  syncBattleChromeForMode();
  showPauseOverlay(true);

  const duel = getState()?.player?.duelMode;
  const tabs = document.querySelector('.pause-tabs');
  const menuEl = document.getElementById('pause-content-menu');
  const duelEl = document.getElementById('pause-content-duel');
  const mapEl = document.getElementById('pause-content-map');

  if (duel) {
    tabs?.classList.add('hidden');
    menuEl?.classList.add('hidden');
    mapEl?.classList.add('hidden');
    duelEl?.classList.remove('hidden');
    renderPauseMap(duelEl, getPauseCallbacks());
    return;
  }

  tabs?.classList.remove('hidden');
  duelEl?.classList.add('hidden');
  switchPauseTab('menu');
}

function closePauseMenu() {
  resumeAudio();
  sounds.click();
  resumeBattle();
  showPauseOverlay(false);
  document.getElementById('pause-content-duel')?.classList.add('hidden');
}

function switchPauseTab(tab) {
  const duel = getState()?.player?.duelMode;
  if (duel) return;

  document.getElementById('pause-tab-menu')?.classList.toggle('active', tab === 'menu');
  document.getElementById('pause-tab-map')?.classList.toggle('active', tab === 'map');
  document.getElementById('pause-content-menu')?.classList.toggle('hidden', tab !== 'menu');
  document.getElementById('pause-content-map')?.classList.toggle('hidden', tab !== 'map');
  if (tab === 'map') {
    renderPauseMap(document.getElementById('pause-content-map'), getPauseCallbacks());
  }
}
bindClick('btn-fullscreen', () => toggleFullscreen());
document.querySelectorAll('[data-duel-diff]').forEach((btn) => {
  btn.addEventListener('click', () => {
    resumeAudio();
    sounds.click();
    const level = Number(btn.getAttribute('data-duel-diff'));
    setDuelDifficulty(level);
  });
});
bindClick('btn-flee', () => {
  const wasDuel = gameState.player.duelMode;
  fleeBattle();
  if (wasDuel) {
    clearSave();
    gameState = createNewGame(false);
    showScreen('title');
    updateContinueButton();
    return;
  }
  showScreen('world');
  renderWorldScreen();
});

document.getElementById('btn-teacher-toggle')?.addEventListener('click', () => {
  document.getElementById('teacher-panel')?.classList.toggle('open');
});

document.getElementById('btn-result-continue')?.addEventListener('click', handleResultContinue);

function handleResultContinue() {
  resumeAudio();
  sounds.click();

  gameState = getState() ?? gameState;

  if (gameState.player.duelMode) {
    clearSave();
    gameState = createNewGame(false);
    saveGame(gameState);
    showScreen('title');
    updateContinueButton();
    return;
  }

  if (gameState.player.hp <= 0) {
    clearSave();
    gameState = createNewGame(gameState.player.duelMode);
    saveGame(gameState);
    showScreen('title');
    updateContinueButton();
    return;
  }

  if (awaitingClearToTitle) {
    awaitingClearToTitle = false;
    clearSave();
    gameState = createNewGame(false);
    showScreen('title');
    updateContinueButton();
    return;
  }

  const { nextWorld, cleared, clearedWorldId } = advanceAfterVictory();
  if (cleared) {
    awaitingClearToTitle = true;
    showResult('축하합니다!', '모든 몬스터를 물리쳤습니다! 리듬 마스터!', false, '👑');
    return;
  }

  if (nextWorld) {
    const w = getWorld(clearedWorldId ?? gameState.player.worldId);
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

function boot() {
  if (window.innerWidth > 720) {
    document.getElementById('teacher-panel')?.classList.add('open');
  }

  initTitleHero(document.getElementById('title-hero-mount'));
}

boot();
