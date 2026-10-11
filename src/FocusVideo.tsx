import {linearTiming, TransitionSeries} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Soundtrack} from './audio/Soundtrack';
import {camera, FLIP_COIN, STATIONS} from './camera';
import {Captions} from './components/Captions';
import {Display, Label, Script} from './components/ui';
import {coinZoom, EndCard} from './overlay/EndCard';
import {paperSlide, ReferencesSlate, SourceNotes} from './overlay/Sources';
import {STORY_FRAMES, TOTAL_FRAMES} from './script';
import {C, DISPLAY, H, HAIR, LIFT, MONO, SANS, SCRIPT, W} from './theme';
import {cueAbs, getScene, sceneFrames} from './timing';
import {ChapterHeader, Grain, World} from './world/World';

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

const HeaderLayer: React.FC<{endAt: number}> = ({endAt}) => {
  const f = useCurrentFrame();
  // the opening has its own masthead; the chapter header takes over on the way to chapter II
  const from = sceneFrames(getScene('who')).from - 10;
  const on = Math.min(1, Math.max(0, (f - from) / 8)) * Math.min(1, Math.max(0, (endAt - f) / 6));
  return <ChapterHeader opacity={on} />;
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
      <HeaderLayer endAt={endAt} />
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
      <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(90deg, ${C.creamDark} 0px, ${C.creamDark} 1.6px, transparent 1.6px, transparent 34px)`, backgroundPosition: `${f * 0.3}px 0px`, opacity: 0.55}} />
      <div style={{position: 'absolute', top: 130, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        <Label size={24} color={C.blue}>
          TKS Focus · Blockchain
        </Label>
        <Script size={68} style={{marginTop: 26, whiteSpace: 'normal', lineHeight: 1.05}}>
          The best crypto trading AI might just be the
        </Script>
        <Display size={200} color={C.orange} style={{marginTop: 4}}>
          Luckiest
        </Display>
      </div>
      <div style={{position: 'absolute', left: 40, top: 640, width: W * scale, height: H * scale, border: `${HAIR}px solid ${C.ink}`, borderRadius: 4, boxShadow: LIFT, overflow: 'hidden'}}>
        <div style={{width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative'}}>
          <Stage captions={false} />
        </div>
      </div>
      <Captions fontSize={60} maxWords={7} maxChars={36} top={1250} maxWidth={960} wrap />
      <SourceNotes left={60} bottom={150} size={26} maxWidth={960} wrap />
      <div style={{position: 'absolute', top: 1500, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Label size={26}>Andrea Gervasoni · full article: link in bio</Label>
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
