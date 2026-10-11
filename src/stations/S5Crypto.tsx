import {noise2D} from '@remotion/noise';
import {interpolate as flubber} from 'flubber';
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {clamp01, easeOut, ramp, sp} from '../anim';
import {Lucky} from '../components/Lucky';
import {Annotate, At, DefCard, Head, Kinetic, Num, Pill, Pop, stickerCut} from '../components/ui';
import {C, MONO, SERIF} from '../theme';
import {useScene} from '../timing';

// 100 tokens; 58 die (14,000 of ~24,000 is about 58%)
const COLS = 10;
const CELL = 58;
const GX = 300;
const GY = 220;
const COIN_PATH = 'M0 -24 C13 -24 24 -13 24 0 C24 13 13 24 0 24 C-13 24 -24 13 -24 0 C-24 -13 -13 -24 0 -24 Z';
const TOMB_PATH = 'M-20 26 L-20 -6 C-20 -20 -11 -28 0 -28 C11 -28 20 -20 20 -6 L20 26 Z';
const toTomb = flubber(COIN_PATH, TOMB_PATH, {maxSegmentLength: 4});
const TOKENS = (() => {
  const order = new Array(100).fill(0).map((_, i) => i).sort((a, b) => random(`d${a}`) - random(`d${b}`));
  const rank = new Map(order.slice(0, 58).map((c, k) => [c, k]));
  return new Array(100).fill(0).map((_, i) => ({
    i,
    x: GX + (i % COLS) * CELL + CELL / 2,
    y: GY + Math.floor(i / COLS) * CELL + CELL / 2,
    color: [C.gold, C.blue, C.paper, C.orange, C.blueSoft][Math.floor(random(`tc${i}`) * 5)],
    dead: rank.has(i),
    rank: rank.get(i) ?? 0,
    depth: random(`dp${i}`),
  }));
})();

const Ghost: React.FC<{s: number}> = ({s}) => (
  <svg viewBox="-30 -34 60 66" width={52 * s} height={57 * s} style={{overflow: 'visible', display: 'block'}}>
    <path d="M-22 26 L-22 -6 Q-22 -30 0 -30 Q22 -30 22 -6 L22 26 Q16 18 11 26 Q5 18 0 26 Q-5 18 -11 26 Q-16 18 -22 26 Z" fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={-8} cy={-6} r={4} fill={C.ink} />
    <circle cx={8} cy={-6} r={4} fill={C.ink} />
    <ellipse cx={0} cy={8} rx={4} ry={5} fill={C.ink} />
  </svg>
);

export const S5Crypto: React.FC = () => {
  const {f, cue} = useScene('crypto');
  const crypto = cue('crypto');
  const worse = cue('worse');
  const d14 = cue('dead14');
  const tokens = cue('tokens');
  const dead = cue('dead');
  const span = Math.max(24, dead - d14 + 6);
  const count = Math.round(14000 * easeOut(clamp01((f - d14 + 2) / 14)));

  return (
    <AbsoluteFill>
      <Pop at={crypto - 14} x={760} y={130} from="up" f={f}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 22, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: SERIF, fontSize: 96, lineHeight: 1, color: C.ink}}>In crypto,</span>
          {f >= worse - 2 && <Kinetic text="it’s even worse." at={worse - 2} size={96} color={C.orange} f={f} serif italic stagger={1.1} />}
        </div>
      </Pop>
      {/* the graveyard */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {TOKENS.map((t) => {
          const appear = sp(f, crypto - 12 + (t.i % COLS) * 0.8 + Math.floor(t.i / COLS) * 0.5, {damping: 9, stiffness: 200});
          if (appear <= 0) return null;
          const dieAt = d14 + (t.rank * span) / 58;
          const m = t.dead ? ramp(f, dieAt, dieAt + 7) : 0;
          const flip = t.dead && f >= dieAt && f < dieAt + 7 ? Math.abs(Math.cos(((f - dieAt) / 7) * Math.PI)) : 1;
          const d = m > 0 ? toTomb(m) : COIN_PATH;
          return (
            <g key={t.i} transform={`translate(${t.x} ${t.y}) scale(${appear * Math.max(0.1, flip)}, ${appear})`}>
              <path d={d} fill={m > 0.5 ? C.greyLight : t.color} stroke={C.ink} strokeWidth={4} />
              {m > 0.6 ? (
                <path d="M-8 4 L8 4 M0 -4 L0 14" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
              ) : (
                <rect x={-6} y={-6} width={12} height={12} rx={2} transform="rotate(45)" fill="none" stroke={C.ink} strokeWidth={3} />
              )}
            </g>
          );
        })}
      </svg>
      {/* ghosts rising, on three depths (parallax: near ones are bigger, faster, blurrier) */}
      {TOKENS.filter((t) => t.dead).map((t) => {
        const dieAt = d14 + (t.rank * span) / 58 + 6;
        const tt = f - dieAt;
        if (tt < 0) return null;
        const depth = t.depth;
        const s = 0.6 + depth * 0.9;
        const speed = 1.6 + depth * 3.2;
        const x = t.x + noise2D('gh', t.i, tt * 0.03) * (30 + depth * 50);
        const y = t.y - tt * speed;
        return (
          <At key={t.i} x={x} y={y} style={{opacity: Math.max(0, Math.min(0.9, tt / 6)) * (1 - clamp01((tt - 70) / 40)), filter: depth > 0.8 ? 'blur(2px)' : undefined}} z={depth > 0.6 ? 6 : 1}>
            <Ghost s={s} />
          </At>
        );
      })}
      {/* the numbers */}
      <Pop at={d14 - 2} x={1380} y={330} f={f}>
        <Num size={150} color={C.orange} style={{WebkitTextStroke: `4px ${C.ink}`}}>
          {count.toLocaleString('en-US')}+
        </Num>
      </Pop>
      <Pop at={d14 + 6} x={1380} y={470} f={f}>
        <Head size={64}>
          of <span style={{fontFamily: MONO}}>~24,000</span> tokens
        </Head>
      </Pop>
      <Pop at={dead} x={1380} y={590} rot={-4} f={f}>
        <Pill bg={C.ink} color={C.white} size={70} style={{borderRadius: 26}}>
          DEAD
        </Pill>
      </Pop>
      <DefCard at={tokens} x={1390} y={705} term="Token" def="a crypto coin" rot={2} f={f} />
    </AbsoluteFill>
  );
};

// ---------- how much history? ----------
const TL_X0 = 230;
const TL_X1 = 1690;
const PX_YEAR = (TL_X1 - TL_X0) / 100;

export const S5CryptoB: React.FC = () => {
  const {f, cue} = useScene('crypto');
  const btc = cue('bitcoin');
  const fifteen = cue('fifteen');
  const grow = ramp(f, btc + 2, btc + 22, easeOut);
  const btcGrow = ramp(f, fifteen - 4, fifteen + 8, easeOut);

  return (
    <AbsoluteFill>
      <Pop at={btc} x={960} y={150} from="up" f={f}>
        <div style={{fontFamily: SERIF, fontSize: 104, lineHeight: 1, color: C.ink, whiteSpace: 'nowrap'}}>
          How much <i style={{color: C.blue}}>history?</i>
        </div>
      </Pop>
      {/* stocks: ~100 years */}
      <Pop at={btc + 2} x={TL_X0 + 140} y={300} f={f}>
        <Head size={50}>Stocks</Head>
      </Pop>
      <div style={{position: 'absolute', left: TL_X0, top: 340, width: (TL_X1 - TL_X0) * grow, height: 90, background: `repeating-linear-gradient(90deg, ${C.blue} 0 ${PX_YEAR * 10 - 4}px, #1A33DD ${PX_YEAR * 10 - 4}px ${PX_YEAR * 10}px)`, border: `5px solid ${C.ink}`, borderRadius: 18, boxShadow: `6px 6px 0 ${C.ink}`, boxSizing: 'border-box'}} />
      {new Array(10).fill(0).map((_, i) => {
        const x = TL_X0 + (i + 0.5) * PX_YEAR * 10;
        if (TL_X0 + (TL_X1 - TL_X0) * grow < x) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x - 8, top: 362, width: 16, height: 46, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: 3, height: 46, background: C.white, opacity: 0.6}} />
          </div>
        );
      })}
      <Pop at={btc + 16} x={TL_X1 - 150} y={290} f={f}>
        <Num size={60} color={C.blue}>
          ~100 years
        </Num>
      </Pop>
      {/* bitcoin: ~15 years, aligned to today */}
      <Pop at={fifteen - 6} x={TL_X0 + 150} y={590} f={f}>
        <Head size={50}>Bitcoin</Head>
      </Pop>
      <div style={{position: 'absolute', left: TL_X1 - 15 * PX_YEAR * btcGrow, top: 630, width: 15 * PX_YEAR * btcGrow, height: 90, background: C.orange, border: btcGrow > 0 ? `5px solid ${C.ink}` : 'none', borderRadius: 18, boxShadow: `6px 6px 0 ${C.ink}`, boxSizing: 'border-box'}} />
      <div style={{position: 'absolute', left: TL_X0, top: 672, width: TL_X1 - TL_X0 - 15 * PX_YEAR - 10, height: 0, borderTop: `5px dashed ${C.greyLight}`, opacity: btcGrow}} />
      <Pop at={fifteen + 2} x={TL_X1 - 15 * PX_YEAR - 170} y={675} f={f}>
        <Num size={56} color={C.orange}>
          ~15 years
        </Num>
      </Pop>
      <Annotate at={fifteen + 8} d={`M${TL_X1 - 250} 610 C ${TL_X1 - 260} 560, ${TL_X1 + 30} 560, ${TL_X1 + 20} 640 C ${TL_X1 + 10} 740, ${TL_X1 - 250} 740, ${TL_X1 - 240} 630`} color={C.orange} width={8} w={10} h={10} f={f} />
      <Pop at={btc + 8} x={1330} y={530} from="down" f={f}>
        <div style={stickerCut(5)}>
          <Lucky size={210} expr={f >= fifteen ? 'squint' : 'happy'} magnifier arms="hold" look={[0.6, -0.8]} jolts={[fifteen]} f={f} seed={5} />
        </div>
      </Pop>
    </AbsoluteFill>
  );
};
