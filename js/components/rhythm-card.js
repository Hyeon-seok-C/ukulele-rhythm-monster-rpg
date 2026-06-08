import { renderEducationalCards } from '../notation.js';

/** @param {HTMLElement} container @param {import('../rhythm-generator.js').RhythmEvent[][]} measureBeats @param {object} [opts] */
export function renderRhythmCardSlots(container, measureBeats, opts = {}) {
  renderEducationalCards(container, measureBeats, opts);
}

/** @param {HTMLElement|null|undefined} zone */
export function spawnSuccessParticle(zone) {
  const root = zone ?? document.getElementById('particle-zone');
  if (!root) return;
  const p = document.createElement('div');
  p.className = 'success-particle';
  p.textContent = '✨';
  p.style.left = `${40 + Math.random() * 20}%`;
  p.style.top = `${45 + Math.random() * 15}%`;
  root.appendChild(p);
  requestAnimationFrame(() => {
    p.style.transform = 'translateY(-40px) scale(1.2)';
    p.style.opacity = '0';
  });
  setTimeout(() => p.remove(), 700);
}

/** @param {HTMLElement|null|undefined} zone */
export function spawnComboFire(zone) {
  const root = zone ?? document.getElementById('particle-zone');
  if (!root) return;
  const p = document.createElement('div');
  p.className = 'combo-fire-particle';
  p.textContent = '🔥';
  p.style.left = `${30 + Math.random() * 40}%`;
  p.style.bottom = `${20 + Math.random() * 20}%`;
  root.appendChild(p);
  setTimeout(() => p.remove(), 900);
}

/** @param {HTMLElement|null|undefined} zone */
export function spawnBurstImpact(zone) {
  const root = zone ?? document.getElementById('particle-zone');
  if (!root) return;
  const flash = document.createElement('div');
  flash.className = 'burst-flash';
  root.appendChild(flash);
  setTimeout(() => flash.remove(), 700);

  for (let i = 0; i < 6; i += 1) {
    const p = document.createElement('div');
    p.className = 'burst-particle';
    p.textContent = ['🎵', '💥', '✨', '⭐'][i % 4];
    p.style.left = `${35 + Math.random() * 30}%`;
    p.style.top = `${40 + Math.random() * 20}%`;
    p.style.setProperty('--burst-x', `${(Math.random() - 0.5) * 80}px`);
    p.style.setProperty('--burst-y', `${-40 - Math.random() * 50}px`);
    root.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}
