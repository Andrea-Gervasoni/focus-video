import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Easing, random} from 'remotion';
import {bouncy, clamp01, easeOut, ramp, sp} from '../anim';
import {CURVE_LOCAL} from '../camera';
import {CrownIcon, Lucky, LUCKY_FEET} from '../components/Lucky';
import {Annotate, At, Card, DefCard, Head, Num, Odometer, Pill, Pop, Stamp, stickerCut} from '../components/ui';
import {crownTrack, sample} from '../sim/physics';
import {sim} from '../sim/curves';
import {C, HEAD, MONO} from '../theme';
import {useScene} from '../timing';

// plot geometry (station px): in-sample 730 days, then the unseen year at the same scale
const PX0 = 180;
const PX1 = CURVE_LOCAL.x; // end of the backtest
const PX2 = PX1 + (PX1 - PX0) / 2; // + one unseen year
const ZERO_Y = 600;

const TOWERS = [
  {v: 1.09, n: '10', x: 330, size: 100, cue: 'b10', count: 10},
  {v: 1.77, n: '100', x: 560, size: 140, cue: 'b100', count: 100},
  {v: 2.3, n: '1,000', x: 800, size: 190, cue: 'b1000', count: 1000},
];
const BASE = 770;
/** the Sharpe odometer, above the end of the golden curve */
const ODO = {x: CURVE_LOCAL.x - 250, y: CURVE_LOCAL.y - 150};
const PX_PER_SR = 190;
/** where the crown sits on the biggest Lucky (station px) */
const CROWN_HEAD_Y = BASE - 2.3 * PX_PER_SR - 190 * LUCKY_FEET + 6 + 190 * (116 / 300);

const KW = '#9DAAFF';
const TX = '#FFFCF4';
const NUMC = '#FF8A57';
const CM = '#8C8676';
type Tok = {t: string; c: string};
const CODE: Tok[][] = [
  [{t: 'import', c: KW}, {t: ' numpy ', c: TX}, {t: 'as', c: KW}, {t: ' np', c: TX}],
  [{t: 'rets = rng.standard_normal((n, ', c: TX}, {t: '730', c: NUMC}, {t: '))', c: TX}, {t: '  # noise', c: CM}],
  [{t: 'sharpe = rets.mean(', c: TX}, {t: '1', c: NUMC}, {t: ') / rets.std(', c: TX}, {t: '1', c: NUMC}, {t: ') * ', c: TX}, {t: '365', c: NUMC}, {t: '**', c: TX}, {t: '0.5', c: NUMC}],
  [{t: 'best = sharpe.max()', c: TX}, {t: '  # keep the best', c: CM}],
];
const TOTAL = CODE.reduce((a, l) => a + l.reduce((b, t) => b + t.t.length, 0) + 1, 0);

const Curves: React.FC<{f: number; shown: number; draw: number; deflate: number; unseen: number; glow: number}> = ({f, shown, draw, deflate, unseen, glow}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const run = sim();
  const best = run.bestOf(Math.max(1, shown));
  const gold = run.paths.subarray(run.best * run.points, run.best * run.points + run.points);
  const k = (ZERO_Y - CURVE_LOCAL.y) / gold[run.points - 1];
  const yOf = (v: number) => ZERO_Y - v * k;
  const xOf = (i: number) => PX0 + ((PX1 - PX0) * i) / (run.points - 1);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(PX0 - 10, 150, PX2 - PX0 + 40, 640);
    ctx.clip();
    const upto = Math.max(1, Math.floor(draw * (run.points - 1)));
    ctx.lineWidth = shown <= 10 ? 4 : shown <= 100 ? 2.6 : 2;
    ctx.strokeStyle = shown <= 10 ? 'rgba(70,64,52,0.55)' : shown <= 100 ? 'rgba(70,64,52,0.3)' : 'rgba(70,64,52,0.16)';
    for (let s = 0; s < shown; s++) {
      if (s === best) continue;
      const o = s * run.points;
      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(run.paths[o]));
      for (let i = 1; i <= upto; i++) ctx.lineTo(xOf(i), yOf(run.paths[o + i]));
      ctx.stroke();
    }
    // the leader (the best of the strategies shown so far)
    const lo = best * run.points;
    const isGold = best === run.best;
    const sink = deflate;
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = `rgba(255,200,40,${0.9 * glow * (1 - sink)})`;
    ctx.shadowBlur = 26 * glow;
    ctx.strokeStyle = sink > 0.5 ? '#9C9480' : C.gold;
    ctx.beginPath();
    for (let i = 0; i <= upto; i++) {
      // deflating balloon: the line sags towards zero, with a wobble
      const v = run.paths[lo + i] * (1 - sink) + Math.sin(i * 0.5 + f * 0.6) * 6 * sink * (1 - sink) * 4;
      const y = yOf(v) + sink * 60 * (i / (run.points - 1));
      if (i === 0) ctx.moveTo(xOf(i), y);
      else ctx.lineTo(xOf(i), y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    // what a real 2.30 would have done next (dashed), then what actually happened
    if (isGold && unseen > 0 && sink < 0.5) {
      const g0 = run.paths[lo + run.points - 1];
      const slope = g0 / (run.points - 1);
      const n = Math.floor(unseen * (run.unseenPoints - 1));
      ctx.save();
      ctx.setLineDash([16, 14]);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(226,165,18,0.85)';
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const x = PX1 + ((PX2 - PX1) * i) / (run.unseenPoints - 1);
        const y = yOf(g0 + slope * i);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    // the unseen year
    if (isGold && unseen > 0) {
      const n = Math.floor(unseen * (run.unseenPoints - 1));
      const start = run.unseenPath[0];
      ctx.lineWidth = 8;
      ctx.strokeStyle = sink > 0.5 ? '#9C9480' : C.orange;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const v = start + (run.unseenPath[i] - start) - start * sink;
        const x = PX1 + ((PX2 - PX1) * i) / (run.unseenPoints - 1);
        if (i === 0) ctx.moveTo(x, yOf(v) + sink * 60);
        else ctx.lineTo(x, yOf(v) + sink * 60);
      }
      ctx.stroke();
    }
    ctx.restore();
  });
  return <canvas ref={ref} width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}} />;
};

const RandomRain: React.FC<{f: number; at: number}> = ({f, at}) => {
  if (f < at) return null;
  const t = f - at;
  return (
    <div style={{position: 'absolute', left: 1020, top: 160, width: 420, height: 560, overflow: 'hidden'}}>
      {new Array(6).fill(0).map((_, c) => (
        <div key={c} style={{position: 'absolute', left: c * 70, top: -400 + ((t * (14 + c * 3)) % 900), fontFamily: MONO, fontWeight: 700, fontSize: 24, color: c % 2 ? C.blue : C.ink, opacity: 0.75, lineHeight: 1.3}}>
          {new Array(16).fill(0).map((_, r) => (
            <div key={r}>{(random(`rr${c}-${r}`) * 4 - 2).toFixed(2)}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

/** "Sharpe = returns / risk", then a ruler where 2+ is excellent */
const SharpeExplainer: React.FC<{f: number; sharpe: number; divided: number; risk: number; above2: number; out: number}> = ({f, sharpe, divided, risk, above2, out}) => {
  const bar = ramp(f, divided + 2, divided + 12, easeOut);
  const marker = sp(f, above2 + 4, {damping: 11, stiffness: 120});
  const zone = ramp(f, above2 + 8, above2 + 20, easeOut);
  const RW = 900;
  const R0 = 960 - RW / 2;
  const xOfV = (v: number) => R0 + (v / 3) * RW;
  return (
    <>
      <Pop at={sharpe} x={960} y={400} f={f} out={out} outTo="up">
        <Card style={{width: 1180, padding: '30px 56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          <Pill bg={C.blue} color={C.white} size={34}>
            SHARPE RATIO
          </Pill>
          <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
            <Head size={104}>Sharpe =</Head>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 400}}>
              <div style={{opacity: f >= divided - 4 ? 1 : 0, transform: `translateY(${(1 - sp(f, divided - 4, {damping: 10, stiffness: 220})) * 40}px)`}}>
                <Head size={96}>returns</Head>
              </div>
              <div style={{width: 420 * bar, height: 12, background: C.ink, borderRadius: 6, margin: '10px 0'}} />
              <div style={{opacity: f >= risk - 2 ? 1 : 0, transform: `translateY(${(1 - sp(f, risk - 2, {damping: 10, stiffness: 220})) * -40}px)`}}>
                <Head size={96} color={C.orange}>
                  risk
                </Head>
              </div>
            </div>
          </div>
        </Card>
      </Pop>
      <Pop at={above2 - 4} x={960} y={790} from="down" f={f} out={out + 2} outTo="down">
        <div style={{position: 'relative', width: RW + 120, height: 150}}>
          <div style={{position: 'absolute', left: 60, top: 50, width: RW, height: 46, borderRadius: 23, border: `5px solid ${C.ink}`, background: C.paper, overflow: 'hidden', boxSizing: 'border-box', boxShadow: `5px 5px 0 ${C.ink}`}}>
            <div style={{position: 'absolute', left: `${(2 / 3) * 100}%`, top: 0, bottom: 0, width: `${(1 / 3) * 100 * zone}%`, background: C.blue}} />
            <div style={{position: 'absolute', left: `${(2 / 3) * 100}%`, top: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 26, color: C.white, opacity: zone}}>
              excellent
            </div>
          </div>
          {[0, 1, 2, 3].map((v) => (
            <div key={v} style={{position: 'absolute', left: xOfV(v) - R0 + 60 - 20, top: 106, width: 40, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 32, color: v === 2 ? C.blue : C.ink}}>
              {v}
            </div>
          ))}
          {/* the marker slides from 0 to 2 */}
          <div style={{position: 'absolute', left: 60 + (2 / 3) * RW * marker - 18, top: 4}}>
            <svg width={36} height={40} viewBox="0 0 36 40">
              <path d="M4 4 L32 4 L18 34 Z" fill={C.orange} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Pop>
    </>
  );
};

export const S4Sim: React.FC = () => {
  const sc = useScene('sim');
  const {cue} = sc;
  const tested = cue('tested');
  const python = cue('python');
  const random_ = cue('random');
  const zeroSkill = cue('zeroSkill');
  const sharpe = cue('sharpe');
  const above2 = cue('above2');
  const b10 = cue('b10');
  const b100 = cue('b100');
  const b1000 = cue('b1000');
  const v23 = cue('v23');
  const unseen = cue('unseen');
  const neverSeen = cue('neverSeen');
  const result = cue('result');
  const collapse = cue('collapse');
  // the freeze: everything stops between "2.3." and "Then I run it"
  const freezeAt = v23 + 14;
  const frozen = sc.f >= freezeAt && sc.f < unseen;
  const f = frozen ? freezeAt : sc.f;

  const typed = Math.floor(TOTAL * ramp(f, tested + 6, zeroSkill - 4, (x) => x));
  let left = typed;
  const lines = CODE.map((line) => {
    const out = line.map((tok) => {
      const n = Math.max(0, Math.min(tok.t.length, left));
      left -= tok.t.length;
      return {...tok, shown: tok.t.slice(0, n)};
    });
    left -= 1;
    return out;
  });

  const shown = f >= b1000 ? 1000 : f >= b100 ? 100 : f >= b10 ? 10 : 0;
  const drawAt = f >= b1000 ? b1000 : f >= b100 ? b100 : b10;
  const draw = ramp(f, drawAt - 2, drawAt + 16, Easing.out(Easing.quad));
  const deflate = ramp(f, collapse, collapse + 22, Easing.in(Easing.quad));
  const unseenDraw = ramp(f, unseen + 4, neverSeen + 8, (x) => x);
  const glow = f >= b1000 ? 1 : 0.6;
  const odo = f < b1000 ? 0 : f < collapse ? 2.3 * easeOut(clamp01((f - b1000) / Math.max(10, v23 - b1000))) : 2.3 * (1 - ramp(f, collapse, collapse + 26, Easing.inOut(Easing.cubic)));
  const crownT = f >= collapse + 2 ? f - (collapse + 2) : -1;
  const ct = crownTrack(BASE - CROWN_HEAD_Y - 24);
  const big = TOWERS[2];
  const chartIn = b10 - 8;
  const expOut = sharpe - 6;

  return (
    <AbsoluteFill>
      {/* ---- the experiment ---- */}
      <Pop at={tested - 14} x={960} y={95} from="up" f={f} out={expOut} outTo="up">
        <Pill bg={C.blue} color={C.white} size={40}>
          THE EXPERIMENT · a Python simulation
        </Pill>
      </Pop>
      <Pop at={tested - 8} x={560} y={340} from="down" out={expOut} outTo="up" rot={-1.5} f={f}>
        <Card bg={C.ink} style={{width: 900, padding: 0, overflow: 'hidden'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px', borderBottom: `4px solid #2C2C2C`}}>
            {[C.orange, C.gold, C.blue].map((c) => (
              <div key={c} style={{width: 18, height: 18, borderRadius: 99, background: c}} />
            ))}
            <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, color: CM, marginLeft: 12}}>noise.py · n = 10, 100, 1000</span>
          </div>
          <div style={{padding: '22px 28px 30px', fontFamily: MONO, fontWeight: 700, fontSize: 25, lineHeight: 1.75, whiteSpace: 'pre', minHeight: 4 * 44}}>
            {lines.map((line, li) => (
              <div key={li}>
                {line.map((tok, ti) => (
                  <span key={ti} style={{color: tok.c}}>
                    {tok.shown}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </Pop>
      <Pop at={python + 12} x={1230} y={440} f={f} out={expOut + 2} outTo="up">
        <Card style={{width: 460, height: 600, padding: 0, overflow: 'hidden', position: 'relative'}}>
          <div style={{position: 'absolute', left: 20, top: 16, zIndex: 2}}>
            <Pill bg={C.gold} size={28}>
              pure random numbers
            </Pill>
          </div>
        </Card>
      </Pop>
      {f < expOut + 8 && (
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${-sp(f, expOut + 2, {damping: 15, stiffness: 170}) * 1300}px)`}}>
          <RandomRain f={f} at={python + 16} />
        </div>
      )}
      <Pop at={tested + 6} x={1660} y={700} from="right" f={f} out={expOut + 4} outTo="right">
        <div style={stickerCut(5)}>
          <Lucky size={230} expr={f >= zeroSkill ? 'shocked' : f >= random_ ? 'confident' : 'happy'} arms={f >= zeroSkill ? 'up' : 'point'} look={[-1, -0.3]} jolts={[tested + 6, random_, zeroSkill]} f={f} seed={9} />
        </div>
      </Pop>
      {f < expOut + 20 && (
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${-sp(f, expOut, {damping: 15, stiffness: 170}) * 1300}px)`}}>
          <Stamp at={zeroSkill} x={560} y={620} rot={-7} size={96} f={f}>
            ZERO SKILL
          </Stamp>
        </div>
      )}

      {/* ---- the Sharpe ratio, explained on its own ---- */}
      <SharpeExplainer f={f} sharpe={sharpe} divided={cue('divided')} risk={cue('risk')} above2={above2} out={chartIn} />

      {/* ---- the chart: 1,000 random walks + towers ---- */}
      <Pop at={chartIn} x={980} y={470} f={f}>
        <div style={{width: 1720, height: 680, background: C.paper, border: `5px solid ${C.ink}`, borderRadius: 30, boxShadow: `6px 6px 0 ${C.ink}`}} />
      </Pop>
      {f >= chartIn + 4 && (
        <>
          <div style={{position: 'absolute', left: PX0, top: ZERO_Y, width: PX2 - PX0, height: 3, background: C.greyLight}} />
          <div style={{position: 'absolute', left: PX0 - 14, top: 150, display: 'flex', flexDirection: 'column', gap: 2, opacity: shown > 0 ? (1 - ramp(f, v23 - 12, v23)) + ramp(f, collapse + 24, collapse + 36) : 0}}>
            <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 34, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
              <span style={{fontFamily: MONO, color: C.blue}}>{shown.toLocaleString('en-US')}</span> strategies of pure noise
            </div>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 20, color: '#6E6757', whiteSpace: 'nowrap'}}>cumulative return · 2 years of daily data</div>
          </div>
          <div style={{position: 'absolute', left: PX0 - 44, top: ZERO_Y - 14, fontFamily: MONO, fontWeight: 800, fontSize: 22, color: '#6E6757'}}>0</div>
          <Curves f={f} shown={shown} draw={draw} deflate={deflate} unseen={unseenDraw} glow={glow} />
        </>
      )}
      {/* unseen year divider */}
      {f >= unseen && (
        <>
          <svg width={20} height={620} style={{position: 'absolute', left: PX1 - 10, top: 160, overflow: 'visible'}}>
            <line x1={10} x2={10} y1={0} y2={600 * ramp(f, unseen, unseen + 12, easeOut)} stroke={C.ink} strokeWidth={6} strokeDasharray="18 14" strokeLinecap="round" />
          </svg>
          <Pop at={unseen + 4} x={(PX1 + PX2) / 2 + 20} y={ZERO_Y + 40} f={f} out={collapse}>
            <Pill bg={C.paper} color={C.orange} size={36}>
              UNSEEN YEAR
              <svg width={44} height={26} viewBox="0 0 100 60">
                <path d="M6 30 L88 30 M62 8 L90 30 L62 52" stroke={C.orange} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Pill>
          </Pop>
        </>
      )}

      {/* towers, each crowned by a bigger Lucky */}
      {TOWERS.map((t, i) => {
        const at = cue(t.cue);
        if (f < at - 2) return null;
        const p = sp(f, at, {damping: 9, stiffness: 140});
        const h = t.v * PX_PER_SR * p;
        const count = t.v * easeOut(clamp01((f - at) / 14));
        const isBig = i === 2;
        const def = isBig ? deflate : 0;
        return (
          <React.Fragment key={t.n}>
            <div
              style={{
                position: 'absolute',
                left: t.x - 80,
                top: BASE - h,
                width: 160,
                height: h,
                background: `repeating-linear-gradient(0deg, ${C.blue} 0 46px, #1A33DD 46px 50px)`,
                border: `5px solid ${C.ink}`,
                borderBottom: 'none',
                borderRadius: '18px 18px 0 0',
                boxShadow: `6px 0 0 ${C.ink}`,
                boxSizing: 'border-box',
              }}
            >
              <div style={{position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
                <Num size={44} color={C.white}>
                  {count.toFixed(2)}
                </Num>
              </div>
            </div>
            <At x={t.x} y={BASE + 40}>
              <div style={{background: C.ink, color: C.white, fontFamily: MONO, fontWeight: 800, fontSize: 24, padding: '4px 12px', borderRadius: 10, whiteSpace: 'nowrap'}}>best of {t.n}</div>
            </At>
            <div style={{position: 'absolute', left: t.x - (t.size * 300) / 300 / 2, top: BASE - h - t.size * LUCKY_FEET + 6, ...stickerCut(4)}}>
              <Lucky
                size={t.size}
                expr={isBig ? (f >= collapse + 4 ? 'deflated' : f >= result ? 'nervous' : 'proud') : 'happy'}
                arms={isBig && f < result ? 'up' : 'down'}
                crown={isBig && crownT < 0 ? bouncy(f, at + 6) : 0}
                deflate={def}
                look={[0.8, -0.4]}
                jolts={[at, collapse]}
                f={f}
                seed={i}
              />
            </div>
          </React.Fragment>
        );
      })}
      {/* the crown falls, bounces and rolls away (matter-js) */}
      {crownT >= 0 &&
        (() => {
          const s = sample(ct, crownT);
          return (
            <At x={big.x + s.x} y={CROWN_HEAD_Y + s.y} transform={`rotate(${s.a}rad)`}>
              <CrownIcon size={big.size * 0.36} />
            </At>
          );
        })()}
      {/* odometer next to the golden curve */}
      {f >= b1000 && (
        <Pop at={b1000 + 2} x={ODO.x} y={ODO.y} f={f}>
          <Card style={{padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 16, background: f >= collapse ? C.paper : C.gold}}>
            <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: 30}}>Sharpe</span>
            {f >= collapse + 20 && <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 70}}>≈</span>}
            <Odometer value={odo} size={78} />
          </Card>
        </Pop>
      )}
      {frozen && <div style={{position: 'absolute', inset: -400, background: 'rgba(30,30,40,0.08)'}} />}
      {f >= neverSeen && deflate <= 0 && (
        <Pop at={neverSeen} x={1590} y={100} rot={-4} f={f}>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: C.goldDark, background: C.paper, border: `3px dashed ${C.goldDark}`, borderRadius: 14, padding: '4px 14px'}}>if it were skill</div>
        </Pop>
      )}
      {/* air puffs escaping the golden curve */}
      {deflate > 0 &&
        new Array(9).fill(0).map((_, k) => {
          const t = f - collapse - k * 2;
          if (t < 0 || t > 30) return null;
          const px = PX0 + 380 + k * 80 + Math.sin(t / 3 + k) * 12;
          const py = CURVE_LOCAL.y + 140 - k * 14 - t * 5;
          const r = 10 + t * 1.3;
          return <div key={k} style={{position: 'absolute', left: px - r, top: py - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `4px solid ${C.ink}`, background: C.paper, opacity: 1 - t / 30}} />;
        })}
      {f >= collapse + 2 && (
        <Pop at={collapse + 2} x={CURVE_LOCAL.x - 160} y={CURVE_LOCAL.y - 40} rot={-10} f={f} out={collapse + 34}>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 110, color: C.paper, WebkitTextStroke: `5px ${C.ink}`, letterSpacing: '-0.02em'}}>pfff…</div>
        </Pop>
      )}
      <Annotate
        at={collapse + 26}
        d={`M${ODO.x - 190} ${ODO.y - 10} C ${ODO.x - 190} ${ODO.y - 90}, ${ODO.x + 200} ${ODO.y - 90}, ${ODO.x + 200} ${ODO.y} C ${ODO.x + 200} ${ODO.y + 80}, ${ODO.x - 200} ${ODO.y + 80}, ${ODO.x - 180} ${ODO.y - 20}`}
        color={C.orange}
        width={9}
        w={10}
        h={10}
        f={f}
      />
    </AbsoluteFill>
  );
};
