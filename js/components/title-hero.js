import { PLAYER_BOY_META } from '../player-meta.js';

/** @param {HTMLElement|null|undefined} mount */
export function initTitleHero(mount) {
  if (!mount) return;

  const heroPath = PLAYER_BOY_META.titleHeroPath ?? PLAYER_BOY_META.imagePath;
  mount.innerHTML = `
    <div class="title-hero-fallback" aria-hidden="true">${PLAYER_BOY_META.states.IDLE.icon}</div>
    <div class="title-hero-shadow"></div>
  `;

  const img = new Image();
  img.onload = () => {
    mount.innerHTML = `
      <img class="title-hero-img" src="${heroPath}" alt="${PLAYER_BOY_META.name}" />
      <div class="title-hero-shadow"></div>
    `;
  };
  img.onerror = () => {};
  img.src = heroPath;
}
