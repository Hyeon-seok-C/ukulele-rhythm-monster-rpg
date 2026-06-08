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
  crystal_crab: 'assets/images/ukulele_monster_assets_individual/20_crystal_crab.png',
  crystal_golem: 'assets/images/ukulele_monster_assets_individual/21_crystal_golem.png',
  conductor_bat: 'assets/images/ukulele_monster_assets_individual/22_conductor_bat.png',
  salamander: 'assets/images/ukulele_monster_assets_individual/23_salamander.png',
  lava_crab: 'assets/images/ukulele_monster_assets_individual/24_lava_crab.png',
  magma_golem: 'assets/images/ukulele_monster_assets_individual/25_magma_golem.png',
  shadow_thief: 'assets/images/ukulele_monster_assets_individual/26_shadow_thief.png',
  dark_jester: 'assets/images/ukulele_monster_assets_individual/27_dark_jester.png',
};

const BOSS_IDS = new Set([
  'beat_bear', 'cave_orc', 'beat_phoenix', 'tempo_lord', 'chrono_dragon', 'metronome_king',
  'crystal_golem', 'magma_golem',
]);

/** 1024×682 등 넓은 캔버스 PNG — 전투 필드에서 추가 확대 */
const LARGE_CANVAS_IDS = new Set([
  'slime', 'bat', 'beat_phoenix',
  'crystal_crab', 'crystal_golem', 'conductor_bat',
  'salamander', 'lava_crab', 'magma_golem',
  'shadow_thief', 'dark_jester',
]);

/** 전투 필드 — 나중에 추가된 넓은 캔버스 PNG (슬라임·박쥬 제외) */
const LATER_FIELD_LOWER_IDS = new Set(
  [...LARGE_CANVAS_IDS].filter((id) => id !== 'slime' && id !== 'bat'),
);

/** 전투 필드 — 추가로 더 아래 */
const FIELD_BOTTOM_EXTRA_LOWER = {
  lava_crab: 8,
  magma_golem: 8,
  beat_phoenix: 8,
};

/** 전투 필드 — 기본 PNG보다 크게 표시 */
const BATTLE_LARGE_IDS = new Set([
  'death_knight', 'metron', 'beat_guardian', 'rhythm_golem', 'chrono_dragon',
]);

const FIELD_BOTTOM_DEFAULT = 26;
const FIELD_BOTTOM_LATER = 14;

/** @param {string} id */
export function getMonsterImagePath(id) {
  return MONSTER_IMAGES[id] ?? null;
}

/** @param {string} id @returns {number} */
export function getMonsterFieldBottom(id) {
  if (FIELD_BOTTOM_EXTRA_LOWER[id] != null) return FIELD_BOTTOM_EXTRA_LOWER[id];
  return LATER_FIELD_LOWER_IDS.has(id) ? FIELD_BOTTOM_LATER : FIELD_BOTTOM_DEFAULT;
}

/** @param {string} id @param {string} emoji @param {{ compact?: boolean }} [opts] */
export function renderMonsterPortrait(id, emoji, opts = {}) {
  const tier = id === 'metronome_king' ? 'final' : (id.includes('boss') || BOSS_IDS.has(id) ? 'boss' : 'normal');
  const compact = opts.compact ? ' monster-sprite-wrap--compact' : '';
  const largeCanvas = LARGE_CANVAS_IDS.has(id) ? ' monster-sprite-wrap--large-canvas' : '';
  const battleLarge = BATTLE_LARGE_IDS.has(id) ? ' monster-sprite-wrap--battle-large' : '';
  const imagePath = getMonsterImagePath(id);

  const spriteContent = imagePath
    ? `<img class="monster-sprite-img monster-sprite-png" src="${imagePath}" alt="" draggable="false" loading="lazy" data-fallback="${emoji}" onerror="const s=document.createElement('span');s.className='monster-sprite-img';s.textContent=this.dataset.fallback||'';this.replaceWith(s)" />`
    : `<span class="monster-sprite-img">${emoji}</span>`;

  return `<span class="monster-sprite-wrap monster-tier-${tier}${compact}${largeCanvas}${battleLarge}">${spriteContent}<span class="monster-ground-shadow" aria-hidden="true"></span></span>`;
}
