import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ramp, sp} from '../anim';
import {HERO_COIN} from '../camera';
import {Lucky} from '../components/Lucky';
import {Annotate, Card, Coin3D, Head, Pill, Pop, stickerCut} from '../components/ui';
import {C} from '../theme';
import {useScene} from '../timing';

// The hook's world: conveyor belts with hundreds of coins. The hero coin (the
// one from the intro) sits in the middle row.

const ROW_GAP = 116;
const COL_GAP = 116;
const X0 = -2200;
const X1 = 2600;
const ROWS = new Array(19).fill(0).map((_, i) => HERO_COIN.y + (i - 12) * ROW_GAP);
const COLS = Math.ceil((X1 - X0) / COL_GAP);

const Belts: React.FC<{run: number; f: number}> = ({run, f}) => (
  <svg
    width={X1 - X0}
    height={ROWS.length * ROW_GAP + 200}
    viewBox={`${X0} ${ROWS[0] - 100} ${X1 - X0} ${ROWS.length * ROW_GAP + 200}`}
    style={{position: 'absolute', left: X0, top: ROWS[0] - 100, overflow: 'visible'}}
  >
    <defs>
      <symbol id="beltcoin" viewBox="-50 -50 100 100" width={92} height={92}>
        <circle r={46} fill={C.goldDark} stroke={C.ink} strokeWidth={7} />
        <circle r={39} cy={-3} fill={C.gold} />
        <circle r={28} cy={-3} fill="none" stroke={C.goldDark} strokeWidth={4} strokeDasharray="5 6" />
        <path d="M-26 -22 Q-18 -32 -4 -34" stroke={C.white} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
      </symbol>
    </defs>
    {ROWS.map((y, r) => {
      const dir = r % 2 ? -1 : 1;
      const off = (((run * (2.2 + (r % 3) * 0.7) * dir) % COL_GAP) + COL_GAP) % COL_GAP;
      return (
        <g key={r}>
          <rect x={X0} y={y + 18} width={X1 - X0} height={46} rx={23} fill="#3B4163" stroke={C.ink} strokeWidth={5} />
          {new Array(Math.ceil((X1 - X0) / 70)).fill(0).map((_, i) => (
            <circle key={i} cx={X0 + ((i * 70 + run * 2.2 * dir) % (X1 - X0) + (X1 - X0)) % (X1 - X0)} cy={y + 41} r={5} fill="#6F78A8" />
          ))}
          {new Array(COLS).fill(0).map((_, c) => {
            const x = X0 + c * COL_GAP + off;
            if (r === 12 && Math.abs(x - HERO_COIN.x) < COL_GAP * 0.8) return null;
            const bob = Math.sin((f + c * 7 + r * 13) / 6) * 1.5;
            return <use key={c} href="#beltcoin" x={x - 46} y={y - 46 + bob} />;
          })}
        </g>
      );
    })}
  </svg>
);

export const S1Hook: React.FC = () => {
  const {f, cue} = useScene('hook');
  const scratch = cue('scratch');
  const luckyIn = cue('luckyIn');
  const title = cue('title');
  const run = Math.max(0, f - scratch - 10);
  const runEase = run * ramp(f, scratch + 10, scratch + 40);
  const glow = f > scratch ? 0.5 + 0.5 * Math.sin(f / 5) : 0;
  const shocked = f >= title - 2;

  return (
    <AbsoluteFill style={{overflow: 'visible'}}>
      <Belts run={runEase} f={f} />
      <div style={{position: 'absolute', left: -2400, top: -1600, width: 7200, height: 4400, background: C.cream, opacity: 0.42 * ramp(f, title - 4, title + 10), pointerEvents: 'none'}} />
      {/* hero coin: the same coin as the intro, face up */}
      <div style={{position: 'absolute', left: HERO_COIN.x - HERO_COIN.r, top: HERO_COIN.y - HERO_COIN.r}}>
        {f > scratch && (
          <div
            style={{
              position: 'absolute',
              left: -26,
              top: -26,
              width: HERO_COIN.r * 2 + 52,
              height: HERO_COIN.r * 2 + 52,
              borderRadius: '50%',
              boxShadow: `0 0 ${30 + glow * 30}px ${8 + glow * 10}px rgba(255,216,77,${0.55 + glow * 0.3})`,
            }}
          />
        )}
        <Coin3D r={HERO_COIN.r} rx={0} ry={0} />
      </div>
      <Annotate
        at={luckyIn + 4}
        d={`M${HERO_COIN.x - 95} ${HERO_COIN.y - 10} C ${HERO_COIN.x - 100} ${HERO_COIN.y - 110}, ${HERO_COIN.x + 110} ${HERO_COIN.y - 110}, ${HERO_COIN.x + 98} ${HERO_COIN.y} C ${HERO_COIN.x + 90} ${HERO_COIN.y + 100}, ${HERO_COIN.x - 90} ${HERO_COIN.y + 110}, ${HERO_COIN.x - 100} ${HERO_COIN.y - 20}`}
        color={C.orange}
        width={10}
        w={10}
        h={10}
        f={f}
      />

      {/* Lucky on a little paper stage */}
      <Pop at={luckyIn} x={1420} y={520} from="down" f={f} dist={700}>
        <div style={{position: 'relative', width: 420, height: 380}}>
          <div style={{position: 'absolute', left: 30, top: 300, width: 360, height: 60, background: C.paper, border: `5px solid ${C.ink}`, borderRadius: 18, boxShadow: `6px 6px 0 ${C.ink}`}} />
          <div style={{position: 'absolute', left: 60, top: 0, ...stickerCut(6)}}>
            <Lucky
              size={330}
              expr={shocked ? 'shocked' : 'confident'}
              arms={shocked ? 'up' : 'point'}
              crown={shocked ? 0 : sp(f, luckyIn + 6)}
              look={shocked ? [-0.4, -0.6] : [-1, 0.4]}
              jolts={[luckyIn, title - 2]}
              f={f}
            />
          </div>
        </div>
      </Pop>
      <Annotate at={luckyIn + 10} d="M1230 470 Q1140 430 1080 520" color={C.ink} width={8} head w={10} h={10} f={f} />

      {/* the article title lands */}
      <Pop at={title} x={960} y={150} from="up" f={f} dist={700}>
        <Card style={{padding: '30px 60px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 1600}}>
          <Pill bg={C.blue} color={C.white} size={32}>
            A RESEARCH STORY · TKS FOCUS
          </Pill>
          <Head size={92} style={{textAlign: 'center', whiteSpace: 'normal'}}>
            The Best Crypto Trading AI Might Just Be the <span style={{color: C.orange}}>Luckiest</span>
          </Head>
        </Card>
      </Pop>
    </AbsoluteFill>
  );
};
