import {Easing, interpolate, random, spring, SpringConfig} from 'remotion';
import {FPS} from './script';

export const sp = (f: number, at: number, cfg: Partial<SpringConfig> = {}) =>
  f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 12, stiffness: 170, mass: 0.9, ...cfg}});

/** springy with visible overshoot */
export const bouncy = (f: number, at: number) => sp(f, at, {damping: 8, stiffness: 190, mass: 0.8});
/** calm settle, no overshoot */
export const soft = (f: number, at: number) => sp(f, at, {damping: 20, stiffness: 120});

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ramp = (f: number, a: number, b: number, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, Math.max(a + 0.001, b)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);

/** damped sine, used for squash & stretch and wobbles */
export const wobble = (f: number, at: number, amp = 0.14, freq = 0.55, decay = 0.13) =>
  f < at ? 0 : amp * Math.exp(-decay * (f - at)) * Math.sin(freq * (f - at));

export const squash = (f: number, at: number, amp = 0.16) => {
  const w = wobble(f, at, amp);
  return `scale(${1 + w}, ${1 - w})`;
};

/** decaying screen shake offset */
export const shake = (f: number, at: number, amp = 16, frames = 12) => {
  if (f < at || f > at + frames) return {x: 0, y: 0};
  const k = 1 - (f - at) / frames;
  return {
    x: (random(`sx${f}${at}`) - 0.5) * 2 * amp * k,
    y: (random(`sy${f}${at}`) - 0.5) * 2 * amp * k,
  };
};

/** gentle idle float so nothing sits still */
export const float = (f: number, seed = 0, amp = 5, speed = 22) => Math.sin((f + seed * 37) / speed) * amp;

/** 0 before `at`, 1 after `at + frames`, eased out */
export const outro = (f: number, at: number) => (f < at ? 0 : sp(f, at, {damping: 16, stiffness: 140}));
