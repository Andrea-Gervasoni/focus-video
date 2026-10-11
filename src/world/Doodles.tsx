import React from 'react';
import {random} from 'remotion';
import {Cam, STATIONS, viewRect} from '../camera';
import {C, HEAD, MONO} from '../theme';

// Hand-drawn notebook clutter between the stations: the path of the story,
// sticky notes, coffee rings, scribbled formulas. Static, world-space.

const S = STATIONS;
const PATHS = [
  `M${S.hook.x + 1900} ${S.hook.y + 560} C ${S.hook.x + 2200} ${S.hook.y + 380}, ${S.who.x - 300} ${S.who.y + 700}, ${S.who.x + 40} ${S.who.y + 540}`,
  `M${S.who.x + 960} ${S.who.y + 1070} C ${S.who.x + 1100} ${S.who.y + 1250}, ${S.whoB.x + 800} ${S.whoB.y - 200}, ${S.whoB.x + 960} ${S.whoB.y + 10}`,
  `M${S.whoB.x + 1900} ${S.whoB.y + 300} C ${S.whoB.x + 2300} ${S.whoB.y}, ${S.problem.x - 300} ${S.problem.y + 1000}, ${S.problem.x + 60} ${S.problem.y + 700}`,
  `M${S.problem.x + 960} ${S.problem.y + 1070} C ${S.problem.x + 820} ${S.problem.y + 1260}, ${S.sim.x + 1100} ${S.sim.y - 220}, ${S.sim.x + 960} ${S.sim.y + 10}`,
  `M${S.sim.x + 960} ${S.sim.y + 1070} C ${S.sim.x + 1100} ${S.sim.y + 1260}, ${S.crypto.x + 800} ${S.crypto.y - 220}, ${S.crypto.x + 960} ${S.crypto.y + 10}`,
  `M${S.crypto.x + 20} ${S.crypto.y + 540} C ${S.crypto.x - 300} ${S.crypto.y + 700}, ${S.cryptoB.x + 2200} ${S.cryptoB.y + 380}, ${S.cryptoB.x + 1900} ${S.cryptoB.y + 540}`,
  `M${S.cryptoB.x + 20} ${S.cryptoB.y + 540} C ${S.cryptoB.x - 300} ${S.cryptoB.y + 380}, ${S.fix.x + 2200} ${S.fix.y + 700}, ${S.fix.x + 1900} ${S.fix.y + 540}`,
  `M${S.fix.x + 960} ${S.fix.y + 10} C ${S.fix.x + 820} ${S.fix.y - 200}, ${S.close.x + 1100} ${S.close.y + 1260}, ${S.close.x + 960} ${S.close.y + 1070}`,
];

type Item = {x: number; y: number; kind: 'note' | 'ring' | 'formula' | 'coin' | 'candles' | 'clip'; text?: string; rot: number};
const GAP_SPOTS: [number, number][] = [
  [2300, 300], [2300, 900], [2250, 1800], [2280, 2700], [4980, 400], [5000, 1100], [5000, 2000], [4950, 2700],
  [1000, 1250], [3600, 1250], [6300, 1270], [900, 2780], [3500, 2790], [6400, 2780], [2300, 3700], [4950, 3650],
  [-300, 1900], [7500, 1900], [-300, 3500], [7600, 600], [3600, -250], [6300, -260], [1000, 4300], [3600, 4300], [6400, 4300],
];
const NOTES = ['luck vs skill?', 'how many tries?', 'past vs future', 'count the tries', 'fees!', 'out of sample', 'survivors only', 'keep a log'];
const ITEMS: Item[] = GAP_SPOTS.map(([x, y], i) => {
  const kinds: Item['kind'][] = ['note', 'ring', 'formula', 'coin', 'candles', 'clip'];
  const kind = kinds[i % kinds.length];
  return {x, y, kind, text: kind === 'note' ? NOTES[Math.floor(i / 6) % NOTES.length] : undefined, rot: (random(`dr${i}`) - 0.5) * 24};
});

const Thing: React.FC<{it: Item}> = ({it}) => {
  switch (it.kind) {
    case 'note':
      return (
        <div style={{width: 230, height: 200, background: '#FFE98A', border: `4px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}`, padding: 22, boxSizing: 'border-box', fontFamily: HEAD, fontWeight: 800, fontSize: 36, lineHeight: 1.05}}>
          {it.text}
        </div>
      );
    case 'ring':
      return <div style={{width: 210, height: 210, borderRadius: '50%', border: '14px solid rgba(140,96,40,0.22)', boxShadow: 'inset 0 0 0 4px rgba(140,96,40,0.12)'}} />;
    case 'formula':
      return <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 46, color: '#8E8676', whiteSpace: 'nowrap'}}>Sharpe = return ÷ risk</div>;
    case 'coin':
      return (
        <svg width={120} height={120} viewBox="-50 -50 100 100">
          <circle r={44} fill={C.gold} stroke={C.ink} strokeWidth={7} />
          <circle r={30} fill="none" stroke={C.goldDark} strokeWidth={5} strokeDasharray="5 6" />
        </svg>
      );
    case 'candles':
      return (
        <svg width={260} height={160} viewBox="0 0 260 160">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} stroke="#8E8676" strokeWidth={4}>
              <line x1={20 + i * 42} x2={20 + i * 42} y1={30 + ((i * 37) % 40)} y2={130 - ((i * 23) % 30)} />
              <rect x={10 + i * 42} y={50 + ((i * 29) % 40)} width={20} height={40} fill={i % 2 ? '#E9DDB4' : 'none'} />
            </g>
          ))}
        </svg>
      );
    case 'clip':
      return (
        <svg width={60} height={150} viewBox="0 0 60 150">
          <path d="M20 140 L20 30 Q20 10 32 10 Q44 10 44 30 L44 120 Q44 132 34 132 Q26 132 26 120 L26 40" stroke="#7D7D7D" strokeWidth={7} fill="none" strokeLinecap="round" />
        </svg>
      );
  }
};

export const Doodles: React.FC<{cam: Cam}> = ({cam}) => {
  const v = viewRect(cam, 400);
  return (
    <>
      <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {PATHS.map((d, i) => (
          <path key={i} d={d} stroke="#9C9480" strokeWidth={9} fill="none" strokeDasharray="4 22" strokeLinecap="round" />
        ))}
      </svg>
      {ITEMS.map((it, i) =>
        it.x > v.x0 - 300 && it.x < v.x1 + 300 && it.y > v.y0 - 300 && it.y < v.y1 + 300 ? (
          <div key={i} style={{position: 'absolute', left: it.x, top: it.y, transform: `translate(-50%, -50%) rotate(${it.rot}deg)`}}>
            <Thing it={it} />
          </div>
        ) : null,
      )}
    </>
  );
};
