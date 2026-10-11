import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {easeOut, lerp, ramp, sp, wobble} from '../anim';
import {Lucky, LUCKY_FEET} from '../components/Lucky';
import {Annotate, Card, Pill, Pop, stickerCut} from '../components/ui';
import {SCENES} from '../script';
import {sim} from '../sim/curves';
import {C, MONO, SERIF} from '../theme';
import {sceneWords, tokenize, useScene} from '../timing';
import {Trader} from './S2Who';

// The opening, as a magazine cover. The question is set in big serif type; a golden
// equity curve (the real winner of the simulation) climbs while Lucky rides it: "yes".
// Research arrives, the "yes" turns into a question, and on "changed my mind" the
// picture freezes and pulls back: the winner was only the luckiest of 1,000 curves of
// pure noise. Then the title lands.

const X0 = 200; // start of the curves
const TIP = {x: 1500, y: 380}; // where the golden curve ends
const ZERO_Y = 800;

/** 1,000 noise curves (grey) and the golden winner, drawn up to `draw` (0..1) */
const Fan: React.FC<{draw: number; ghosts: number; glow: number}> = ({draw, ghosts, glow}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const run = sim();
  const gold = run.best * run.points;
  const k = (ZERO_Y - TIP.y) / run.paths[gold + run.points - 1];
  const xOf = (i: number) => X0 + ((TIP.x - X0) * i) / (run.points - 1);
  const yOf = (v: number) => ZERO_Y - v * k;
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.translate(600, 600);
    const upto = Math.max(1, Math.floor(draw * (run.points - 1)));
    if (ghosts > 0.01) {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(70,64,52,${0.09 * ghosts})`;
      for (let s = 0; s < run.sharpe.length; s++) {
        if (s === run.best) continue;
        const o = s * run.points;
        ctx.beginPath();
        ctx.moveTo(xOf(0), yOf(run.paths[o]));
        for (let i = 1; i <= upto; i++) ctx.lineTo(xOf(i), yOf(run.paths[o + i]));
        ctx.stroke();
      }
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= upto; i++) {
      if (i === 0) ctx.moveTo(xOf(i), yOf(run.paths[gold + i]));
      else ctx.lineTo(xOf(i), yOf(run.paths[gold + i]));
    }
    ctx.shadowColor = `rgba(255,200,40,${0.9 * glow})`;
    ctx.shadowBlur = 30 * glow;
    ctx.lineWidth = 12;
    ctx.strokeStyle = C.gold;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.restore();
  });
  // the canvas is bigger than the station so the fan can spill out when the view pulls back
  return <canvas ref={ref} width={3120} height={2280} style={{position: 'absolute', left: -600, top: -600}} />;
};

/** where the golden curve's pen is at progress `draw` */
const penAt = (draw: number) => {
  const run = sim();
  const gold = run.best * run.points;
  const k = (ZERO_Y - TIP.y) / run.paths[gold + run.points - 1];
  const t = draw * (run.points - 1);
  const i = Math.floor(t);
  const j = Math.min(run.points - 1, i + 1);
  const v = lerp(run.paths[gold + i], run.paths[gold + j], t - i);
  return {x: X0 + (TIP.x - X0) * (t / (run.points - 1)), y: ZERO_Y - v * k};
};

const REFS = [
  {who: 'Barber & Odean', year: '2000', where: 'Journal of Finance'},
  {who: 'Bailey & López de Prado', year: '2014', where: 'J. of Portfolio Management'},
  {who: 'Harvey, Liu & Zhu', year: '2016', where: 'Review of Financial Studies'},
];

/** thin double rule around the cover, drawn on at the start */
const Masthead: React.FC<{f: number; out: number}> = ({f, out}) => {
  const p = ramp(f, 0, 22, easeOut);
  const o = 1 - ramp(f, out, out + 10);
  const W = 1920 - 80;
  const H = 1080 - 80;
  const per = 2 * (W + H);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={40} y={40} width={W} height={H} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - p)} />
        <rect x={52} y={52} width={W - 24} height={H - 24} fill="none" stroke={C.ink} strokeWidth={1.2} opacity={0.6} strokeDasharray={per} strokeDashoffset={per * (1 - p)} />
      </svg>
      <div style={{position: 'absolute', left: 84, right: 84, top: 74, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: ramp(f, 8, 22)}}>
        <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 20, letterSpacing: '0.16em', color: C.ink}}>TKS FOCUS · BLOCKCHAIN</span>
        <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: C.ink}}>a research story</span>
        <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 20, letterSpacing: '0.16em', color: C.ink}}>BY ANDREA GERVASONI</span>
      </div>
    </div>
  );
};

export const S1Hook: React.FC = () => {
  const {f, cue} = useScene('hook');
  const sure = cue('sure');
  const yes = cue('yes');
  const research = cue('research');
  const riser = cue('riser');
  const scratch = cue('scratch');
  const luckyIn = cue('luckyIn');
  const title = cue('title');

  // ---- the question ----
  const scene = SCENES[0];
  const words = sceneWords(scene);
  const toks = tokenize(scene.voText).slice(0, 8);
  const wordAt = (i: number) => Math.round(words[i][0] * 30) - 3;
  const up = sp(f, sure - 6, {damping: 18, stiffness: 120});
  const qOut = ramp(f, scratch + 2, scratch + 12);

  // ---- the curve and the view ----
  const draw = ramp(f, sure + 2, yes + 6, Easing.inOut(Easing.cubic));
  const ghosts = ramp(f, riser, scratch, (x) => x * x) * 0.55 + ramp(f, scratch + 6, scratch + 26) * 0.45;
  // push in on the tip while the riser builds, freeze, then pull back on the fan
  const push = ramp(f, riser, scratch, Easing.in(Easing.quad));
  const pull = ramp(f, scratch + 6, scratch + 34, Easing.inOut(Easing.cubic));
  const settle = ramp(f, title - 14, title + 8, Easing.inOut(Easing.cubic));
  const gs = lerp(1 + 0.16 * push, 0.74, pull);
  const gy = 250 * settle;
  const frozen = f >= scratch && f < scratch + 7;
  const pen = penAt(Math.max(0.001, draw));
  const crown = sp(f, luckyIn + 4, {damping: 10, stiffness: 160});
  const shocked = f >= title - 2;

  // ---- "Yes." ----
  const yesP = sp(f, yes, {damping: 9, stiffness: 220});
  const yesW = wobble(f, yes + 4, 0.1, 0.8);
  const asks = f >= research + 4;
  const qmark = sp(f, research + 4, {damping: 8, stiffness: 240});
  const yesOut = sp(f, scratch + 10, {damping: 15, stiffness: 140});

  const LS = 170; // Lucky riding the curve

  return (
    <AbsoluteFill style={{overflow: 'visible', filter: frozen ? 'grayscale(1) contrast(1.15)' : undefined}}>
      <Masthead f={f} out={title + 70} />

      {/* ---- the curve, Lucky and the reveal (one group, so the view can push and pull) ---- */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translate(0px, ${gy}px) scale(${gs})`, transformOrigin: `${TIP.x}px ${TIP.y}px`}}>
        {f >= sure && (
          <>
            <div style={{position: 'absolute', left: X0 - 40, top: ZERO_Y, width: (TIP.x - X0 + 120) * ramp(f, sure - 2, sure + 10, easeOut), height: 2, background: C.ink, opacity: 0.35}} />
            <Fan draw={draw} ghosts={ghosts} glow={0.5 + 0.5 * ramp(f, luckyIn, luckyIn + 10)} />
            <div style={{position: 'absolute', left: pen.x - LS / 2, top: pen.y - LS * LUCKY_FEET + 8, transform: `scale(${sp(f, sure + 4, {damping: 10, stiffness: 200})})`, transformOrigin: '50% 100%', ...stickerCut(5)}}>
              <Lucky
                size={LS}
                expr={shocked ? 'shocked' : f >= scratch ? 'nervous' : f >= research ? 'squint' : f >= yes ? 'proud' : 'confident'}
                arms={shocked ? 'up' : f >= yes && f < research ? 'up' : 'down'}
                sunglasses={f < research ? sp(f, sure + 10, {damping: 12, stiffness: 200}) : 0}
                crown={crown}
                look={f >= research && f < scratch ? [-0.3, 1] : [-1, 0.2]}
                jolts={[sure + 4, yes, research, scratch, luckyIn + 4, title - 2]}
                f={f}
              />
            </div>
          </>
        )}
        {/* the fact behind the reveal */}
        <Pop at={luckyIn + 10} x={TIP.x + 250} y={TIP.y - 40} rot={4} f={f}>
          <Pill bg={C.ink} color={C.white} size={40} mono>
            best of 1,000
          </Pill>
        </Pop>
        <Pop at={luckyIn + 16} x={X0 + 380} y={ZERO_Y - 300} rot={-2} f={f}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: '#5E584A', whiteSpace: 'nowrap'}}>1,000 strategies of pure noise</div>
        </Pop>
      </div>

      {/* ---- "Yes." -> "Yes?" -> struck through ---- */}
      {f >= yes && yesOut < 0.99 && (
        <div style={{position: 'absolute', left: 300, top: 300, transform: `translateY(${yesOut * 900}px) rotate(${-6 + yesOut * 14}deg) scale(${(0.4 + 0.6 * yesP) * (1 + yesW)}, ${(0.4 + 0.6 * yesP) * (1 - yesW)})`, transformOrigin: '30% 70%'}}>
          <div style={{position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontSize: 250, lineHeight: 1, color: C.blue, whiteSpace: 'nowrap'}}>
            Yes
            <span style={{display: 'inline-block', color: asks ? C.orange : C.blue, transform: asks ? `scale(${qmark}) rotate(${(1 - qmark) * 40}deg)` : undefined}}>{asks ? '?' : '.'}</span>
            <Annotate at={yes + 6} d="M10 238 Q160 224 380 236" color={C.blue} width={9} w={10} h={10} f={f} />
            <Annotate at={scratch + 1} dur={7} d="M-10 150 L420 120" color={C.orange} width={16} w={10} h={10} f={f} />
          </div>
        </div>
      )}

      {/* ---- the research: three of the papers behind the article ---- */}
      {REFS.map((r, i) => {
        const at = research + 2 + i * 4;
        if (f < at - 3 || f > riser + 40) return null;
        const p = sp(f, at, {damping: 12, stiffness: 150});
        const leave = sp(f, riser + 4 + i * 2, {damping: 14, stiffness: 140});
        const x = 1330 + i * 48;
        const y = 600 + i * 118;
        return (
          <div key={r.who} style={{position: 'absolute', left: x - 200, top: y - 80, transform: `translate(${(1 - p) * 700 + leave * 200}px, ${(1 - p) * 300 + leave * 700}px) rotate(${-4 + i * 3 + (1 - p) * 30}deg)`}}>
            <Card style={{width: 400, padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 6}} radius={18}>
              <div style={{fontFamily: SERIF, fontSize: 40, lineHeight: 1.05, color: C.ink}}>{r.who}</div>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 18, color: '#6E6757'}}>
                {r.where} · {r.year}
              </div>
            </Card>
          </div>
        );
      })}

      {/* ---- the question ---- */}
      {qOut < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lerp(300, 150, up),
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${lerp(1, 0.46, up)})`,
            transformOrigin: '50% 0%',
            opacity: 1 - qOut,
          }}
        >
          <div style={{width: 1500, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 34, rowGap: 0}}>
            {toks.map((tk, i) => {
              const at = wordAt(i);
              const p = sp(f, at, {damping: 13, stiffness: 190});
              const isAI = tk === 'AI';
              const isHuman = tk.startsWith('human');
              return (
                <div key={i} style={{position: 'relative', overflow: 'visible'}}>
                  {/* Lucky and a (cartoon) human peek out from behind their words */}
                  {(isAI || isHuman) && f >= at + 4 && f < sure + 6 && (
                    <div
                      style={{
                        position: 'absolute',
                        ...(isAI ? {left: '50%', bottom: '78%'} : {left: '96%', bottom: '8%'}),
                        transform: isAI
                          ? `translateX(-50%) translateY(${(1 - sp(f, at + 4, {damping: 9, stiffness: 180})) * 120}px) rotate(-8deg) scale(${1 - sp(f, sure - 2, {damping: 14, stiffness: 200})})`
                          : `translateX(${(1 - sp(f, at + 4, {damping: 9, stiffness: 180})) * -90}px) rotate(10deg) scale(${1 - sp(f, sure - 2, {damping: 14, stiffness: 200})})`,
                        transformOrigin: isAI ? '50% 100%' : '0% 100%',
                        zIndex: -1,
                        ...stickerCut(4),
                      }}
                    >
                      {isAI ? <Lucky size={130} expr="happy" arms="wave" look={[0.3, 0.6]} jolts={[at + 4]} f={f} seed={2} /> : <div style={{width: 135, height: 172, overflow: 'visible'}}><div style={{transform: 'scale(0.5)', transformOrigin: '0 0'}}><Trader f={f} panic={0.4} /></div></div>}
                    </div>
                  )}
                  <div style={{overflow: 'hidden', padding: '0 6px 14px'}}>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: isAI || isHuman ? 'italic' : 'normal',
                        fontSize: 158,
                        lineHeight: 1.02,
                        color: isAI ? C.blue : isHuman ? C.orange : C.ink,
                        transform: `translateY(${(1 - p) * 190}px)`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tk}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* freeze-frame flash on "changed my mind" */}
      {f >= scratch && f < scratch + 4 && <div style={{position: 'absolute', inset: -200, background: C.white, opacity: 0.55 * (1 - (f - scratch) / 4)}} />}

      {/* ---- the title ---- */}
      <div style={{position: 'absolute', inset: -300, background: C.cream, opacity: 0.35 * ramp(f, title - 4, title + 10), pointerEvents: 'none'}} />
      <Pop at={title} x={960} y={292} from="up" f={f} dist={600}>
        <Card style={{width: 1560, padding: '30px 70px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{fontFamily: SERIF, fontSize: 112, lineHeight: 1.0, textAlign: 'center', color: C.ink, letterSpacing: '-0.005em'}}>
            The Best Crypto Trading AI Might Just Be the <span style={{fontStyle: 'italic', color: C.orange}}>Luckiest</span>
          </div>
        </Card>
      </Pop>
    </AbsoluteFill>
  );
};
