import { Renderer, Stave, StaveNote, Voice, Formatter, Beam } from 'https://cdn.jsdelivr.net/npm/vexflow@4.2.5/+esm';

/**
 * VexFlow로 리듬 패턴 렌더링
 * @param {HTMLElement} container
 * @param {import('./rhythm-generator.js').RhythmEvent[]} events
 */
export function renderScore(container, events) {
  container.innerHTML = '';

  const width = Math.max(400, events.length * 60 + 80);
  const height = 140;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();
  context.setFont('Arial', 10);

  const stave = new Stave(10, 20, width - 30);
  stave.addClef('percussion').addTimeSignature('4/4');
  stave.setContext(context).draw();

  const notes = events.map((e) => {
    if (e.type === 'rest') {
      return new StaveNote({
        keys: ['b/4'],
        duration: e.vexDuration,
        clef: 'percussion',
      });
    }
    return new StaveNote({
      keys: ['f/4'],
      duration: e.vexDuration,
      clef: 'percussion',
    });
  });

  const totalBeats = events.reduce((sum, e) => sum + e.units / 4, 0);
  const numBeats = Math.max(4, Math.ceil(totalBeats));

  const voice = new Voice({ numBeats, beatValue: 4 });
  voice.setStrict(false);
  voice.addTickables(notes);

  const beams = Beam.generateBeams(notes.filter((n) => {
    const d = n.getDuration();
    return d === '8' || d === '16' || d === '8d' || d === '16d';
  }));

  new Formatter().joinVoices([voice]).format([voice], width - 60);
  voice.draw(context, stave);
  beams.forEach((b) => b.setContext(context).draw());
}
