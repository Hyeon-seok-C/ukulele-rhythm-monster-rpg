/**
 * 리듬 패턴 생성기
 * @typedef {{ type: 'note'|'rest', duration: string, vexDuration: string, units: number, strum: string }} RhythmEvent
 */

const STAGE1 = [
  { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓' },
  { type: 'rest', duration: 'quarter_rest', vexDuration: 'qr', units: 4, strum: '쉼' },
];

const STAGE2 = [
  { type: 'note', duration: 'eighth', vexDuration: '8', units: 2, strum: '↓↑' },
  { type: 'rest', duration: 'eighth_rest', vexDuration: '8r', units: 2, strum: '쉼' },
];

const STAGE3 = [
  { type: 'note', duration: 'sixteenth', vexDuration: '16', units: 1, strum: '↓↑↓↑' },
  { type: 'rest', duration: 'sixteenth_rest', vexDuration: '16r', units: 1, strum: '쉼' },
];

const LENGTH_RANGES = {
  1: [4, 4],
  2: [4, 6],
  3: [6, 8],
  4: [8, 10],
  5: [10, 12],
};

function getPool(difficulty, bossRule) {
  let pool = [...STAGE1];
  if (difficulty >= 2) pool = pool.concat(STAGE2);
  if (difficulty >= 3) pool = pool.concat(STAGE3);

  if (bossRule === 'more_rests') {
    pool = pool.filter((e) => e.type === 'rest').concat(pool);
  } else if (bossRule === 'more_sixteenths') {
    pool = pool.filter((e) => e.duration.includes('sixteenth')).concat(pool, STAGE3);
  } else if (bossRule === 'mixed' || bossRule === 'max_difficulty') {
    pool = [...STAGE1, ...STAGE2, ...STAGE3, ...STAGE2, ...STAGE1];
  }

  return pool;
}

function patternKey(events) {
  return events.map((e) => e.vexDuration).join('-');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {number} difficulty 1-5
 * @param {string|null} bossRule
 * @param {string|null} lastKey
 * @returns {{ events: RhythmEvent[], key: string, length: number }}
 */
export function generatePattern(difficulty, bossRule = null, lastKey = null) {
  const [minLen, maxLen] = LENGTH_RANGES[difficulty] ?? LENGTH_RANGES[1];
  const pool = getPool(difficulty, bossRule);
  let attempts = 0;

  while (attempts < 50) {
    attempts++;
    const targetQuarters = randomInt(minLen, maxLen);
    const targetUnits = targetQuarters * 4;
    /** @type {RhythmEvent[]} */
    const events = [];
    let units = 0;

    while (units < targetUnits) {
      const remaining = targetUnits - units;
      const valid = pool.filter((e) => e.units <= remaining);
      if (valid.length === 0) break;
      const pick = valid[randomInt(0, valid.length - 1)];
      events.push({ ...pick });
      units += pick.units;
    }

    if (units !== targetUnits || events.length === 0) continue;

    const key = patternKey(events);
    if (key === lastKey) continue;

    return { events, key, length: targetQuarters };
  }

  const fallback = [
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓' },
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓' },
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓' },
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓' },
  ];
  return { events: fallback, key: patternKey(fallback), length: 4 };
}

export function getStrumHints(events) {
  return events.map((e) => ({ strum: e.strum, isRest: e.type === 'rest' }));
}
