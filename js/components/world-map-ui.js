import { WORLDS, getMonster } from '../data.js';
import { getWorldScene, ADVENTURE_MAP_BG } from '../world-backgrounds.js';
import { renderMonsterPortrait } from '../monster-meta.js';

/** @typedef {{ currentWorldId: number, maxUnlockedWorldId?: number, monsterIndex?: number, mode?: 'select'|'view', compact?: boolean, showDetail?: boolean, onSelectWorld?: (id: number) => void }} WorldMapOptions */

/** adventure_map_bg.png (1024×682) 원형 스테이지 아이콘 중심 — 이미지 기준 % */
const NODE_LAYOUT = [
  { x: 14.1, y: 83.5 },
  { x: 33.8, y: 72.2 },
  { x: 50.0, y: 60.0 },
  { x: 67.7, y: 46.8 },
  { x: 84.5, y: 32.4 },
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
      <div class="world-map-canvas world-map-canvas--adventure" id="world-map-canvas">
        <div class="world-map-stage" style="background-image:url('${ADVENTURE_MAP_BG}')">
        ${WORLDS.map((world, idx) => {
          const pos = NODE_LAYOUT[idx] ?? NODE_LAYOUT[0];
          const locked = world.id > maxUnlockedWorldId;
          const selected = world.id === selectedId;
          const current = world.id === currentWorldId;
          const clickable = mode === 'select' && !locked;
          return `
            <button type="button"
              class="world-map-node world-map-node--map-overlay${clickable ? ' world-map-node--clickable' : ''}${selected ? ' world-map-node--selected' : ''}${current ? ' world-map-node--current' : ''}${locked ? ' world-map-node--locked' : ''}"
              data-world-id="${world.id}"
              style="left:${pos.x}%; top:${pos.y}%;"
              ${locked ? 'disabled' : ''}
              aria-label="${world.name}">
              ${current ? '<span class="world-map-player-pin" aria-hidden="true">📍</span>' : ''}
            </button>`;
        }).join('')}
        </div>
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
