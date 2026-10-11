import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {ramp, sp} from '../anim';
import {Lucky} from '../components/Lucky';
import {Card, Coin3D, Display, Label, Pill, Pop, Rise, Script, stickerCut} from '../components/ui';
import {C, DISPLAY, HAIR, LIFT, MONO, SANS, SCRIPT} from '../theme';

// End card + a custom @remotion/transitions presentation: the camera dives into
// the frozen coin and its face opens onto the end card.

type CoinZoomProps = {x: number; y: number; r: number};

const CoinZoom: React.FC<TransitionPresentationComponentProps<CoinZoomProps>> = ({children, presentationDirection, presentationProgress, passedProps}) => {
  const p = presentationProgress;
  const {x, y, r} = passedProps;
  if (presentationDirection === 'exiting') {
    // the canvas zooms into the coin
    const s = 1 + p * p * 7;
    return (
      <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${x}px ${y}px`, filter: p > 0.5 ? `blur(${(p - 0.5) * 8}px)` : undefined}}>
        {children}
      </AbsoluteFill>
    );
  }
  // the end card appears through the coin's face, which grows to fill the frame
  const R = r + (p * p) * 2300;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `circle(${R}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>
      {p < 0.98 && (
        <div style={{position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, borderRadius: '50%', border: `${14 + 20 * (1 - p)}px solid ${C.gold}`, outline: `6px solid ${C.ink}`, boxSizing: 'border-box'}} />
      )}
    </AbsoluteFill>
  );
};

export const coinZoom = (props: CoinZoomProps): TransitionPresentation<CoinZoomProps> => ({component: CoinZoom, props});

export const EndCard: React.FC<{belowAt: number}> = ({belowAt}) => {
  const f = useCurrentFrame();
  const slam = sp(f, 8, {damping: 12, stiffness: 230, mass: 0.7});
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(90deg, ${C.creamDark} 0px, ${C.creamDark} 1.6px, transparent 1.6px, transparent 34px)`, backgroundPosition: `${f * 0.3}px 0px`, opacity: 0.55}} />
      {/* the title, as the same collage as the opening */}
      <div style={{position: 'absolute', left: 170, top: 210, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        <Rise at={2} f={f}>
          <Label size={22} color={C.blue}>
            The full article · 17 min read
          </Label>
        </Rise>
        <div style={{marginTop: 26}}>
          <Rise at={4} f={f}>
            <Script size={76}>The best crypto trading AI</Script>
          </Rise>
        </div>
        <Rise at={6} f={f}>
          <Script size={76}>might just be the</Script>
        </Rise>
        <div style={{transform: `scale(${2 - slam})`, transformOrigin: '0% 70%', opacity: f >= 8 ? 1 : 0, marginTop: 4}}>
          <Display size={300} color={C.orange}>
            Luckiest
          </Display>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 34, opacity: ramp(f, 12, 22)}}>
          <Label size={24}>Andrea Gervasoni</Label>
          <div style={{width: 50, height: HAIR, background: C.ink}} />
          <Label size={24} color="#6E6757">
            TKS Focus · Blockchain
          </Label>
        </div>
      </div>
      <Pop at={Math.max(16, belowAt - 4)} x={1300} y={820} f={f}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, transform: `translateY(${Math.abs(Math.sin(f / 5)) * -10}px)`}}>
          <Pill bg={C.orange} color={C.white} size={52}>
            Link below
          </Pill>
          <svg width={60} height={80} viewBox="0 0 74 92" style={{overflow: 'visible'}}>
            <path d="M37 6 L37 76 M14 54 L37 82 L60 54" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Pop>
      <Pop at={8} x={1610} y={560} from="right" f={f}>
        <div style={stickerCut(6)}>
          <Lucky size={320} expr="happy" arms="wave" f={f} look={[-0.6, 0]} jolts={[8]} />
        </div>
      </Pop>
      {/* the coin is still in the air */}
      <div style={{position: 'absolute', left: 1610 - 46, top: 210 - 46 + Math.sin(f / 10) * 8}}>
        <Coin3D r={46} rx={18} ry={f * 1.6} />
      </div>
      <div style={{position: 'absolute', left: 1490, top: 100, transform: `scale(${sp(f, 20)})`}}>
        <Script size={36} color="#6E6757" weight={500}>
          still in the air…
        </Script>
      </div>
    </AbsoluteFill>
  );
};
