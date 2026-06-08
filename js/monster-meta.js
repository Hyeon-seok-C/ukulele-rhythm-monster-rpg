/** @param {string} id @param {string} emoji @param {{ compact?: boolean }} [opts] */
export function renderMonsterPortrait(id, emoji, opts = {}) {
  const tier = id === 'metronome_king' ? 'final' : (id.includes('boss') || ['beat_bear', 'cave_orc', 'beat_phoenix', 'tempo_lord', 'metronome_king'].includes(id) ? 'boss' : 'normal');
  const compact = opts.compact ? ' monster-sprite-wrap--compact' : '';
  return `<span class="monster-sprite-wrap monster-tier-${tier}${compact}"><span class="monster-sprite-img">${emoji}</span><span class="monster-ground-shadow" aria-hidden="true"></span></span>`;
}
