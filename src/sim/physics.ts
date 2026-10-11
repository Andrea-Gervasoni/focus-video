import Matter from 'matter-js';

// Physics is pre-simulated once with matter-js at a fixed step, then sampled
// per frame. Inputs never change, so every render tab gets identical motion.
// Each track is in local px, t = frames since the event started.

export type Track = {x: number[]; y: number[]; a: number[]};

const STEP = 1000 / 60; // two physics steps per video frame

const simulateOne = (
  frames: number,
  body: Matter.Body,
  statics: Matter.Body[],
  v: {x: number; y: number},
  spin: number,
  gravity = 1.7,
): Track => {
  const engine = Matter.Engine.create({gravity: {x: 0, y: gravity, scale: 0.001}});
  Matter.Composite.add(engine.world, [body, ...statics]);
  Matter.Body.setVelocity(body, v);
  Matter.Body.setAngularVelocity(body, spin);
  const tr: Track = {x: [], y: [], a: []};
  for (let i = 0; i < frames; i++) {
    tr.x.push(body.position.x);
    tr.y.push(body.position.y);
    tr.a.push(body.angle);
    Matter.Engine.update(engine, STEP);
    Matter.Engine.update(engine, STEP);
  }
  return tr;
};

const memo = new Map<string, Track | Track[]>();

/**
 * The crown falls off Lucky's head, hits the floor, bounces and rolls away.
 * Starts at (0,0) = crown on the head; the floor is `floor` px below.
 */
export const crownTrack = (floor = 210): Track => {
  const key = `crown${floor}`;
  if (!memo.has(key)) {
    const crown = Matter.Bodies.circle(0, 0, 26, {restitution: 0.55, friction: 0.02, frictionAir: 0.004, density: 0.002});
    const ground = Matter.Bodies.rectangle(0, floor + 40, 6000, 80, {isStatic: true, friction: 0.02});
    memo.set(key, simulateOne(150, crown, [ground], {x: 5.5, y: -9}, 0.28));
  }
  return memo.get(key) as Track;
};

/**
 * Coins leaking out of the "most active traders" bar as fees: each coin drops
 * from the underside of the bar (y = 0) to a floor `floor` px below and rolls.
 */
export const feeCoinTracks = (n = 14, floor = 150): Track[] => {
  const key = `fees${n}-${floor}`;
  if (!memo.has(key)) {
    const tracks: Track[] = [];
    for (let i = 0; i < n; i++) {
      const coin = Matter.Bodies.circle(0, 0, 16, {restitution: 0.6, friction: 0.05, frictionAir: 0.006});
      const ground = Matter.Bodies.rectangle(0, floor + 30, 8000, 60, {isStatic: true});
      const vx = -1.2 - ((i * 37) % 10) / 6;
      const vy = 1 + ((i * 53) % 7) / 4;
      tracks.push(simulateOne(110, coin, [ground], {x: vx, y: vy}, ((i % 5) - 2) * 0.08));
    }
    memo.set(key, tracks);
  }
  return memo.get(key) as Track[];
};

export const sample = (tr: Track, t: number) => {
  const i = Math.max(0, Math.min(tr.x.length - 1, Math.floor(t)));
  return {x: tr.x[i], y: tr.y[i], a: tr.a[i]};
};
