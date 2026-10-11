import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// Fonts are self-hosted in public/fonts (SIL Open Font License), so renders never
// depend on fonts.googleapis.com and work offline or behind a proxy.
const FACES: [family: string, weight: string, file: string, style?: string][] = [
  ['Instrument Serif', '400', 'fonts/InstrumentSerif-Regular.ttf'],
  ['Instrument Serif', '400', 'fonts/InstrumentSerif-Italic.ttf', 'italic'],
  ['Bricolage Grotesque', '700', 'fonts/BricolageGrotesque-700.ttf'],
  ['Bricolage Grotesque', '800', 'fonts/BricolageGrotesque-800.ttf'],
  ['JetBrains Mono', '700', 'fonts/JetBrainsMono-700.ttf'],
  ['JetBrains Mono', '800', 'fonts/JetBrainsMono-800.ttf'],
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(([family, weight, file, style = 'normal']) =>
      new FontFace(family, `url('${staticFile(file)}') format('truetype')`, {weight, style}).load().then((face) => document.fonts.add(face)),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
}

// Type system: SERIF for titles and statements (the editorial voice), HEAD for UI, labels and
// captions, MONO for numbers, code and sources.
export const SERIF = "'Instrument Serif', 'Times New Roman', serif";
export const HEAD = "'Bricolage Grotesque', sans-serif";
export const MONO = "'JetBrains Mono', monospace";

export const C = {
  cream: '#F3EEDF',
  creamDark: '#E4DCC6',
  paper: '#FFFCF4',
  ink: '#131313',
  blue: '#1F3BFF',
  blueSoft: '#C9D0FF',
  orange: '#FF6A2B',
  orangeSoft: '#FFD2BE',
  gold: '#FFD84D',
  goldDark: '#E2A512',
  grey: '#A9A291',
  greyLight: '#D8D1BE',
  skin: '#FFD3AE',
  white: '#FFFFFF',
};

export const STROKE = 5;
export const SHADOW = `6px 6px 0 ${C.ink}`;

export const W = 1920;
export const H = 1080;
/** 8% safe margins; the caption band sits below CONTENT_BOTTOM. */
export const SAFE = {x: 154, y: 86};
export const CONTENT_BOTTOM = 860;
