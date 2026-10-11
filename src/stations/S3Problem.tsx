import React from 'react';
import {AbsoluteFill, Easing, random} from 'remotion';
import {bouncy, clamp01, lerp, ramp, sp} from '../anim';
import {NEST, STATIONS} from '../camera';
import {CrownIcon, Lucky} from '../components/Lucky';
import {Annotate, At, Card, Coin, DefCard, Display, Kinetic, Label, Num, Pill, Pop, Rise, Script, stickerCut} from '../components/ui';
import {C, DISPLAY, HAIR, LIFT, MONO, SANS, SCRIPT} from '../theme';
import {useScene} from '../timing';

// ---------- part A: the version conveyor ----------
const SPACING = 210;
const BELT_Y = 600;
const SCAN_X = NEST.x - STATIONS.problem.x; // 1430
const BEST_V = 731;

const VersionCard: React.FC<{n: number; best?: boolean; showData?: boolean}> = ({n, best, showData}) => {
  const pts = new Array(7).fill(0).map((_, i) => 60 - random(`vc${n}-${i}`) * 50 - (best ? i * 6 : 0));
  return (
    <div style={{width: 150, height: 190, background: best ? C.gold : C.paper, border: `${HAIR}px solid ${C.ink}`, borderRadius: 16, boxShadow: LIFT, boxSizing: 'border-box', padding: '12px 12px', position: 'relative'}}>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 30}}>v{n}</div>
      <svg width={118} height={70} viewBox="0 0 118 70" style={{marginTop: 8}}>
        {showData &&
          [0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={6 + i * 23} y={20 + ((n * 7 + i * 13) % 26)} width={10} height={14 + ((n + i * 5) % 20)} fill={i % 2 ? C.orange : C.blue} opacity={0.35} />
          ))}
        <path d={`M4 ${pts[0]} ${pts.map((p, i) => `L${4 + i * 18} ${p}`).join(' ')}`} stroke={best ? C.ink : C.blue} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {best && (
        <div style={{position: 'absolute', top: -40, left: 34}}>
          <CrownIcon size={80} />
        </div>
      )}
    </div>
  );
};

const VersionBelt: React.FC<{f: number; model: number; versions: number; keep: number; past: number}> = ({f, model, versions, keep, past}) => {
  // speed: 0 -> 7 px/f on "trading model", ramps to 46 on "many versions", stops on "keep the best"
  const speedAt = (t: number) => {
    const idle = 2.2;
    const base = 7 * ramp(t, model, model + 10);
    const fast = 39 * ramp(t, versions - 4, versions + 14, Easing.in(Easing.quad)) * (1 - ramp(t, keep - 16, keep, Easing.out(Easing.quad)));
    const after = 4 * ramp(t, keep + 24, keep + 40);
    return idle * (1 - ramp(t, keep - 8, keep)) + base * (1 - ramp(t, keep - 8, keep)) + fast + after;
  };
  // integrate speed (cheap: per-frame sum)
  let dist = 0;
  for (let t = -40; t < f; t++) dist += speedAt(t);
  const first = Math.floor(dist / SPACING);
  const off = dist % SPACING;
  const v = speedAt(f);
  const streak = Math.min(1, v / 40);
  return (
    <>
      <div style={{position: 'absolute', left: -300, top: BELT_Y + 100, width: 2520, height: 58, background: '#3B4163', border: `${HAIR}px solid ${C.ink}`, borderRadius: 30}} />
      {new Array(36).fill(0).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: -300 + ((i * 70 - dist) % 2520 + 2520) % 2520, top: BELT_Y + 122, width: 12, height: 12, borderRadius: 9, background: '#6F78A8'}} />
      ))}
      {new Array(12).fill(0).map((_, k) => {
        const idx = first + k;
        const n = 1000 - idx; // versions arrive from the right, counting down to the last tried
        if (n < 1) return null;
        const x = 2100 - k * SPACING + off - SPACING;
        if (x < -250 || x > 2200) return null;
        const grabbed = f >= keep && Math.abs(x - SCAN_X) < SPACING / 2;
        if (grabbed) return null;
        return (
          <div key={idx} style={{position: 'absolute', left: x - 75, top: BELT_Y - 90, transform: `skewX(${-streak * 12}deg) scaleX(${1 + streak * 0.25})`, filter: streak > 0.3 ? `blur(${streak * 2.5}px)` : undefined}}>
            <VersionCard n={n} showData={f >= past} />
          </div>
        );
      })}
    </>
  );
};

// ---------- part B: 1,024 coins, nested inside the golden coin ----------
const N = 32;
const CELL = 21;
const GX = 700 - (N * CELL) / 2;
const GY = 520 - (N * CELL) / 2;
const WIN_CELL = 13 * N + 18;
const PEOPLE = (() => {
  const perm = new Array(N * N).fill(0).map((_, i) => i);
  perm.sort((a, b) => random(`perm${a}`) - random(`perm${b}`));
  const k = perm.indexOf(1023);
  [perm[k], perm[WIN_CELL]] = [perm[WIN_CELL], perm[k]];
  return perm.map((p, cell) => {
    let ones = 0;
    while (ones < 10 && (p >> ones) & 1) ones++;
    const row = Math.floor(cell / N);
    const col = cell % N;
    return {cell, row, col, x: GX + col * CELL + CELL / 2, y: GY + row * CELL + CELL / 2, out: ones >= 10 ? 99 : ones + 1, vx: (random(`pv${cell}`) - 0.5) * 6, spin: (random(`ps${cell}`) - 0.5) * 30};
  });
})();
const WIN = PEOPLE[WIN_CELL];

const Nested: React.FC<{f: number; cue: (e: string) => number}> = ({f, cue}) => {
  const pic = cue('picture') - 4;
  const n1024 = cue('n1024');
  const flipping = cue('flipping');
  const oneGets = cue('oneGets');
  const tenHeads = cue('tenHeads');
  const genius = cue('genius');
  const no = cue('no');
  const justLucky = cue('justLucky');
  const span = Math.max(44, oneGets - 4 - flipping);
  const roundAt = (r: number) => flipping + 2 + ((r - 1) * span) / 10;
  let round = 0;
  for (let r = 1; r <= 10; r++) if (f >= roundAt(r) + 6) round = r;
  const standing = 1024 >> round;
  const reveal = ramp(f, pic + 6, pic + 24, Easing.inOut(Easing.cubic));
  const rise = sp(f, tenHeads, {damping: 12, stiffness: 90});
  const spot = ramp(f, tenHeads - 2, tenHeads + 8);
  const winX = lerp(WIN.x, 700, rise);
  const winY = lerp(WIN.y, 470, rise);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        clipPath: `circle(${lerp(NEST.r / NEST.scale, 1250, reveal)}px at 960px 540px)`,
      }}
    >
      <div style={{position: 'absolute', inset: -300, background: C.cream, backgroundImage: `radial-gradient(${C.creamDark} 2.6px, transparent 2.9px)`, backgroundSize: '46px 46px'}} />
      {/* the grid */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {PEOPLE.map((p) => {
          const appear = bouncy(f, pic + 8 + (p.row + p.col) * 0.35);
          if (appear <= 0) return null;
          if (p.cell === WIN_CELL) return null;
          // idle shimmer wave before the first flip
          let sy = f < flipping ? 1 - 0.35 * Math.max(0, Math.sin((f - pic) / 4 - (p.row + p.col) / 6)) ** 6 : 1;
          let tails = false;
          for (let r = 1; r <= Math.min(10, p.out); r++) {
            const t0 = roundAt(r) + ((p.row + p.col) / 62) * 6;
            if (f >= t0 && f < t0 + 5) sy = Math.cos(((f - t0) / 5) * Math.PI * 2);
            if (r === p.out && f >= t0 + 2.5) tails = true;
          }
          let dx = 0;
          let dy = 0;
          let rot = 0;
          let op = 1;
          if (p.out <= 10) {
            const t0 = roundAt(p.out) + ((p.row + p.col) / 62) * 6 + 5;
            const t = f - t0;
            if (t > 0) {
              dx = p.vx * t;
              dy = 0.9 * t * t - 4 * t;
              rot = p.spin * t;
              op = Math.max(0, 1 - t / 28);
            }
          }
          if (op <= 0)
            return (
              <circle key={p.cell} cx={p.x} cy={p.y} r={8.5} fill="none" stroke={C.greyLight} strokeWidth={2.4} />
            );
          return (
            <g key={p.cell} transform={`translate(${p.x + dx} ${p.y + dy}) rotate(${rot}) scale(${appear}, ${appear * Math.max(0.08, Math.abs(sy))})`} opacity={op}>
              <circle r={8.5} fill={tails ? C.orange : C.gold} stroke={C.ink} strokeWidth={2.4} />
            </g>
          );
        })}
      </svg>
      {spot > 0 && (
        <>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${winX}px ${winY}px, rgba(255,216,77,0.18) 70px, rgba(16,20,52,0.74) 210px, rgba(10,12,32,0.86) 900px)`, opacity: spot}} />
          <div
            style={{
              position: 'absolute',
              left: winX - 420,
              top: winY - 420,
              width: 840,
              height: 840,
              opacity: spot * 0.55,
              transform: `rotate(${f * 0.7}deg)`,
              background: 'repeating-conic-gradient(from 0deg, rgba(255,216,77,0.85) 0deg 5deg, transparent 5deg 20deg)',
              WebkitMaskImage: 'radial-gradient(circle, black 12%, transparent 62%)',
              maskImage: 'radial-gradient(circle, black 12%, transparent 62%)',
            }}
          />
        </>
      )}
      {f >= pic + 8 && (
        <At x={winX} y={winY} transform={`scale(${1 + rise * 8})`} style={{filter: rise > 0.1 ? `drop-shadow(0 0 ${14 * rise}px rgba(255,216,77,0.9))` : undefined}}>
          <Coin r={9} face="H" style={{transform: `scaleX(${f >= tenHeads + 10 ? 0.75 + 0.25 * Math.cos((f - tenHeads) / 6) : 1})`}} />
        </At>
      )}
      {spot > 0.5 &&
        new Array(8).fill(0).map((_, k) => {
          const a = (k / 8) * Math.PI * 2 + f / 14;
          const rr = 150 + Math.sin(f / 7 + k) * 12;
          return (
            <At key={k} x={winX + Math.cos(a) * rr} y={winY + Math.sin(a) * rr * 0.8} transform={`scale(${0.7 + 0.3 * Math.sin(f / 4 + k)}) rotate(${f * 4}deg)`}>
              <svg width={34} height={34} viewBox="-10 -10 20 20">
                <path d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10 Z" fill={C.gold} stroke={C.ink} strokeWidth={1.6} />
              </svg>
            </At>
          );
        })}
      <Pop at={tenHeads + 4} x={700} y={300} f={f}>
        <Pill bg={C.gold} size={50}>
          10 heads · 1 in 1,024
        </Pill>
      </Pop>
      {/* side panel */}
      <Pop at={n1024} x={1440} y={200} f={f}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
          <Display size={130} color={C.blue}>
            1,024
          </Display>
          <Script size={70}>people</Script>
        </div>
      </Pop>
      <Pop at={flipping} x={1290} y={420} f={f}>
        <Card style={{textAlign: 'center', padding: '14px 34px'}}>
          <Label size={18} color="#6E6757">
            Flip
          </Label>
          <Num size={84}>{Math.max(1, round)}/10</Num>
        </Card>
      </Pop>
      <Pop at={flipping + 3} x={1600} y={420} f={f}>
        <Card style={{textAlign: 'center', padding: '14px 30px', width: 270}}>
          <Label size={18} color="#6E6757">
            Standing
          </Label>
          <Num size={84} color={standing === 1 ? C.orange : C.blue}>
            {standing.toLocaleString('en-US')}
          </Num>
        </Card>
      </Pop>
      {/* Lucky wonders */}
      <Pop at={pic + 14} x={1730} y={810} from="down" f={f}>
        <div style={stickerCut(5)}>
          <Lucky size={230} expr={f >= justLucky ? 'laugh' : f >= no ? 'shocked' : f >= tenHeads ? 'confident' : 'happy'} look={[-1, -0.4]} jolts={[tenHeads, no]} f={f} seed={7} />
        </div>
      </Pop>
      {/* Genius? No. Just lucky. */}
      <Pop at={genius - 2} x={1250} y={650} f={f}>
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
          <div style={{position: 'relative', opacity: f >= justLucky ? 0.4 : 1}}>
            <Display size={150} color={C.paper}>
              Genius?
            </Display>
            <Annotate at={no} dur={7} d="M-16 92 L470 62" color={C.orange} width={16} w={10} h={10} f={f} />
          </div>
          {f >= justLucky - 2 && (
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: -10}}>
              <Rise at={justLucky - 2} f={f}>
                <Script size={86} color={C.paper}>
                  just
                </Script>
              </Rise>
              <Kinetic text="lucky." at={justLucky + 2} size={150} color={C.orange} f={f} font="display" stagger={1.2} />
            </div>
          )}
        </div>
      </Pop>
    </div>
  );
};

export const S3Problem: React.FC = () => {
  const {f, cue} = useScene('problem');
  const quants = cue('quants');
  const elseAt = cue('else');
  const model = cue('model');
  const versions = cue('versions');
  const past = cue('past');
  const backtest = cue('backtest');
  const keep = cue('keep');
  const luckiest = cue('luckiest');
  const pic = cue('picture');
  const scanning = f >= keep - 14 && f < keep + 6;
  const lift = sp(f, keep + 2, {damping: 14, stiffness: 120});
  const flip = ramp(f, luckiest - 2, luckiest + 10, Easing.inOut(Easing.cubic));
  const tape = ramp(f, quants, quants + 14, Easing.out(Easing.cubic));
  const nx = SCAN_X;
  const ny = NEST.y - STATIONS.problem.y;

  return (
    <AbsoluteFill>
      {/* the warning, as a collage */}
      {f >= quants - 4 && sp(f, model + 2, {damping: 16, stiffness: 140}) < 0.99 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${-sp(f, model + 2, {damping: 16, stiffness: 140}) * 600}px)`}}>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 26}}>
            <Rise at={quants - 4} f={f}>
              <Script size={96}>But</Script>
            </Rise>
            <div style={{transform: `scale(${2 - sp(f, quants, {damping: 12, stiffness: 240, mass: 0.7})})`, opacity: f >= quants ? 1 : 0}}>
              <Display size={170} color={C.orange}>
                Quants warn
              </Display>
            </div>
          </div>
          <div style={{alignSelf: 'flex-end', marginRight: 330, marginTop: -6}}>
            <Rise at={elseAt - 2} f={f}>
              <Script size={70}>about something else.</Script>
            </Rise>
          </div>
        </div>
      )}
      <DefCard at={quants + 10} x={960} y={420} term="Quant" def="trades with math & data" out={model + 4} f={f} />
      <DefCard at={backtest} x={960} y={250} term="Backtest" def="simulating a strategy on past data" f={f} />

      <VersionBelt f={f} model={model} versions={versions} keep={keep} past={past} />
      {/* how many versions went through the test */}
      <Pop at={versions - 2} x={370} y={418} f={f} out={keep + 24}>
        <Card style={{width: 400, padding: '14px 26px 14px', display: 'flex', flexDirection: 'column', gap: 4}}>
          <Label size={18} color="#6E6757">
            Versions tested
          </Label>
          <Num size={74} color={f >= keep ? C.orange : C.blue}>
            {Math.round(1000 * ramp(f, versions - 2, keep - 10, Easing.in(Easing.quad))).toLocaleString('en-US')}
          </Num>
        </Card>
      </Pop>

      {/* scanner gantry */}
      <div style={{position: 'absolute', left: nx - 130, top: BELT_Y - 260, width: 260, height: 380}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 26, height: 380, background: C.greyLight, border: `${HAIR}px solid ${C.ink}`, borderRadius: 10}} />
        <div style={{position: 'absolute', right: 0, top: 0, width: 26, height: 380, background: C.greyLight, border: `${HAIR}px solid ${C.ink}`, borderRadius: 10}} />
        <div style={{position: 'absolute', left: -10, top: -10, width: 280, height: 40, background: C.ink, borderRadius: 12}} />
        <div style={{position: 'absolute', left: 90, top: 2, fontFamily: MONO, fontWeight: 800, fontSize: 20, color: scanning && Math.floor(f / 3) % 2 ? C.orange : C.white}}>SCAN</div>
        {scanning && <div style={{position: 'absolute', left: 30, right: 30, top: 60 + ((f * 23) % 260), height: 8, background: C.orange, boxShadow: `0 0 18px 6px rgba(255,106,43,0.7)`}} />}
      </div>
      {/* claw + the best card, lifted; it flips to show a gold coin */}
      {f >= keep - 6 && (
        <>
          <div style={{position: 'absolute', left: nx - 4, top: BELT_Y - 270, width: 8, height: lerp(250, 50, lift), background: C.ink}} />
          <div style={{position: 'absolute', left: nx - 75, top: lerp(BELT_Y - 90, ny - 95, lift), perspective: 900}}>
            <div style={{transform: `rotateY(${flip * 180}deg) scale(${1 + 0.6 * lift})`, transformStyle: 'preserve-3d', position: 'relative', width: 150, height: 190}}>
              <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>
                <VersionCard n={BEST_V} best />
              </div>
              <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: C.paper, border: `${HAIR}px solid ${C.ink}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Coin r={NEST.r / 1.6} face="H" />
              </div>
            </div>
          </div>
          <Pop at={keep + 6} x={nx + 250} y={ny - 160} rot={6} f={f} out={pic}>
            <Pill bg={C.ink} color={C.white} size={34}>
              keep the best
            </Pill>
          </Pop>
          <Pop at={luckiest + 4} x={nx - 280} y={ny + 160} rot={-5} f={f} out={pic}>
            <Pill bg={C.gold} size={40}>
              …or the luckiest?
            </Pill>
          </Pop>
        </>
      )}
      <Pop at={model - 4} x={1760} y={830} from="right" f={f} out={pic + 10}>
        <div style={stickerCut(5)}>
          <Lucky size={200} expr={f >= luckiest ? 'shocked' : f >= keep ? 'confident' : 'happy'} look={[-1, -0.3]} jolts={[keep, luckiest]} f={f} seed={4} />
        </div>
      </Pop>

      {/* the nested world inside the coin */}
      {f >= pic - 6 && (
        <div
          style={{
            position: 'absolute',
            left: nx - 960 * NEST.scale,
            top: ny - 540 * NEST.scale,
            width: 1920,
            height: 1080,
            transform: `scale(${NEST.scale})`,
            transformOrigin: '0 0',
            opacity: clamp01((f - (pic - 6)) / 6),
          }}
        >
          <Nested f={f} cue={cue} />
        </div>
      )}
    </AbsoluteFill>
  );
};
