import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, lerp, ramp, sp} from '../anim';
import {FLIP_COIN} from '../camera';
import {Lucky} from '../components/Lucky';
import {Annotate, Card, Coin3D, Head, Pill, Pop, stickerCut} from '../components/ui';
import {C, HEAD, SERIF} from '../theme';
import {useScene} from '../timing';

// Names only, no logos: four who tried, as polaroids on a detective board.
const POLAROIDS = [
  {name: 'Renaissance', x: 330, y: 300, rot: -6, bg: C.blue, icon: 'bars', cue: 'renaissance'},
  {name: 'Numerai', x: 700, y: 250, rot: 4, bg: C.orange, icon: 'net', cue: 'numerai'},
  {name: 'G-Research', x: 1060, y: 330, rot: -3, bg: C.gold, icon: 'cup', cue: ''},
  {name: 'AIEQ', x: 560, y: 600, rot: 5, bg: C.blueSoft, icon: 'chip', cue: ''},
];

const Icon: React.FC<{kind: string}> = ({kind}) => (
  <svg width={140} height={110} viewBox="0 0 140 110">
    <g stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill={C.paper}>
      {kind === 'bars' && [0, 1, 2, 3].map((i) => <rect key={i} x={18 + i * 28} y={86 - (i + 1) * 17} width={20} height={(i + 1) * 17} />)}
      {kind === 'net' && (
        <>
          <path d="M30 30 L70 55 L110 25 M70 55 L40 90 M70 55 L105 88" fill="none" />
          {[[30, 30], [110, 25], [70, 55], [40, 90], [105, 88]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={11} />
          ))}
        </>
      )}
      {kind === 'cup' && (
        <>
          <path d="M42 18 L98 18 L94 52 Q70 74 46 52 Z" />
          <path d="M70 66 L70 84 M50 92 L90 92" fill="none" />
        </>
      )}
      {kind === 'chip' && (
        <>
          <rect x={40} y={25} width={60} height={60} rx={8} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${52 + i * 18} 25 L${52 + i * 18} 12 M${52 + i * 18} 85 L${52 + i * 18} 98`} fill="none" />
          ))}
        </>
      )}
    </g>
  </svg>
);

export const S7Close: React.FC = () => {
  const {f, cue} = useScene('close');
  const board = cue('board');
  const question = cue('question');
  const shrug = cue('shrug');
  const flip = cue('flip');
  const student = cue('student');
  const compete = cue('compete');
  const shift = sp(f, question, {damping: 15, stiffness: 110});
  const lower = sp(f, flip - 2, {damping: 14, stiffness: 140});
  // the coin: tossed up, then frozen mid-air, slowly turning
  const tt = f - flip;
  const T_APEX = 16;
  const up = tt < 0 ? 0 : Math.min(tt, T_APEX);
  const rise = up / T_APEX;
  const cy = lerp(FLIP_COIN.hand.y, FLIP_COIN.apex.y, 1 - (1 - rise) ** 2);
  const cx = lerp(FLIP_COIN.hand.x, FLIP_COIN.apex.x, rise);
  const spin = tt < 0 ? 0 : tt < T_APEX ? tt * 40 : T_APEX * 40 + (tt - T_APEX) * 1.6;
  const frozen = tt >= T_APEX;
  // rack focus: once the coin hangs in the air, the board and the cards go soft
  const dof = ramp(f, flip + 8, flip + 30);
  const soft: React.CSSProperties = dof > 0.01 ? {filter: `blur(${dof * 7}px)`, opacity: 1 - dof * 0.35} : {};

  return (
    <AbsoluteFill>
      {/* cork board */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateX(${-shift * 60}px) scale(${1 - shift * 0.22})`, transformOrigin: '0% 50%', ...soft}}>
        <Pop at={board - 6} x={760} y={470} f={f}>
          <div
            style={{
              width: 1200,
              height: 660,
              background: '#D6B07C',
              backgroundImage: 'radial-gradient(#B98E57 2px, transparent 2.5px)',
              backgroundSize: '22px 22px',
              border: `8px solid ${C.ink}`,
              borderRadius: 26,
              boxShadow: `8px 8px 0 ${C.ink}`,
              boxSizing: 'border-box',
            }}
          />
        </Pop>
        <Annotate
          at={board + 12}
          dur={18}
          d="M330 180 L700 130 L1060 210 L560 480 L330 180"
          color="#D22B2B"
          width={6}
          w={10}
          h={10}
          f={f}
        />
        {POLAROIDS.map((p, i) => {
          const at = board + i * 3;
          const hl = p.cue ? sp(f, cue(p.cue), {damping: 8, stiffness: 200}) * (1 - ramp(f, cue(p.cue) + 20, cue(p.cue) + 40)) : 0;
          return (
            <Pop key={p.name} at={at} x={p.x} y={p.y + 70} from={i % 2 ? 'right' : 'left'} rot={p.rot} f={f} dist={900}>
              <div style={{transform: `scale(${1 + hl * 0.12})`, position: 'relative'}}>
                <div style={{width: 250, padding: '16px 16px 18px', background: C.white, border: `5px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, boxSizing: 'border-box'}}>
                  <div style={{height: 150, background: p.bg, border: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Icon kind={p.icon} />
                  </div>
                  <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 32, textAlign: 'center', marginTop: 10, whiteSpace: 'nowrap'}}>{p.name}</div>
                </div>
                <div style={{position: 'absolute', left: 109, top: -14, width: 32, height: 32, borderRadius: 99, background: '#D22B2B', border: `5px solid ${C.ink}`}} />
                {hl > 0.05 && <div style={{position: 'absolute', inset: -18, border: `8px solid ${C.orange}`, borderRadius: 30, opacity: clamp01(hl * 1.5)}} />}
              </div>
            </Pop>
          );
        })}
        <Pop at={board + 16} x={1130} y={640} rot={-5} f={f}>
          <div style={{background: C.gold, border: `5px solid ${C.ink}`, padding: '10px 22px', fontFamily: HEAD, fontWeight: 800, fontSize: 34, boxShadow: `5px 5px 0 ${C.ink}`}}>who actually tried</div>
        </Pop>
      </div>

      {/* a laptop vs the big funds */}
      <Pop at={student + 4} x={1350} y={640} rot={-8} f={f} out={flip}>
        <svg width={170} height={120} viewBox="0 0 170 120">
          <rect x={25} y={8} width={120} height={80} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={7} />
          <rect x={38} y={20} width={94} height={56} rx={4} fill={C.blueSoft} />
          <path d="M44 62 L64 46 L80 54 L104 32 L124 40" stroke={C.blue} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 96 L164 96 L150 112 L20 112 Z" fill={C.greyLight} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
        </svg>
      </Pop>
      <Pop at={compete + 2} x={1110} y={680} from="down" f={f} out={flip}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 10}}>
          {[220, 290, 190].map((h, i) => (
            <div key={i} style={{width: 92, height: h, background: i === 1 ? C.ink : '#3B4163', border: `6px solid ${C.ink}`, borderRadius: '10px 10px 0 0', boxShadow: `6px 6px 0 ${C.ink}`, position: 'relative'}}>
              {new Array(Math.floor(h / 46)).fill(0).map((_, r) => (
                <div key={r} style={{position: 'absolute', left: 14, right: 14, top: 18 + r * 40, height: 16, background: (r + i) % 3 ? C.gold : '#6F78A8', borderRadius: 3}} />
              ))}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: '50%', top: -60, transform: 'translateX(-50%) rotate(-4deg)', whiteSpace: 'nowrap'}}>
          <Pill bg={C.orange} color={C.white} size={34}>
            big funds
          </Pill>
        </div>
      </Pop>
      {/* the open question */}
      <Pop at={question} x={1440} y={lerp(260, 420, lower)} f={f} rot={-2} out={flip + 10}>
        <Card style={{width: 700, padding: '24px 34px', opacity: 1 - lower * 0.85}}>
          <div style={{fontFamily: SERIF, fontSize: 70, lineHeight: 1.02, color: C.ink}}>
            Can a student with a laptop compete with the <span style={{fontStyle: 'italic', color: C.orange}}>big funds?</span>
          </div>
        </Card>
      </Pop>
      <Pop at={board + 4} x={1600} y={720} from="right" f={f}>
        <div style={{...stickerCut(5), ...(dof > 0.01 ? {filter: `${stickerCut(5).filter} blur(${dof * 5}px)`} : {})}}>
          <Lucky
            size={290}
            expr={f >= flip ? 'happy' : f >= shrug ? 'shrug' : 'detective'}
            hat={f < question}
            arms={f >= flip ? (tt < 8 ? 'flip' : 'down') : f >= shrug ? 'shrug' : f >= question ? 'card' : 'point'}
            look={f >= flip ? [-0.6, -1] : [-1, -0.2]}
            jolts={[board + 4, question, shrug, flip]}
            f={f}
            seed={8}
          />
        </div>
      </Pop>
      {f >= flip && (
        <div style={{position: 'absolute', left: cx - FLIP_COIN.r, top: cy - FLIP_COIN.r}}>
          {frozen && (
            <div style={{position: 'absolute', left: -30, top: -30, width: FLIP_COIN.r * 2 + 60, height: FLIP_COIN.r * 2 + 60, borderRadius: '50%', boxShadow: `0 0 50px 16px rgba(255,216,77,0.55)`}} />
          )}
          <Coin3D r={FLIP_COIN.r} rx={frozen ? 18 : spin} ry={frozen ? spin : 20} />
        </div>
      )}
      {frozen && (
        <Pop at={flip + T_APEX + 4} x={FLIP_COIN.apex.x} y={FLIP_COIN.apex.y + 150} f={f}>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: C.ink, background: C.paper, border: `4px solid ${C.ink}`, borderRadius: 999, padding: '4px 22px'}}>…?</div>
        </Pop>
      )}
    </AbsoluteFill>
  );
};
