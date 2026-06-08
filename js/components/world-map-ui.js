import { WORLDS, getMonster } from '../data.js';
import { getWorldScene } from '../world-backgrounds.js';
import { renderMonsterPortrait } from '../monster-meta.js';

/** @typedef {{ currentWorldId: number, maxUnlockedWorldId?: number, monsterIndex?: number, mode?: 'select'|'view', compact?: boolean, showDetail?: boolean, onSelectWorld?: (id: number) => void }} WorldMapOptions */

const NODE_LAYOUT = [
  { x: 14, y: 72 },
  { x: 32, y: 58 },
  { x: 52, y: 44 },
  { x: 70, y: 30 },
  { x: 86, y: 18 },
];

/**
 * @param {HTMLElement} root
 * @param {WorldMapOptions} options
 */
export function renderWorldMap(root, options) {
  if (!root) return;

  const {
    currentWorldId,
    maxUnlockedWorldId = currentWorldId,
    monsterIndex = 0,
    mode = 'select',
    compact = false,
    showDetail = true,
    onSelectWorld,
  } = options;

  const selectedId = currentWorldId;
  const detail = getWorldScene(selectedId);
  const monster = getMonster(selectedId, monsterIndex);

  root.innerHTML = `
    <div class="world-map-wrap${compact ? ' world-map-wrap--compact' : ''}">
      <div class="world-map-canvas" id="world-map-canvas" style="--world-map-bg: url('${detail.bg}')">
        <svg class="world-map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline class="world-map-path-line world-map-path-line--bg"
            points="${NODE_LAYOUT.map((p) => `${p.x},${p.y}`).join(' ')}" />
          <polyline class="world-map-path-line world-map-path-line--fg"
            points="${NODE_LAYOUT.slice(0, maxUnlockedWorldId).map((p) => `${p.x},${p.y}`).join(' ')}" />
        </svg>
        ${WORLDS.map((world, idx) => {
          const pos = NODE_LAYOUT[idx] ?? NODE_LAYOUT[0];
          const locked = world.id > maxUnlockedWorldId;
          const selected = world.id === selectedId;
          const current = world.id === currentWorldId;
          const clickable = mode === 'select' && !locked;
          const nodeScene = getWorldScene(world.id);
          return `
            <button type="button"
              class="world-map-node${clickable ? ' world-map-node--clickable' : ''}${selected ? ' world-map-node--selected' : ''}${current ? ' world-map-node--current' : ''}${locked ? ' world-map-node--locked' : ''}"
              data-world-id="${world.id}"
              style="left:${pos.x}%; top:${pos.y}%; --node-color:${world.theme === 'theme-boss' ? '#ffeaa7' : '#74b9ff'};"
              ${locked ? 'disabled' : ''}
              aria-label="${world.name}">
              <span class="world-map-node-ring"></span>
              <span class="world-map-node-thumb" style="background-image:url('${nodeScene.mapIcon}')"></span>
              <span class="world-map-node-num">${world.id}</span>
              <span class="world-map-node-label">${world.name}</span>
              ${current ? '<span class="world-map-player-pin" aria-hidden="true">📍</span>' : ''}
            </button>`;
        }).join('')}
      </div>
      ${showDetail && !compact ? `
        <aside class="world-map-detail">
          <div class="world-map-detail-preview" style="background-image:url('${detail.bg}')"></div>
          <div class="world-map-detail-body">
            <p class="world-map-detail-eyebrow">WORLD ${selectedId}</p>
            <h3 class="world-map-detail-title">${detail.label}</h3>
            <p class="world-map-detail-en">${detail.labelEn ?? ''}</p>
            <p class="world-map-detail-desc">${detail.desc}</p>
            <p class="world-map-detail-diff">난이도 ${selectedId}</p>
            <div class="world-map-detail-monster">
              <span>현재 몬스터</span>
              <div class="world-map-detail-monsters">
                ${renderMonsterPortrait(monster.id, monster.emoji, { compact: true })}
                <strong>${monster.name}</strong>
              </div>
            </div>
          </div>
        </aside>` : ''}
    </div>`;

  if (mode === 'select') {
    root.querySelectorAll('[data-world-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const worldId = Number(btn.getAttribute('data-world-id'));
        if (Number.isNaN(worldId)) return;
        onSelectWorld?.(worldId);
        renderWorldMap(root, { ...options, currentWorldId: worldId });
      });
    });
  }
}
