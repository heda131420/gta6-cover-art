// Fixed scenes for screenshots, driven by the page's query string:
//   ?shot=cover&photo=beach&caption=Sunset%20Heist&size=square&grade=sunset
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen&size=wide&grade=neon
//   ?shot=cover&panels=beach,boulevard,skyline&caption=Three%20Ways%20Down
// `panels` names one sample per panel (left, centre, right); without it every
// panel uses `photo`. window.__shotReady is set once the scene has painted.

export function runShot(shot, query, env) {
  const name = (v, fallback) => (v && v.trim() ? v.trim() : fallback);
  const caption = name(query.get('caption'), 'Sunset Heist');
  const grade = name(query.get('grade'), 'sunset');
  const size = name(query.get('size'), 'square');
  const pick = name(query.get('photo'), 'beach');
  const panelNames = query.get('panels')
    ? query.get('panels').split(',').map((s) => name(s, pick))
    : [pick, pick, pick];
  while (panelNames.length < 3) panelNames.push(pick);
  const panels = panelNames.slice(0, 3).map((sample) => ({
    img: env.samples[sample] ?? env.samples.beach,
    src: `sample: ${sample}`,
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
  if (shot === 'cover') document.body.classList.add('shot-cover');
  env.apply({ panels, caption, grade, size });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
