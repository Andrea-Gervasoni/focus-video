// The article's simulation, re-run in the browser: N strategies of pure noise,
// two years of daily returns (730 days, crypto never closes), Sharpe annualised
// with sqrt(365). The winner is then run on one more unseen year.
// SEED was chosen with scripts/find-seed.ts so this exact run matches the article:
// best of 1,000 has Sharpe 2.30 and the winner's unseen year is about 0.

export const N_STRAT = 1000;
export const DAYS = 730;
export const UNSEEN = 365;
export const STEP = 5; // keep every 5th day for drawing
export const SEED = 230346;

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const gaussFactory = (seed: number) => {
  const rnd = mulberry32(seed);
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    while (u === 0) u = rnd();
    const v = rnd();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
};

export const sharpeOf = (r: ArrayLike<number>, from: number, n: number) => {
  let s = 0;
  for (let i = 0; i < n; i++) s += r[from + i];
  const mean = s / n;
  let v = 0;
  for (let i = 0; i < n; i++) v += (r[from + i] - mean) ** 2;
  const sd = Math.sqrt(v / (n - 1));
  return (mean / sd) * Math.sqrt(365);
};

export type SimRun = {
  sharpe: Float64Array;
  best: number;
  bestOf: (n: number) => number;
  unseenSharpe: number;
  /** cumulative paths, (DAYS/STEP + 1) points each */
  paths: Float32Array;
  /** winner's path over the unseen year, (UNSEEN/STEP + 1) points */
  unseenPath: Float32Array;
  points: number;
  unseenPoints: number;
};

export const runSim = (seed: number): SimRun => {
  const g = gaussFactory(seed);
  const returns = new Float64Array(N_STRAT * DAYS);
  for (let i = 0; i < returns.length; i++) returns[i] = g();
  const unseen = new Float64Array(UNSEEN);
  for (let i = 0; i < UNSEEN; i++) unseen[i] = g();
  const sharpe = new Float64Array(N_STRAT);
  for (let s = 0; s < N_STRAT; s++) sharpe[s] = sharpeOf(returns, s * DAYS, DAYS);
  let best = 0;
  for (let s = 1; s < N_STRAT; s++) if (sharpe[s] > sharpe[best]) best = s;
  const bestOf = (n: number) => {
    let b = 0;
    for (let s = 1; s < n; s++) if (sharpe[s] > sharpe[b]) b = s;
    return b;
  };
  const points = DAYS / STEP + 1;
  const paths = new Float32Array(N_STRAT * points);
  for (let s = 0; s < N_STRAT; s++) {
    let acc = 0;
    paths[s * points] = 0;
    for (let d = 0; d < DAYS; d++) {
      acc += returns[s * DAYS + d];
      if ((d + 1) % STEP === 0) paths[s * points + (d + 1) / STEP] = acc;
    }
  }
  const unseenPoints = UNSEEN / STEP + 1;
  const unseenPath = new Float32Array(unseenPoints);
  let acc = paths[best * points + points - 1];
  unseenPath[0] = acc;
  for (let d = 0; d < UNSEEN; d++) {
    acc += unseen[d];
    if ((d + 1) % STEP === 0) unseenPath[(d + 1) / STEP] = acc;
  }
  return {sharpe, best, bestOf, unseenSharpe: sharpeOf(unseen, 0, UNSEEN), paths, unseenPath, points, unseenPoints};
};

let cached: SimRun | null = null;
export const sim = () => {
  if (!cached) cached = runSim(SEED);
  return cached;
};
