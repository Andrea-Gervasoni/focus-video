import React from 'react';
import {STATIONS} from '../camera';

// The path of the story between the stations: a dotted line on the paper,
// visible during the whip pans and on the map. Static, world-space.

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

export const Doodles: React.FC = () => (
  <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {PATHS.map((d, i) => (
      <path key={i} d={d} stroke="#B5AC95" strokeWidth={9} fill="none" strokeDasharray="4 22" strokeLinecap="round" />
    ))}
  </svg>
);
