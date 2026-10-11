import {noise2D} from '@remotion/noise';
import {interpolate as flubber} from 'flubber';
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';

// Lucky: a layered SVG rig. Body, blinking eyes, spring antenna with
// follow-through, mouth shapes, arms, accessories, and a flubber "deflate".

export type Expr = 'happy' | 'confident' | 'proud' | 'shocked' | 'nervous' | 'deflated' | 'detective' | 'squint' | 'calm' | 'laugh' | 'shrug';
export type Arms = 'down' | 'up' | 'wave' | 'shrug' | 'hold' | 'point' | 'flip' | 'card';

type Props = {
  size?: number;
  expr?: Expr;
  arms?: Arms;
  /** 0..1 crown sitting on the head */
  crown?: number;
  look?: [number, number];
  hat?: boolean;
  magnifier?: boolean;
  sunglasses?: number;
  /** 0..1: body melts into a puddle */
  deflate?: number;
  /** frames (same clock as `f`) where Lucky moved: the antenna follows through */
  jolts?: number[];
  f?: number;
  tint?: string;
  seed?: number;
  style?: React.CSSProperties;
};

const VB = {x: -50, y: -70, w: 300, h: 300};

const BODY = 'M100 42 C143 42 178 77 178 120 C178 163 143 198 100 198 C57 198 22 163 22 120 C22 77 57 42 100 42 Z';
const PUDDLE = 'M100 168 C150 168 196 178 196 192 C196 204 150 206 100 206 C50 206 4 204 4 192 C4 178 50 168 100 168 Z';
const melt = flubber(BODY, PUDDLE, {maxSegmentLength: 6});

const Arm: React.FC<{d: string; hand: [number, number]; tint: string}> = ({d, hand, tint}) => (
  <g>
    <path d={d} stroke={C.ink} strokeWidth={15} fill="none" strokeLinecap="round" />
    <path d={d} stroke={tint} strokeWidth={9} fill="none" strokeLinecap="round" />
    <circle cx={hand[0]} cy={hand[1]} r={11} fill={C.white} stroke={C.ink} strokeWidth={3} />
  </g>
);

const ARMS: Record<Arms, {l: [string, [number, number]]; r: [string, [number, number]]}> = {
  down: {l: ['M30 128 Q10 150 6 174', [6, 176]], r: ['M170 128 Q190 150 194 174', [194, 176]]},
  up: {l: ['M30 120 Q2 100 -4 66', [-4, 62]], r: ['M170 120 Q198 100 204 66', [204, 62]]},
  wave: {l: ['M30 128 Q10 150 6 174', [6, 176]], r: ['M170 120 Q198 100 204 66', [204, 62]]},
  shrug: {l: ['M30 128 Q-6 142 -12 104', [-12, 100]], r: ['M170 128 Q206 142 212 104', [212, 100]]},
  hold: {l: ['M30 128 Q10 150 6 174', [6, 176]], r: ['M170 132 Q198 154 184 172', [182, 172]]},
  point: {l: ['M30 128 Q10 150 6 174', [6, 176]], r: ['M170 118 Q200 108 226 96', [228, 95]]},
  flip: {l: ['M30 128 Q10 150 6 174', [6, 176]], r: ['M170 112 Q196 80 196 40', [196, 36]]},
  card: {l: ['M30 120 Q0 96 -8 58', [-8, 54]], r: ['M170 120 Q200 96 208 58', [208, 54]]},
};

const Eye: React.FC<{cx: number; cy: number; look: [number, number]; r?: number; pupil?: number; blink: number; lid?: number}> = ({
  cx,
  cy,
  look,
  r = 16,
  pupil = 8.5,
  blink,
  lid = 0,
}) => (
  <g transform={`translate(${cx} ${cy}) scale(1 ${blink}) translate(${-cx} ${-cy})`}>
    <circle cx={cx} cy={cy} r={r} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={cx + look[0] * 5} cy={cy + look[1] * 5} r={pupil} fill={C.ink} />
    <circle cx={cx + look[0] * 5 - 3} cy={cy + look[1] * 5 - 3} r={2.8} fill={C.white} />
    {lid > 0 && (
      <path
        d={`M${cx - r - 2} ${cy - r - 2} L${cx + r + 2} ${cy - r - 2} L${cx + r + 2} ${cy - r + lid * r * 1.2} L${cx - r - 2} ${cy - r + lid * r * 1.2} Z`}
        fill={C.paper}
        stroke={C.ink}
        strokeWidth={4}
      />
    )}
  </g>
);

const CrownShape: React.FC = () => (
  <g>
    <path d="M64 46 L58 6 L82 26 L100 -8 L118 26 L142 6 L136 46 Z" fill={C.gold} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M62 40 L138 40" stroke={C.goldDark} strokeWidth={3} />
    <circle cx={100} cy={-8} r={4.5} fill={C.blue} stroke={C.ink} strokeWidth={2} />
  </g>
);

export const CrownIcon: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 80, style}) => (
  <svg viewBox="50 -14 100 66" width={size} height={(size * 66) / 100} style={{overflow: 'visible', display: 'block', ...style}}>
    <CrownShape />
  </svg>
);

export const Lucky: React.FC<Props> = ({
  size = 260,
  expr = 'happy',
  arms = 'down',
  crown = 0,
  look = [0, 0],
  hat = false,
  magnifier = false,
  sunglasses = 0,
  deflate = 0,
  jolts = [],
  f: fo,
  tint = C.blue,
  seed = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = fo ?? frame;
  const t = f + seed * 13;
  const bob = Math.sin(t / 9) * 3 * (1 - deflate);
  const breathe = 1 + Math.sin(t / 9 + 1) * 0.012;
  const blink = t % 95 < 4 ? 0.12 : 1;
  // antenna: idle noise + damped spring after every jolt (follow-through)
  let ant = noise2D('ant', t * 0.03, seed) * 8;
  for (const j of jolts) {
    const d = f - j;
    if (d > 0 && d < 60) ant += 34 * Math.exp(-d / 9) * Math.sin(d * 0.55);
  }
  ant = ant * (1 - deflate) + deflate * 70;

  const mouth: Record<Expr, React.ReactNode> = {
    happy: <path d="M88 134 Q100 147 112 134" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    confident: <path d="M86 136 Q102 146 116 130" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    laugh: (
      <g>
        <path d="M84 130 Q100 156 116 130 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={100} cy={143} rx={7} ry={4} fill={C.orange} />
      </g>
    ),
    proud: (
      <g>
        <path d="M84 130 Q100 154 116 130 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={100} cy={142} rx={7} ry={4} fill={C.orange} />
      </g>
    ),
    nervous: <path d="M82 140 q4.5 -6 9 0 t9 0 t9 0 t9 0" stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
    shocked: <ellipse cx={100} cy={141} rx={9} ry={11} fill={C.ink} />,
    deflated: <path d="M86 144 Q100 132 114 144" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    calm: <path d="M91 136 Q100 143 109 136" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    detective: <path d="M88 139 Q103 145 114 133" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    squint: <path d="M88 140 L112 138" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />,
    shrug: <path d="M86 140 Q93 134 100 140 Q107 146 114 140" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
  };

  const eyes = (() => {
    switch (expr) {
      case 'proud':
      case 'laugh':
        return (
          <g stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round">
            <path d="M62 116 Q76 98 90 116" />
            <path d="M110 116 Q124 98 138 116" />
          </g>
        );
      case 'calm':
        return (
          <g stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round">
            <path d="M63 110 Q76 121 89 110" />
            <path d="M111 110 Q124 121 137 110" />
          </g>
        );
      case 'deflated':
        return (
          <g stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round">
            <path d="M62 108 Q76 120 90 108" />
            <path d="M110 108 Q124 120 138 108" />
            <path d="M60 96 L88 102" strokeWidth={4.5} />
            <path d="M140 96 L112 102" strokeWidth={4.5} />
          </g>
        );
      case 'confident':
        return (
          <g>
            <Eye cx={76} cy={113} look={look} blink={blink} lid={0.45} />
            <Eye cx={124} cy={113} look={look} blink={blink} lid={0.45} />
            <path d="M110 88 Q124 80 140 88" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        );
      case 'squint':
        return (
          <g>
            <Eye cx={76} cy={113} look={look} blink={1} lid={0.62} r={15} />
            <Eye cx={124} cy={113} look={look} blink={1} lid={0.62} r={15} />
            <path d="M60 92 L90 98" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <path d="M140 92 L110 98" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          </g>
        );
      case 'detective':
        return (
          <g>
            <path d="M62 113 L90 109" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
            <path d="M60 98 L90 102" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <Eye cx={124} cy={112} look={look} r={18} blink={blink} />
          </g>
        );
      case 'shocked':
        return (
          <g>
            <Eye cx={76} cy={110} look={look} r={20} pupil={5.5} blink={1} />
            <Eye cx={124} cy={110} look={look} r={20} pupil={5.5} blink={1} />
          </g>
        );
      case 'nervous':
        return (
          <g>
            <Eye cx={76} cy={112} look={look} pupil={6.5} blink={blink} />
            <Eye cx={124} cy={112} look={look} pupil={6.5} blink={blink} />
            <path d="M62 98 L86 90" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
            <path d="M138 98 L114 90" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
          </g>
        );
      default:
        return (
          <g>
            <Eye cx={76} cy={112} look={look} blink={blink} />
            <Eye cx={124} cy={112} look={look} blink={blink} />
          </g>
        );
    }
  })();

  const armSet = ARMS[arms];
  const waveRot = arms === 'wave' ? Math.sin(t / 3.2) * 16 : 0;
  const shrugLift = arms === 'shrug' ? Math.abs(Math.sin(t / 8)) * -6 : 0;
  const d = deflate;
  const bodyPath = d > 0.001 ? melt(Math.min(1, d)) : BODY;
  const faceTf = `translate(100 196) scale(${(2 - breathe) * (1 + 0.35 * d)} ${breathe * (1 - 0.62 * d)}) translate(-100 -196)`;

  return (
    <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} height={size} width={(size * VB.w) / VB.h} style={{overflow: 'visible', display: 'block', ...style}}>
      <g transform={`translate(0 ${bob})`}>
        <g fill={C.ink} opacity={1 - d}>
          <ellipse cx={74} cy={198} rx={20} ry={11} />
          <ellipse cx={126} cy={198} rx={20} ry={11} />
        </g>
        <g transform={`translate(0 ${d * 120}) rotate(${ant} 138 52)`}>
          <path d="M138 52 L152 14" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <circle cx={154} cy={10} r={10} fill={C.orange} stroke={C.ink} strokeWidth={3} />
        </g>
        <g opacity={1 - d} transform={`translate(0 ${shrugLift + d * 40})`}>
          <Arm d={armSet.l[0]} hand={armSet.l[1]} tint={tint} />
          <g transform={`rotate(${waveRot} 170 124)`}>
            <Arm d={armSet.r[0]} hand={armSet.r[1]} tint={tint} />
          </g>
        </g>
        <path d={bodyPath} fill={tint} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
        <g transform={faceTf}>
          <path d="M48 86 Q58 60 84 50" stroke={C.white} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.45 * (1 - d)} />
          <rect x={44} y={76} width={112} height={78} rx={30} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <g fill={C.orange} opacity={0.5}>
            <ellipse cx={58} cy={136} rx={8} ry={4.5} />
            <ellipse cx={142} cy={136} rx={8} ry={4.5} />
          </g>
          {eyes}
          {mouth[expr]}
          {sunglasses > 0 && (
            <g transform={`translate(0 ${(1 - sunglasses) * -90})`} opacity={Math.min(1, sunglasses * 3)}>
              <path d="M52 104 L148 104" stroke={C.ink} strokeWidth={4.5} />
              <path d="M56 100 L94 100 L90 124 Q74 132 60 122 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
              <path d="M106 100 L144 100 L140 122 Q126 132 110 124 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
              <path d="M64 106 L74 106" stroke={C.white} strokeWidth={4} strokeLinecap="round" />
              <path d="M114 106 L124 106" stroke={C.white} strokeWidth={4} strokeLinecap="round" />
            </g>
          )}
          {/* a bow tie: Lucky dresses for the occasion */}
          <g opacity={1 - d} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
            <path d="M100 174 L80 162 Q76 174 80 186 Z" fill={C.ink} />
            <path d="M100 174 L120 162 Q124 174 120 186 Z" fill={C.ink} />
            <rect x={94} y={168} width={12} height={12} rx={3} fill={C.blue} />
          </g>
        </g>
        {expr === 'nervous' && <path d={`M166 ${70 + ((t * 0.8) % 22)} q-9 14 0 18 q9 -4 0 -18 Z`} fill="#9FD8FF" stroke={C.ink} strokeWidth={3} />}
        {hat && (
          <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
            <path d="M46 62 Q100 -8 154 62 Z" fill="#C98E4E" />
            <path d="M68 40 Q100 22 132 40" fill="none" strokeWidth={3} />
            <path d="M28 62 Q100 46 172 62 Q100 80 28 62 Z" fill="#9C6430" />
          </g>
        )}
        {magnifier && (
          <g>
            <path d="M184 168 L204 138" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
            <path d="M184 168 L204 138" stroke="#9C6430" strokeWidth={4} strokeLinecap="round" />
            <circle cx={218} cy={112} r={30} fill="rgba(201,208,255,0.55)" stroke={C.ink} strokeWidth={7} />
            <path d="M200 102 Q206 90 218 88" stroke={C.white} strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        )}
        {crown > 0 && (
          <g transform={`translate(100 46) rotate(-6) scale(${crown}) translate(-100 -46)`}>
            <CrownShape />
          </g>
        )}
      </g>
    </svg>
  );
};

/** feet position as a fraction of the rendered height (for standing on things) */
export const LUCKY_FEET = (209 - VB.y) / VB.h;
/** crown anchor on the head in viewBox units (for physics hand-off) */
export const LUCKY_VB = VB;
