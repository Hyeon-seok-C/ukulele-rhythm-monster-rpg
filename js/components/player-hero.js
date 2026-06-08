import { PLAYER_BOY_META, PLAYER_SPRITE_SHEET, DUEL_OPPONENT_META } from '../player-meta.js';
import { chromaKeySpriteSheet, chromaKeyImage, getSpriteDisplaySize } from '../player-sprite-util.js';

/** @type {import('../player-meta.js').PlayerAnimState} */
let currentState = 'IDLE';
/** @type {Record<string, import('../player-meta.js').PlayerAnimState>} */
const statesByPrefix = {};
/** @type {Record<string, ReturnType<typeof setTimeout>>} */
const resetTimers = {};
/** @type {Record<string, boolean>} */
const useSpriteSheetByPrefix = {};

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
  const { frameCount } = PLAYER_SPRITE_SHEET;
  const display = getSpriteDisplaySize(PLAYER_SPRITE_SHEET);

  container.innerHTML = `
    <div class="player-hero-wrap ${flipClass}">
      <div id="${prefix}-hero-stage" class="player-hero-stage player-state-idle">
        <div
          id="${prefix}-sprite"
          class="player-sprite"
          role="img"
          aria-label="${label}"
          style="
            --frame-count: ${frameCount};
            --frame-index: 0;
            --display-w: ${display.width}px;
            --display-h: ${display.height}px;
          "
        ></div>
        <img
          id="${prefix}-sprite-fallback"
          class="player-hero-img player-sprite-fallback hidden"
          src="${PLAYER_BOY_META.imagePath}"
          alt="${label}"
        />
        <div id="${prefix}-state-fx" class="player-state-fx"></div>
      </div>
    </div>`;

  statesByPrefix[prefix] = 'IDLE';

  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    const sprite = document.getElementById(`${prefix}-sprite`);
    const dataUrl = chromaKeySpriteSheet(probe, PLAYER_SPRITE_SHEET);
    if (sprite && dataUrl) {
      sprite.style.setProperty('--sprite-url', `url('${dataUrl}')`);
      useSpriteSheetByPrefix[prefix] = true;
      applySpriteFrame(prefix, statesByPrefix[prefix]);
    } else {
      fallbackToSvg(prefix);
    }
  };
  probe.onerror = () => fallbackToSvg(prefix);
  probe.src = `${PLAYER_SPRITE_SHEET.imagePath}?v=${Date.now()}`;
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
          id="${prefix}-sprite-fallback"
          class="player-hero-img opponent-hero-img"
          src="${DUEL_OPPONENT_META.imagePath}"
          alt="${label}"
          style="height: ${h}px; width: auto;"
        />
        <div id="${prefix}-state-fx" class="player-state-fx"></div>
      </div>
    </div>`;

  statesByPrefix[prefix] = 'IDLE';
  useSpriteSheetByPrefix[prefix] = false;

  const imgEl = document.getElementById(`${prefix}-sprite-fallback`);
  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    const dataUrl = chromaKeyImage(probe, { r: 0, g: 0, b: 0 }, 60);
    if (imgEl && dataUrl) imgEl.src = dataUrl;
  };
  probe.src = `${DUEL_OPPONENT_META.imagePath}?v=${Date.now()}`;
}

/** @param {string} prefix */
function fallbackToSvg(prefix) {
  useSpriteSheetByPrefix[prefix] = false;
  document.getElementById(`${prefix}-sprite`)?.classList.add('hidden');
  document.getElementById(`${prefix}-sprite-fallback`)?.classList.remove('hidden');
}

/**
 * @param {string} prefix
 * @param {import('../player-meta.js').PlayerAnimState} state
 */
function applySpriteFrame(prefix, state) {
  const sprite = document.getElementById(`${prefix}-sprite`);
  if (!sprite || !useSpriteSheetByPrefix[prefix]) return;

  const frameIndex = PLAYER_SPRITE_SHEET.frames[state] ?? 0;
  sprite.style.setProperty('--frame-index', String(frameIndex));
  sprite.dataset.state = state;
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

  stage.className = `player-hero-stage player-state-${state.toLowerCase()}`;
  applySpriteFrame(prefix, state);

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
