import type React from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// Fonts are self-hosted in public/fonts (SIL Open Font License), so renders never
// depend on fonts.googleapis.com and work offline or behind a proxy.
const FACES: [family: string, weight: string, file: string, style?: string][] = [
  ['Anton', '400', 'fonts/Anton-Regular.ttf'],
  ['Playfair Display', '500', 'fonts/PlayfairDisplay-Italic500.ttf', 'italic'],
  ['Playfair Display', '700', 'fonts/PlayfairDisplay-Italic700.ttf', 'italic'],
  ['Inter', '500', 'fonts/Inter-500.ttf'],
  ['Inter', '700', 'fonts/Inter-700.ttf'],
  ['Inter', '800', 'fonts/Inter-800.ttf'],
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

// ---------- the tailored look ----------
// Same palette as always (cream paper, ink, blue, orange, gold). Type is the graphic:
// giant condensed capitals (DISPLAY) layered with an elegant italic serif (SCRIPT), small
// spaced capitals for labels (SANS). Fine ink hairlines instead of thick outlines.

/** giant condensed capitals: the words that hit */
export const DISPLAY = "'Anton', 'Impact', sans-serif";
/** high-contrast italic serif: the voice around them */
export const SCRIPT = "'Playfair Display', Georgia, serif";
/** labels, captions, sources */
export const SANS = "'Inter', 'Helvetica Neue', sans-serif";
/** code and small data */
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

/** fine ink rule */
export const HAIR = 2;
/** soft lift instead of the hard offset shadow */
export const LIFT = '0 18px 40px rgba(60,45,20,0.14), 0 2px 6px rgba(60,45,20,0.10)';
/** small spaced capitals */
export const LABEL: React.CSSProperties = {fontFamily: SANS, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase'};

export const W = 1920;
export const H = 1080;
/** 8% safe margins; the caption band sits below CONTENT_BOTTOM. */
export const SAFE = {x: 154, y: 86};
export const CONTENT_BOTTOM = 860;
