import { MONSTERS } from '../data.js';
import { renderMonsterPortrait } from '../monster-meta.js';

/** @param {HTMLElement|null|undefined} root */
export function renderBestiaryGrid(root) {
  if (!root) return;

  /** @type {{ worldId: number, index: number, monster: import('../data.js').Monster }[]} */
  const entries = [];
  Object.entries(MONSTERS).forEach(([worldId, list]) => {
    list.forEach((monster, index) => {
      entries.push({ worldId: Number(worldId), index, monster });
    });
  });

  root.innerHTML = `
    <section class="bestiary-panel">
      <h3 class="bestiary-title">📖 몬스터 도감</h3>
      <div class="bestiary-grid">
        ${entries.map(({ worldId, index, monster }) => `
          <article class="bestiary-card">
            <span class="bestiary-no">W${worldId}-${index + 1}</span>
            <div class="bestiary-sprite">${renderMonsterPortrait(monster.id, monster.emoji)}</div>
            <p class="bestiary-name">${monster.name}${monster.isFinalBoss ? ' 👑' : monster.isBoss ? ' ⚔️' : ''}</p>
          </article>
        `).join('')}
      </div>
    </section>`;
}
