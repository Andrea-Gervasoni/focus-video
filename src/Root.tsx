import React from 'react';
import {AbsoluteFill, Composition, Freeze} from 'remotion';
import {FocusVideo, FocusVideoVertical, Stage} from './FocusVideo';
import {FPS, SCENES, TOTAL_FRAMES} from './script';
import {C, H, MONO, W} from './theme';
import {sceneFrames} from './timing';

type SheetProps = {frames: number[]};

/** QA helper: a grid of frozen frames (default: the midpoint of every scene) */
const ContactSheet: React.FC<SheetProps> = ({frames}) => {
  const cols = 3;
  const scale = 1 / cols;
  return (
    <AbsoluteFill style={{background: C.ink, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start'}}>
      {frames.map((fr) => (
        <div key={fr} style={{width: W * scale, height: H * scale, position: 'relative', overflow: 'hidden', outline: `2px solid ${C.ink}`}}>
          <div style={{width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative'}}>
            <Freeze frame={fr}>
              <Stage />
            </Freeze>
          </div>
          <div style={{position: 'absolute', left: 8, top: 8, fontFamily: MONO, fontSize: 22, background: C.ink, color: C.white, padding: '2px 8px'}}>
            {(fr / FPS).toFixed(1)}s
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const midpoints = SCENES.map((s) => {
  const {from, dur} = sceneFrames(s);
  return from + Math.round(dur / 2);
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="FocusVideo" component={FocusVideo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition
      id="FocusVideoVertical"
      component={FocusVideoVertical}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="ContactSheet"
      component={ContactSheet}
      defaultProps={{frames: midpoints}}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={Math.ceil(midpoints.length / 3) * (H / 3)}
    />
  </>
);
