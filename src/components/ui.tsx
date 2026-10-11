import {evolvePath, getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {easeOut, ramp, sp, wobble} from '../anim';
import {C, HEAD, MONO, SHADOW, STROKE} from '../theme';

// ---------- layout ----------

/** Absolutely positioned element centred on (x, y). */
export const At: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  transform?: string;
  z?: number;
  origin?: string;
}> = ({x, y, children, style, transform = '', z, origin}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) ${transform}`,
      transformOrigin: origin,
      zIndex: z,
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- motion ----------

/**
 * Entrance curve: 3 frames of anticipation (a squashed seed), a spring with
 * overshoot, a settle. Returns null before the element exists.
 */
export const entrance = (f: number, at: number) => {
  if (f < at - 3) return null;
  if (f < at) {
    const a = (f - (at - 3)) / 3;
    return {p: 0.12 + 0.06 * a, sx: 1.25, sy: 0.7, blur: 0};
  }
  const p = sp(f, at, {damping: 9, stiffness: 210, mass: 0.75});
  const t = f - at;
  // 1-2 frame smear on the fastest part of the move
  const smear = t < 2 ? 1 - t / 2 : 0;
  const w = wobble(f, at + 7, 0.1, 0.7, 0.16);
  return {p, sx: (1 + w) * (1 - smear * 0.18), sy: (1 - w) * (1 + smear * 0.28), blur: smear * 1.5};
};

type From = 'scale' | 'down' | 'up' | 'left' | 'right';

export const Pop: React.FC<{
  at: number;
  out?: number;
  outTo?: 'scale' | 'up' | 'down' | 'left' | 'right';
  x: number;
  y: number;
  from?: From;
  rot?: number;
  children: React.ReactNode;
  z?: number;
  style?: React.CSSProperties;
  f?: number;
  dist?: number;
}> = ({at, out, outTo = 'scale', x, y, from = 'scale', rot = 0, children, z, style, f: fOverride, dist = 520}) => {
  const frame = useCurrentFrame();
  const f = fOverride ?? frame;
  const e = entrance(f, at);
  if (!e) return null;
  const q = out !== undefined ? sp(f, out, {damping: 15, stiffness: 170}) : 0;
  if (q > 0.995) return null;
  let tf = '';
  if (from === 'scale') tf = `scale(${e.p})`;
  if (from === 'down') tf = `translateY(${(1 - e.p) * dist}px)`;
  if (from === 'up') tf = `translateY(${(e.p - 1) * dist}px)`;
  if (from === 'left') tf = `translateX(${(e.p - 1) * dist}px)`;
  if (from === 'right') tf = `translateX(${(1 - e.p) * dist}px)`;
  let outTf = '';
  if (q > 0) {
    if (outTo === 'scale') outTf = `scale(${1 - q})`;
    if (outTo === 'up') outTf = `translateY(${-q * 1300}px) rotate(${-q * 10}deg)`;
    if (outTo === 'down') outTf = `translateY(${q * 1300}px) rotate(${q * 10}deg)`;
    if (outTo === 'left') outTf = `translateX(${-q * 2300}px) rotate(${-q * 12}deg)`;
    if (outTo === 'right') outTf = `translateX(${q * 2300}px) rotate(${q * 12}deg)`;
  }
  return (
    <At
      x={x}
      y={y}
      z={z}
      style={{...style, filter: e.blur > 0.05 ? `blur(${e.blur}px)` : undefined}}
      transform={`${outTf} ${tf} rotate(${rot}deg) scale(${e.sx}, ${e.sy})`}
    >
      {children}
    </At>
  );
};

// ---------- surfaces ----------

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  bg?: string;
  radius?: number;
  pad?: number | string;
}> = ({children, style, bg = C.paper, radius = 30, pad = 26}) => (
  <div
    style={{
      background: bg,
      border: `${STROKE}px solid ${C.ink}`,
      borderRadius: radius,
      boxShadow: SHADOW,
      padding: pad,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
  mono?: boolean;
}> = ({children, bg = C.paper, color = C.ink, size = 40, style, mono}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.32,
      background: bg,
      color,
      border: `${STROKE}px solid ${C.ink}`,
      borderRadius: 999,
      boxShadow: SHADOW,
      padding: `${size * 0.2}px ${size * 0.58}px`,
      fontFamily: mono ? MONO : HEAD,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.1,
      letterSpacing: mono ? 0 : '-0.01em',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Head: React.FC<{size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({
  size = 80,
  color = C.ink,
  children,
  style,
}) => (
  <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.025em', color, whiteSpace: 'nowrap', ...style}}>
    {children}
  </div>
);

export const Num: React.FC<{size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({
  size = 120,
  color = C.ink,
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '-0.04em',
      color,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Tilted sticker */
export const Sticker: React.FC<{
  at: number;
  x: number;
  y: number;
  rot?: number;
  bg?: string;
  color?: string;
  size?: number;
  children: React.ReactNode;
  out?: number;
  z?: number;
  f?: number;
}> = ({at, x, y, rot = -6, bg = C.orange, color = C.white, size = 44, children, out, z = 20, f}) => (
  <Pop at={at} x={x} y={y} rot={rot} out={out} z={z} f={f}>
    <Pill bg={bg} color={color} size={size} style={{borderRadius: 20, boxShadow: `5px 5px 0 ${C.ink}`}}>
      {children}
    </Pill>
  </Pop>
);

/** Rubber stamp that slams down */
export const Stamp: React.FC<{
  at: number;
  x: number;
  y: number;
  rot?: number;
  color?: string;
  size?: number;
  children: React.ReactNode;
  z?: number;
  bg?: string;
  f?: number;
}> = ({at, x, y, rot = -8, color = C.orange, size = 120, children, z = 30, bg = C.paper, f: fo}) => {
  const frame = useCurrentFrame();
  const f = fo ?? frame;
  if (f < at) return null;
  const p = sp(f, at, {damping: 13, stiffness: 280, mass: 0.7});
  const scale = 2.6 - 1.6 * p;
  const w = wobble(f, at + 5, 0.08, 0.8);
  return (
    <At x={x} y={y} z={z} transform={`rotate(${rot}deg) scale(${scale * (1 + w)}, ${scale * (1 - w)})`} style={{opacity: Math.min(1, p * 2.5)}}>
      <div
        style={{
          border: `${size * 0.09}px solid ${color}`,
          outline: `${STROKE}px solid ${C.ink}`,
          borderRadius: size * 0.22,
          padding: `${size * 0.06}px ${size * 0.28}px`,
          color,
          background: bg,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.0,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          boxShadow: `8px 8px 0 ${C.ink}`,
        }}
      >
        {children}
      </div>
    </At>
  );
};

export const SourceTag: React.FC<{at: number; x: number; y: number; children: React.ReactNode; out?: number; f?: number}> = ({
  at,
  x,
  y,
  children,
  out,
  f,
}) => (
  <Pop at={at} x={x} y={y} out={out} f={f}>
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 24,
        color: C.ink,
        background: C.creamDark,
        border: `3px solid ${C.ink}`,
        borderRadius: 999,
        padding: '6px 18px',
        whiteSpace: 'nowrap',
      }}
    >
      Source: {children}
    </div>
  </Pop>
);

/** "Term = definition" card, slapped on the first time a term is spoken */
export const DefCard: React.FC<{
  at: number;
  x: number;
  y: number;
  term: string;
  def: React.ReactNode;
  rot?: number;
  out?: number;
  f?: number;
  width?: number;
}> = ({at, x, y, term, def, rot = -2, out, f, width}) => (
  <Pop at={at} x={x} y={y} rot={rot} out={out} z={40} f={f}>
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        border: `${STROKE}px solid ${C.ink}`,
        borderRadius: 22,
        boxShadow: `7px 7px 0 ${C.ink}`,
        overflow: 'hidden',
        width,
        background: C.paper,
      }}
    >
      <div style={{background: C.blue, color: C.white, fontFamily: HEAD, fontWeight: 800, fontSize: 40, padding: '14px 24px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}}>
        {term}
      </div>
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 36, padding: '14px 26px', display: 'flex', alignItems: 'center', lineHeight: 1.1, color: C.ink}}>
        {def}
      </div>
    </div>
  </Pop>
);

// ---------- kinetic type ----------

/**
 * Per-letter springs. mode 'pop': letters spring up in a stagger.
 * mode 'shards': letters fly in from scattered positions and assemble.
 */
export const Kinetic: React.FC<{
  text: string;
  at: number;
  size?: number;
  color?: string;
  mode?: 'pop' | 'shards';
  stagger?: number;
  f?: number;
  mono?: boolean;
  seed?: string;
  style?: React.CSSProperties;
}> = ({text, at, size = 90, color = C.ink, mode = 'pop', stagger = 1.6, f: fo, mono, seed = 'k', style}) => {
  const frame = useCurrentFrame();
  const f = fo ?? frame;
  return (
    <div style={{display: 'flex', fontFamily: mono ? MONO : HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.05, letterSpacing: '-0.02em', color, whiteSpace: 'pre', ...style}}>
      {text.split('').map((ch, i) => {
        const t0 = at + i * stagger;
        if (f < t0 - 2) return <span key={i} style={{opacity: 0}}>{ch}</span>;
        const p = sp(f, t0, {damping: 10, stiffness: 230, mass: 0.6});
        let tf: string;
        if (mode === 'shards') {
          const dx = (random(`${seed}x${i}`) - 0.5) * 900;
          const dy = (random(`${seed}y${i}`) - 0.5) * 700;
          const r = (random(`${seed}r${i}`) - 0.5) * 220;
          tf = `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) rotate(${r * (1 - p)}deg) scale(${0.4 + 0.6 * p})`;
        } else {
          const w = wobble(f, t0 + 6, 0.12, 0.8, 0.2);
          tf = `translateY(${(1 - p) * size * 0.7}px) scale(${1 + w}, ${1 - w})`;
        }
        return (
          <span key={i} style={{display: 'inline-block', transform: tf, opacity: Math.min(1, p * 2)}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** rolling digits counter */
export const Odometer: React.FC<{value: number; decimals?: number; size?: number; color?: string; prefix?: string; suffix?: string}> = ({
  value,
  decimals = 2,
  size = 120,
  color = C.ink,
  prefix = '',
  suffix = '',
}) => {
  const str = Math.max(0, value).toFixed(decimals);
  const scaled = Math.max(0, value) * 10 ** decimals;
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', fontFamily: MONO, fontWeight: 800, fontSize: size, lineHeight: 1, color, letterSpacing: '-0.04em'}}>
      {prefix}
      {str.split('').map((ch, i) => {
        if (ch === '.') return <span key={i}>.</span>;
        const digitsAfter = str.slice(i + 1).replace('.', '').length;
        const place = 10 ** digitsAfter;
        const raw = (scaled / place) % 10;
        const d = Math.floor(raw);
        const frac = digitsAfter === 0 ? raw - d : Math.max(0, (raw - d - 0.8) / 0.2);
        return (
          <span key={i} style={{display: 'inline-block', height: size, overflow: 'hidden', position: 'relative', width: size * 0.6}}>
            <span style={{position: 'absolute', left: 0, top: -frac * size}}>{d}</span>
            <span style={{position: 'absolute', left: 0, top: (1 - frac) * size}}>{(d + 1) % 10}</span>
          </span>
        );
      })}
      {suffix}
    </div>
  );
};

// ---------- hand-drawn annotations (stroke draw-on) ----------

export const Annotate: React.FC<{
  d: string;
  at: number;
  dur?: number;
  color?: string;
  width?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  head?: boolean;
  f?: number;
}> = ({d, at, dur = 12, color = C.ink, width = 8, x = 0, y = 0, w = 400, h = 200, head = false, f: fo}) => {
  const frame = useCurrentFrame();
  const f = fo ?? frame;
  if (f < at) return null;
  const p = ramp(f, at, at + dur, easeOut);
  const ev = evolvePath(p, d);
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: x, top: y, overflow: 'visible', pointerEvents: 'none'}}>
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
      {head && p > 0.92 && <ArrowHead d={d} color={color} width={width} />}
    </svg>
  );
};

const ArrowHead: React.FC<{d: string; color: string; width: number}> = ({d, color, width}) => {
  const L = getLength(d);
  const pt = getPointAtLength(d, L) ?? {x: 0, y: 0};
  const tg = getTangentAtLength(d, L) ?? {x: 1, y: 0};
  const a = Math.atan2(tg.y, tg.x);
  const s = width * 3.2;
  const p1 = {x: pt.x - Math.cos(a - 0.5) * s, y: pt.y - Math.sin(a - 0.5) * s};
  const p2 = {x: pt.x - Math.cos(a + 0.5) * s, y: pt.y - Math.sin(a + 0.5) * s};
  return <path d={`M${p1.x} ${p1.y} L${pt.x} ${pt.y} L${p2.x} ${p2.y}`} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
};

// ---------- coins ----------

/** flat coin; `flip` 0..1 turns it over (scaleY), `face` chooses heads/tails art */
export const Coin: React.FC<{r?: number; face?: 'H' | 'T' | 'AI' | 'blank' | 'tomb'; flip?: number; tint?: string; style?: React.CSSProperties; label?: string}> = ({
  r = 40,
  face = 'H',
  flip = 0,
  tint = C.gold,
  style,
  label,
}) => {
  const sy = Math.cos(flip * Math.PI);
  const showBack = sy < 0;
  const f = showBack ? (face === 'H' ? 'T' : 'H') : face;
  const shade = 0.75 + 0.25 * Math.abs(sy);
  return (
    <svg width={r * 2} height={r * 2} viewBox="-50 -50 100 100" style={{overflow: 'visible', display: 'block', transform: `scaleY(${Math.max(0.06, Math.abs(sy))})`, ...style}}>
      <circle r={46} fill={C.goldDark} stroke={C.ink} strokeWidth={7} />
      <circle r={40} cy={-3} fill={tint} style={{filter: `brightness(${shade})`}} />
      <circle r={30} cy={-3} fill="none" stroke={C.goldDark} strokeWidth={4} strokeDasharray="5 6" />
      {f === 'H' && <text y={13} textAnchor="middle" fontFamily={HEAD} fontWeight={800} fontSize={40} fill={C.ink}>H</text>}
      {f === 'T' && <text y={13} textAnchor="middle" fontFamily={HEAD} fontWeight={800} fontSize={40} fill={C.ink}>T</text>}
      {f === 'AI' && <text y={13} textAnchor="middle" fontFamily={HEAD} fontWeight={800} fontSize={38} fill={C.ink}>AI</text>}
      {label && <text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>{label}</text>}
      <path d="M-28 -24 Q-20 -34 -6 -36" stroke={C.white} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
    </svg>
  );
};

/** human silhouette for the back of the hero coin */
export const HumanGlyph: React.FC<{size: number; color?: string}> = ({size, color = C.ink}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{display: 'block'}}>
    <circle cx={0} cy={-16} r={15} fill={color} />
    <path d="M-28 34 Q-28 4 0 4 Q28 4 28 34 Z" fill={color} />
  </svg>
);

/**
 * CSS-3D gold coin (front: "AI", back: a human). Thickness comes from stacked
 * rim discs. rx/ry are rotations in degrees.
 */
export const Coin3D: React.FC<{r: number; rx: number; ry: number; thickness?: number}> = ({r, rx, ry, thickness = 0.16}) => {
  const t = r * thickness;
  const layers = 14;
  const face = (back: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: `radial-gradient(circle at 35% 30%, #FFF1B0 0%, ${C.gold} 38%, ${C.goldDark} 100%)`,
    border: `${Math.max(4, r * 0.035)}px solid ${C.ink}`,
    boxSizing: 'border-box',
    transform: `${back ? 'rotateY(180deg) ' : ''}translateZ(${t / 2}px)`,
    backfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  return (
    <div style={{width: r * 2, height: r * 2, perspective: r * 9}}>
      <div style={{width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg)`}}>
        {new Array(layers).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: r * 0.01,
              borderRadius: '50%',
              background: i % 2 ? C.goldDark : '#C98F00',
              border: `${Math.max(3, r * 0.02)}px solid ${C.ink}`,
              boxSizing: 'border-box',
              transform: `translateZ(${-t / 2 + (t * i) / (layers - 1)}px)`,
            }}
          />
        ))}
        <div style={face(false)}>
          <div style={{position: 'absolute', inset: r * 0.13, borderRadius: '50%', border: `${r * 0.03}px dashed ${C.goldDark}`}} />
          <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: r * 0.78, color: C.ink, letterSpacing: '-0.03em'}}>AI</span>
        </div>
        <div style={face(true)}>
          <div style={{position: 'absolute', inset: r * 0.13, borderRadius: '50%', border: `${r * 0.03}px dashed ${C.goldDark}`}} />
          <HumanGlyph size={r * 1.1} />
        </div>
      </div>
    </div>
  );
};

// ---------- misc ----------

export const Check: React.FC<{size?: number; progress?: number}> = ({size = 80, progress = 1}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{overflow: 'visible'}}>
    <circle cx={50} cy={50} r={44} fill={C.blue} stroke={C.ink} strokeWidth={7} />
    <path d="M28 52 L44 68 L74 34" stroke={C.white} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={80} strokeDashoffset={80 * (1 - progress)} />
  </svg>
);

/** white sticker-cut outline + hard shadow around any character */
export const stickerCut = (w = 5): React.CSSProperties => ({
  filter: `drop-shadow(${w}px 0 0 #fff) drop-shadow(-${w}px 0 0 #fff) drop-shadow(0 ${w}px 0 #fff) drop-shadow(0 -${w}px 0 #fff) drop-shadow(6px 6px 0 ${C.ink})`,
});

