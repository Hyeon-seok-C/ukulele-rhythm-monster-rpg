/**
 * 리듬 패턴 생성기 — 4/4 마디, 교육용 마디 패턴
 * @typedef {{ type: 'note'|'rest'|'hold', duration: string, vexDuration: string, units: number, strum: string, cardId?: string, tieAfter?: boolean, tieStart?: boolean }} RhythmEvent
 */

import {
  getMeasurePatternsForLevel,
  getEasyLevel4Patterns,
  weightTemplates,
  splitMeasureIntoBeatSlots,
  mergeConsecutiveRests,
} from './education-rhythm.js';

export const UNITS_PER_MEASURE = 16;
export const UNITS_PER_BEAT = 4;
export const BEATS_PER_MEASURE = 4;

/** 난이도 1~5 → 교육 레벨 (5=왕국급·16분 위주) */
function educationLevel(difficulty) {
  if (difficulty <= 1) return 1;
  if (difficulty === 2) return 2;
  if (difficulty === 3) return 3;
  if (difficulty === 4) return 4;
  return 5;
}

const MEASURE_RANGES = {
  1: [1, 1],
  2: [1, 2],
  3: [2, 3],
  4: [2, 2],
  5: [2, 3],
};

/** @param {RhythmEvent[][]} patterns */
function withoutSixteenths(patterns) {
  return patterns.filter((m) => !m.some((e) => e.duration.includes('sixteenth')));
}

/** @param {number} difficulty */
function getPatternsForDifficulty(difficulty) {
  const level = educationLevel(difficulty);
  if (difficulty <= 1) {
    const l1 = getMeasurePatternsForLevel(1);
    const l2easy = withoutSixteenths(getMeasurePatternsForLevel(2));
    return [...l1, ...l1, ...l2easy];
  }
  if (difficulty === 2) {
    const l2 = getMeasurePatternsForLevel(2);
    const l3easy = withoutSixteenths(getMeasurePatternsForLevel(3));
    return [...l2, ...l2, ...l3easy];
  }
  if (difficulty === 3) {
    const l3 = getMeasurePatternsForLevel(3);
    const easy4 = getEasyLevel4Patterns();
    return [...l3, ...l3, ...easy4];
  }
  if (difficulty === 4) {
    const l3 = getMeasurePatternsForLevel(3);
    const l4 = getMeasurePatternsForLevel(4);
    return [...l3, ...l3, ...l4];
  }
  return getMeasurePatternsForLevel(level);
}

function patternKey(events) {
  return events.map((e) => e.vexDuration).join('-');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** @param {RhythmEvent[]} events @returns {RhythmEvent[][]} */
export function splitIntoMeasures(events) {
  const measures = [];
  let current = [];
  let units = 0;
  for (const e of events) {
    current.push(e);
    units += e.units;
    if (units === UNITS_PER_MEASURE) {
      measures.push(current);
      current = [];
      units = 0;
    }
  }
  return measures;
}

/** @param {RhythmEvent[]} events @returns {RhythmEvent[][]} */
export function splitIntoBeats(events) {
  const measures = splitIntoMeasures(events);
  return measures.flatMap((measure) => splitMeasureIntoBeatSlots(measure));
}

/** @param {RhythmEvent[]} measure */
function cloneMeasure(measure) {
  return measure.map((e) => ({ ...e }));
}

/** @param {RhythmEvent[][]} patterns @param {number} level */
function pickMeasure(patterns, level) {
  /** @type {RhythmEvent[][]} */
  let pool = patterns;

  if (level >= 5) {
    const tied = patterns.filter((m) => m.some((e) => e.tieAfter || e.tieStart));
    const withRests = patterns.filter((m) => m.some((e) => e.type === 'rest'));
    const dotted8 = patterns.filter((m) => m.some((e) => e.vexDuration === '8d' || e.vexDuration === '8dr'));
    const roll = Math.random();
    if (tied.length && roll < 0.42) pool = tied;
    else if (withRests.length && roll < 0.62) pool = withRests;
    else if (dotted8.length && roll < 0.78) pool = dotted8;
  } else if (level >= 4) {
    const tied = patterns.filter((m) => m.some((e) => e.tieAfter || e.tieStart));
    const advanced = patterns.filter((m) => m.some((e) => (
      e.duration.includes('sixteenth')
      || e.duration.includes('eighth_dotted')
    )));
    const roll = Math.random();
    if (tied.length && roll < 0.22) pool = tied;
    else if (advanced.length && roll < 0.55) pool = advanced;
  } else if (level === 3) {
    const dotted = patterns.filter((m) => m.some((e) => (
      e.duration.includes('quarter_dotted') || e.duration.includes('eighth_dotted')
    )));
    const dense8 = patterns.filter((m) => {
      const eighthUnits = m.filter((e) => e.duration.includes('eighth') || e.duration.includes('sixteenth'))
        .reduce((s, e) => s + e.units, 0);
      return eighthUnits >= 8;
    });
    const roll = Math.random();
    if (dotted.length && roll < 0.5) pool = dotted;
    else if (dense8.length && roll < 0.85) pool = dense8;
  }

  const measure = cloneMeasure(pool[randomInt(0, pool.length - 1)]);
  return mergeConsecutiveRests(measure);
}

/** @param {number} measureCount @param {RhythmEvent[][]} patterns @param {number} level */
function fillMeasures(measureCount, patterns, level) {
  /** @type {RhythmEvent[]} */
  const all = [];
  /** @type {RhythmEvent[][]} */
  const measureBeats = [];

  for (let m = 0; m < measureCount; m += 1) {
    const measure = pickMeasure(patterns, level);
    measureBeats.push(splitMeasureIntoBeatSlots(measure));
    all.push(...measure);
  }

  return { events: all, measureBeats };
}

/**
 * @param {number} difficulty 1-5
 * @param {string|null} bossRule
 * @param {string|null} lastKey
 */
export function generatePattern(difficulty, bossRule = null, lastKey = null) {
  const [minM, maxM] = MEASURE_RANGES[difficulty] ?? MEASURE_RANGES[1];
  const level = educationLevel(difficulty);
  let patterns = getPatternsForDifficulty(difficulty);
  patterns = weightTemplates(patterns, bossRule);

  let attempts = 0;
  while (attempts < 60) {
    attempts += 1;
    const measureCount = randomInt(minM, maxM);
    const { events, measureBeats } = fillMeasures(measureCount, patterns, level);
    const key = patternKey(events);
    if (key === lastKey) continue;

    const measures = splitIntoMeasures(events);
    const beats = splitIntoBeats(events);

    return {
      events,
      measures,
      measureBeats,
      beats,
      key,
      measureCount,
      beatCount: beats.length,
      educationLevel: level,
      length: measureCount * 4,
      timeSignature: '4/4',
    };
  }

  const fb = [
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓', cardId: 'q_note' },
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓', cardId: 'q_note' },
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓', cardId: 'q_note' },
    { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓', cardId: 'q_note' },
  ];
  const fbBeats = splitMeasureIntoBeatSlots(fb);
  return {
    events: fb,
    measures: [fb],
    measureBeats: [fbBeats],
    beats: fbBeats,
    key: patternKey(fb),
    measureCount: 1,
    beatCount: 4,
    educationLevel: 1,
    length: 4,
    timeSignature: '4/4',
  };
}

export function getStrumHints(events) {
  return events.map((e) => ({ strum: e.strum, isRest: e.type === 'rest' }));
}
