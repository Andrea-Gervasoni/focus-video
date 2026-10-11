import {loadFont as loadHead} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

export const HEAD = loadHead('normal', {weights: ['700', '800'], subsets: ['latin', 'latin-ext']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['700', '800'], subsets: ['latin']}).fontFamily;

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
