/** @typedef {{ id: string, name: string, emoji: string, hp: number, atk: number, exp: number, isBoss?: boolean, bossRule?: string }} Monster */

/** @typedef {{ id: number, name: string, theme: string, difficulty: number }} World */

export const WORLDS = /** @type {World[]} */ ([
  { id: 1, name: '숲의 리듬', theme: 'theme-beginner', difficulty: 1 },
  { id: 2, name: '동굴의 박자', theme: 'theme-intermediate', difficulty: 2 },
  { id: 3, name: '화산의 스트럼', theme: 'theme-advanced', difficulty: 3 },
  { id: 4, name: '어둠의 템포', theme: 'theme-advanced', difficulty: 4 },
  { id: 5, name: '메트로놈 성', theme: 'theme-boss', difficulty: 5 },
]);

export const EXP_TABLE = [0, 10, 25, 50, 80, 120, 170, 230, 300, 400];

export const MONSTERS = /** @type {Record<number, Monster[]>} */ ({
  1: [
    { id: 'slime', name: '슬라임', emoji: '🟢', hp: 15, atk: 2, exp: 8 },
    { id: 'baby_slime', name: '아기슬라임', emoji: '💚', hp: 12, atk: 2, exp: 6 },
    { id: 'mushroom', name: '버섯몬', emoji: '🍄', hp: 18, atk: 3, exp: 10 },
    { id: 'goblin', name: '숲고블린', emoji: '👺', hp: 20, atk: 3, exp: 12 },
    { id: 'rhythm_rabbit', name: '리듬토끼', emoji: '🐰', hp: 16, atk: 3, exp: 10 },
    { id: 'beat_bear', name: '비트베어', emoji: '🐻', hp: 40, atk: 5, exp: 30, isBoss: true, bossRule: 'continuous' },
  ],
  2: [
    { id: 'bat', name: '박쥐', emoji: '🦇', hp: 18, atk: 3, exp: 12 },
    { id: 'skeleton', name: '해골병사', emoji: '💀', hp: 22, atk: 4, exp: 14 },
    { id: 'cave_thief', name: '동굴도적', emoji: '🥷', hp: 20, atk: 4, exp: 13 },
    { id: 'rhythm_wolf', name: '리듬늑대', emoji: '🐺', hp: 24, atk: 4, exp: 15 },
    { id: 'troll', name: '트롤', emoji: '👹', hp: 28, atk: 5, exp: 18 },
    { id: 'cave_orc', name: '동굴오크', emoji: '🧌', hp: 50, atk: 6, exp: 40, isBoss: true, bossRule: 'more_rests' },
  ],
  3: [
    { id: 'salamander', name: '불도마뱀', emoji: '🦎', hp: 26, atk: 5, exp: 18 },
    { id: 'fire_spirit', name: '화염정령', emoji: '🔥', hp: 24, atk: 5, exp: 17 },
    { id: 'lava_knight', name: '용암기사', emoji: '⚔️', hp: 30, atk: 6, exp: 20 },
    { id: 'volcano_orc', name: '화산오크', emoji: '👺', hp: 32, atk: 6, exp: 22 },
    { id: 'red_dragon', name: '붉은드래곤', emoji: '🐉', hp: 35, atk: 7, exp: 25 },
    { id: 'beat_phoenix', name: '비트피닉스', emoji: '🦅', hp: 60, atk: 8, exp: 50, isBoss: true, bossRule: 'more_sixteenths' },
  ],
  4: [
    { id: 'dark_mage', name: '암흑마법사', emoji: '🧙', hp: 34, atk: 7, exp: 24 },
    { id: 'shadow_thief', name: '그림자도적', emoji: '🌑', hp: 32, atk: 7, exp: 23 },
    { id: 'wraith_knight', name: '망령기사', emoji: '👻', hp: 38, atk: 8, exp: 28 },
    { id: 'dark_priest', name: '어둠의사제', emoji: '🕯️', hp: 36, atk: 8, exp: 26 },
    { id: 'death_knight', name: '데스나이트', emoji: '⚰️', hp: 42, atk: 9, exp: 30 },
    { id: 'tempo_lord', name: '템포로드', emoji: '⏱️', hp: 70, atk: 9, exp: 60, isBoss: true, bossRule: 'mixed' },
  ],
  5: [
    { id: 'metron', name: '메트론', emoji: '⏰', hp: 40, atk: 8, exp: 30 },
    { id: 'beat_guardian', name: '비트가디언', emoji: '🛡️', hp: 44, atk: 9, exp: 32 },
    { id: 'rhythm_golem', name: '리듬골렘', emoji: '🗿', hp: 48, atk: 9, exp: 35 },
    { id: 'chrono_dragon', name: '크로노드래곤', emoji: '🐲', hp: 52, atk: 10, exp: 38 },
    { id: 'harmonic_king', name: '하모닉킹', emoji: '👑', hp: 55, atk: 10, exp: 40 },
    { id: 'metronome_king', name: '메트로놈 킹', emoji: '🎵', hp: 100, atk: 12, exp: 100, isBoss: true, bossRule: 'max_difficulty' },
  ],
});

export function getMonster(worldId, index) {
  const list = MONSTERS[worldId];
  return list[Math.min(index, list.length - 1)];
}

export function getWorld(id) {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}
