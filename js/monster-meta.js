/** @type {Record<string, string>} */
const MONSTER_IMAGES = {
  slime: 'assets/images/ukulele_monster_assets_individual/01_slime.png',
  baby_slime: 'assets/images/ukulele_monster_assets_individual/02_baby_slime.png',
  mushroom: 'assets/images/ukulele_monster_assets_individual/03_mushroom_monster.png',
  goblin: 'assets/images/ukulele_monster_assets_individual/04_forest_goblin.png',
  rhythm_rabbit: 'assets/images/ukulele_monster_assets_individual/05_rhythm_rabbit.png',
  beat_bear: 'assets/images/ukulele_monster_assets_individual/06_beat_bear_boss.png',
  bat: 'assets/images/ukulele_monster_assets_individual/07_bat.png',
  skeleton: 'assets/images/ukulele_monster_assets_individual/08_skeleton_soldier.png',
  cave_orc: 'assets/images/ukulele_monster_assets_individual/09_cave_orc_boss.png',
  fire_spirit: 'assets/images/ukulele_monster_assets_individual/10_fire_spirit.png',
  beat_phoenix: 'assets/images/ukulele_monster_assets_individual/11_beat_phoenix_boss.png',
  dark_mage: 'assets/images/ukulele_monster_assets_individual/12_dark_mage.png',
  death_knight: 'assets/images/ukulele_monster_assets_individual/13_death_knight.png',
  tempo_lord: 'assets/images/ukulele_monster_assets_individual/14_tempo_lord_boss.png',
  metron: 'assets/images/ukulele_monster_assets_individual/15_metron.png',
  beat_guardian: 'assets/images/ukulele_monster_assets_individual/16_beat_guardian.png',
  rhythm_golem: 'assets/images/ukulele_monster_assets_individual/17_rhythm_golem.png',
  chrono_dragon: 'assets/images/ukulele_monster_assets_individual/18_chrono_dragon.png',
  metronome_king: 'assets/images/ukulele_monster_assets_individual/19_metronome_king_final_boss.png',
};

/** @param {string} id */
export function getMonsterImagePath(id) {
  return MONSTER_IMAGES[id] ?? null;
}

/** @param {string} id @param {string} emoji @param {{ compact?: boolean }} [opts] */
export function renderMonsterPortrait(id, emoji, opts = {}) {
  const tier = id === 'metronome_king' ? 'final' : (id.includes('boss') || ['beat_bear', 'cave_orc', 'beat_phoenix', 'tempo_lord', 'chrono_dragon', 'metronome_king'].includes(id) ? 'boss' : 'normal');
  const compact = opts.compact ? ' monster-sprite-wrap--compact' : '';
  const imagePath = getMonsterImagePath(id);

  const spriteContent = imagePath
    ? `<img class="monster-sprite-img monster-sprite-png" src="${imagePath}" alt="" draggable="false" loading="lazy" data-fallback="${emoji}" onerror="const s=document.createElement('span');s.className='monster-sprite-img';s.textContent=this.dataset.fallback||'';this.replaceWith(s)" />`
    : `<span class="monster-sprite-img">${emoji}</span>`;

  return `<span class="monster-sprite-wrap monster-tier-${tier}${compact}">${spriteContent}<span class="monster-ground-shadow" aria-hidden="true"></span></span>`;
}
