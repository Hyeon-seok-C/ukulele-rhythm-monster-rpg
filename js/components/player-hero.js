import { PLAYER_BOY_META, PLAYER_MOTIONS, DUEL_OPPONENT_META } from '../player-meta.js';
import { imageHasTransparentBackground, removeBorderBackground } from '../player-sprite-util.js';

/** @type {import('../player-meta.js').PlayerAnimState} */
let currentState = 'IDLE';
/** @type {Record<string, import('../player-meta.js').PlayerAnimState>} */
const statesByPrefix = {};
/** @type {Record<string, ReturnType<typeof setTimeout>>} */
const resetTimers = {};
/** @type {Record<string, string>} */
const motionCache = {};

/**
 * @param {typeof PLAYER_MOTIONS} motions
 * @param {import('../player-meta.js').PlayerAnimState} state
 */
function stateToMotionKey(motions, state) {
  return motions.stateMap[state] ?? 'idle';
}

/**
 * @param {string} prefix
 * @param {import('../player-meta.js').PlayerAnimState} state
 */
function showPlayerMotion(prefix, state) {
  const img = document.getElementById(`${prefix}-hero-img`);
  if (!img) return;

  const motionKey = stateToMotionKey(PLAYER_MOTIONS, state);
  const path = PLAYER_MOTIONS[motionKey];
  if (!path) return;

  const cacheKey = path;
  if (motionCache[cacheKey]) {
    img.src = motionCache[cacheKey];
    return;
  }

  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    let src = path;
    if (!imageHasTransparentBackground(probe)) {
      const dataUrl = removeBorderBackground(
        probe,
        probe.naturalWidth,
        probe.naturalHeight,
        48,
      );
      if (dataUrl) src = dataUrl;
    }
    motionCache[cacheKey] = src;
    if (document.getElementById(`${prefix}-hero-img`)) {
      img.src = `${src}${src.startsWith('data:') ? '' : `?v=${Date.now()}`}`;
    }
  };
  probe.onerror = () => {
    img.src = path;
  };
  probe.src = `${path}?v=${Date.now()}`;
}

/**
 * @param {HTMLElement} container
 * @param {{ prefix?: string, flip?: boolean, label?: string, variant?: 'player'|'opponent' }} [opts]
 */
export function initPlayerHero(container, opts = {}) {
  if (!container) return;

  if (opts.variant === 'opponent') {
    initOpponentHero(container, opts);
    return;
  }

  const prefix = opts.prefix ?? 'player';
  const flipClass = opts.flip ? 'player-hero-flip' : '';
  const label = opts.label ?? PLAYER_BOY_META.name;
  const displayH = PLAYER_MOTIONS.displayHeight ?? 72;

  container.innerHTML = `
    <div class="player-hero-wrap ${flipClass}">
      <div id="${prefix}-hero-stage" class="player-hero-stage player-state-idle">
        <img
          id="${prefix}-hero-img"
          class="player-hero-img"
          alt="${label}"
          draggable="false"
          style="height:${displayH}px;width:auto;max-width:100%;object-fit:contain;"
        />
        <div id="${prefix}-state-fx" class="player-state-fx"></div>
      </div>
    </div>`;

  statesByPrefix[prefix] = 'IDLE';
  showPlayerMotion(prefix, 'IDLE');
}

/**
 * @param {HTMLElement} container
 * @param {{ prefix?: string, flip?: boolean, label?: string }} opts
 */
function initOpponentHero(container, opts) {
  const prefix = opts.prefix ?? 'opponent';
  const flipClass = opts.flip ? 'player-hero-flip' : '';
  const label = opts.label ?? DUEL_OPPONENT_META.name;
  const h = DUEL_OPPONENT_META.displayHeight;

  container.innerHTML = `
    <div class="player-hero-wrap opponent-hero-wrap ${flipClass}">
      <div id="${prefix}-hero-stage" class="player-hero-stage opponent-hero-stage player-state-idle">
        <img
          id="${prefix}-hero-img"
          class="player-hero-img opponent-hero-img"
          src="${DUEL_OPPONENT_META.imagePath}"
          alt="${label}"
          style="height: ${h}px; width: auto;"
        />
        <div id="${prefix}-state-fx" class="player-state-fx"></div>
      </div>
    </div>`;

  statesByPrefix[prefix] = 'IDLE';

  const imgEl = document.getElementById(`${prefix}-hero-img`);
  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    if (!imageHasTransparentBackground(probe)) {
      const dataUrl = removeBorderBackground(probe, probe.naturalWidth, probe.naturalHeight, 48);
      if (imgEl && dataUrl) imgEl.src = dataUrl;
    }
  };
  probe.src = `${DUEL_OPPONENT_META.imagePath}?v=${Date.now()}`;
}

/**
 * @param {import('../player-meta.js').PlayerAnimState} state
 * @param {{ autoResetMs?: number, prefix?: string }} [opts]
 */
export function setPlayerState(state, opts = {}) {
  const prefix = opts.prefix ?? 'player';
  statesByPrefix[prefix] = state;
  if (prefix === 'player') currentState = state;

  const stage = document.getElementById(`${prefix}-hero-stage`);
  const fx = document.getElementById(`${prefix}-state-fx`);
  if (!stage) return;

  const extra = prefix === 'opponent' ? ' opponent-hero-stage' : '';
  stage.className = `player-hero-stage${extra} player-state-${state.toLowerCase()}`;
  if (prefix === 'player') showPlayerMotion(prefix, state);

  if (fx) {
    fx.innerHTML = '';
    if (state === 'PERFECT') fx.innerHTML = '<span class="fx-sparkle">✨</span>';
    else if (state === 'DAMAGE') fx.innerHTML = '<span class="fx-hit">💥</span>';
    else if (state === 'VICTORY') fx.innerHTML = '<span class="fx-win">🏆</span>';
  }

  if (resetTimers[prefix]) clearTimeout(resetTimers[prefix]);
  const resetMs = opts.autoResetMs ?? (state === 'IDLE' || state === 'VICTORY' ? 0 : 700);
  if (resetMs > 0) {
    resetTimers[prefix] = setTimeout(() => setPlayerState('IDLE', { prefix }), resetMs);
  }
}

export function getPlayerState() {
  return currentState;
}

export function setVictoryPose(prefix = 'player') {
  setPlayerState('VICTORY', { prefix, autoResetMs: 0 });
}

/** @param {string} prefix */
export function shakePlayerHero(prefix = 'player') {
  const stage = document.getElementById(`${prefix}-hero-stage`);
  stage?.classList.add('animate-shake');
  setTimeout(() => stage?.classList.remove('animate-shake'), 400);
}

/** @param {'A'|'B'} side */
export function highlightDuelTurn(side) {
  document.getElementById('duel-hero-a-mount')?.classList.toggle('duel-hero-active', side === 'A');
  document.getElementById('duel-hero-b-mount')?.classList.toggle('duel-hero-active', side === 'B');
}
