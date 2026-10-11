import {noise2D} from '@remotion/noise';
import {SCENES} from './script';
import {cueAbs, impactPulse, sceneFrames, getScene} from './timing';

// ---------- the canvas ----------
// Every station is a 1920x1080 "page" on one huge notebook. Origins in world px.
export const STATIONS = {
  hook: {x: 0, y: 0},
  who: {x: 2700, y: 0},
  whoB: {x: 2700, y: 1500},
  problem: {x: 5400, y: 0},
  sim: {x: 5400, y: 1500},
  crypto: {x: 5400, y: 3000},
  cryptoB: {x: 2700, y: 3000},
  fix: {x: 0, y: 3000},
  close: {x: 0, y: 1500},
} as const;
export type StationId = keyof typeof STATIONS;
export const center = (s: StationId, dx = 0, dy = 0) => ({x: STATIONS[s].x + 960 + dx, y: STATIONS[s].y + 540 + dy});

/** the hero coin on the hook conveyor (world px) and its radius */
export const HERO_COIN = {x: 960, y: 560, r: 60};
/** the golden coin on the "best version" card in the problem station; the 1,024 grid lives inside it */
export const NEST = {x: STATIONS.problem.x + 1430, y: STATIONS.problem.y + 470, r: 70, scale: 0.11};
/** the tip of the golden curve (end of the backtest) in the sim station */
export const CURVE_LOCAL = {x: 1240, y: 270};
export const CURVE_TIP = {x: STATIONS.sim.x + CURVE_LOCAL.x, y: STATIONS.sim.y + CURVE_LOCAL.y};
export const MAP = {x: 3660, y: 2040, z: 0.245};
/** the coin Lucky flips at the end (close station px) */
export const FLIP_COIN = {hand: {x: 1530, y: 640}, apex: {x: 1060, y: 330}, r: 115};

// ---------- keyframes ----------
type Ease = 'whip' | 'inOut' | 'out' | 'in' | 'hold' | 'linear';
type Key = {f: number; x: number; y: number; z: number; r?: number; ease?: Ease};

const easeFn: Record<Ease, (t: number) => number> = {
  linear: (t) => t,
  hold: () => 0,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 4,
  inOut: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  // whip pan: slow start, very fast middle, soft landing with a hint of overshoot
  whip: (t) => {
    const e = t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
    return e + Math.sin(Math.PI * t) ** 2 * 0.04 * Math.max(0, t - 0.6) * 5;
  },
};

const BEAT = 18; // 100 bpm at 30 fps
/** land camera hits on the beat when the voice allows it (within 4 frames) */
const onBeat = (f: number) => {
  const b = Math.round(f / BEAT) * BEAT;
  return Math.abs(b - f) <= 4 ? b : f;
};

const startOf = (id: string) => sceneFrames(getScene(id)).from;

let keysCache: Key[] | null = null;
const buildKeys = (): Key[] => {
  const k: Key[] = [];
  const add = (f: number, p: {x: number; y: number}, z: number, ease: Ease = 'inOut', r = 0) => k.push({f, x: p.x, y: p.y, z, r, ease});
  const c = cueAbs;

  // HOOK: start deep inside the hero coin, pull back on "changed my mind"
  const hero = {x: HERO_COIN.x, y: HERO_COIN.y};
  add(0, hero, 5);
  const scratch = c('hook', 'scratch');
  add(scratch + 6, hero, 5, 'hold');
  add(scratch + 40, center('hook', 0, -40), 0.6, 'out', -2);
  add(c('hook', 'luckyIn'), center('hook', 0, -30), 0.66, 'inOut', 0);
  add(c('hook', 'title') + 6, center('hook', 0, -40), 0.82, 'out');

  // WHO: whip right to the name card, slide down to the bar race
  const whoS = onBeat(startOf('who') - 6);
  add(whoS, center('hook', 0, -40), 0.82, 'hold');
  add(whoS + 16, center('who'), 1, 'whip', 1.5);
  add(c('who', 'logic'), center('who'), 1.0, 'inOut', 0);
  add(c('who', 'none', 0.3), center('who', 0, 20), 1.04, 'inOut');
  const data = onBeat(c('who', 'data') - 4);
  add(data, center('who', 0, 20), 1.04, 'hold');
  add(data + 18, center('whoB'), 1, 'whip', -1);
  add(c('who', 'final', 0.6), center('whoB', 40, 0), 1.06, 'inOut');

  // PROBLEM: whip up-right, then zoom through the golden coin into the 1,024 grid
  const pS = onBeat(startOf('problem') - 6);
  add(pS, center('whoB', 40, 0), 1.06, 'hold');
  add(pS + 18, center('problem'), 1, 'whip', 2);
  add(c('problem', 'keep'), center('problem', 60, 0), 1.0, 'inOut', 0);
  const pic = c('problem', 'picture', -0.15);
  add(pic, center('problem', 120, 0), 1.08, 'inOut');
  const nestZ = (1 / NEST.scale) * 1.03;
  add(pic + 24, {x: NEST.x, y: NEST.y}, nestZ, 'inOut');
  add(c('problem', 'tenHeads'), {x: NEST.x, y: NEST.y}, nestZ * 1.02, 'linear');

  // SIM: pull out of the coin and drop down to the lab; push into the golden curve
  const sS = onBeat(startOf('sim') - 8);
  add(sS, {x: NEST.x, y: NEST.y}, nestZ * 1.02, 'hold');
  add(sS + 26, center('sim'), 1, 'whip', -2);
  add(c('sim', 'sharpe', -0.1), center('sim'), 1, 'inOut', 0);
  add(c('sim', 'sharpe', 0.5), center('sim', 0, -150), 1.22, 'out');
  add(c('sim', 'above2'), center('sim', 220, 80), 1.14, 'inOut');
  add(c('sim', 'b10', 0.3), center('sim', -300, 20), 1.25, 'inOut');
  add(c('sim', 'b100', 0.3), center('sim', -160, 10), 1.16, 'inOut');
  add(c('sim', 'b1000'), center('sim', 60, -10), 1.06, 'inOut');
  add(c('sim', 'v23'), {x: CURVE_TIP.x - 120, y: CURVE_TIP.y + 60}, 1.9, 'inOut');
  add(c('sim', 'unseen'), {x: CURVE_TIP.x - 120, y: CURVE_TIP.y + 60}, 1.9, 'hold');
  add(c('sim', 'neverSeen'), {x: CURVE_TIP.x + 60, y: CURVE_TIP.y + 140}, 1.45, 'inOut');
  add(c('sim', 'result'), {x: CURVE_TIP.x - 60, y: CURVE_TIP.y + 70}, 1.6, 'inOut');
  add(c('sim', 'collapse', 0.25), {x: CURVE_TIP.x - 120, y: CURVE_TIP.y + 60}, 1.78, 'out');
  add(c('sim', 'collapse', 1.3), center('sim', 140, -20), 1.08, 'inOut');

  // CRYPTO: whip down to the graveyard, slide left to the timelines
  const cS = onBeat(startOf('crypto') - 6);
  add(cS, center('sim', 220, 60), 1.1, 'hold');
  add(cS + 18, center('crypto'), 1, 'whip', 1.5);
  const btc = onBeat(c('crypto', 'bitcoin') - 6);
  add(btc, center('crypto'), 1, 'hold', 0);
  add(btc + 16, center('cryptoB'), 1, 'whip');

  // FIX: whip left to the slot machine
  const fS = onBeat(startOf('fix') - 6);
  add(fS, center('cryptoB'), 1, 'hold');
  add(fS + 20, center('fix'), 1, 'whip', -1.5);
  add(c('fix', 'take'), center('fix'), 1.0, 'inOut', 0);
  add(c('fix', 'take', 0.5), center('fix', -420, -80), 1.25, 'out');
  add(c('fix', 'two', -0.4), center('fix', 120, 20), 1.06, 'inOut');
  add(c('fix', 'thousand'), center('fix', 200, -10), 1.1, 'inOut');
  add(c('fix', 'p34', 0.5), center('fix', 80, 0), 1.08, 'inOut');

  // CLOSE: pull back to see the whole canvas, then dive into the detective board
  const mapAt = c('close', 'map', -0.1);
  add(mapAt, center('fix', 80, 0), 1.08, 'hold');
  add(mapAt + 36, {x: MAP.x, y: MAP.y}, MAP.z, 'inOut', -1);
  const dive = Math.max(mapAt + 60, c('close', 'renaissance', -0.5));
  add(dive, {x: MAP.x, y: MAP.y}, MAP.z * 1.04, 'linear', 0);
  add(dive + 26, center('close'), 1, 'inOut');
  add(c('close', 'flip'), center('close', 0, -20), 1.04, 'inOut');
  const coin = {x: STATIONS.close.x + FLIP_COIN.apex.x, y: STATIONS.close.y + FLIP_COIN.apex.y + 40};
  add(c('close', 'flip') + 34, coin, 1.5, 'inOut', -1);
  const lastF = Math.round(SCENES[SCENES.length - 1].end * 30);
  add(lastF + 30, coin, 1.62, 'linear', 0);

  return k.sort((a, b) => a.f - b.f);
};

export const cameraKeys = () => {
  if (!keysCache) keysCache = buildKeys();
  return keysCache;
};

export type Cam = {x: number; y: number; z: number; r: number};

/** camera without handheld drift / shake (fractional frames allowed) */
export const baseCamera = (f: number): Cam => {
  const k = cameraKeys();
  if (f <= k[0].f) return {x: k[0].x, y: k[0].y, z: k[0].z, r: k[0].r ?? 0};
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1];
    const b = k[i];
    if (f <= b.f) {
      const span = Math.max(1, b.f - a.f);
      const u = easeFn[b.ease ?? 'inOut'](Math.min(1, Math.max(0, (f - a.f) / span)));
      // zoom moves in log space; position follows the zoom so the target stays put
      const lz = Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * u;
      const z = Math.exp(lz);
      const w = Math.abs(1 / a.z - 1 / b.z) > 1e-6 ? (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z) : u;
      return {x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z, r: (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * u};
    }
  }
  const l = k[k.length - 1];
  return {x: l.x, y: l.y, z: l.z, r: l.r ?? 0};
};

/** full camera: keyframes + handheld drift + impact shake */
export const camera = (f: number): Cam => {
  const c = baseCamera(f);
  const shake = impactPulse(Math.floor(f), 14) * 26;
  const sx = noise2D('sx', f * 0.9, 0) * shake + noise2D('hx', f * 0.012, 0) * 4;
  const sy = noise2D('sy', f * 0.9, 1) * shake + noise2D('hy', f * 0.012, 1) * 3;
  const sr = noise2D('sr', f * 0.7, 2) * shake * 0.03 + noise2D('hr', f * 0.01, 2) * 0.12;
  return {x: c.x + sx / c.z, y: c.y + sy / c.z, z: c.z, r: c.r + sr};
};

/** screen-space speed of the camera, used to switch motion blur on */
export const cameraSpeed = (f: number) => {
  const a = baseCamera(f - 1);
  const b = baseCamera(f);
  const pan = Math.hypot(b.x - a.x, b.y - a.y) * b.z;
  const zoom = Math.abs(Math.log(b.z) - Math.log(a.z)) * 1400;
  return pan + zoom;
};

export const worldTransform = (c: Cam) =>
  `translate(960px, 540px) rotate(${c.r}deg) scale(${c.z}) translate(${-c.x}px, ${-c.y}px)`;

/** visible world rect (axis aligned, with margin) */
export const viewRect = (c: Cam, margin = 300) => {
  const hw = 960 / c.z + margin / c.z;
  const hh = 540 / c.z + margin / c.z;
  return {x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y + hh};
};
