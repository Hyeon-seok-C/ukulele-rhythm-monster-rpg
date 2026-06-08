let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function beep(freq, duration, type = 'square', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* audio unavailable */
  }
}

export const sounds = {
  click: () => beep(440, 0.08),
  success: () => {
    beep(523, 0.1);
    setTimeout(() => beep(659, 0.1), 80);
  },
  miss: () => beep(180, 0.2, 'sawtooth'),
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 120));
  },
  levelUp: () => {
    [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'sine', 0.2), i * 100));
  },
  boss: () => {
    beep(110, 0.4, 'sawtooth', 0.2);
    setTimeout(() => beep(87, 0.5, 'sawtooth', 0.2), 200);
  },
  gameOver: () => {
    [392, 349, 330, 262].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'triangle'), i * 200));
  },
  attack: () => beep(300, 0.06, 'square', 0.12),
  skill: () => {
    beep(880, 0.08);
    setTimeout(() => beep(1100, 0.12), 60);
  },
  burst: () => {
    beep(220, 0.06, 'square', 0.18);
    setTimeout(() => beep(440, 0.08, 'square', 0.15), 40);
    setTimeout(() => beep(660, 0.1, 'square', 0.12), 90);
  },
  shield: () => {
    beep(520, 0.15, 'sine', 0.12);
    setTimeout(() => beep(780, 0.2, 'sine', 0.1), 100);
  },
  guide: () => {
    beep(660, 0.1, 'sine', 0.1);
    setTimeout(() => beep(880, 0.12, 'sine', 0.1), 80);
  },
};

export function resumeAudio() {
  try {
    getCtx().resume();
  } catch {
    /* ignore */
  }
}
