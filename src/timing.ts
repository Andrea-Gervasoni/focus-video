import {useCurrentFrame} from 'remotion';
import {FPS, SCENES, SceneData, SceneId} from './script';

// Word + anchor timing shared by scenes, camera, captions and sound.
// scripts/retime.mjs mirrors tokenize/norm/syllables, keep them in sync.

export const tokenize = (text: string) => text.split(/\s+/).filter(Boolean);

export const norm = (w: string) =>
  w
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9$%&]+/, '')
    .replace(/[^a-z0-9%]+$/, '');

export const syllables = (raw: string) => {
  const w = norm(raw);
  if (/\d/.test(w)) {
    const digits = w.replace(/[^0-9]/g, '').length;
    let s = Math.max(2, digits * 1.4);
    if (w.includes('.')) s += 1;
    if (w.includes('%')) s += 2;
    if (w.startsWith('$')) s += 1;
    return s;
  }
  const groups = w.replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
};

const pauseAfter = (raw: string) => {
  if (/[?]["”’)]*$/.test(raw)) return 0.42;
  if (/[.!]["”’)]*$/.test(raw)) return 0.36;
  if (/[:;]$/.test(raw)) return 0.26;
  if (/,$/.test(raw)) return 0.14;
  return 0;
};

const estimateWords = (scene: SceneData, index: number): [number, number][] => {
  const toks = tokenize(scene.voText);
  const lead = index === 0 ? 0.25 : 0.45;
  const tail = scene.minTail ?? 0.5;
  const syl = toks.map(syllables);
  const pauses = toks.map((t, i) => (i === toks.length - 1 ? 0 : pauseAfter(t) + (scene.holds?.[norm(t)] ?? 0)));
  const window = scene.end - scene.start - lead - tail;
  const totalPause = pauses.reduce((a, b) => a + b, 0);
  const totalSyl = syl.reduce((a, b) => a + b, 0);
  const k = Math.max(0.05, (window - totalPause) / totalSyl);
  let t = scene.start + lead;
  return toks.map((_, i) => {
    const s = t;
    const e = t + syl[i] * k;
    t = e + pauses[i];
    return [s, e];
  });
};

const wordCache = new Map<string, [number, number][]>();
export const sceneWords = (scene: SceneData): [number, number][] => {
  const hit = wordCache.get(scene.id);
  if (hit) return hit;
  const index = SCENES.findIndex((s) => s.id === scene.id);
  const toks = tokenize(scene.voText);
  const words = scene.words && scene.words.length === toks.length ? scene.words : estimateWords(scene, index);
  wordCache.set(scene.id, words);
  return words;
};

export const getScene = (id: SceneId | string) => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scene ${id}`);
  return s;
};

export const sceneFrames = (scene: SceneData) => {
  const from = Math.round(scene.start * FPS);
  return {from, dur: Math.round(scene.end * FPS) - from};
};

const findPhrase = (scene: SceneData, phrase: string, nth = 0) => {
  const toks = tokenize(scene.voText).map(norm);
  const p = tokenize(phrase).map(norm);
  let seen = 0;
  for (let i = 0; i + p.length <= toks.length; i++) {
    if (p.every((w, j) => toks[i + j] === w)) {
      if (seen === nth) return [i, i + p.length - 1] as const;
      seen++;
    }
  }
  throw new Error(`Phrase "${phrase}" (#${nth}) not found in scene ${scene.id}`);
};

/** absolute time (s) of an anchor event; retime may have written it already */
export const anchorTime = (sceneId: SceneId | string, event: string) => {
  const scene = getScene(sceneId);
  const a = scene.anchors.find((x) => x.event === event);
  if (!a) throw new Error(`Anchor "${event}" not defined in scene ${sceneId}`);
  if (a.at !== undefined && scene.words) return a.at;
  const [i] = findPhrase(scene, a.word, a.nth ?? 0);
  return sceneWords(scene)[i][0];
};

/** absolute frame of an anchor */
export const cueAbs = (sceneId: SceneId | string, event: string, offsetSec = 0) =>
  Math.round((anchorTime(sceneId, event) + offsetSec) * FPS);

/** absolute frame where a phrase ends (end of its last word) */
export const phraseEndAbs = (sceneId: SceneId | string, phrase: string, nth = 0) => {
  const scene = getScene(sceneId);
  const [, j] = findPhrase(scene, phrase, nth);
  return Math.round(sceneWords(scene)[j][1] * FPS);
};

export type CaptionWord = {text: string; s: number; e: number; scene: number; i: number};
export const allWords = (): CaptionWord[] =>
  SCENES.flatMap((scene, si) => {
    const toks = tokenize(scene.voText);
    const w = sceneWords(scene);
    return toks.map((text, i) => ({text, s: w[i][0], e: w[i][1], scene: si, i}));
  });

// ---------- impacts: hit-stop + speed ramp ----------
// Each impact freezes the action for `hold` frames, then plays a little faster
// for CATCH_UP frames so the scene stays in sync with the voice.
export type Impact = {scene: SceneId; event: string; hold: number; offset?: number; strength?: number};
export const IMPACTS: Impact[] = [
  {scene: 'hook', event: 'coinLand', hold: 4, offset: 0.25, strength: 1},
  {scene: 'hook', event: 'yes', hold: 3, strength: 0.7},
  {scene: 'hook', event: 'scratch', hold: 6, strength: 1},
  {scene: 'hook', event: 'title', hold: 3, strength: 0.8},
  {scene: 'who', event: 'burst', hold: 4, strength: 0.9},
  {scene: 'who', event: 'stop', hold: 3, strength: 0.6},
  {scene: 'problem', event: 'backtest', hold: 3, strength: 0.6},
  {scene: 'problem', event: 'tenHeads', hold: 5, strength: 0.9},
  {scene: 'sim', event: 'b1000', hold: 3, strength: 0.7},
  {scene: 'sim', event: 'collapse', hold: 6, strength: 1.2},
  {scene: 'crypto', event: 'dead', hold: 3, strength: 0.7},
  {scene: 'fix', event: 'p34', hold: 4, strength: 0.9},
  {scene: 'close', event: 'flip', hold: 4, strength: 0.6},
];
const CATCH_UP = 10;

let impactFramesCache: {at: number; hold: number; strength: number}[] | null = null;
export const impactFrames = () => {
  if (!impactFramesCache)
    impactFramesCache = IMPACTS.map((i) => ({at: cueAbs(i.scene, i.event, i.offset ?? 0), hold: i.hold, strength: i.strength ?? 1}));
  return impactFramesCache;
};

/** how many frames the action lags behind real time at absolute frame f */
export const lagAt = (f: number) => {
  let lag = 0;
  for (const im of impactFrames()) {
    const d = f - im.at;
    if (d < 0) continue;
    if (d <= im.hold) lag += d;
    else if (d < im.hold + CATCH_UP) lag += im.hold * (1 - (d - im.hold) / CATCH_UP);
  }
  return lag;
};

/** 0..1 envelope right after an impact (for shake / chromatic aberration) */
export const impactPulse = (f: number, len = 12) => {
  let v = 0;
  for (const im of impactFrames()) {
    const d = f - im.at;
    if (d >= 0 && d < len) v = Math.max(v, im.strength * (1 - d / len) ** 2);
  }
  return v;
};

/**
 * Hook used by every scene. `f` is the scene-relative frame with hit-stops
 * applied; `cue('event')` is the scene-relative frame of an anchor.
 */
export const useScene = (id: SceneId) => {
  const scene = getScene(id);
  // stations live on one shared canvas, so this is the absolute video frame
  const abs = useCurrentFrame();
  const {from, dur} = sceneFrames(scene);
  const raw = abs - from;
  const f = raw - lagAt(abs);
  const cue = (event: string, offsetSec = 0) => cueAbs(id, event, offsetSec) - from;
  const words = sceneWords(scene);
  const lastWordEnd = Math.round(words[words.length - 1][1] * FPS) - from;
  return {f, raw, abs, cue, dur, lastWordEnd, from};
};
