import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {easeOut, ramp, sp, wobble} from '../anim';
import {FPS} from '../script';
import {C, HEAD} from '../theme';
import {cueAbs, getScene, impactPulse, sceneWords, tokenize} from '../timing';
import {Coin3D, Kinetic, Stamp} from '../components/ui';

// Screen-space intro: black void, a 3D coin ("AI" / human) spinning into camera
// in slow motion, the question assembling from shards, "YES." stamped in blue.
// On "changed my mind" the black irises open onto the world, where the same
// coin sits on a conveyor of thousands.

const R_END = 300;

const coinPose = (f: number, land: number, sure: number) => {
  const t = Math.min(1, f / land);
  const e = 1 - (1 - t) ** 3; // slow-motion landing
  const r = 40 + (R_END - 40) * e;
  // 4 full turns, ends on the "AI" face; a quick victory flip on "I was sure"
  const flip = f >= sure ? 360 * Math.min(1, ((f - sure) / 14) ** 0.7) : 0;
  const idle = f > land ? Math.min(1, (f - land) / 20) : 0;
  const ry = 1440 * e + flip + idle * 9 * Math.sin(f / 23);
  const rx = 38 * (1 - e) * Math.sin(f / 5) + idle * 7 * Math.sin(f / 31 + 1);
  const x = 960 - 260 * (1 - e);
  const y = 540 - 180 * (1 - e) * Math.cos(f / 9);
  return {r, ry, rx, x, y};
};

const SpinningCoin: React.FC<{land: number; sure: number}> = ({land, sure}) => {
  const f = useCurrentFrame();
  const p = coinPose(f, land, sure);
  const squash = wobble(f, land, 0.12, 0.8, 0.18);
  return (
    <div style={{position: 'absolute', left: p.x - p.r, top: p.y - p.r, transform: `scale(${1 + squash}, ${1 - squash})`}}>
      <Coin3D r={p.r} rx={p.rx} ry={p.ry} />
    </div>
  );
};

export const HookOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const scene = getScene('hook');
  const land = cueAbs('hook', 'coinLand', 0.25);
  const sure = cueAbs('hook', 'sure');
  const yes = cueAbs('hook', 'yes');
  const research = cueAbs('hook', 'research');
  const riser = cueAbs('hook', 'riser');
  const scratch = cueAbs('hook', 'scratch');
  const iris = ramp(f, scratch + 4, scratch + 14, (x) => x * x);
  if (f > scratch + 16) return null;

  // the question, word by word
  const words = sceneWords(scene);
  const toks = tokenize(scene.voText).slice(0, 8);
  const shake = impactPulse(f, 14) * 22;
  const sx = noise2D('osx', f * 0.9, 0) * shake;
  const sy = noise2D('osy', f * 0.9, 1) * shake;
  // record scratch: everything jerks back for a few frames
  const rewind = f >= scratch && f < scratch + 5 ? Math.sin(((f - scratch) / 5) * Math.PI) * -60 : 0;
  const glowOn = ramp(f, sure, sure + 10);
  const vib = f >= riser ? Math.sin(f * 2.3) * 3 * ramp(f, riser, scratch) : 0;
  const rays = ramp(f, riser, scratch, easeOut);

  const blurCoin = f < land - 4 || (f >= sure && f < sure + 14);
  const coin = <SpinningCoin land={land} sure={sure} />;

  return (
    <AbsoluteFill
      style={{
        zIndex: 60,
        WebkitMaskImage: iris > 0 ? `radial-gradient(circle at 50% 50%, transparent ${R_END + iris * 1500}px, black ${R_END + iris * 1500 + 2}px)` : undefined,
        maskImage: iris > 0 ? `radial-gradient(circle at 50% 50%, transparent ${R_END + iris * 1500}px, black ${R_END + iris * 1500 + 2}px)` : undefined,
      }}
    >
      <div style={{position: 'absolute', left: -90, top: -90, width: 2100, height: 1260, background: 'radial-gradient(ellipse at 50% 55%, #1E1B16 0%, #0B0A08 70%)', transform: `translate(${sx + rewind}px, ${sy}px)`}}>
        <div style={{position: 'absolute', left: 90, top: 90, width: 1920, height: 1080}}>
        {/* gold dust drifting */}
        {new Array(40).fill(0).map((_, i) => {
          const x = (random(`dx${i}`) * 2100 + f * (0.4 + random(`dv${i}`))) % 2100 - 90;
          const y = random(`dy${i}`) * 1080 + noise2D('dd', i, f * 0.01) * 40;
          const s = 2 + random(`ds${i}`) * 5;
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: 9, background: C.gold, opacity: 0.25 + random(`do${i}`) * 0.4}} />;
        })}
        {/* light rays before the reveal */}
        {rays > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 960 - 900,
              top: 540 - 900,
              width: 1800,
              height: 1800,
              opacity: rays * 0.35,
              transform: `rotate(${f * 0.8}deg)`,
              background: `repeating-conic-gradient(from 0deg, rgba(255,216,77,0.9) 0deg 6deg, transparent 6deg 22deg)`,
              WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 65%)',
              maskImage: 'radial-gradient(circle, black 20%, transparent 65%)',
            }}
          />
        )}
        {/* research notes flying past */}
        {f >= research &&
          [0, 1, 2, 3].map((i) => {
            const t = f - research - i * 5;
            if (t < 0) return null;
            const x = 2100 - t * (34 + i * 6);
            const y = 300 + i * 170 + Math.sin(t / 6 + i) * 20;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 170,
                  height: 210,
                  background: '#F3EEDF',
                  border: `4px solid ${C.ink}`,
                  borderRadius: 10,
                  transform: `rotate(${(i - 1.5) * 14 + t}deg)`,
                  opacity: 0.9,
                  padding: 18,
                  boxSizing: 'border-box',
                }}
              >
                {[0, 1, 2, 3, 4].map((l) => (
                  <div key={l} style={{height: 9, width: `${90 - ((l * 23 + i * 17) % 45)}%`, background: '#B9B09A', borderRadius: 5, marginBottom: 14}} />
                ))}
              </div>
            );
          })}
        {/* the question */}
        <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
          {toks.map((tk, i) => (
            <Kinetic
              key={i}
              text={tk}
              at={Math.round(words[i][0] * FPS) - 2}
              size={76}
              color={tk.toLowerCase().startsWith('ai') ? C.gold : tk.startsWith('human') ? C.orange : C.paper}
              mode="shards"
              stagger={1.2}
              f={f}
              seed={`q${i}`}
            />
          ))}
        </div>
        {/* the coin */}
        <div style={{position: 'absolute', inset: 0, transform: `translate(${vib}px, 0)`}}>
          {glowOn > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 960 - R_END - 40,
                top: 540 - R_END - 40,
                width: (R_END + 40) * 2,
                height: (R_END + 40) * 2,
                borderRadius: '50%',
                boxShadow: `0 0 120px 40px rgba(255,216,77,${0.35 * glowOn})`,
              }}
            />
          )}
          {blurCoin ? (
            <CameraMotionBlur samples={6} shutterAngle={240}>
              {coin}
            </CameraMotionBlur>
          ) : (
            coin
          )}
        </div>
        <Stamp at={yes} x={1420} y={760} rot={-10} size={130} color={C.blue} f={f} z={5}>
          YES.
        </Stamp>
        {f >= scratch && f < scratch + 6 && (
          <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 3px, transparent 3px 7px)`}} />
        )}
        </div>
      </div>
      {/* "?" marks while researching */}
      {f >= research &&
        f < scratch &&
        [0, 1, 2].map((i) => {
          const at = research + 6 + i * 6;
          if (f < at) return null;
          const p = sp(f, at, {damping: 9, stiffness: 200});
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: [520, 1360, 1460][i],
                top: [330, 300, 640][i],
                fontFamily: HEAD,
                fontWeight: 800,
                fontSize: 120,
                color: C.orange,
                transform: `scale(${p}) rotate(${(i - 1) * 16}deg)`,
                WebkitTextStroke: `3px ${C.ink}`,
              }}
            >
              ?
            </div>
          );
        })}
    </AbsoluteFill>
  );
};
