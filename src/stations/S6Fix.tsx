import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, interpolateColors, random} from 'remotion';
import {clamp01, easeOut, lerp, ramp, sp} from '../anim';
import {Lucky} from '../components/Lucky';
import {Annotate, At, Card, DefCard, Display, Label, Num, Pill, Pop, Rise, Script, Sticker, stickerCut} from '../components/ui';
import {C, DISPLAY, HAIR, LIFT, MONO, SANS, SCRIPT} from '../theme';
import {useScene} from '../timing';

// DSR of a backtest with Sharpe 2.0 (two years of daily data), from the article
const STEPS = [
  {n: 2, dsr: 99},
  {n: 10, dsr: 89},
  {n: 100, dsr: 62},
  {n: 1000, dsr: 34},
];
const colorFor = (v: number) => interpolateColors(v, [34, 99], [C.orange, C.blue]);

const Reel: React.FC<{from: number; to: number; spin: number; seed: number}> = ({from, to, spin, seed}) => {
  // spin 0..1: scrolls through 2+ full turns and lands exactly on `to`
  const H = 130;
  const spinning = spin > 0 && spin < 1;
  const total = 20 + seed * 10 + ((to - from + 10) % 10);
  const travel = easeOut(spin) * total;
  const shown = spin >= 1 ? to : (from + Math.floor(travel)) % 10;
  const frac = spinning ? travel % 1 : 0;
  return (
    <div style={{width: 100, height: H, background: C.paper, border: `${HAIR}px solid ${C.ink}`, borderRadius: 4, overflow: 'hidden', position: 'relative', boxSizing: 'border-box', boxShadow: 'inset 0 18px 18px rgba(0,0,0,0.12), inset 0 -18px 18px rgba(0,0,0,0.12)'}}>
      {[0, 1].map((k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (k - frac) * H - 4,
            height: H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: DISPLAY,
            fontSize: 104,
            color: C.ink,
            filter: spinning ? 'blur(2.5px)' : undefined,
          }}
        >
          {(shown + k) % 10}
        </div>
      ))}
    </div>
  );
};

const digitsOf = (n: number) => n.toString().padStart(4, '0').split('').map(Number);

export const S6Fix: React.FC = () => {
  const {f, cue} = useScene('fix');
  const fix = cue('fix');
  const dsr = cue('dsr');
  const versions = cue('versions');
  const take = cue('take');
  const two = cue('two');
  const real = cue('real');
  const thousand = cue('thousand');
  const p34 = cue('p34');
  const land1 = two + 4;
  const land2 = Math.max(land1 + 14, real + 6);
  const land4 = Math.max(land2 + 26, thousand + 6);
  const land3 = Math.round((land2 + land4) / 2);
  const lands = [land1, land2, land3, land4];
  let step = -1;
  lands.forEach((l, i) => {
    if (f >= l) step = i;
  });
  // the lever is pulled 14 frames before each landing
  const pulls = lands.map((l) => l - 14);
  const pullNow = pulls.reduce((acc, p) => (f >= p - 3 && f < p + 14 ? p : acc), -1);
  let lever = 0; // 0 = up, 1 = pulled down
  if (pullNow >= 0) {
    const t = f - pullNow;
    lever = t < 0 ? -0.08 * ((t + 3) / 3) : t < 5 ? t / 5 : 1 - sp(f, pullNow + 5, {damping: 9, stiffness: 160});
  }
  // reels
  const target = step >= 0 ? digitsOf(STEPS[step].n) : [0, 0, 0, 0];
  const nextPull = pulls.find((p, i) => f >= p && f < lands[i]);
  const nextIdx = nextPull !== undefined ? pulls.indexOf(nextPull) : -1;
  // needle springs (overshoot is fine); printed % never overshoots
  const cur = step >= 0 ? STEPS[step].dsr : 0;
  const before = step >= 1 ? STEPS[step - 1].dsr : 0;
  const tStep = step >= 0 ? lands[step] : 0;
  const needle = step >= 0 ? lerp(before, cur, sp(f, tStep, {damping: 8, stiffness: 120})) : 0;
  const shownPct = step === 0 ? cur : step > 0 ? Math.round(lerp(before, cur, easeOut(clamp01((f - tStep) / 8)))) : 0;
  const col = colorFor(step >= 0 ? shownPct : 99);
  const ang = -120 + (needle / 100) * 240;
  const pinWob = noise2D('pin', f * 0.05, 0) * 4 + (step >= 0 ? Math.sin((f - tStep) * 0.5) * 6 * Math.exp(-(f - tStep) / 10) : 0);

  return (
    <AbsoluteFill>
      {/* "The fix." lands big, then steps back for the definition */}
      {f < dsr + 16 && (
        <At
          x={960}
          y={lerp(470, 330, ramp(f, dsr - 6, dsr + 10))}
          transform={`scale(${(2 - sp(f, fix - 14, {damping: 12, stiffness: 230, mass: 0.7})) * (1 - 0.45 * ramp(f, dsr - 6, dsr + 10))})`}
          style={{opacity: Math.min(f >= fix - 14 ? 1 : 0, 1 - ramp(f, dsr, dsr + 14))}}
        >
          <div style={{position: 'relative', display: 'flex', alignItems: 'baseline', gap: 30}}>
            <Script size={150}>There’s a</Script>
            <Display size={330} color={C.blue}>
              Fix.
            </Display>
          </div>
        </At>
      )}
      <DefCard at={dsr} x={1000} y={182} term="Deflated Sharpe Ratio" def="Sharpe, corrected for how many versions you tried" f={f} width={1080} />

      <Sticker at={versions} x={840} y={300} rot={-5} bg={C.orange} color={C.white} size={36} f={f}>
        how many tries?
      </Sticker>
      {/* pinned backtest card that never changes */}
      <Pop at={take} x={300} y={420} f={f}>
        <div style={{transform: `rotate(${pinWob - 4}deg)`, transformOrigin: '50% 0%'}}>
          <Card style={{width: 300, height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative'}}>
            <div style={{position: 'absolute', top: -24, left: 128, width: 34, height: 34, borderRadius: 99, background: C.orange, border: `${HAIR}px solid ${C.ink}`}} />
            <Pill bg={C.ink} color={C.white} size={26}>
              BACKTEST
            </Pill>
            <Script size={50}>Sharpe</Script>
            <Num size={110} color={C.blue}>
              2.0
            </Num>
          </Card>
        </div>
      </Pop>

      <Annotate
        at={take + 10}
        dur={16}
        d="M118 400 C 112 228, 492 220, 492 412 C 492 606, 118 622, 126 378"
        color={C.orange}
        width={9}
        w={10}
        h={10}
        f={f}
      />

      {/* slot machine */}
      <Pop at={dsr + 4} x={840} y={560} from="down" f={f}>
        <div style={{position: 'relative', width: 600, height: 470}}>
          <div style={{position: 'absolute', inset: 0, background: C.blue, border: `${HAIR}px solid ${C.ink}`, borderRadius: 10, boxShadow: LIFT}} />
          <div style={{position: 'absolute', left: 40, right: 40, top: 26, height: 70, background: C.gold, border: `${HAIR}px solid ${C.ink}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Label size={30}>Versions tried</Label>
          </div>
          {new Array(12).fill(0).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: 30 + i * 47, top: 8, width: 14, height: 14, borderRadius: 9, background: (Math.floor(f / 4) + i) % 2 ? C.gold : C.paper, border: `2px solid ${C.ink}`}} />
          ))}
          <div style={{position: 'absolute', left: 50, right: 50, top: 130, height: 180, background: C.ink, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
            {[0, 1, 2, 3].map((r) => {
              if (nextIdx >= 0) {
                const spin = clamp01((f - pulls[nextIdx] - r * 2) / (14 - r * 2));
                const from = nextIdx >= 1 ? digitsOf(STEPS[nextIdx - 1].n)[r] : 0;
                return <Reel key={r} from={from} to={digitsOf(STEPS[nextIdx].n)[r]} spin={spin} seed={r} />;
              }
              return <Reel key={r} from={target[r]} to={target[r]} spin={0} seed={r} />;
            })}
          </div>
          <div style={{position: 'absolute', left: 60, right: 60, top: 340, height: 90, background: '#1A33DD', border: `${HAIR}px solid ${C.ink}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Label size={24} color={C.white}>
              {step >= 0 ? `${STEPS[step].n.toLocaleString('en-US')} tried` : 'pull to try'}
            </Label>
          </div>
          {/* lever */}
          <div style={{position: 'absolute', right: -70, top: 250, width: 40, height: 80, background: C.greyLight, border: `${HAIR}px solid ${C.ink}`, borderRadius: 12}} />
          <div style={{position: 'absolute', right: -52, top: 270, width: 10, height: 10, transform: `rotate(${lever * 150}deg)`, transformOrigin: '5px 5px'}}>
            <div style={{position: 'absolute', left: -4, top: -200, width: 18, height: 205, background: C.ink, borderRadius: 9}} />
            <div style={{position: 'absolute', left: -26, top: -246, width: 62, height: 62, borderRadius: 99, background: C.orange, border: `${HAIR}px solid ${C.ink}`, boxSizing: 'border-box'}} />
          </div>
        </div>
      </Pop>
      <Pop at={dsr + 8} x={1255} y={720} from="down" f={f}>
        <div style={stickerCut(5)}>
          <Lucky size={230} expr="detective" hat magnifier arms="up" look={[1, -0.3]} jolts={pulls} f={f} seed={6} />
        </div>
      </Pop>

      {/* pressure gauge */}
      <Pop at={dsr + 11} x={1610} y={450} f={f}>
        <div style={{position: 'relative', width: 400, height: 400}}>
          <div style={{position: 'absolute', left: 175, top: -40, width: 50, height: 60, background: C.greyLight, border: `${HAIR}px solid ${C.ink}`, borderRadius: 8}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: C.paper, border: `${HAIR}px solid ${C.ink}`, boxShadow: LIFT}} />
          <svg width={400} height={400} viewBox="-200 -200 400 400" style={{position: 'absolute', left: 0, top: 0}}>
            {[0, 25, 50, 75, 100].map((v) => {
              const a = ((-120 + (v / 100) * 240 - 90) * Math.PI) / 180;
              return <line key={v} x1={Math.cos(a) * 140} y1={Math.sin(a) * 140} x2={Math.cos(a) * 165} y2={Math.sin(a) * 165} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />;
            })}
            <path d={describeArc(150, -120, -120 + (needle / 100) * 240)} stroke={col} strokeWidth={22} fill="none" strokeLinecap="round" />
            <g transform={`rotate(${ang})`}>
              <path d="M-9 0 L0 -150 L9 0 Z" fill={C.ink} />
            </g>
            <circle r={22} fill={C.gold} stroke={C.ink} strokeWidth={3} />
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Num size={80} color={col}>
              {step >= 0 ? `${shownPct}%` : '--'}
            </Num>
            <Script size={32}>chance it’s real</Script>
          </div>
          {/* steam puffs when the pressure drops */}
          {lands.slice(1).map((l, i) =>
            new Array(6).fill(0).map((_, k) => {
              const t = f - l - k * 2;
              if (t < 0 || t > 34) return null;
              const r = 16 + t * 2.2;
              return (
                <div
                  key={`${i}-${k}`}
                  style={{
                    position: 'absolute',
                    left: 200 + (random(`st${i}${k}`) - 0.5) * 60 + t * (random(`sv${i}${k}`) - 0.5) * 3 - r,
                    top: -40 - t * 5 - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: '50%',
                    background: C.white,
                    border: `${HAIR}px solid ${C.ink}`,
                    opacity: 1 - t / 34,
                  }}
                />
              );
            }),
          )}
        </div>
      </Pop>
      {f >= p34 && (
        <Pop at={p34 + 4} x={1610} y={790} rot={-4} f={f}>
          <Pill bg={C.orange} color={C.white} size={36}>
            same backtest, 1,000 tries
          </Pill>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

function describeArc(r: number, a0: number, a1: number) {
  const p = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return {x: Math.cos(rad) * r, y: Math.sin(rad) * r};
  };
  const s = p(a0);
  const e = p(Math.max(a0 + 0.5, a1));
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${s.x} ${s.y} A${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

