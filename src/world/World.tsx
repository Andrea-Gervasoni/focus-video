import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, random, staticFile, useCurrentFrame} from 'remotion';
import {Cam, camera, cameraSpeed, STATIONS, StationId, viewRect, worldTransform} from '../camera';
import {C, MONO} from '../theme';
import {impactPulse} from '../timing';
import {Doodles} from './Doodles';
import {S1Hook} from '../stations/S1Hook';
import {S2Who, S2WhoB} from '../stations/S2Who';
import {S3Problem} from '../stations/S3Problem';
import {S4Sim} from '../stations/S4Sim';
import {S5Crypto, S5CryptoB} from '../stations/S5Crypto';
import {S6Fix} from '../stations/S6Fix';
import {S7Close} from '../stations/S7Close';

const STATION_VIEWS: {id: StationId; C: React.FC; extra?: [number, number, number, number]}[] = [
  {id: 'hook', C: S1Hook, extra: [-2200, -900, 2600, 1500]},
  {id: 'who', C: S2Who},
  {id: 'whoB', C: S2WhoB},
  {id: 'problem', C: S3Problem},
  {id: 'sim', C: S4Sim},
  {id: 'crypto', C: S5Crypto},
  {id: 'cryptoB', C: S5CryptoB},
  {id: 'fix', C: S6Fix},
  {id: 'close', C: S7Close},
];

const visible = (cam: Cam, id: StationId, extra?: [number, number, number, number]) => {
  const v = viewRect(cam, 200);
  const s = STATIONS[id];
  const r = extra ? {x0: s.x + extra[0], y0: s.y + extra[1], x1: s.x + 1920 + extra[2], y1: s.y + 1080 + extra[3]} : {x0: s.x - 150, y0: s.y - 150, x1: s.x + 2070, y1: s.y + 1230};
  return r.x0 < v.x1 && r.x1 > v.x0 && r.y0 < v.y1 && r.y1 > v.y0;
};

// ---------- parallax ----------

type PItem = {x: number; y: number; kind: number; s: number; rot: number; seed: number};
const makeItems = (n: number, tw: number, th: number, key: string): PItem[] =>
  new Array(n).fill(0).map((_, i) => ({
    x: random(`${key}x${i}`) * tw,
    y: random(`${key}y${i}`) * th,
    kind: Math.floor(random(`${key}k${i}`) * 3),
    s: 0.6 + random(`${key}s${i}`) * 0.9,
    rot: (random(`${key}r${i}`) - 0.5) * 40,
    seed: i,
  }));

const FAR = {tw: 5200, th: 3200, items: makeItems(46, 5200, 3200, 'far')};
const NEAR = {tw: 5200, th: 3400, items: makeItems(9, 5200, 3400, 'near')};

const wrap = (v: number, m: number) => ((((v + m / 2) % m) + m) % m) - m / 2;

const Candle: React.FC<{s: number}> = ({s}) => (
  <svg width={60 * s} height={160 * s} viewBox="0 0 60 160">
    <line x1={30} x2={30} y1={0} y2={160} stroke="#CFC6AE" strokeWidth={6} />
    <rect x={10} y={40} width={40} height={80} rx={6} fill="#DDD4BC" />
  </svg>
);
const MiniCoin: React.FC<{s: number; blur?: number}> = ({s, blur = 0}) => (
  <svg width={70 * s} height={70 * s} viewBox="-50 -50 100 100" style={{filter: blur ? `blur(${blur}px)` : undefined}}>
    <circle r={44} fill={blur ? C.gold : '#E9DDB4'} stroke={blur ? C.goldDark : '#D9CCA3'} strokeWidth={8} />
  </svg>
);

const FarLayer: React.FC<{cam: Cam; f: number}> = ({cam, f}) => {
  const k = 0.32;
  const zs = Math.pow(cam.z, 0.35);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {FAR.items.map((it, i) => {
        const x = wrap(it.x - cam.x * k + noise2D('fx', i, f * 0.004) * 30, FAR.tw);
        const y = wrap(it.y - cam.y * k + noise2D('fy', i, f * 0.004) * 30, FAR.th);
        const sx = 960 + x * zs;
        const sy = 540 + y * zs;
        if (sx < -300 || sx > 2220 || sy < -300 || sy > 1380) return null;
        return (
          <div key={i} style={{position: 'absolute', left: sx, top: sy, transform: `translate(-50%,-50%) scale(${zs}) rotate(${it.rot}deg)`}}>
            {it.kind === 0 ? <MiniCoin s={it.s} /> : <Candle s={it.s} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const GridLayer: React.FC<{cam: Cam}> = ({cam}) => {
  const k = 0.7;
  const zs = Math.pow(cam.z, 0.7);
  const size = 46 * zs;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${C.creamDark} ${Math.max(1.2, 2.6 * zs)}px, transparent ${Math.max(1.4, 2.9 * zs)}px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${960 - cam.x * k * zs}px ${540 - cam.y * k * zs}px`,
      }}
    />
  );
};

const NearLayer: React.FC<{cam: Cam; f: number}> = ({cam, f}) => {
  if (cam.z > 2.2) return null;
  const k = 1.7;
  const zs = Math.pow(cam.z, 1.25);
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      {NEAR.items.map((it, i) => {
        const x = wrap(it.x - cam.x * k + noise2D('nx', i, f * 0.006) * 60, NEAR.tw);
        const y = wrap(it.y - cam.y * k + noise2D('ny', i, f * 0.006) * 60, NEAR.th);
        const sx = 960 + x * zs;
        const sy = 540 + y * zs;
        if (sx < -400 || sx > 2320 || sy < -400 || sy > 1480) return null;
        return (
          <div key={i} style={{position: 'absolute', left: sx, top: sy, opacity: 0.55, transform: `translate(-50%,-50%) scale(${zs * 2.4})`}}>
            {it.kind === 2 ? <div style={{width: 18, height: 18, borderRadius: 99, background: C.creamDark, filter: 'blur(3px)'}} /> : <MiniCoin s={it.s} blur={6} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- the world ----------

const ChromaDefs: React.FC<{d: number}> = ({d}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id="ca" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
      <feOffset in="r" dx={d} dy={d * 0.3} result="ro" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
      <feOffset in="b" dx={-d} dy={-d * 0.3} result="bo" />
      <feComposite in="ro" in2="g" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rg" />
      <feComposite in="rg" in2="bo" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
    </filter>
  </svg>
);

const WorldView: React.FC<{forceAll?: boolean}> = ({forceAll}) => {
  const f = useCurrentFrame();
  const cam = camera(f);
  const ca = impactPulse(Math.floor(f), 9);
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden', filter: ca > 0.04 ? 'url(#ca)' : undefined}}>
      {ca > 0.04 && <ChromaDefs d={ca * 14} />}
      <FarLayer cam={cam} f={f} />
      <GridLayer cam={cam} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: worldTransform(cam), transformOrigin: '0 0'}}>
        <Doodles cam={cam} />
        {STATION_VIEWS.map(({id, C: Comp, extra}) =>
          forceAll || visible(cam, id, extra) ? (
            <div key={id} style={{position: 'absolute', left: STATIONS[id].x, top: STATIONS[id].y, width: 1920, height: 1080}}>
              <Comp />
            </div>
          ) : null,
        )}
      </div>
      <NearLayer cam={cam} f={f} />
    </AbsoluteFill>
  );
};

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const moving = cameraSpeed(f) > 45 || cameraSpeed(f + 1) > 45;
  return moving ? (
    <CameraMotionBlur shutterAngle={170} samples={10}>
      <WorldView />
    </CameraMotionBlur>
  ) : (
    <WorldView />
  );
};

// ---------- screen overlays ----------

const TICKS = new Array(40).fill(0).map((_, i) => ({up: random(`tu${i}`) > 0.45, v: (random(`tv${i}`) * 4).toFixed(2), w: random(`tw${i}`)}));

export const Ticker: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const f = useCurrentFrame();
  const x = -((f * 2.2) % 2400);
  if (opacity <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 44, background: C.ink, overflow: 'hidden', opacity, zIndex: 90}}>
      <div style={{position: 'absolute', left: x, top: 0, height: 44, display: 'flex', alignItems: 'center', gap: 34, whiteSpace: 'nowrap'}}>
        {[...TICKS, ...TICKS].map((t, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontWeight: 700, fontSize: 21, color: t.up ? '#8FA0FF' : '#FF9466'}}>
            <svg width={14} height={12} viewBox="0 0 14 12">
              <path d={t.up ? 'M7 0 L14 12 L0 12 Z' : 'M0 0 L14 0 L7 12 Z'} fill={t.up ? '#8FA0FF' : '#FF9466'} />
            </svg>
            {t.up ? '+' : '-'}
            {t.v}%
            <span style={{color: '#5A5A5A'}}>{'|'.repeat(1 + Math.floor(t.w * 3))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const j = Math.floor(f / 6);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.32, zIndex: 95}}>
      <div
        style={{
          position: 'absolute',
          inset: -40,
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundSize: '320px 320px',
          backgroundPosition: `${(random(`gx${j}`) * 320) | 0}px ${(random(`gy${j}`) * 320) | 0}px`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 62%, rgba(80,60,20,0.16) 100%)'}} />
    </AbsoluteFill>
  );
};

