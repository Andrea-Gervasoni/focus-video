import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {easeOut, lerp, ramp, sp, wobble} from '../anim';
import {Lucky, LUCKY_FEET} from '../components/Lucky';
import {Annotate, Card, Display, Label, Pill, Pop, Rise, Script, stickerCut} from '../components/ui';
import {SCENES} from '../script';
import {sim} from '../sim/curves';
import {C, HAIR} from '../theme';
import {sceneWords, useScene} from '../timing';
import {Trader} from './S2Who';

// The opening, as a magazine cover. The question is a typographic collage: the italic
// voice laid over giant condensed capitals (AI, HUMAN?). A golden equity curve (the real
// winner of the simulation) climbs while Lucky rides it: YES. Research arrives, YES.
// turns into YES?, and on "changed my mind" the picture freezes and pulls back: the
// winner was only the luckiest of 1,000 curves of pure noise. Then the title lands.

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

/** fine double rule around the cover, drawn on at the start */
const Masthead: React.FC<{f: number; out: number}> = ({f, out}) => {
  const p = ramp(f, 0, 22, easeOut);
  const o = 1 - ramp(f, out, out + 10);
  const W = 1920 - 80;
  const H = 1080 - 80;
  const per = 2 * (W + H);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={40} y={40} width={W} height={H} fill="none" stroke={C.ink} strokeWidth={2.5} strokeDasharray={per} strokeDashoffset={per * (1 - p)} />
        <rect x={50} y={50} width={W - 20} height={H - 20} fill="none" stroke={C.ink} strokeWidth={1} opacity={0.55} strokeDasharray={per} strokeDashoffset={per * (1 - p)} />
      </svg>
      <div style={{position: 'absolute', left: 84, right: 84, top: 74, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: ramp(f, 8, 22)}}>
        <Label size={19}>TKS Focus · Blockchain</Label>
        <Script size={34} weight={500}>
          a research story
        </Script>
        <Label size={19}>By Andrea Gervasoni</Label>
      </div>
    </div>
  );
};

/** one word of the opening question, placed in the collage */
type QWord = {i: number; kind: 'script' | 'display'; x: number; y: number; size: number; color: string; rot?: number};
const QUESTION: QWord[] = [
  {i: 0, kind: 'script', x: 470, y: 268, size: 132, color: C.ink, rot: -5}, // Can
  {i: 1, kind: 'script', x: 700, y: 268, size: 132, color: C.ink, rot: -5}, // an
  {i: 2, kind: 'display', x: 640, y: 520, size: 470, color: C.blue}, // AI
  {i: 3, kind: 'script', x: 1250, y: 330, size: 132, color: C.ink}, // trade
  {i: 4, kind: 'script', x: 1290, y: 470, size: 132, color: C.ink}, // better
  {i: 5, kind: 'script', x: 1040, y: 600, size: 104, color: C.ink, rot: -3}, // than
  {i: 6, kind: 'script', x: 1250, y: 600, size: 104, color: C.ink, rot: -3}, // a
  {i: 7, kind: 'display', x: 1210, y: 790, size: 290, color: C.orange}, // HUMAN?
];

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
  const toks = scene.voText.split(/\s+/).slice(0, 8);
  const wordAt = (i: number) => Math.round(words[i][0] * 30) - 3;
  const qOut = sp(f, sure - 8, {damping: 16, stiffness: 130});

  // ---- the curve and the view ----
  const draw = ramp(f, sure + 2, yes + 6, Easing.inOut(Easing.cubic));
  const ghosts = ramp(f, riser, scratch, (x) => x * x) * 0.55 + ramp(f, scratch + 6, scratch + 26) * 0.45;
  // push in on the tip while the riser builds, freeze, then pull back on the fan
  const push = ramp(f, riser, scratch, Easing.in(Easing.quad));
  const pull = ramp(f, scratch + 6, scratch + 34, Easing.inOut(Easing.cubic));
  const settle = ramp(f, title - 14, title + 8, Easing.inOut(Easing.cubic));
  const gs = lerp(1 + 0.16 * push, 0.74, pull);
  const gy = 330 * settle;
  const frozen = f >= scratch && f < scratch + 7;
  const pen = penAt(Math.max(0.001, draw));
  const crown = sp(f, luckyIn + 4, {damping: 10, stiffness: 160});
  const shocked = f >= title - 2;

  // ---- YES. ----
  const yesP = sp(f, yes, {damping: 11, stiffness: 260});
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
            <div style={{position: 'absolute', left: X0 - 40, top: ZERO_Y, width: (TIP.x - X0 + 120) * ramp(f, sure - 2, sure + 10, easeOut), height: HAIR, background: C.ink, opacity: 0.4}} />
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
        <Pop at={luckyIn + 10} x={TIP.x + 250} y={TIP.y - 40} rot={3} f={f}>
          <Pill bg={C.ink} color={C.paper} size={44}>
            Best of 1,000
          </Pill>
        </Pop>
        <Pop at={luckyIn + 16} x={X0 + 400} y={ZERO_Y - 300} rot={-3} f={f}>
          <Script size={68} color="#5E584A" weight={500}>
            1,000 strategies of pure noise
          </Script>
        </Pop>
      </div>

      {/* ---- YES. -> YES? -> struck through by the editor's pen ---- */}
      {f >= sure && yesOut < 0.99 && (
        <div style={{position: 'absolute', left: 150, top: 150, transform: `translateY(${yesOut * 900}px) rotate(${yesOut * 10}deg)`, transformOrigin: '30% 70%'}}>
          <Rise at={sure + 2} f={f}>
            <Script size={64}>I was sure the answer was</Script>
          </Rise>
          {f >= yes && (
            <div style={{position: 'relative', marginTop: 4, transform: `scale(${2.2 - 1.2 * yesP})`, transformOrigin: '0% 60%', opacity: Math.min(1, yesP * 3)}}>
              <Display size={400} color={C.blue}>
                YES
                <span style={{display: 'inline-block', color: asks ? C.orange : C.blue, transform: asks ? `scale(${qmark}) rotate(${(1 - qmark) * 30}deg)` : undefined}}>{asks ? '?' : '.'}</span>
              </Display>
              <Annotate at={scratch + 1} dur={7} d="M-20 230 L720 150" color={C.orange} width={22} w={10} h={10} f={f} />
            </div>
          )}
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
            <Card style={{width: 420, padding: '16px 24px 18px', display: 'flex', flexDirection: 'column', gap: 6}} radius={3}>
              <Script size={38}>{r.who}</Script>
              <Label size={15} color="#6E6757">
                {r.where} · {r.year}
              </Label>
            </Card>
          </div>
        );
      })}

      {/* ---- the question, as a collage ---- */}
      {qOut < 0.99 &&
        QUESTION.map((q) => {
          const at = wordAt(q.i);
          if (f < at - 2) return null;
          const p = sp(f, at, q.kind === 'display' ? {damping: 12, stiffness: 240, mass: 0.7} : {damping: 14, stiffness: 180});
          const tk = toks[q.i];
          const isAI = q.i === 2;
          const isHuman = q.i === 7;
          const flyX = (q.x - 960) * qOut * 1.6;
          const flyY = -260 * qOut;
          const enter = q.kind === 'display' ? `scale(${1.9 - 0.9 * p})` : `translateY(${(1 - p) * 60}px)`;
          return (
            <div
              key={q.i}
              style={{
                position: 'absolute',
                left: q.x,
                top: q.y,
                transform: `translate(-50%, -50%) translate(${flyX}px, ${flyY}px) ${enter} rotate(${q.rot ?? 0}deg)`,
                opacity: Math.min(1, p * 2.5) * (1 - qOut),
                zIndex: q.kind === 'script' ? 3 : 2,
              }}
            >
              {/* Lucky and a (cartoon) human peek out from behind their words */}
              {(isAI || isHuman) && f >= at + 5 && (
                <div
                  style={{
                    position: 'absolute',
                    ...(isAI ? {right: '88%', bottom: '8%'} : {left: '97%', bottom: '18%'}),
                    transform: isAI
                      ? `translateX(${(1 - sp(f, at + 5, {damping: 9, stiffness: 180})) * 130}px) rotate(-10deg)`
                      : `translateX(${(1 - sp(f, at + 5, {damping: 9, stiffness: 180})) * -110}px) rotate(10deg)`,
                    transformOrigin: isAI ? '100% 100%' : '0% 100%',
                    zIndex: -1,
                    ...stickerCut(4),
                  }}
                >
                  {isAI ? (
                    <Lucky size={150} expr="happy" arms="wave" look={[0.3, 0.6]} jolts={[at + 5]} f={f} seed={2} />
                  ) : (
                    <div style={{width: 150, height: 190, overflow: 'visible'}}>
                      <div style={{transform: 'scale(0.55)', transformOrigin: '0 0'}}>
                        <Trader f={f} panic={0.4} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {q.kind === 'display' ? (
                <Display size={q.size} color={q.color}>
                  {tk}
                </Display>
              ) : (
                <Script size={q.size} color={q.color}>
                  {tk}
                </Script>
              )}
            </div>
          );
        })}

      {/* freeze-frame flash on "changed my mind" */}
      {f >= scratch && f < scratch + 4 && <div style={{position: 'absolute', inset: -200, background: C.white, opacity: 0.55 * (1 - (f - scratch) / 4)}} />}

      {/* ---- the title, as a collage ---- */}
      <div style={{position: 'absolute', inset: -300, background: C.cream, opacity: 0.45 * ramp(f, title - 4, title + 10), pointerEvents: 'none'}} />
      {f >= title - 10 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Rise at={title - 10} f={f}>
            <Script size={74}>The best crypto trading AI might just be the</Script>
          </Rise>
          <div style={{marginTop: -6, transform: `scale(${2 - sp(f, title, {damping: 12, stiffness: 230, mass: 0.7})})`, opacity: f >= title ? Math.min(1, sp(f, title, {damping: 12, stiffness: 230}) * 3) : 0}}>
            <Display size={290} color={C.orange}>
              Luckiest
            </Display>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
