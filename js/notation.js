import { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Dot, StaveTie } from 'https://cdn.jsdelivr.net/npm/vexflow@4.2.5/+esm';
import { splitIntoMeasures, BEATS_PER_MEASURE } from './rhythm-generator.js';
import {
  getCountingLabel,
  getStrumLabel,
  isRestBeat,
} from './education-rhythm.js';

/** 렌더 해상도 대비 화면 표시 크기 — 작을수록 음표가 작아짐 */
const NOTE_SCALE = 0.58;
const MEASURE_UNITS = 16;
/** 오선 위·아래 여백 (빔·기둥·쉼표) */
const STAVE_Y = 26;
const RENDER_HEIGHT = 120;
/** 박과 박 사이 여백 (px, 렌더 좌표) */
const BEAT_INNER_GAP = 4;
/** 오선 음표 영역 안쪽 여백 — 빔·기둥·점8분 */
const STAVE_PAD_LEFT = 6;
const STAVE_PAD_RIGHT = 18;
/** 음표 머리+기둥이 span 밖으로 나가는 최대 px */
const NOTE_STEM_TAIL = 12;

/** VexFlow 4.x — '8d'/'8dr'만으로는 점이 안 그려져 Dot.buildAndAttach 필요 */
function parseVexDuration(vexDuration) {
  if (vexDuration.endsWith('dr')) {
    return { duration: `${vexDuration.slice(0, -2)}r`, dotted: true };
  }
  if (vexDuration.endsWith('d')) {
    return { duration: vexDuration.slice(0, -1), dotted: true };
  }
  return { duration: vexDuration, dotted: false };
}

/** @typedef {import('./rhythm-generator.js').RhythmEvent & { tieAfter?: boolean, tieStart?: boolean }} DisplayEvent */

/** @param {DisplayEvent} event @param {number} units */
function eventForUnits(event, units) {
  const isRest = event.type === 'rest';
  if (units === 1) {
    return { ...event, vexDuration: isRest ? '16r' : '16', duration: isRest ? 'sixteenth_rest' : 'sixteenth', units: 1 };
  }
  if (units === 2) {
    return { ...event, vexDuration: isRest ? '8r' : '8', duration: isRest ? 'eighth_rest' : 'eighth', units: 2 };
  }
  if (units === 3) {
    return { ...event, vexDuration: isRest ? '8dr' : '8d', duration: isRest ? 'eighth_dotted_rest' : 'eighth_dotted', units: 3 };
  }
  if (units === 4) {
    return { ...event, vexDuration: isRest ? 'qr' : 'q', duration: isRest ? 'quarter_rest' : 'quarter', units: 4 };
  }
  return { ...event, units };
}

/** 박 경계에서 끊고 이음줄 연결 (8+8=4분처럼 박을 넘기는 길이) */
function splitAtBeatBoundaries(events) {
  /** @type {DisplayEvent[]} */
  const out = [];
  let unitPos = 0;
  for (const event of events) {
    /** @type {DisplayEvent[]} */
    const parts = [];
    let rem = event.units;
    while (rem > 0) {
      const room = 4 - (unitPos % 4);
      const take = Math.min(rem, room);
      parts.push(eventForUnits(event, take));
      unitPos += take;
      rem -= take;
    }
    parts.forEach((part, idx) => {
      if (parts.length === 1) {
        part.tieStart = !!event.tieStart;
        part.tieAfter = !!event.tieAfter;
      } else {
        part.tieStart = idx > 0 ? true : !!event.tieStart;
        part.tieAfter = idx < parts.length - 1 ? true : !!event.tieAfter;
      }
      out.push(part);
    });
  }
  return out;
}

/** @param {DisplayEvent} a @param {DisplayEvent} b */
function sixteenthsToEighth(a, b) {
  const isRest = a.type === 'rest';
  return {
    ...a,
    duration: isRest ? 'eighth_rest' : 'eighth',
    vexDuration: isRest ? '8r' : '8',
    units: 2,
    tieStart: !!a.tieStart,
    tieAfter: !!b.tieAfter,
  };
}

/** 한 박 안 16분 4개 → 16+16+8 (스케치 하단) */
function collapseSixteenthsInBeat(beatEvents) {
  /** @type {DisplayEvent[]} */
  const out = [];
  let i = 0;
  while (i < beatEvents.length) {
    const e = beatEvents[i];
    if (e.vexDuration !== '16' && e.vexDuration !== '16r') {
      out.push({ ...e });
      i += 1;
      continue;
    }
    /** @type {DisplayEvent[]} */
    const group = [];
    while (i < beatEvents.length) {
      const cur = beatEvents[i];
      if (cur.vexDuration !== '16' && cur.vexDuration !== '16r') break;
      group.push({ ...cur });
      i += 1;
    }
    if (group.length === 4) {
      out.push({ ...group[0], tieStart: group[0].tieStart, tieAfter: false });
      out.push({ ...group[1], tieStart: false, tieAfter: false });
      out.push(sixteenthsToEighth(group[2], group[3]));
    } else {
      group.forEach((g) => out.push({ ...g }));
    }
  }
  return out;
}

/** @param {DisplayEvent[]} events */
function bucketByBeat(events) {
  /** @type {DisplayEvent[][]} */
  const beats = [[], [], [], []];
  let unitPos = 0;
  for (const event of events) {
    beats[Math.min(Math.floor(unitPos / 4), 3)].push(event);
    unitPos += event.units;
  }
  return beats;
}

/** @param {import('./rhythm-generator.js').RhythmEvent[]} measureEvents */
function prepareMeasureForNotation(measureEvents) {
  const split = splitAtBeatBoundaries(measureEvents);
  return bucketByBeat(split).flatMap(collapseSixteenthsInBeat);
}

/** @param {DisplayEvent[]} events */
function buildNotes(events) {
  return events.map((e) => {
    const { duration, dotted } = parseVexDuration(e.vexDuration);
    const note = new StaveNote({
      keys: [e.type === 'rest' ? 'b/4' : 'f/4'],
      duration,
      clef: 'percussion',
    });
    if (dotted) {
      Dot.buildAndAttach([note], { all: true });
    }
    return note;
  });
}

function isBeamable(note) {
  if (typeof note.isRest === 'function' && note.isRest()) return false;
  const d = note.getDuration();
  return d === '8' || d === '16' || d === '8d' || d === '16d';
}

function computeEqualBeatBoundaries(stave, beatCount = 4) {
  const start = typeof stave.getNoteStartX === 'function'
    ? stave.getNoteStartX()
    : stave.getX() + 12;
  const end = typeof stave.getNoteEndX === 'function'
    ? stave.getNoteEndX()
    : stave.getX() + stave.getWidth() - 12;
  const beatWidth = (end - start) / beatCount;
  return Array.from({ length: beatCount + 1 }, (_, i) => start + i * beatWidth);
}

/** @param {DisplayEvent[]} measureEvents */
function bucketEventsByBeat(measureEvents) {
  /** @type {{ event: import('./rhythm-generator.js').RhythmEvent, noteIdx: number }[][]} */
  const buckets = [[], [], [], []];
  let noteIdx = 0;
  let unitPos = 0;
  for (const event of measureEvents) {
    const bi = Math.min(Math.floor(unitPos / 4), 3);
    buckets[bi].push({ event, noteIdx: noteIdx++ });
    unitPos += event.units;
  }
  return buckets;
}

function getStaveLayoutMetrics(staveWrap, layout) {
  const svg = staveWrap?.querySelector('svg');
  if (!svg || !layout) return null;

  const wrapRect = staveWrap.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  if (!wrapRect.width || !svgRect.width) return null;

  const svgScale = svgRect.width / layout.renderWidth;
  const svgOffsetLeft = svgRect.left - wrapRect.left;

  const noteStart = svgOffsetLeft + layout.boundaries[0] * svgScale;
  const noteEnd = svgOffsetLeft + layout.boundaries[layout.boundaries.length - 1] * svgScale;

  const beatWidths = [];
  for (let i = 0; i < layout.boundaries.length - 1; i++) {
    beatWidths.push((layout.boundaries[i + 1] - layout.boundaries[i]) * svgScale);
  }

  return {
    wrapWidth: wrapRect.width,
    noteStart,
    noteEnd,
    noteWidth: noteEnd - noteStart,
    beatWidths,
  };
}

function applyBeatRowLayout(el, layout, staveWrap) {
  if (!el || !layout || !staveWrap) return;

  const metrics = getStaveLayoutMetrics(staveWrap, layout);
  if (!metrics) return;

  const parent = el.parentElement;
  const parentRect = parent?.getBoundingClientRect();
  const wrapRect = staveWrap.getBoundingClientRect();
  if (!parentRect?.width) return;

  const leftInParent = metrics.noteStart + (wrapRect.left - parentRect.left);

  el.style.marginLeft = `${(leftInParent / parentRect.width) * 100}%`;
  el.style.width = `${(metrics.noteWidth / parentRect.width) * 100}%`;
  el.style.paddingLeft = '0';
  el.style.paddingRight = '0';
  el.style.gridTemplateColumns = metrics.beatWidths.map((w) => `${w}fr`).join(' ');
}

/**
 * 음표는 span 왼쪽(박 시작)에, 쉼표는 span 중앙에 배치
 */
function noteAnchorX(spanStart, spanW, units, isRest) {
  if (isRest) {
    if (units >= 8) return spanStart + spanW / 2 - 9;
    if (units >= 4) return spanStart + spanW / 2 - 7;
    return spanStart + spanW / 2 - 5;
  }
  if (units >= 16) return spanStart + spanW / 2 - 10;
  return spanStart + 2;
}

/** @param {number} x @param {number} spanStart @param {number} spanEnd @param {boolean} isRest */
function clampNoteX(x, spanStart, spanEnd, isRest) {
  const tail = isRest ? 6 : NOTE_STEM_TAIL;
  const minX = spanStart + 1;
  const maxX = spanEnd - tail;
  return Math.min(Math.max(x, minX), maxX);
}

/**
 * 마디 16단위 비율 배치 — 박마다 슬롯 폭이 달라지며 4박이 넘치는 문제 방지
 */
function layoutMeasureNotes(allNotes, measureEvents, stave) {
  const boundaries = computeEqualBeatBoundaries(stave, 4);
  const innerStart = boundaries[0] + STAVE_PAD_LEFT;
  const innerEnd = boundaries[4] - STAVE_PAD_RIGHT;
  const unitW = (innerEnd - innerStart) / MEASURE_UNITS;

  const voice = new Voice({ numBeats: 4, beatValue: 4 });
  voice.setStrict(false);
  voice.addTickables(allNotes);
  new Formatter().joinVoices([voice]).format([voice], innerEnd - innerStart);

  let unitPos = 0;
  measureEvents.forEach((event, noteIdx) => {
    const note = allNotes[noteIdx];
    const beatIdx = Math.min(Math.floor(unitPos / 4), 3);
    const beatStart = boundaries[beatIdx] + STAVE_PAD_LEFT;
    const beatEnd = boundaries[beatIdx + 1] - (beatIdx < 3 ? BEAT_INNER_GAP : STAVE_PAD_RIGHT);
    const spanStart = innerStart + unitPos * unitW;
    const spanW = event.units * unitW;
    const spanEnd = spanStart + spanW;
    const isRest = typeof note.isRest === 'function' && note.isRest();
    let anchorX = noteAnchorX(spanStart, spanW, event.units, isRest);
    anchorX = clampNoteX(anchorX, beatStart, beatEnd, isRest);
    anchorX = clampNoteX(anchorX, innerStart, innerEnd, isRest);
    const tc = note.getTickContext();
    if (tc) tc.setX(anchorX);
    unitPos += event.units;
  });

  return voice;
}

/**
 * 박 안 음표 빔 — 16+16+8 혼합도 한 박 안에서만
 * 박을 넘는 이음(Et/Ets)은 빔으로 묶지 않음
 */
function createBeatBeams(allNotes, measureEvents) {
  /** @type {import('vexflow').Beam[]} */
  const beams = [];
  const beatBuckets = bucketEventsByBeat(measureEvents);

  beatBuckets.forEach((bucket) => {
    const beatNotes = bucket.map(({ noteIdx }) => allNotes[noteIdx]);
    const beamable = beatNotes.filter(isBeamable);
    if (beamable.length < 2) return;

    Beam.generateBeams(beamable, {
      beam_rests: false,
      beam_middle_rests: false,
    }).forEach((beam) => {
      beam.getNotes().forEach((note) => {
        if (typeof note.setBeam === 'function') note.setBeam(beam);
      });
      beams.push(beam);
    });
  });

  return beams;
}

/** 박 경계에서만 이음줄 (8+8=4분, 싱코페이션) */
function createTies(allNotes, measureEvents) {
  /** @type {import('vexflow').StaveTie[]} */
  const ties = [];
  let unitPos = 0;
  for (let i = 0; i < measureEvents.length - 1; i += 1) {
    const cur = measureEvents[i];
    const next = measureEvents[i + 1];
    const endPos = unitPos + cur.units;
    const onBeatBoundary = endPos % 4 === 0 && endPos > 0 && endPos < MEASURE_UNITS;
    unitPos = endPos;
    if (!onBeatBoundary) continue;
    if (cur.type !== 'note' || next.type !== 'note') continue;
    if (!cur.tieAfter || !next.tieStart) continue;
    ties.push(new StaveTie({
      first_note: allNotes[i],
      last_note: allNotes[i + 1],
      first_indices: [0],
      last_indices: [0],
    }));
  }
  return ties;
}

function fitSvgToDisplay(container, renderWidth, renderHeight, displayWidth) {
  const svg = container.querySelector('svg');
  if (!svg) return;

  const displayHeight = Math.round(renderHeight * NOTE_SCALE);
  svg.setAttribute('viewBox', `0 0 ${renderWidth} ${renderHeight}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  svg.setAttribute('width', String(displayWidth));
  svg.setAttribute('height', String(displayHeight));
  svg.style.width = '100%';
  svg.style.height = `${displayHeight}px`;
  svg.style.minHeight = `${displayHeight}px`;
  svg.style.display = 'block';
  svg.style.overflow = 'hidden';
  svg.style.maxWidth = '100%';
  container.style.minHeight = `${displayHeight + 4}px`;
  container.style.overflow = 'hidden';
}

/**
 * @param {HTMLElement} container
 * @param {import('./rhythm-generator.js').RhythmEvent[][]} beats
 * @param {{ width?: number, showTimeSig?: boolean }} [opts]
 */
export function renderMeasureStave(container, beats, opts = {}) {
  container.innerHTML = '';
  const displayWidth = opts.width ?? 480;
  const renderWidth = Math.round(displayWidth / NOTE_SCALE);
  const renderHeight = RENDER_HEIGHT;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(renderWidth, renderHeight);
  const context = renderer.getContext();

  const stave = new Stave(10, STAVE_Y, renderWidth - 20, { numLines: 5 });
  if (opts.showTimeSig !== false) {
    stave.addTimeSignature('4/4');
  }
  stave.setContext(context).draw();

  const measureEvents = beats
    .flat()
    .filter((e) => e.type !== 'hold' && e.vexDuration);
  const displayEvents = prepareMeasureForNotation(measureEvents);
  const allNotes = buildNotes(displayEvents);
  const boundaries = computeEqualBeatBoundaries(stave, beats.length);

  const voice = layoutMeasureNotes(allNotes, displayEvents, stave);
  const beams = createBeatBeams(allNotes, displayEvents);
  const ties = createTies(allNotes, displayEvents);

  voice.draw(context, stave);
  beams.forEach((b) => b.setContext(context).draw());
  ties.forEach((t) => t.setContext(context).draw());

  fitSvgToDisplay(container, renderWidth, renderHeight, displayWidth);

  return { boundaries, renderWidth, displayWidth };
}

export function renderScore(container, events, measureBeats = null) {
  container.innerHTML = '';

  const measures = measureBeats ?? splitIntoMeasures(events).map((m) => {
    const beatList = [];
    let u = 0;
    let cur = [];
    for (const e of m) {
      cur.push(e);
      u += e.units;
      if (u === 4) {
        beatList.push(cur);
        cur = [];
        u = 0;
      }
    }
    return beatList;
  });

  const wrap = document.createElement('div');
  wrap.className = 'score-measures-wrap';

  measures.forEach((beats, mi) => {
    const block = document.createElement('div');
    block.className = 'score-measure-block';
    if (mi === 0) {
      const label = document.createElement('div');
      label.className = 'score-clef-label';
      label.textContent = '🥁 4/4';
      block.appendChild(label);
    }
    const staveEl = document.createElement('div');
    staveEl.className = 'score-measure-stave';
    block.appendChild(staveEl);
    wrap.appendChild(block);
    const scoreWidth = Math.max(Math.min((container.clientWidth || 420) - 24, 480), 280);
    renderMeasureStave(staveEl, beats, { width: scoreWidth, showTimeSig: mi === 0 });
  });

  container.appendChild(wrap);
}

export function renderEducationalCards(container, measureBeats, opts = {}) {
  if (!container) return;
  container.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'edu-measures-row';

  measureBeats.forEach((beats, mi) => {
    const measure = document.createElement('div');
    measure.className = [
      'edu-measure',
      opts.successMeasure === mi ? 'edu-measure-success' : '',
    ].filter(Boolean).join(' ');

    const header = document.createElement('div');
    header.className = 'edu-measure-header';
    header.innerHTML = `<span class="edu-ts">4/4</span><span class="edu-measure-num">${mi + 1}마디</span>`;
    measure.appendChild(header);

    const beatNums = document.createElement('div');
    beatNums.className = 'edu-beat-numbers-row';
    beats.forEach((_, bi) => {
      const n = document.createElement('div');
      n.className = 'edu-beat-number-top';
      n.textContent = String(bi + 1);
      beatNums.appendChild(n);
    });
    measure.appendChild(beatNums);

    const staveWrap = document.createElement('div');
    staveWrap.className = 'edu-measure-stave-wrap';
    const staveEl = document.createElement('div');
    staveEl.className = 'edu-measure-stave';
    staveWrap.appendChild(staveEl);
    measure.appendChild(staveWrap);

    const panelWidth = container.clientWidth || 360;
    const displayWidth = Math.max(Math.min(panelWidth - 36, 520), 280);
    const layout = renderMeasureStave(staveEl, beats, {
      width: displayWidth,
      showTimeSig: mi === 0,
    });

    /** @type {HTMLElement | null} */
    let countRow = null;
    if (opts.showCounting) {
      countRow = document.createElement('div');
      countRow.className = 'edu-counting-row';
      beats.forEach((beat, bi) => {
        const c = document.createElement('div');
        c.className = 'edu-counting-cell';
        c.textContent = getCountingLabel(beat, bi + 1);
        countRow.appendChild(c);
      });
      measure.appendChild(countRow);
    }

    const strumRow = document.createElement('div');
    strumRow.className = 'edu-strum-row';
    beats.forEach((beat) => {
      const s = document.createElement('div');
      s.className = ['edu-strum-cell', isRestBeat(beat) ? 'edu-strum-rest' : ''].filter(Boolean).join(' ');
      if (isRestBeat(beat)) {
        s.textContent = '쉼';
      } else if (beat.every((e) => e.type === 'hold')) {
        s.textContent = '—';
        s.classList.add('edu-strum-hold');
      } else if (opts.hideStrum) {
        s.textContent = '—';
        s.classList.add('edu-strum-hidden');
      } else {
        s.textContent = getStrumLabel(beat);
      }
      strumRow.appendChild(s);
    });
    measure.appendChild(strumRow);

    const syncBeatLayout = () => {
      applyBeatRowLayout(beatNums, layout, staveWrap);
      if (countRow) applyBeatRowLayout(countRow, layout, staveWrap);
      applyBeatRowLayout(strumRow, layout, staveWrap);
    };
    syncBeatLayout();
    requestAnimationFrame(syncBeatLayout);

    row.appendChild(measure);
  });

  container.appendChild(row);
}

/** @deprecated */
export function renderBeatCards(container, beats, opts = {}) {
  const mb = [];
  for (let i = 0; i < beats.length; i += BEATS_PER_MEASURE) {
    mb.push(beats.slice(i, i + BEATS_PER_MEASURE));
  }
  renderEducationalCards(container, mb, opts);
}

export function renderBeat(container, beatEvents, opts = {}) {
  renderMeasureStave(container, [beatEvents], opts);
}

export function renderMeasure(container, beatEvents, opts = {}) {
  renderMeasureStave(container, [beatEvents], opts);
}

export function renderMeasureCards(container, measureBeats, opts = {}) {
  renderEducationalCards(container, measureBeats, opts);
}
