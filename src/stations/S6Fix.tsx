import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, interpolateColors, random} from 'remotion';
import {clamp01, easeOut, lerp, ramp, sp} from '../anim';
import {Lucky} from '../components/Lucky';
import {Annotate, At, Card, DefCard, Head, Num, Pill, Pop, Sqrt, Sticker, stickerCut} from '../components/ui';
import {C, HEAD, MONO} from '../theme';
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
    <div style={{width: 100, height: H, background: C.paper, border: `5px solid ${C.ink}`, borderRadius: 14, overflow: 'hidden', position: 'relative', boxSizing: 'border-box', boxShadow: 'inset 0 18px 18px rgba(0,0,0,0.12), inset 0 -18px 18px rgba(0,0,0,0.12)'}}>
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
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 92,
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
      {/* sunburst behind the title card, like the hook's reveal */}
      {f >= fix - 24 && f < dsr + 10 && (
        <div
          style={{
            position: 'absolute',
            left: 960 - 900,
            top: 470 - 900,
            width: 1800,
            height: 1800,
            opacity: 0.5 * sp(f, fix - 24, {damping: 20, stiffness: 120}) * (1 - ramp(f, dsr - 6, dsr + 8)),
            transform: `rotate(${f * 0.5}deg) scale(${0.6 + 0.4 * sp(f, fix - 24, {damping: 14, stiffness: 120})})`,
            background: `repeating-conic-gradient(from 0deg, ${C.blueSoft} 0deg 7deg, transparent 7deg 22deg)`,
            WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
            maskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
          }}
        />
      )}
      {/* "THE FIX" lands big, then tucks into the corner */}
      <At
        x={lerp(960, 250, sp(f, dsr - 4, {damping: 15, stiffness: 120}))}
        y={lerp(470, 110, sp(f, dsr - 4, {damping: 15, stiffness: 120}))}
        transform={`scale(${lerp(2.6, 1, sp(f, dsr - 4, {damping: 15, stiffness: 120})) * sp(f, fix - 24, {damping: 9, stiffness: 200})}) rotate(-4deg)`}
      >
        <Pill bg={C.blue} color={C.white} size={50}>
          THE FIX
        </Pill>
      </At>
      <DefCard at={dsr} x={1000} y={182} term="Deflated Sharpe Ratio" def="Sharpe, corrected for how many versions you tried" f={f} width={1080} />

      <Sticker at={versions} x={840} y={300} rot={-5} bg={C.orange} color={C.white} size={36} f={f}>
        how many tries?
      </Sticker>
      {/* pinned backtest card that never changes */}
      <Pop at={take} x={300} y={420} f={f}>
        <div style={{transform: `rotate(${pinWob - 4}deg)`, transformOrigin: '50% 0%'}}>
          <Card style={{width: 300, height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative'}}>
            <div style={{position: 'absolute', top: -24, left: 128, width: 34, height: 34, borderRadius: 99, background: C.orange, border: `5px solid ${C.ink}`}} />
            <Pill bg={C.ink} color={C.white} size={26}>
              BACKTEST
            </Pill>
            <Head size={46}>SHARPE</Head>
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

      {/* the formula behind the gauge, for the curious */}
      <Pop at={versions + 10} x={328} y={742} rot={-1.5} f={f}>
        <Card style={{width: 404, padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 7}} radius={20}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <Pill bg={C.ink} color={C.white} size={20} mono>
              THE MATH
            </Pill>
            <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, color: '#6E6757'}}>Bailey &amp; López de Prado</span>
          </div>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 21, color: C.ink, whiteSpace: 'nowrap', display: 'flex', alignItems: 'flex-end'}}>
            DSR = Φ((SR − SR<sub style={{fontSize: 13}}>0</sub>)·<Sqrt>T−1</Sqrt>/σ)
          </div>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 20, lineHeight: 1.15, color: C.ink}}>
            SR<sub style={{fontSize: 12}}>0</sub> = the best Sharpe that N lucky tries would give
          </div>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 18, color: C.orange, whiteSpace: 'nowrap'}}>more tries → higher SR<sub style={{fontSize: 11}}>0</sub> → lower DSR</div>
        </Card>
      </Pop>

      {/* slot machine */}
      <Pop at={dsr + 4} x={840} y={560} from="down" f={f}>
        <div style={{position: 'relative', width: 600, height: 470}}>
          <div style={{position: 'absolute', inset: 0, background: C.blue, border: `6px solid ${C.ink}`, borderRadius: 40, boxShadow: `8px 8px 0 ${C.ink}`}} />
          <div style={{position: 'absolute', left: 40, right: 40, top: 26, height: 70, background: C.gold, border: `5px solid ${C.ink}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 40}}>
            VERSIONS TRIED
          </div>
          {new Array(12).fill(0).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: 30 + i * 47, top: 8, width: 14, height: 14, borderRadius: 9, background: (Math.floor(f / 4) + i) % 2 ? C.gold : C.paper, border: `3px solid ${C.ink}`}} />
          ))}
          <div style={{position: 'absolute', left: 50, right: 50, top: 130, height: 180, background: C.ink, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
            {[0, 1, 2, 3].map((r) => {
              if (nextIdx >= 0) {
                const spin = clamp01((f - pulls[nextIdx] - r * 2) / (14 - r * 2));
                const from = nextIdx >= 1 ? digitsOf(STEPS[nextIdx - 1].n)[r] : 0;
                return <Reel key={r} from={from} to={digitsOf(STEPS[nextIdx].n)[r]} spin={spin} seed={r} />;
              }
              return <Reel key={r} from={target[r]} to={target[r]} spin={0} seed={r} />;
            })}
          </div>
          <div style={{position: 'absolute', left: 60, right: 60, top: 340, height: 90, background: '#1A33DD', border: `5px solid ${C.ink}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.white}}>{step >= 0 ? `${STEPS[step].n.toLocaleString('en-US')} tried` : 'pull to try'}</span>
          </div>
          {/* lever */}
          <div style={{position: 'absolute', right: -70, top: 250, width: 40, height: 80, background: C.greyLight, border: `5px solid ${C.ink}`, borderRadius: 12}} />
          <div style={{position: 'absolute', right: -52, top: 270, width: 10, height: 10, transform: `rotate(${lever * 150}deg)`, transformOrigin: '5px 5px'}}>
            <div style={{position: 'absolute', left: -4, top: -200, width: 18, height: 205, background: C.ink, borderRadius: 9}} />
            <div style={{position: 'absolute', left: -26, top: -246, width: 62, height: 62, borderRadius: 99, background: C.orange, border: `6px solid ${C.ink}`, boxSizing: 'border-box'}} />
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
          <div style={{position: 'absolute', left: 175, top: -40, width: 50, height: 60, background: C.greyLight, border: `5px solid ${C.ink}`, borderRadius: 8}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: C.paper, border: `8px solid ${C.ink}`, boxShadow: `8px 8px 0 ${C.ink}`}} />
          <svg width={400} height={400} viewBox="-200 -200 400 400" style={{position: 'absolute', left: 0, top: 0}}>
            {[0, 25, 50, 75, 100].map((v) => {
              const a = ((-120 + (v / 100) * 240 - 90) * Math.PI) / 180;
              return <line key={v} x1={Math.cos(a) * 140} y1={Math.sin(a) * 140} x2={Math.cos(a) * 165} y2={Math.sin(a) * 165} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />;
            })}
            <path d={describeArc(150, -120, -120 + (needle / 100) * 240)} stroke={col} strokeWidth={22} fill="none" strokeLinecap="round" />
            <g transform={`rotate(${ang})`}>
              <path d="M-9 0 L0 -150 L9 0 Z" fill={C.ink} />
            </g>
            <circle r={22} fill={C.gold} stroke={C.ink} strokeWidth={7} />
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Num size={80} color={col}>
              {step >= 0 ? `${shownPct}%` : '--'}
            </Num>
            <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: 26}}>chance it’s real</span>
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
                    border: `4px solid ${C.ink}`,
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

