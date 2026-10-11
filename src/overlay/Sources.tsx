import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp01, sp} from '../anim';
import {Lucky} from '../components/Lucky';
import {Display, Label, Pill, Pop, Rise, Script, Sqrt, stickerCut} from '../components/ui';
import {SceneId} from '../script';
import {C, DISPLAY, HAIR, LIFT, MONO, SANS, SCRIPT} from '../theme';
import {cueAbs, getScene, sceneFrames} from '../timing';

// Every claim on screen carries its source in one fixed place (bottom left, under
// the captions), and the video ends on the full reference list. The references are
// the ones cited by the article; nothing here adds a number of its own.

export type Reference = {
  id: number;
  short: string;
  title: string;
  venue: React.ReactNode;
  used: React.ReactNode;
};

export const REFERENCES: Reference[] = [
  {
    id: 1,
    short: 'Barber & Odean (2000)',
    title: 'Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors',
    venue: 'Journal of Finance, 55(2), 773–806',
    used: '66,465 households · 11.4% vs 17.9% a year',
  },
  {
    id: 2,
    short: 'Bailey & López de Prado (2014)',
    title: 'The Deflated Sharpe Ratio: Correcting for Selection Bias, Backtest Overfitting and Non-Normality',
    venue: 'Journal of Portfolio Management, 40(5), 94–107',
    used: 'the fix · Sharpe 2.0: 99% real → 34% real',
  },
  {
    id: 3,
    short: 'CoinGecko (2024)',
    title: 'Research on dead cryptocurrencies, as reported by The Defiant',
    venue: 'CoinGecko · The Defiant',
    used: '14,000+ of ~24,000 tokens dead',
  },
  {
    id: 4,
    short: 'Harvey, Liu & Zhu (2016)',
    title: '…and the Cross-Section of Expected Returns',
    venue: 'Review of Financial Studies, 29(1), 5–68',
    used: 'why testing many versions fools you',
  },
  {
    id: 5,
    short: 'McLean & Pontiff (2016)',
    title: 'Does Academic Research Destroy Stock Return Predictability?',
    venue: 'Journal of Finance, 71(1), 5–32',
    used: 'what happens out of sample',
  },
  {
    id: 6,
    short: 'Gu, Kelly & Xiu (2020)',
    title: 'Empirical Asset Pricing via Machine Learning',
    venue: 'Review of Financial Studies, 33(5), 2223–2273',
    used: 'what machine learning can do in markets',
  },
  {
    id: 7,
    short: 'IMF (2022)',
    title: 'Publication on crypto markets, from the article’s reference list',
    venue: 'International Monetary Fund',
    used: 'cited in the article',
  },
  {
    id: 8,
    short: 'My simulation',
    title: 'Python simulation: strategies made of pure random numbers, scored with the Sharpe ratio',
    venue: <>730 daily returns · Sharpe × <Sqrt>365</Sqrt> · winner re-run on 1 unseen year</>,
    used: 'best of 10 / 100 / 1,000 = 1.09 / 1.77 / 2.30 · unseen ≈ 0',
  },
];

// ---------- the footnote under the captions ----------

type Note = {from: [SceneId, string | null]; to: [SceneId, string | null]; label: 'SOURCE' | 'METHOD' | 'MATH'; text: React.ReactNode};

const NOTES: Note[] = [
  {from: ['who', 'data'], to: ['who', null], label: 'SOURCE', text: 'Barber & Odean (2000), Journal of Finance · 66,465 U.S. households, 1991–1996'},
  {from: ['problem', 'quants'], to: ['problem', 'picture'], label: 'SOURCE', text: 'Bailey & López de Prado (2014) · Harvey, Liu & Zhu (2016)'},
  {from: ['problem', 'picture'], to: ['problem', null], label: 'MATH', text: '2^10 = 1,024 → one person in 1,024 gets ten heads by pure chance'},
  {from: ['sim', 'tested'], to: ['sim', null], label: 'METHOD', text: <>My Python simulation · pure-noise strategies · 730 daily returns · Sharpe × <Sqrt>365</Sqrt></>},
  {from: ['crypto', 'crypto'], to: ['crypto', 'bitcoin'], label: 'SOURCE', text: 'CoinGecko (2024), reported by The Defiant · 14,000+ of ~24,000 listed tokens are dead'},
  {from: ['fix', 'dsr'], to: ['fix', null], label: 'SOURCE', text: 'Bailey & López de Prado (2014), Journal of Portfolio Management · Sharpe 2.0, 2 years of daily data'},
];

const edge = ([scene, ev]: [SceneId, string | null], end: boolean) => {
  if (ev) return cueAbs(scene, ev, end ? 0 : -0.1);
  const {from, dur} = sceneFrames(getScene(scene));
  return end ? from + dur - 4 : from;
};

const LABEL_BG: Record<Note['label'], string> = {SOURCE: C.blue, METHOD: C.ink, MATH: C.orange};

export const SourceNotes: React.FC<{left?: number; bottom?: number; size?: number; maxWidth?: number; wrap?: boolean}> = ({left = 46, bottom = 20, size = 20, maxWidth = 1500, wrap = false}) => {
  const f = useCurrentFrame();
  const spans = NOTES.map((n) => ({...n, a: edge(n.from, false), b: edge(n.to, true)}));
  const cur = spans.find((s) => f >= s.a && f < s.b);
  if (!cur) return null;
  const inP = sp(f, cur.a, {damping: 16, stiffness: 200});
  const out = clamp01((cur.b - f) / 6);
  // a note that directly follows another one swaps in place instead of dropping out
  const prev = spans.find((s) => s.b >= cur.a - 1 && s.b <= cur.a + 1 && s !== cur);
  const y = prev ? 0 : (1 - inP) * 40;
  return (
    <div style={{position: 'absolute', left, bottom, zIndex: 101, opacity: Math.min(prev ? 1 : inP, out), transform: `translateY(${y}px)`, pointerEvents: 'none'}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          maxWidth,
          background: C.paper,
          border: `${HAIR}px solid ${C.ink}`,
          borderRadius: 3,
          boxShadow: LIFT,
          overflow: 'hidden',
        }}
      >
        <div style={{background: LABEL_BG[cur.label], color: C.white, fontFamily: SANS, fontWeight: 800, fontSize: size * 0.72, letterSpacing: '0.18em', padding: `${size * 0.3}px ${size * 0.6}px`, display: 'flex', alignItems: 'center'}}>
          {cur.label}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 500, fontSize: size, color: C.ink, padding: `${size * 0.3}px ${size * 0.65}px`, whiteSpace: wrap ? 'normal' : 'nowrap', lineHeight: 1.3, opacity: prev ? clamp01((f - cur.a) / 5) : 1}}>
          {cur.text}
        </div>
      </div>
    </div>
  );
};

// ---------- the reference slate (last seconds of the video) ----------

const RefCard: React.FC<{r: Reference; w: number}> = ({r, w}) => (
  <div
    style={{
      width: w,
      height: 172,
      display: 'flex',
      gap: 18,
      background: C.paper,
      border: `${HAIR}px solid ${C.ink}`,
      borderRadius: 4,
      boxShadow: LIFT,
      padding: '14px 22px 14px 16px',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        flex: '0 0 auto',
        width: 52,
        height: 52,
        borderRadius: 2,
        background: r.id === 8 ? C.orange : C.blue,
        color: C.white,
        fontFamily: DISPLAY,
        fontSize: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {r.id}
    </div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 12, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: SCRIPT, fontStyle: 'italic', fontWeight: 700, fontSize: 38, lineHeight: 1, color: C.ink}}>{r.short}</span>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 21, lineHeight: 1.18, color: C.ink, height: 52, overflow: 'hidden'}}>{r.title}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 16, color: '#6E6757', whiteSpace: 'nowrap', overflow: 'hidden'}}>{r.venue}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', color: C.orange, whiteSpace: 'nowrap', overflow: 'hidden'}}>→ {r.used}</div>
    </div>
  </div>
);

export const ReferencesSlate: React.FC<{tall?: boolean}> = ({tall = false}) => {
  const f = useCurrentFrame();
  if (tall) return <ReferencesTall f={f} />;
  const W = 790;
  const GAP_X = 32;
  const x0 = (1920 - (2 * W + GAP_X)) / 2;
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(90deg, ${C.creamDark} 0px, ${C.creamDark} 1.6px, transparent 1.6px, transparent 34px)`, backgroundPosition: `${f * 0.3}px 0px`, opacity: 0.55}} />
      <AbsoluteFill style={{transform: `scale(${1 + Math.min(f, 240) * 0.00012})`}}>
        <div style={{position: 'absolute', left: x0, top: 70, display: 'flex', alignItems: 'baseline', gap: 30}}>
          <div style={{transform: `scale(${2 - sp(f, 2, {damping: 12, stiffness: 230, mass: 0.7})})`, transformOrigin: '0% 80%', opacity: f >= 2 ? 1 : 0}}>
            <Display size={120} color={C.blue}>
              Sources
            </Display>
          </div>
          <Rise at={6} f={f}>
            <Script size={40}>Every number on screen comes from the article and the work it cites.</Script>
          </Rise>
        </div>
        {REFERENCES.map((r, i) => {
          const col = i < 4 ? 0 : 1;
          const row = i % 4;
          return (
            <Pop key={r.id} at={8 + i * 2.5} x={x0 + col * (W + GAP_X) + W / 2} y={276 + row * 186} from={col ? 'right' : 'left'} f={f} dist={240}>
              <RefCard r={r} w={W} />
            </Pop>
          );
        })}
        <Pop at={30} x={960} y={1010} f={f}>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6E6757', whiteSpace: 'nowrap'}}>
            Andrea Gervasoni · TKS Focus: Blockchain · full article linked below
          </div>
        </Pop>
      </AbsoluteFill>
      <Pop at={14} x={1745} y={1000} from="right" f={f}>
        <div style={stickerCut(4)}>
          <Lucky size={130} expr="detective" magnifier arms="hold" look={[-1, 0.4]} jolts={[14]} f={f} seed={11} />
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

/** 1080x1920 version: one column, bigger type */
const ReferencesTall: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: C.cream, backgroundImage: `radial-gradient(${C.creamDark} 2.6px, transparent 2.9px)`, backgroundSize: '46px 46px', backgroundPosition: `${f * 0.4}px ${f * 0.25}px`}}>
    <Pop at={2} x={540} y={150} from="up" f={f} dist={300}>
      <Pill bg={C.ink} color={C.white} size={52}>
        SOURCES
      </Pill>
    </Pop>
    <Pop at={5} x={540} y={250} f={f}>
      <div style={{fontFamily: SCRIPT, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: C.ink, textAlign: 'center', width: 960, lineHeight: 1.05}}>
        Every number on screen comes from the article and <i>the work it cites.</i>
      </div>
    </Pop>
    {REFERENCES.map((r, i) => (
      <Pop key={r.id} at={8 + i * 2.5} x={540} y={420 + i * 184} from={i % 2 ? 'right' : 'left'} f={f} dist={240}>
        <RefCard r={r} w={980} />
      </Pop>
    ))}
  </AbsoluteFill>
);

// ---------- transition: the reference page slides over the end card like a sheet of paper ----------

const PaperSlide: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress}) => {
  const p = presentationProgress;
  const e = 1 - (1 - p) ** 3;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${1 - 0.06 * e})`, filter: `brightness(${1 - 0.25 * e})`}}>{children}</AbsoluteFill>;
  }
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - e) * 1140}px) rotate(${(1 - e) * 2.5}deg)`, boxShadow: `0 -10px 0 ${C.ink}`, transformOrigin: '0% 100%'}}>
      {children}
    </AbsoluteFill>
  );
};

export const paperSlide = (): TransitionPresentation<Record<string, never>> => ({component: PaperSlide, props: {}});
