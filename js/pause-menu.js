import { getState } from './battle.js';
import { renderWorldMap } from './components/world-map-ui.js';
import { getDuelFighterName } from './player-meta.js';
import { getDuelDifficultyLabel } from './game-state.js';

/**
 * @param {HTMLElement} container
 * @param {{ onResume: () => void, onDuelDifficultyChange?: (level: number) => void }} callbacks
 */
export function renderPauseMap(container, callbacks) {
  const state = getState();
  if (!state || !container) return;

  if (state.player.duelMode) {
    renderDuelPausePanel(container, callbacks, state);
    return;
  }

  container.innerHTML = `
    <div class="pause-map">
      <div id="pause-world-map-root"></div>
      <div class="pause-stats">
        <span>Lv.${state.player.level}</span>
        <span>HP ${state.player.hp}/${state.player.maxHp}</span>
        <span>EXP ${state.player.exp}</span>
      </div>
      <button class="btn btn-primary btn-lg pause-resume-btn" id="btn-pause-resume">▶ 게임 계속</button>
    </div>`;

  renderWorldMap(container.querySelector('#pause-world-map-root'), {
    currentWorldId: state.player.worldId,
    maxUnlockedWorldId: state.player.worldId,
    monsterIndex: state.player.monsterIndex,
    mode: 'view',
    compact: true,
    showDetail: true,
  });

  container.querySelector('#btn-pause-resume')?.addEventListener('click', () => {
    callbacks.onResume();
  });
}

/**
 * @param {HTMLElement} container
 * @param {{ onResume: () => void, onDuelDifficultyChange?: (level: number) => void }} callbacks
 * @param {import('./game-state.js').GameState} state
 */
function renderDuelPausePanel(container, callbacks, state) {
  const turn = getDuelFighterName(state.player.duelAttacker);
  const opponent = state.duelOpponent;
  const currentDiff = state.player.duelDifficulty ?? 2;
  const diffLabel = getDuelDifficultyLabel(currentDiff);

  container.innerHTML = `
    <div class="pause-map pause-map-duel">
      <h3 class="pause-duel-title">⚔️ 2인 리듬 대결 · ${diffLabel}</h3>
      <div class="pause-duel-stats">
        <div class="pause-duel-row">
          <span class="pause-duel-label">${getDuelFighterName('A')}</span>
          <span>HP ${state.player.hp}/${state.player.maxHp}</span>
        </div>
        <div class="pause-duel-row">
          <span class="pause-duel-label">${opponent?.name ?? '피아노 소년'}</span>
          <span>HP ${opponent?.hp ?? 0}/${opponent?.maxHp ?? 20}</span>
        </div>
        <p class="pause-duel-turn">현재 차례: <strong>${turn}</strong></p>
      </div>
      <p class="teacher-label pause-duel-diff-label">난이도 변경</p>
      <div class="duel-diff-toggle pause-duel-diff-btns">
        <button class="btn btn-sm ${currentDiff === 1 ? 'active' : ''}" type="button" data-pause-duel-diff="1">초급</button>
        <button class="btn btn-sm ${currentDiff === 2 ? 'active' : ''}" type="button" data-pause-duel-diff="2">중급</button>
        <button class="btn btn-sm ${currentDiff === 3 ? 'active' : ''}" type="button" data-pause-duel-diff="3">고급</button>
      </div>
      <p class="pause-hint">난이도를 바꾸면 다음 리듬 패턴이 바로 적용됩니다.</p>
      <button class="btn btn-primary btn-lg pause-resume-btn" id="btn-pause-resume">▶ 게임 계속</button>
    </div>`;

  container.querySelectorAll('[data-pause-duel-diff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const level = Number(btn.getAttribute('data-pause-duel-diff'));
      callbacks.onDuelDifficultyChange?.(level);
      renderDuelPausePanel(container, callbacks, getState() ?? state);
    });
  });

  container.querySelector('#btn-pause-resume')?.addEventListener('click', () => {
    callbacks.onResume();
  });
}

export function showPauseOverlay(show) {
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.classList.toggle('active', show);
}
