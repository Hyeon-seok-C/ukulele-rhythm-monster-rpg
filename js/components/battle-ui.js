import { renderSystemIcon } from '../system-icons.js';
import { getNextLevelExp } from '../game-state.js';
import { getWorldScene, getDuelScene } from '../world-backgrounds.js';
import { getMonsterFieldBottom, renderMonsterPortrait } from '../monster-meta.js';
import { DUEL_OPPONENT_META, DUEL_PLAYER_META } from '../player-meta.js';

/** @param {number} current @param {number} max @returns {string} */
export function hpBarColor(current, max) {
  const ratio = current / max;
  if (ratio > 0.5) return 'hp-green';
  if (ratio > 0.25) return 'hp-yellow';
  return 'hp-red';
}

/**
 * 2인 대결 — 두 학생이 마주 보는 PvP 필드
 * @param {HTMLElement} sceneContainer
 * @param {HTMLElement} hudContainer
 * @param {{ opponentHp: number, opponentMax: number, player: object, duelCombos?: { A: number, B: number }, duelAttacker?: 'A'|'B' }} data
 */
export function renderDuelBattleScene(sceneContainer, hudContainer, data) {
  const { opponentHp, opponentMax, player } = data;
  const duelCombos = data.duelCombos ?? { A: 0, B: 0 };
  const duelAttacker = data.duelAttacker ?? 'A';
  const activeCombo = duelCombos[duelAttacker] ?? 0;
  const sceneInfo = getDuelScene();
  const bHpPct = Math.max(0, (opponentHp / opponentMax) * 100);
  const bBar = hpBarColor(opponentHp, opponentMax);
  const playerHpPct = (player.hp / player.maxHp) * 100;
  const playerBar = hpBarColor(player.hp, player.maxHp);

  sceneContainer.className = `battle-scene battle-scene-duel ${sceneInfo.scene}`;
  sceneContainer.style.backgroundImage = `url('${sceneInfo.bg}')`;
  sceneContainer.innerHTML = `
    <div class="duel-top-bar">
      <div class="duel-fighter-card duel-fighter-a" id="duel-fighter-a">
        <div class="duel-fighter-sprite" id="duel-hero-a-mount" aria-label="${DUEL_PLAYER_META.name}"></div>
        <div class="duel-fighter-info">
          <p class="duel-fighter-name">${DUEL_PLAYER_META.name}</p>
          <p class="duel-combo-tag ${duelCombos.A >= 3 ? 'duel-combo-active' : ''}" id="duel-combo-a">${duelCombos.A}X COMBO</p>
          <div class="bar-row">
            ${renderSystemIcon('icon_hp').outerHTML}
            <div class="rpg-bar duel-hp-bar player-hp-bar">
              <div class="rpg-bar-fill ${playerBar}" id="player-hp-fill" style="width:${playerHpPct}%"></div>
            </div>
            <span class="bar-num" id="player-hp-text">${player.hp}/${player.maxHp}</span>
          </div>
        </div>
      </div>

      <div class="duel-top-divider" aria-hidden="true">⚔</div>

      <div class="duel-fighter-card duel-fighter-b" id="duel-fighter-b">
        <div class="duel-fighter-sprite" id="duel-hero-b-mount" aria-label="${DUEL_OPPONENT_META.name}"></div>
        <div class="duel-fighter-info">
          <p class="duel-fighter-name">${DUEL_OPPONENT_META.name}</p>
          <p class="duel-combo-tag ${duelCombos.B >= 3 ? 'duel-combo-active' : ''}" id="duel-combo-b">${duelCombos.B}X COMBO</p>
          <div class="bar-row">
            <span class="bar-label">HP</span>
            <div class="rpg-bar duel-hp-bar">
              <div class="rpg-bar-fill ${bBar}" id="enemy-hp-fill" style="width:${bHpPct}%"></div>
            </div>
            <span class="bar-num enemy-hp-num" id="enemy-hp-text">${opponentHp}/${opponentMax}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="duel-field duel-field-arena">
      <div class="duel-vs-badge">VS</div>
      <p class="duel-arena-tag">${sceneInfo.label}</p>
    </div>

    <div id="particle-zone" class="particle-zone"></div>
    <div class="battle-message-box" id="message-box">리듬을 맞추고 상대를 공격하세요!</div>
  `;

  hudContainer.innerHTML = `
    <div class="battle-hud-panel battle-hud-duel battle-hud-duel-rhythm">
      <div class="combo-banner ${activeCombo >= 3 ? 'combo-active' : ''}" id="combo-display">
        ${activeCombo > 0 ? `${activeCombo}X` : '0X'} COMBO!
      </div>
      <div class="rhythm-panel">
        <p class="rhythm-panel-title">🎵 리듬 악보 · 4/4 · 1·2·3·4박</p>
        <div id="rhythm-card-area"></div>
      </div>
    </div>
  `;
}

/**
 * @param {HTMLElement} sceneContainer
 * @param {HTMLElement} hudContainer
 * @param {{ worldId: number, monster: object, monsterHp: number, player: object }} data
 */
export function renderBattleScene(sceneContainer, hudContainer, data) {
  const { worldId, monster, monsterHp, player } = data;
  const sceneInfo = getWorldScene(worldId);
  const hpPct = Math.max(0, (monsterHp / monster.hp) * 100);
  const enemyBar = hpBarColor(monsterHp, monster.hp);
  const playerHpPct = (player.hp / player.maxHp) * 100;
  const playerBar = hpBarColor(player.hp, player.maxHp);
  const nextExp = getNextLevelExp(player.level);
  const expPct = Math.min(100, (player.exp / nextExp) * 100);

  sceneContainer.className = `battle-scene ${sceneInfo.scene}`;
  sceneContainer.style.backgroundImage = `url('${sceneInfo.bg}')`;
  sceneContainer.innerHTML = `
    <div class="enemy-hud">
      <div class="enemy-hud-portrait">${renderMonsterPortrait(monster.id, monster.emoji, { compact: true })}</div>
      <div class="enemy-hud-info">
        <p class="enemy-name">${monster.name}${monster.isFinalBoss ? ' 👑' : monster.isBoss ? ' ⚔️' : ''}</p>
        <div class="bar-row">
          <span class="bar-label">HP</span>
          <div class="rpg-bar enemy-bar">
            <div class="rpg-bar-fill ${enemyBar}" id="enemy-hp-fill" style="width:${hpPct}%"></div>
          </div>
          <span class="bar-num enemy-hp-num" id="enemy-hp-text">${monsterHp}/${monster.hp}</span>
        </div>
        <p class="world-tag" id="world-label-battle">월드 ${worldId} · ${sceneInfo.label}</p>
      </div>
    </div>

    <div class="monster-field-sprite" id="monster-field-sprite" style="bottom:${getMonsterFieldBottom(monster.id)}%">
      <div class="monster-sprite-inner" id="monster-portrait">${renderMonsterPortrait(monster.id, monster.emoji)}</div>
      <div class="monster-shadow" aria-hidden="true"></div>
    </div>

    <div id="particle-zone" class="particle-zone"></div>

    <div class="battle-message-box" id="message-box">리듬 패턴을 연주하세요!</div>
  `;

  hudContainer.innerHTML = `
    <div class="battle-hud-panel">
      <div class="hud-left">
        <div class="player-portrait-ring" id="player-hero-mount"></div>
        <div class="player-stats">
          <p class="player-name-tag">${player.name} <span class="lv-tag">Lv.${player.level}</span></p>
          <div class="bar-row">
            ${renderSystemIcon('icon_hp').outerHTML}
            <div class="rpg-bar player-hp-bar">
              <div class="rpg-bar-fill ${playerBar}" id="player-hp-fill" style="width:${playerHpPct}%"></div>
            </div>
            <span class="bar-num" id="player-hp-text">${player.hp}/${player.maxHp}</span>
          </div>
          <div class="bar-row">
            ${renderSystemIcon('icon_exp').outerHTML}
            <div class="rpg-bar exp-bar">
              <div class="rpg-bar-fill exp-fill" id="player-exp-fill" style="width:${expPct}%"></div>
            </div>
            <span class="bar-num exp-num" id="player-exp-text">${player.exp}/${nextExp}</span>
          </div>
        </div>
      </div>

      <div class="hud-right">
        <div class="combo-banner ${player.combo >= 3 ? 'combo-active' : ''}" id="combo-display">
          ${player.combo > 0 ? `${player.combo}X` : '0X'} COMBO!
        </div>
        <div class="rhythm-panel">
          <p class="rhythm-panel-title">🎵 리듬 악보 · 4/4 · 1·2·3·4박</p>
          <div id="rhythm-card-area"></div>
        </div>
      </div>
    </div>
  `;
}

/** @param {HTMLElement} hudRoot @param {{ monsterHp: number, monsterMax: number, player: object }} stats */
export function updateBattleStatsUI(hudRoot, stats) {
  // 몬스터 HP는 battle-scene 안에 있음
  const enemyFill = document.getElementById('enemy-hp-fill');
  const enemyHpText = document.getElementById('enemy-hp-text');

  const playerFill = hudRoot?.querySelector('#player-hp-fill') ?? document.getElementById('player-hp-fill');
  const expFill = hudRoot?.querySelector('#player-exp-fill');
  const hpText = hudRoot?.querySelector('#player-hp-text') ?? document.getElementById('player-hp-text');
  const expText = hudRoot?.querySelector('#player-exp-text');
  const comboEl = hudRoot?.querySelector('#combo-display');

  if (enemyFill) {
    const pct = Math.max(0, (stats.monsterHp / stats.monsterMax) * 100);
    enemyFill.style.width = `${pct}%`;
    enemyFill.className = `rpg-bar-fill ${hpBarColor(stats.monsterHp, stats.monsterMax)}`;
  }
  if (enemyHpText) {
    enemyHpText.textContent = `${Math.max(0, stats.monsterHp)}/${stats.monsterMax}`;
  }
  if (playerFill) {
    playerFill.style.width = `${(stats.player.hp / stats.player.maxHp) * 100}%`;
    playerFill.className = `rpg-bar-fill ${hpBarColor(stats.player.hp, stats.player.maxHp)}`;
  }
  if (expFill) {
    const next = getNextLevelExp(stats.player.level);
    expFill.style.width = `${Math.min(100, (stats.player.exp / next) * 100)}%`;
  }
  if (hpText) hpText.textContent = `${stats.player.hp}/${stats.player.maxHp}`;
  if (expText) {
    const next = getNextLevelExp(stats.player.level);
    expText.textContent = `${stats.player.exp}/${next}`;
  }
  if (comboEl) {
    if (stats.duelMode && stats.duelCombos) {
      const attacker = stats.duelAttacker ?? 'A';
      const cur = stats.duelCombos[attacker] ?? 0;
      comboEl.textContent = `${cur}X COMBO!`;
      comboEl.classList.toggle('combo-active', cur >= 3);
      ['A', 'B'].forEach((side) => {
        const tag = document.getElementById(`duel-combo-${side.toLowerCase()}`);
        const n = stats.duelCombos[side] ?? 0;
        if (tag) {
          tag.textContent = `${n}X COMBO`;
          tag.classList.toggle('duel-combo-active', n >= 3);
        }
      });
    } else {
      comboEl.textContent = `${stats.player.combo}X COMBO!`;
      comboEl.classList.toggle('combo-active', stats.player.combo >= 3);
    }
  }
}

/** @param {HTMLElement} portrait */
export function shakeMonster(portrait) {
  const root = portrait ?? document.getElementById('monster-field-sprite');
  const target = root?.querySelector('.monster-sprite-wrap')
    ?? root?.querySelector('.monster-sprite-inner')
    ?? root;
  target?.classList.add('animate-shake');
  setTimeout(() => target?.classList.remove('animate-shake'), 400);
}

/** @param {HTMLElement} battleMain */
export function shieldEffect(battleMain) {
  battleMain?.classList.add('shield-effect');
  setTimeout(() => battleMain?.classList.remove('shield-effect'), 500);
}

/** @param {HTMLElement} battleMain */
export function burstEffect(battleMain) {
  battleMain?.classList.add('burst-impact');
  setTimeout(() => battleMain?.classList.remove('burst-impact'), 650);
}

/** @param {number} current @param {number} max */
export function updateSkillButtonsUI(current, max) {
  const label = document.getElementById('skill-points-label');
  if (label) label.textContent = `SP ${current}/${max}`;

  const disabled = current <= 0;
  ['btn-skill-burst', 'btn-skill-shield', 'btn-skill-guide'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = disabled;
    btn.classList.toggle('skill-btn-disabled', disabled);
  });
}

/** @deprecated use updateBattleStatsUI */
export function updateComboFlame(container, combo) {
  const el = container?.querySelector('#combo-display') ?? document.getElementById('combo-display');
  if (el) {
    el.textContent = `${combo}X COMBO!`;
    el.classList.toggle('combo-active', combo >= 3);
  }
}

// Legacy exports for compatibility
export function renderEnemyTop() {}
export function renderPlayerBottom() {}
