import {linearTiming, TransitionSeries} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Soundtrack} from './audio/Soundtrack';
import {camera, FLIP_COIN, STATIONS} from './camera';
import {Captions} from './components/Captions';
import {coinZoom, EndCard} from './overlay/EndCard';
import {HookOverlay} from './overlay/HookOverlay';
import {paperSlide, ReferencesSlate, SourceNotes} from './overlay/Sources';
import {STORY_FRAMES, TOTAL_FRAMES} from './script';
import {C, H, HEAD, MONO, SHADOW, STROKE, W} from './theme';
import {cueAbs} from './timing';
import {Grain, Ticker, World} from './world/World';

const T = 18;
/** end card -> reference slate */
const T2 = 16;

const endTiming = () => {
  // let the frozen coin hang in the air for at least ~1.2 s before diving into it
  const endAt = Math.max(cueAbs('close', 'end', -0.45), cueAbs('close', 'flip', 1.7));
  const cam = camera(endAt);
  const wx = STATIONS.close.x + FLIP_COIN.apex.x;
  const wy = STATIONS.close.y + FLIP_COIN.apex.y;
  return {endAt, x: 960 + (wx - cam.x) * cam.z, y: 540 + (wy - cam.y) * cam.z, r: FLIP_COIN.r * cam.z};
};

const TickerLayer: React.FC<{endAt: number}> = ({endAt}) => {
  const f = useCurrentFrame();
  const on = Math.min(1, Math.max(0, (f - (cueAbs('hook', 'scratch') + 12)) / 8)) * Math.min(1, Math.max(0, (endAt - f) / 6));
  return <Ticker opacity={on} />;
};

export const Stage: React.FC<{captions?: boolean}> = ({captions = true}) => {
  const {endAt, x, y, r} = endTiming();
  const belowAt = cueAbs('close', 'below') - endAt;
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={endAt + T}>
          <World />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={coinZoom({x, y, r})} timing={linearTiming({durationInFrames: T})} />
        <TransitionSeries.Sequence durationInFrames={STORY_FRAMES - endAt + T2}>
          <EndCard belowAt={belowAt} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={paperSlide()} timing={linearTiming({durationInFrames: T2})} />
        <TransitionSeries.Sequence durationInFrames={TOTAL_FRAMES - STORY_FRAMES}>
          <ReferencesSlate />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <HookOverlay />
      <TickerLayer endAt={endAt} />
      <Grain />
      {captions && <Captions />}
      {captions && <SourceNotes />}
    </AbsoluteFill>
  );
};

export const FocusVideo: React.FC = () => (
  <AbsoluteFill>
    <Stage />
    <Soundtrack />
  </AbsoluteFill>
);

/** 1080x1920 cut for Instagram: the same stage, framed, with bigger captions */
export const FocusVideoVertical: React.FC = () => {
  const f = useCurrentFrame();
  const scale = 1000 / W;
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${C.creamDark} 2.6px, transparent 2.9px)`, backgroundSize: '46px 46px', backgroundPosition: `${f * 0.35}px ${f * 0.22}px`}} />
      <div style={{position: 'absolute', top: 150, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start'}}>
        <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 30, background: C.blue, color: C.white, border: `${STROKE}px solid ${C.ink}`, borderRadius: 999, padding: '8px 24px', boxShadow: SHADOW}}>
          TKS FOCUS · BLOCKCHAIN
        </div>
        <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 74, lineHeight: 1.0, letterSpacing: '-0.03em', color: C.ink, background: C.paper, border: `${STROKE}px solid ${C.ink}`, borderRadius: 32, boxShadow: SHADOW, padding: '26px 34px'}}>
          The Best Crypto Trading AI Might Just Be the Luckiest
        </div>
      </div>
      <div style={{position: 'absolute', left: 40, top: 640, width: W * scale, height: H * scale, border: `${STROKE + 1}px solid ${C.ink}`, borderRadius: 28, boxShadow: SHADOW, overflow: 'hidden'}}>
        <div style={{width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative'}}>
          <Stage captions={false} />
        </div>
      </div>
      <Captions fontSize={60} maxWords={7} maxChars={36} bottom={590} maxWidth={960} wrap />
      <SourceNotes left={60} bottom={300} size={26} maxWidth={960} wrap />
      <div style={{position: 'absolute', bottom: 470, left: 0, right: 0, textAlign: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 38, color: C.ink}}>
        Andrea Gervasoni · full article: link in bio
      </div>
      <Sequence from={STORY_FRAMES - T2} layout="none">
        <TallSlate />
      </Sequence>
      <Soundtrack />
    </AbsoluteFill>
  );
};

/** the vertical cut ends on a full-screen, one-column reference list */
const TallSlate: React.FC = () => {
  const f = useCurrentFrame();
  const e = 1 - (1 - Math.min(1, f / T2)) ** 3;
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - e) * 2000}px)`, zIndex: 200}}>
      <Sequence from={T2} layout="none">
        <ReferencesSlate tall />
      </Sequence>
      {f < T2 && <AbsoluteFill style={{background: C.cream}} />}
    </AbsoluteFill>
  );
};
