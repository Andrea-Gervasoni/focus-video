import {CameraMotionBlur} from '@remotion/motion-blur';
import React from 'react';
import {AbsoluteFill, random, staticFile, useCurrentFrame} from 'remotion';
import {Cam, camera, cameraSpeed, STATIONS, StationId, viewRect, worldTransform} from '../camera';
import {clamp01, sp} from '../anim';
import {SceneId, SCENES, STORY_FRAMES} from '../script';
import {C, SERIF} from '../theme';
import {sceneFrames} from '../timing';
import {Doodles} from './Doodles';
import {S1Hook} from '../stations/S1Hook';
import {S2Who, S2WhoB} from '../stations/S2Who';
import {S3Problem} from '../stations/S3Problem';
import {S4Sim} from '../stations/S4Sim';
import {S5Crypto, S5CryptoB} from '../stations/S5Crypto';
import {S6Fix} from '../stations/S6Fix';
import {S7Close} from '../stations/S7Close';

const STATION_VIEWS: {id: StationId; C: React.FC; extra?: [number, number, number, number]}[] = [
  {id: 'hook', C: S1Hook, extra: [-700, -700, 700, 700]},
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

// ---------- paper ----------

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

// ---------- map labels: when the camera pulls back on the whole notebook, every station shows its chapter ----------

const LABELLED: [StationId, SceneId][] = [
  ['hook', 'hook'],
  ['who', 'who'],
  ['problem', 'problem'],
  ['sim', 'sim'],
  ['crypto', 'crypto'],
  ['fix', 'fix'],
  ['close', 'close'],
];

const StationLabels: React.FC<{cam: Cam; f: number}> = ({cam, f}) => {
  const vis = clamp01((0.5 - cam.z) / 0.15);
  if (vis <= 0) return null;
  return (
    <>
      {LABELLED.map(([st, scene], i) => {
        const p = sp(f, Math.floor(f - (vis * 30 - i * 3)), {damping: 12, stiffness: 200});
        return (
          <div
            key={st}
            style={{
              position: 'absolute',
              left: STATIONS[st].x + 960,
              top: STATIONS[st].y + 540,
              transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * p) * (0.9 + 0.1 * vis)})`,
              opacity: vis,
              display: 'flex',
              alignItems: 'stretch',
              border: `16px solid ${C.ink}`,
              borderRadius: 60,
              overflow: 'hidden',
              boxShadow: `22px 22px 0 ${C.ink}`,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{background: scene === 'close' ? C.orange : C.blue, color: C.white, fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, padding: '6px 54px 14px', display: 'flex', alignItems: 'center', lineHeight: 1.1}}>
              {ROMAN[i]}
            </div>
            <div style={{background: C.paper, color: C.ink, fontFamily: SERIF, fontSize: 170, padding: '6px 64px 14px', lineHeight: 1.1}}>{CHAPTERS[scene]}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------- the world ----------

const WorldView: React.FC<{forceAll?: boolean}> = ({forceAll}) => {
  const f = useCurrentFrame();
  const cam = camera(f);
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      <GridLayer cam={cam} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: worldTransform(cam), transformOrigin: '0 0'}}>
        <Doodles />
        {STATION_VIEWS.map(({id, C: Comp, extra}) =>
          forceAll || visible(cam, id, extra) ? (
            <div key={id} style={{position: 'absolute', left: STATIONS[id].x, top: STATIONS[id].y, width: 1920, height: 1080}}>
              <Comp />
            </div>
          ) : null,
        )}
        <StationLabels cam={cam} f={f} />
      </div>
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

// ---------- chapter header: roman numeral + chapter title + a hairline that fills with the story ----------
const CHAPTERS: Record<SceneId, string> = {
  hook: 'The question',
  who: 'Why I believed it',
  problem: 'The trap',
  sim: 'The experiment',
  crypto: 'Crypto',
  fix: 'The fix',
  close: 'What comes next',
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const ChapterHeader: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const f = useCurrentFrame();
  if (opacity <= 0.01) return null;
  // switch chapter a little before the scene starts, while the camera whips there
  let idx = 0;
  SCENES.forEach((s, i) => {
    if (i > 0 && f >= sceneFrames(s).from - 6) idx = i;
  });
  const changeAt = idx === 0 ? 0 : sceneFrames(SCENES[idx]).from - 6;
  const p = sp(f, changeAt, {damping: 16, stiffness: 200});
  const progress = clamp01(f / STORY_FRAMES);
  const rows = [
    {n: idx > 0 ? ROMAN[idx - 1] : '', t: idx > 0 ? CHAPTERS[SCENES[idx - 1].id] : '', y: -p * 52, o: 1 - p},
    {n: ROMAN[idx], t: CHAPTERS[SCENES[idx].id], y: (1 - p) * 52, o: p},
  ];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 80, opacity, zIndex: 90, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 46, top: 22, height: 52, width: 760, overflow: 'hidden'}}>
        {rows.map((r, i) =>
          r.t ? (
            <div key={i} style={{position: 'absolute', left: 0, top: r.y, height: 52, display: 'flex', alignItems: 'baseline', gap: 16, opacity: r.o, whiteSpace: 'nowrap'}}>
              <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: C.blue, minWidth: 44}}>{r.n}</span>
              <span style={{width: 2, height: 30, background: C.ink, opacity: 0.35, alignSelf: 'center'}} />
              <span style={{fontFamily: SERIF, fontSize: 40, color: C.ink, letterSpacing: '0.005em'}}>{r.t}</span>
            </div>
          ) : null,
        )}
      </div>
      {/* the story so far: a hairline that fills with gold, with a tick per chapter */}
      <div style={{position: 'absolute', left: 46, right: 46, top: 14, height: 2, background: 'rgba(19,19,19,0.18)'}}>
        <div style={{position: 'absolute', left: 0, top: -1, height: 4, width: `${progress * 100}%`, background: C.goldDark, borderRadius: 2}} />
        {SCENES.slice(1).map((s) => (
          <div key={s.id} style={{position: 'absolute', left: `${(sceneFrames(s).from / STORY_FRAMES) * 100}%`, top: -5, width: 2, height: 12, background: C.ink, opacity: 0.45}} />
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

