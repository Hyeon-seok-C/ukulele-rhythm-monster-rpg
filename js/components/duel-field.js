import {
  DUEL_OPPONENT_META,
  DUEL_DRUM_MOTIONS,
  DUEL_PIANO_MOTIONS,
  DUEL_PLAYER_META,
} from '../player-meta.js';
import { imageHasTransparentBackground, removeBorderBackground } from '../player-sprite-util.js';

/** @type {Record<'A'|'B', import('../player-meta.js').PlayerAnimState>} */
const duelStates = { A: 'IDLE', B: 'IDLE' };

/** @type {Record<string, string>} */
const motionCache = {};

/** 2인 대결 상단 캐릭터 표시 높이 (드럼 기준) */
const DUEL_DRUM_SPRITE_H = 118;

/** @type {Record<'A'|'B', { meta: object, motions: typeof DUEL_DRUM_MOTIONS, flip: boolean }>} */
const FIGHTERS = {
  A: { meta: DUEL_PLAYER_META, motions: DUEL_DRUM_MOTIONS, flip: false },
  B: { meta: DUEL_OPPONENT_META, motions: DUEL_PIANO_MOTIONS, flip: true },
};

function getFighterDisplayHeight(side) {
  return FIGHTERS[side].motions.displayHeight ?? DUEL_DRUM_SPRITE_H;
}

/**
 * 2인 대결 필드 — 드럼 소년 vs 피아노 소년 (개별 모션 PNG)
 */
export function setupDuelFieldCharacters() {
  setupDuelFighter('A');
  setupDuelFighter('B');
}

/** @param {'A'|'B'} side */
function setupDuelFighter(side) {
  const sid = side === 'A' ? 'a' : 'b';
  const { meta, flip } = FIGHTERS[side];
  const mount = document.getElementById(`duel-hero-${sid}-mount`);
  if (!mount) return;

  const displayH = getFighterDisplayHeight(side);
  const imgClass = side === 'B' ? 'duel-motion-img duel-motion-img-piano' : 'duel-motion-img';
  const flipClass = flip ? 'duel-char-stage-opponent player-hero-flip ' : '';
  mount.innerHTML = `
    <div id="duel-${sid}-stage" class="${flipClass}duel-char-stage player-state-idle">
      <img
        id="duel-${sid}-img"
        class="${imgClass}"
        alt="${meta.name}"
        draggable="false"
        style="height:${displayH}px;width:auto;"
      />
      <div id="duel-${sid}-fx" class="player-state-fx"></div>
    </div>`;

  showDuelMotion(side, 'IDLE');
}

/**
 * @param {typeof DUEL_DRUM_MOTIONS} motions
 * @param {import('../player-meta.js').PlayerAnimState} state
 * @returns {'idle'|'attack'}
 */
function stateToMotionKey(motions, state) {
  return motions.stateMap[state] ?? 'idle';
}

/**
 * @param {'A'|'B'} side
 * @param {import('../player-meta.js').PlayerAnimState} state
 */
function showDuelMotion(side, state) {
  const sid = side === 'A' ? 'a' : 'b';
  const { motions } = FIGHTERS[side];
  const motionKey = stateToMotionKey(motions, state);
  const path = motions[motionKey];
  const img = document.getElementById(`duel-${sid}-img`);
  if (!img || !path) return;

  const cacheKey = `${path}`;
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
    if (document.getElementById(`duel-${sid}-img`)) {
      img.src = `${src}${src.startsWith('data:') ? '' : `?v=${Date.now()}`}`;
    }
  };
  probe.onerror = () => {
    img.src = path;
  };
  probe.src = `${path}?v=${Date.now()}`;
}

/**
 * @param {'A'|'B'} side
 * @param {import('../player-meta.js').PlayerAnimState} state
 * @param {{ autoResetMs?: number }} [opts]
 */
export function setDuelFieldState(side, state, opts = {}) {
  duelStates[side] = state;
  const sid = side === 'A' ? 'a' : 'b';
  const stage = document.getElementById(`duel-${sid}-stage`);
  const fx = document.getElementById(`duel-${sid}-fx`);
  if (!stage) return;

  const flipClass = side === 'B' ? 'duel-char-stage-opponent player-hero-flip ' : '';
  stage.className = `${flipClass}duel-char-stage player-state-${state.toLowerCase()}`;
  showDuelMotion(side, state);

  if (fx) {
    fx.innerHTML = '';
    if (state === 'PERFECT') fx.innerHTML = '<span class="fx-sparkle">✨</span>';
    else if (state === 'DAMAGE') fx.innerHTML = '<span class="fx-hit">💥</span>';
    else if (state === 'VICTORY') fx.innerHTML = '<span class="fx-win">🏆</span>';
  }

  const resetMs = opts.autoResetMs ?? (state === 'IDLE' || state === 'VICTORY' ? 0 : 700);
  if (resetMs > 0) {
    setTimeout(() => setDuelFieldState(side, 'IDLE', { autoResetMs: 0 }), resetMs);
  }
}

/** @param {'A'|'B'} side */
export function shakeDuelFieldCharacter(side) {
  document.getElementById(`${side === 'A' ? 'duel-a' : 'duel-b'}-stage`)
    ?.classList.add('animate-shake');
  setTimeout(() => {
    document.getElementById(`${side === 'A' ? 'duel-a' : 'duel-b'}-stage`)
      ?.classList.remove('animate-shake');
  }, 400);
}

/** @param {'A'|'B'} side */
export function setDuelVictoryPose(side) {
  setDuelFieldState(side, 'VICTORY', { autoResetMs: 0 });
}

/** @param {'A'|'B'} side */
export function highlightDuelTurn(side) {
  document.getElementById('duel-fighter-a')?.classList.toggle('duel-fighter-active', side === 'A');
  document.getElementById('duel-fighter-b')?.classList.toggle('duel-fighter-active', side === 'B');
}
