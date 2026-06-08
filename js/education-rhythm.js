/**
 * 교육용 리듬 — 마디 패턴 라이브러리 (스케치 1~36번 기준)
 * @typedef {import('./rhythm-generator.js').RhythmEvent} RhythmEvent
 */

const Q = { type: 'note', duration: 'quarter', vexDuration: 'q', units: 4, strum: '↓', cardId: 'q_note' };
const QR = { type: 'rest', duration: 'quarter_rest', vexDuration: 'qr', units: 4, strum: '쉼', cardId: 'q_rest' };
const E = { type: 'note', duration: 'eighth', vexDuration: '8', units: 2, strum: '↓↑', cardId: 'e_notes' };
const ER = { type: 'rest', duration: 'eighth_rest', vexDuration: '8r', units: 2, strum: '쉼', cardId: 'e_rest' };
const S = { type: 'note', duration: 'sixteenth', vexDuration: '16', units: 1, strum: '↓↑', cardId: 's_notes' };
const SR = { type: 'rest', duration: 'sixteenth_rest', vexDuration: '16r', units: 1, strum: '쉼', cardId: 's_rest' };
const Ed = { type: 'note', duration: 'eighth_dotted', vexDuration: '8d', units: 3, strum: '↓', cardId: 'ed_note' };
const Edr = { type: 'rest', duration: 'eighth_dotted_rest', vexDuration: '8dr', units: 3, strum: '쉼', cardId: 'ed_rest' };
const Qd = { type: 'note', duration: 'quarter_dotted', vexDuration: 'qd', units: 6, strum: '↓', cardId: 'q_note' };
const H = { type: 'note', duration: 'half', vexDuration: 'h', units: 8, strum: '↓', cardId: 'q_note' };
const HR = { type: 'rest', duration: 'half_rest', vexDuration: 'hr', units: 8, strum: '쉼', cardId: 'q_rest' };
const Hd = { type: 'note', duration: 'half_dotted', vexDuration: 'hd', units: 12, strum: '↓', cardId: 'q_note' };
const W = { type: 'note', duration: 'whole', vexDuration: 'w', units: 16, strum: '↓', cardId: 'q_note' };
const WR = { type: 'rest', duration: 'whole_rest', vexDuration: 'wr', units: 16, strum: '쉼', cardId: 'q_rest' };

/** 8분 이음줄 시작/연결 (4단계 싱코페이션) */
const Et = () => ({ ...clone(E), tieAfter: true });
const Ets = () => ({ ...clone(E), tieStart: true, strum: '—' });
const St = () => ({ ...clone(S), tieAfter: true });
const Sts = () => ({ ...clone(S), tieStart: true, strum: '—' });

/** @param {RhythmEvent} t */
function clone(t) {
  return { ...t };
}

/** @param {RhythmEvent[]} events */
function cloneMeasure(events) {
  return events.map(clone);
}

/** @param {number} units */
function unitsToRestEvents(units) {
  /** @type {RhythmEvent[]} */
  const out = [];
  let remaining = units;
  while (remaining > 0) {
    if (remaining >= 8) {
      out.push(clone(HR));
      remaining -= 8;
    } else if (remaining >= 4) {
      out.push(clone(QR));
      remaining -= 4;
    } else if (remaining >= 3) {
      out.push(clone(Edr));
      remaining -= 3;
    } else if (remaining >= 2) {
      out.push(clone(ER));
      remaining -= 2;
    } else {
      out.push(clone(SR));
      remaining -= 1;
    }
  }
  return out;
}

/** @param {RhythmEvent[]} events */
export function mergeConsecutiveRests(events) {
  /** @type {RhythmEvent[]} */
  const merged = [];
  let i = 0;
  while (i < events.length) {
    const event = events[i];
    if (event.type !== 'rest') {
      merged.push(clone(event));
      i += 1;
      continue;
    }
    let j = i;
    let restUnits = 0;
    while (j < events.length && events[j].type === 'rest') {
      restUnits += events[j].units;
      j += 1;
    }
    merged.push(...unitsToRestEvents(restUnits));
    i = j;
  }
  return merged;
}

/** @param {RhythmEvent[]} events — 16단위 마디 */
function finalizeMeasure(events) {
  const total = events.reduce((sum, e) => sum + e.units, 0);
  if (total !== 16) {
    throw new Error(`Invalid measure length: ${total} units`);
  }
  return mergeConsecutiveRests(events.map(clone));
}

/** @param {RhythmEvent[]} events */
function M(...events) {
  return finalizeMeasure(events);
}

/** @param {RhythmEvent[][]} patterns */
function clonePatterns(patterns) {
  return patterns.map((measure) => measure.map(clone));
}

/**
 * 스케치 6종 박 (①~⑥, 각 4 units)
 * ① sEd  ♬♪.   ② sse  ♬♬♪   ③ ess  ♪♬♬
 * ④ srse 16쉼♬♪  ⑤ esSr ♪♬16쉼  ⑥ erss 8쉼♬♬
 */
const SKETCH_BEATS = {
  sEd: () => [clone(S), clone(Ed)],
  sse: () => [clone(S), clone(S), clone(E)],
  ess: () => [clone(E), clone(S), clone(S)],
  srse: () => [clone(SR), clone(S), clone(E)],
  esSr: () => [clone(E), clone(S), clone(SR)],
  erss: () => [clone(ER), clone(S), clone(S)],
};

/** @param {RhythmEvent[]} beat */
function lastNoteIdx(beat) {
  for (let i = beat.length - 1; i >= 0; i -= 1) {
    if (beat[i].type === 'note') return i;
  }
  return -1;
}

/** @param {RhythmEvent[]} beat */
function firstNoteIdx(beat) {
  for (let i = 0; i < beat.length; i += 1) {
    if (beat[i].type === 'note') return i;
  }
  return -1;
}

/** @param {RhythmEvent[]} left @param {RhythmEvent[]} right */
function canTieBeats(left, right) {
  const li = lastNoteIdx(left);
  const ri = firstNoteIdx(right);
  if (li < 0 || ri < 0) return false;
  const lv = left[li].vexDuration;
  const rv = right[ri].vexDuration;
  return (lv === '8' && rv === '8') || (lv === '16' && rv === '16');
}

/** @param {RhythmEvent[]} left @param {RhythmEvent[]} right */
function applyBeatTie(left, right) {
  const li = lastNoteIdx(left);
  const ri = firstNoteIdx(right);
  if (li < 0 || ri < 0) return;
  if (left[li].vexDuration === '8') {
    left[li] = Et();
    right[ri] = Ets();
  } else if (left[li].vexDuration === '16') {
    left[li] = St();
    right[ri] = Sts();
  }
}

/** @param {string[]} cellKeys @param {[boolean,boolean,boolean]} tieFlags */
function composeSketchMeasure(cellKeys, tieFlags = [false, false, false]) {
  const beats = cellKeys.map((key) => SKETCH_BEATS[key]());
  for (let i = 0; i < 3; i += 1) {
    if (tieFlags[i] && canTieBeats(beats[i], beats[i + 1])) {
      applyBeatTie(beats[i], beats[i + 1]);
    }
  }
  return finalizeMeasure(beats.flat());
}

/** 6종 박 조합 + 박 경계 이음줄 → 왕국급 패턴 풀 */
function buildLevel5SketchPatterns() {
  const keys = Object.keys(SKETCH_BEATS);
  /** @type {RhythmEvent[][]} */
  const patterns = [];
  const seen = new Set();

  /** @param {string[]} cells @param {[boolean,boolean,boolean]} ties */
  function push(cells, ties) {
    const measure = composeSketchMeasure(cells, ties);
    const sig = measure.map((e) => (
      `${e.vexDuration}${e.tieAfter ? 'a' : ''}${e.tieStart ? 's' : ''}`
    )).join('|');
    if (seen.has(sig)) return;
    seen.add(sig);
    patterns.push(measure);
  }

  for (const a of keys) {
    for (const b of keys) {
      for (const c of keys) {
        for (const d of keys) {
          const cells = [a, b, c, d];
          for (let mask = 0; mask < 8; mask += 1) {
            push(cells, [!!(mask & 1), !!((mask >> 1) & 1), !!((mask >> 2) & 1)]);
          }
        }
      }
    }
  }

  return patterns;
}

/** 초급 — 4분음표·4분쉼 (①~④) */
const LEVEL_1 = clonePatterns([
  M(Q, Q, Q, Q),
  M(Q, Q, Q, QR),
  M(Q, HR, QR),
  M(Q, QR, Q, QR),
]);

/** 중급 — 8분음표 혼합 (⑤~⑫, ⑰~⑱) */
const LEVEL_2 = clonePatterns([
  M(Q, QR, QR, Q),
  M(QR, Q, QR, Q),
  M(Q, E, E, Q, Q),
  M(Q, E, E, Q, E, E),
  M(Q, Q, E, E, Q),
  M(E, E, Q, E, E, Q),
  M(E, E, Q, E, E, E, E),
  M(E, E, E, E, Q, Q),
  M(QR, E, E, QR, Q),
  M(HR, E, E, Q),
  M(Q, Q, E, E, E, E),
  M(E, E, Q, E, E, Q),
]);

/** 상급 — 2분·점4분·점8분·8분 밀집 (화산 월드) */
const LEVEL_3 = clonePatterns([
  M(E, E, E, E, E, E, Q),
  M(E, E, E, E, E, E, E, E),
  M(E, E, Q, HR),
  M(E, E, HR, Q),
  M(H, H),
  M(H, Q, Q),
  M(H, Q, QR),
  M(H, E, E, Q),
  M(Q, Q, H),
  M(E, E, E, E, H),
  M(Q, H, Q),
  M(Hd, QR),
  M(Hd, Q),
  M(Q, Hd),
  M(Q, E, E, H),
  M(E, E, Q, H),
  // 점4분·점8분 — 1박 시작 패턴
  M(Qd, E, Q, Q),
  M(Qd, E, E, E, Q),
  M(Qd, E, Qd, E),
  M(Q, Qd, E, Q),
  M(Ed, S, E, E, Q, Q),
  M(Ed, S, Ed, S, E, E, E, E),
  M(Q, Ed, S, E, E, Q),
  M(E, E, Ed, S, E, E, E, E),
  M(Ed, S, E, E, E, E, Q),
  M(E, Q, E, H),
  M(Qd, E, H),
  M(E, E, Qd, E, E, E),
]);

/** 최상급 — 16분·싱코페이션·이음줄 (어둠 월드) */
const LEVEL_4 = clonePatterns([
  M(QR, Hd),
  M(W),
  M(HR, H),
  M(Qd, E, H),
  M(Qd, E, Q, Q),
  M(Qd, E, E, E, Q),
  M(Qd, E, Qd, E),
  M(E, Q, E, H),
  // 이음줄 싱코페이션 — ♬♬♬♬ | ♬—♬♬♬ (스케치 기준)
  M(Q, S, S, S, St(), Sts(), S, S, S, Q),
  M(S, S, S, S, S, S, S, St(), Sts(), S, S, S, Q),
  M(Q, E, Et(), Ets(), E, Q),
  M(E, E, Et(), Ets(), Q, Q),
  M(Q, E, E, Et(), Ets(), E, E),
  M(E, E, Q, Et(), Ets(), E, E),
  M(Ed, S, Ed, S, E, E, E, E),
  M(S, S, E, E, S, S, E, E, E, E),
  M(S, S, S, S, S, S, S, S, Q, Q),
  M(Ed, S, E, E, Q, Q),
  M(S, S, E, ER, E, Q, Q),
  M(Q, Ed, S, Ed, S, E, E),
  M(S, E, S, E, E, Q, Q),
  M(Ed, S, Ed, SR, E, E, E, E),
  M(S, S, S, S, E, E, Q, Q),
  M(S, E, S, E, S, E, S, E, E, E),
  M(Ed, S, S, S, Ed, S, E, E, E),
  M(S, S, E, S, S, E, E, E, E, E),
]);

/** 왕국급(5단계) — 스케치 6종 박(①~⑥) 조합 + 박 경계 이음줄 */
const LEVEL_5 = clonePatterns(buildLevel5SketchPatterns());

/** @param {RhythmEvent[]} measure */
export function countSixteenthUnits(measure) {
  return measure
    .filter((e) => e.vexDuration === '16' || e.vexDuration === '16r')
    .reduce((sum, e) => sum + e.units, 0);
}

/** @param {number} level 1=초급 2=중급 3=상급 4=최상급 5=왕국급 */
export function getMeasurePatternsForLevel(level) {
  if (level <= 1) return LEVEL_1;
  if (level === 2) return LEVEL_2;
  if (level === 3) return LEVEL_3;
  if (level === 4) return LEVEL_4;
  return LEVEL_5;
}

/** 4단계 중 16분·이음줄 없는 완만한 패턴 (3→4 브릿지용) */
export function getEasyLevel4Patterns() {
  return LEVEL_4.filter((m) => {
    const has16 = m.some((e) => e.duration.includes('sixteenth'));
    const hasTie = m.some((e) => e.tieAfter || e.tieStart);
    return !has16 && !hasTie;
  });
}

/** @deprecated — beat 단위 (하위 호환) */
export function getBeatTemplatesForLevel(level) {
  return getMeasurePatternsForLevel(level).map((measure) => {
    /** @type {RhythmEvent[][]} */
    const beats = [[], [], [], []];
    let unitPos = 0;
    for (const event of measure) {
      const beatIdx = Math.min(Math.floor(unitPos / 4), 3);
      beats[beatIdx].push(clone(event));
      unitPos += event.units;
    }
    return beats.flat();
  });
}

/** @param {RhythmEvent[][]} patterns @param {string|null} bossRule */
export function weightTemplates(patterns, bossRule) {
  if (bossRule === 'more_rests') {
    const rests = patterns.filter((m) => m.some((e) => e.type === 'rest'));
    return [...rests, ...rests, ...patterns];
  }
  if (bossRule === 'more_sixteenths') {
    const mixed = patterns.filter((m) => m.some((e) => (
      e.duration.includes('sixteenth') || e.duration.includes('quarter_dotted') || e.duration.includes('eighth_dotted')
    )));
    return [...mixed, ...mixed, ...mixed, ...patterns];
  }
  return patterns;
}

/** @param {RhythmEvent[]} beat */
export function normalizeBeatNotation(beat) {
  const key = beat.map((e) => e.vexDuration).join('+');
  const fixes = {
    '8+16+16': [clone(Ed), clone(S)],
    '8+16r+16r': [clone(Ed), clone(SR)],
    '8r+16+16': [clone(Edr), clone(S)],
    '8r+16r+16r': [clone(Edr), clone(SR)],
  };
  if (fixes[key]) return mergeConsecutiveRests(fixes[key]);
  return mergeConsecutiveRests(beat.map(clone));
}

/**
 * 마디 이벤트 → 4박 UI 슬롯 (2분음표 등은 첫 박에만 표시)
 * @param {RhythmEvent[]} measureEvents
 * @returns {RhythmEvent[][]}
 */
export function splitMeasureIntoBeatSlots(measureEvents) {
  /** @type {RhythmEvent[][]} */
  const beats = [[], [], [], []];
  let unitPos = 0;

  for (const event of measureEvents) {
    const startBeat = Math.min(Math.floor(unitPos / 4), 3);
    const endBeat = Math.min(Math.floor((unitPos + event.units - 1) / 4), 3);

    if (startBeat === endBeat) {
      beats[startBeat].push(clone(event));
    } else {
      beats[startBeat].push(clone(event));
      for (let b = startBeat + 1; b <= endBeat; b += 1) {
        beats[b].push({
          type: 'hold',
          duration: 'hold',
          vexDuration: '',
          units: 0,
          strum: '—',
        });
      }
    }
    unitPos += event.units;
  }

  return beats.map((beat) => {
    const notes = beat.filter((e) => e.type !== 'hold');
    if (!notes.length) {
      return [{ type: 'hold', duration: 'hold', vexDuration: '', units: 0, strum: '—' }];
    }
    return normalizeBeatNotation(notes);
  });
}

/** @param {RhythmEvent[]} beat */
export function getBeatRhythmLevel(beat) {
  if (beat.some((e) => e.duration.includes('sixteenth') || e.duration.includes('eighth_dotted') || e.duration.includes('quarter_dotted'))) {
    return 'sixteenth';
  }
  if (beat.some((e) => e.duration.includes('eighth'))) return 'eighth';
  if (beat.some((e) => e.duration.includes('half'))) return 'half';
  return 'quarter';
}

/** @param {RhythmEvent[]} beat @param {number} beatNum 1-4 */
export function getCountingLabel(beat, beatNum) {
  const playable = beat.filter((e) => e.type !== 'hold');
  if (!playable.length) return '—';
  const level = getBeatRhythmLevel(playable);
  if (level === 'quarter' || level === 'half') return `${beatNum}`;
  if (level === 'eighth') return `${beatNum} &`;
  return `${beatNum} e & a`;
}

/** @param {RhythmEvent[]} beat */
export function getStrumLabel(beat) {
  const playable = beat.filter((e) => e.type !== 'hold' && e.type !== 'rest');
  if (!playable.length) {
    if (beat.every((e) => e.type === 'rest' || e.type === 'hold')) return '쉼';
    return '—';
  }
  if (playable.length === 1) return playable[0].strum;
  return playable.map((e) => e.strum).join(' ');
}

/** @param {RhythmEvent[]} beat */
export function isRestBeat(beat) {
  if (!beat.length || beat.every((e) => e.type === 'hold')) return false;
  return beat.every((e) => e.type === 'rest' || e.type === 'hold');
}
