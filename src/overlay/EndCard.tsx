import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {sp} from '../anim';
import {Lucky} from '../components/Lucky';
import {Card, Coin3D, Head, Pill, Pop, stickerCut} from '../components/ui';
import {C, MONO, SERIF} from '../theme';

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
  return (
    <AbsoluteFill style={{background: C.cream, backgroundImage: `radial-gradient(${C.creamDark} 2.6px, transparent 2.9px)`, backgroundSize: '46px 46px', backgroundPosition: `${f * 0.4}px ${f * 0.25}px`}}>
      <Pop at={4} x={830} y={360} from="down" f={f} dist={300}>
        <Card style={{width: 1300, padding: '40px 56px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          <div style={{display: 'flex', gap: 16}}>
            <Pill bg={C.ink} color={C.white} size={30}>
              FULL ARTICLE
            </Pill>
            <Pill bg={C.gold} size={30} mono>
              17 min read
            </Pill>
          </div>
          <div style={{fontFamily: SERIF, fontSize: 104, lineHeight: 1, textAlign: 'center', color: C.ink}}>
            The Best Crypto Trading AI Might Just Be the <span style={{fontStyle: 'italic', color: C.orange}}>Luckiest</span>
          </div>
        </Card>
      </Pop>
      <Pop at={12} x={830} y={650} rot={-1.5} f={f}>
        <Pill bg={C.blue} color={C.white} size={42}>
          Andrea Gervasoni · TKS Focus: Blockchain
        </Pill>
      </Pop>
      <Pop at={Math.max(16, belowAt - 4)} x={830} y={790} f={f}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, transform: `translateY(${Math.abs(Math.sin(f / 5)) * -12}px)`}}>
          <Pill bg={C.orange} color={C.white} size={52}>
            <span>Link below</span>
          </Pill>
          <svg width={74} height={92} viewBox="0 0 74 92" style={{overflow: 'visible'}}>
            <path d="M37 6 L37 76 M10 52 L37 82 L64 52" stroke={C.ink} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
      <div style={{position: 'absolute', left: 1500, top: 120, fontFamily: MONO, fontWeight: 800, fontSize: 26, color: C.grey, transform: `scale(${sp(f, 20)})`}}>still in the air…</div>
    </AbsoluteFill>
  );
};
