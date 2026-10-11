import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {clamp01, easeOut, lerp, ramp, sp, wobble} from '../anim';
import {Lucky} from '../components/Lucky';
import {Annotate, At, Card, Coin, Display, Kinetic, Label, Num, Pill, Pop, Rise, Script, Sticker, stickerCut} from '../components/ui';
import {feeCoinTracks, sample} from '../sim/physics';
import {C, DISPLAY, HAIR, LIFT, MONO, SANS, SCRIPT} from '../theme';
import {useScene} from '../timing';

// ---------- a cartoon (not real) trader ----------
export const Trader: React.FC<{f: number; panic: number}> = ({f, panic}) => {
  const jx = (random(`tx${Math.floor(f)}`) - 0.5) * 7 * panic;
  const jy = (random(`ty${Math.floor(f)}`) - 0.5) * 7 * panic;
  const drop = (f * 2.4) % 40;
  return (
    <svg viewBox="0 0 260 330" width={270} height={343} style={{overflow: 'visible', display: 'block'}}>
      <g transform={`translate(${jx} ${jy})`} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M58 330 Q58 210 130 206 Q202 210 202 330 Z" fill={C.paper} />
        <path d="M130 212 L118 250 L130 300 L142 250 Z" fill={C.orange} strokeWidth={5} />
        <path d="M74 240 Q40 200 52 128" fill="none" strokeWidth={22} />
        <path d="M74 240 Q40 200 52 128" fill="none" stroke={C.paper} strokeWidth={10} />
        <path d="M186 240 Q220 200 208 128" fill="none" strokeWidth={22} />
        <path d="M186 240 Q220 200 208 128" fill="none" stroke={C.paper} strokeWidth={10} />
        <circle cx={130} cy={110} r={74} fill={C.skin} />
        <path d="M60 92 Q70 30 130 32 Q196 32 202 96 Q172 66 130 70 Q88 70 60 92 Z" fill={C.ink} />
        <circle cx={52} cy={124} r={17} fill={C.skin} />
        <circle cx={208} cy={124} r={17} fill={C.skin} />
        <path d="M88 92 L114 102" strokeWidth={5} />
        <path d="M172 92 L146 102" strokeWidth={5} />
        <circle cx={104} cy={120} r={9} fill={C.ink} />
        <circle cx={156} cy={120} r={9} fill={C.ink} />
        <path d="M104 156 q6.5 -8 13 0 t13 0 t13 0" fill="none" strokeWidth={5} />
        <path d={`M196 ${60 + drop} q-10 16 0 20 q10 -4 0 -20 Z`} fill="#9FD8FF" strokeWidth={3} opacity={1 - drop / 40} />
        <path d={`M70 ${70 + ((drop + 20) % 40)} q-8 13 0 16 q8 -3 0 -16 Z`} fill="#9FD8FF" strokeWidth={3} opacity={1 - ((drop + 20) % 40) / 40} />
      </g>
    </svg>
  );
};

/** EMOTIONS thermometer: level 0..1, bursts at `burstAt` */
const Thermo: React.FC<{level: number; f: number; burstAt?: number; label?: string; color?: string}> = ({level, f, burstAt, label = 'EMOTIONS', color = C.orange}) => {
  const burst = burstAt !== undefined && f >= burstAt;
  const jitter = noise2D('th', f * 0.4, 0) * 0.04;
  const lv = clamp01(level + jitter);
  const H = 330;
  return (
    <div style={{position: 'relative', width: 120, height: 470}}>
      <div style={{position: 'absolute', top: 462, left: '50%', transform: 'translateX(-50%)'}}>
        <Label size={17}>{label}</Label>
      </div>
      <div style={{position: 'absolute', left: 30, top: 40, width: 60, height: H, borderRadius: 30, border: `${HAIR}px solid ${C.ink}`, background: C.paper, overflow: 'hidden', boxSizing: 'border-box', opacity: burst ? 0 : 1}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${lv * 100}%`, background: color}} />
        {[0.25, 0.5, 0.75].map((m) => (
          <div key={m} style={{position: 'absolute', left: 0, width: 18, top: `${(1 - m) * 100}%`, height: 4, background: C.ink}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 10, top: 40 + H - 20, width: 100, height: 100, borderRadius: 99, background: color, border: `${HAIR}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      {burst &&
        new Array(10).fill(0).map((_, i) => {
          const t = f - (burstAt as number);
          const a = random(`sh${i}`) * Math.PI * 2;
          const v = 8 + random(`sv${i}`) * 10;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 60 + Math.cos(a) * v * t,
                top: 80 + Math.sin(a) * v * t + 0.6 * t * t,
                width: 18,
                height: 30,
                background: '#E9F4FF',
                border: `3px solid ${C.ink}`,
                transform: `rotate(${t * 20 * (i % 2 ? 1 : -1)}deg)`,
                opacity: Math.max(0, 1 - t / 30),
              }}
            />
          );
        })}
    </div>
  );
};

/** red candles bursting out of the thermometer */
const CandleBurst: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  if (f < at) return null;
  const t = f - at;
  return (
    <>
      {new Array(26).fill(0).map((_, i) => {
        const a = -Math.PI / 2 + (random(`ca${i}`) - 0.5) * 2.6;
        const v = 16 + random(`cv${i}`) * 20;
        const k = 14;
        const d = (1 - Math.exp(-t / k)) * k;
        const px = x + Math.cos(a) * v * d;
        const py = y + Math.sin(a) * v * d + 0.9 * t * t * 0.18;
        const h = 30 + random(`ch${i}`) * 40;
        return (
          <div key={i} style={{position: 'absolute', left: px, top: py, transform: `rotate(${t * (random(`cr${i}`) - 0.5) * 18}deg)`, opacity: Math.max(0, 1 - Math.max(0, t - 30) / 25)}}>
            <div style={{position: 'absolute', left: 9, top: -14, width: 4, height: h + 28, background: C.ink}} />
            <div style={{width: 22, height: h, background: i % 3 ? C.orange : '#E8402A', border: `3px solid ${C.ink}`, borderRadius: 4}} />
          </div>
        );
      })}
    </>
  );
};

export const S2Who: React.FC = () => {
  const {f, cue} = useScene('who');
  const name = cue('name');
  const first = cue('first');
  const tks = cue('tks');
  const logic = cue('logic');
  const human = cue('human');
  const burst = cue('burst');
  const lucky = cue('lucky');
  const none = cue('none');
  const duel = logic + 10;
  const level = f < human ? 0.12 : f < burst ? 0.15 + 0.85 * ramp(f, human + 4, burst, (x) => x * x) : 1;
  const nameUp = sp(f, logic, {damping: 16, stiffness: 120});

  return (
    <AbsoluteFill>
      {/* name card */}
      <At x={960} y={450 - nameUp * 900} transform={`scale(${1 - 0.3 * nameUp})`}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{alignSelf: 'flex-start', marginLeft: 40, marginBottom: -34, position: 'relative', zIndex: 2, transform: 'rotate(-5deg)'}}>
            <Rise at={name - 6} f={f}>
              <Script size={120}>I’m</Script>
            </Rise>
          </div>
          <Kinetic text="Andrea Gervasoni" at={name} size={220} f={f} font="display" stagger={1.1} />
          <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 22, opacity: ramp(f, first - 4, first + 4)}}>
            <Label size={26}>TKS Focus · Blockchain</Label>
            <div style={{width: 60, height: HAIR, background: C.ink}} />
            <Script size={52} color={C.blue}>
              my first research
            </Script>
          </div>
        </div>
      </At>

      {/* the logic, as a formula */}
      <Pop at={logic} x={960} y={175} f={f}>
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <Script size={78}>emotions</Script>
          <svg width={120} height={40} viewBox="0 0 120 40">
            <path d="M4 20 L110 20 M92 8 L112 20 L92 32" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Display size={120} color={C.orange}>
            Losses
          </Display>
        </div>
      </Pop>

      {/* the duel */}
      <Pop at={duel} x={460} y={700} from="left" f={f}>
        <div style={stickerCut(6)}>
          <Trader f={f} panic={f >= burst - 20 ? 1.8 : 0.9} />
        </div>
      </Pop>
      <Pop at={duel + 3} x={720} y={640} from="down" f={f}>
        <Thermo level={level} f={f} burstAt={burst} />
      </Pop>
      <CandleBurst f={f} at={burst} x={720} y={460} />
      <Pop at={duel + 8} x={960} y={640} f={f}>
        <Script size={130}>vs.</Script>
      </Pop>
      <Pop at={human - 2} x={590} y={350} f={f}>
        <Display size={96}>People</Display>
      </Pop>
      <Pop at={lucky - 2} x={1510} y={350} f={f}>
        <Display size={96} color={C.blue}>
          Computers
        </Display>
      </Pop>
      {/* Lucky says hi next to the name card, then takes its place in the duel */}
      <At
        x={lerp(1690, 1380, sp(f, duel, {damping: 15, stiffness: 120}))}
        y={lerp(800, 680, sp(f, duel, {damping: 15, stiffness: 120}))}
        transform={`scale(${sp(f, name - 4, {damping: 9, stiffness: 180})})`}
      >
        <div style={stickerCut(6)}>
          <Lucky size={330} expr={f >= none ? 'confident' : f >= lucky ? 'calm' : 'happy'} sunglasses={sp(f, none, {damping: 10, stiffness: 200})} arms={f >= none ? 'point' : f >= lucky ? 'up' : f < duel ? 'wave' : 'down'} jolts={[name - 4, duel, lucky, none]} f={f} look={f >= lucky ? [-0.6, 0] : [-1, 0.2]} />
        </div>
      </At>
      <Pop at={duel + 8} x={1640} y={640} from="down" f={f}>
        <Thermo level={0} f={f} label="EMOTIONS" color={C.blue} />
      </Pop>
      <Pop at={none} x={1790} y={560} f={f}>
        <Num size={84} color={C.blue}>
          0
        </Num>
      </Pop>
    </AbsoluteFill>
  );
};

// ---------- the bar race (Figure 1) ----------

const BAR_W = 1080; // 17.9%
const N_FEES = 14;

export const S2WhoB: React.FC = () => {
  const {f, cue} = useScene('who');
  const data = cue('data');
  const households = cue('households');
  const race = cue('race');
  const stop = Math.max(race + 26, cue('stop'));
  const finalAt = Math.max(stop + 20, cue('final'));
  const wOrange = (BAR_W * 11.4) / 17.9;
  const ro = ramp(f, race, stop, (x) => x);
  const orangeW = wOrange * ro;
  const blueW = f < stop ? orangeW : lerp(wOrange, BAR_W, ramp(f, stop, finalAt, easeOut));
  const stopW = wobble(f, stop, 0.09, 0.7);
  const house = Math.round(66465 * easeOut(clamp01((f - (households - 4)) / 15)));
  const tracks = feeCoinTracks(N_FEES, 274);

  return (
    <AbsoluteFill>
      {/* the study itself, before its numbers */}
      <Pop at={data + 4} x={960} y={455} rot={-2} f={f} out={households - 10} outTo="up">
        <div style={{position: 'relative'}}>
          {[2, 1].map((k) => (
            <div key={k} style={{position: 'absolute', inset: 0, transform: `translate(${k * 16}px, ${k * 14}px) rotate(${k * 1.6}deg)`, background: C.paper, border: `${HAIR}px solid ${C.ink}`, borderRadius: 6}} />
          ))}
          <Card style={{width: 1280, padding: '40px 60px 46px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <Pill bg={C.ink} color={C.paper} size={30}>
                Journal of Finance · 2000
              </Pill>
              <Label size={18} color="#6E6757">
                peer-reviewed study
              </Label>
            </div>
            <Script size={100} style={{whiteSpace: 'normal', lineHeight: 1.02}}>
              Trading Is Hazardous to Your Wealth
            </Script>
            <Label size={24}>Brad Barber &amp; Terrance Odean</Label>
            {[0, 1, 2].map((l) => (
              <div key={l} style={{height: 14, width: `${92 - l * 14}%`, background: C.greyLight, borderRadius: 7}} />
            ))}
          </Card>
        </div>
      </Pop>
      <Pop at={households + 12} x={1370} y={790} rot={-2} f={f}>
        <Pill bg={C.gold} size={28}>
          U.S. broker accounts, 1991–1996
        </Pill>
      </Pop>
      <Pop at={households - 8} x={960} y={130} from="up" f={f}>
        <Card style={{display: 'flex', alignItems: 'baseline', gap: 24, padding: '18px 44px'}}>
          <Script size={52} color="#6E6757">
            a study of
          </Script>
          <Num size={112} color={C.blue}>
            {house.toLocaleString('en-US')}
          </Num>
          <Script size={60}>households</Script>
        </Card>
      </Pop>

      <Pop at={households - 4} x={960} y={490} f={f}>
        <Card style={{width: 1560, height: 470, position: 'relative'}} pad={0}>
          <div style={{position: 'absolute', right: 36, top: 30}}>
            <Label size={20} color="#6E6757">
              Return per year
            </Label>
          </div>
          {/* a crowd of households fills the card, then clears for the race */}
          {f < race + 14 &&
            new Array(84).fill(0).map((_, i) => {
              const col = i % 21;
              const row = Math.floor(i / 21);
              const p = sp(f, households - 4 + col * 0.7 + row * 1.5, {damping: 10, stiffness: 220});
              const out = ramp(f, race - 6 + col * 0.4, race + 6 + col * 0.4);
              if (p <= 0) return null;
              return (
                <svg
                  key={i}
                  width={56}
                  height={56}
                  viewBox="0 0 56 56"
                  style={{position: 'absolute', left: 60 + col * 70, top: 92 + row * 84 + out * 60, transform: `scale(${p * (1 - out)})`, opacity: 1 - out}}
                >
                  <path d="M6 26 L28 6 L50 26 L50 50 L6 50 Z" fill={i % 5 === 0 ? C.blueSoft : C.cream} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
                  <rect x={22} y={32} width={12} height={18} fill={C.ink} />
                </svg>
              );
            })}
          <div style={{position: 'absolute', left: 40, top: 30, opacity: ramp(f, race - 10, race - 2)}}>
            <Display size={56}>Most active 20% of traders</Display>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 96,
              height: 80,
              width: orangeW,
              background: C.orange,
              border: `${HAIR}px solid ${C.ink}`,
              borderRadius: 18,
              boxShadow: LIFT,
              boxSizing: 'border-box',
              transform: `scale(${1 - stopW}, ${1 + stopW})`,
              transformOrigin: 'left center',
            }}
          />
          <div style={{position: 'absolute', left: 40 + orangeW + 24, top: 100, opacity: f >= race ? 1 : 0}}>
            <Num size={72}>{((11.4 * orangeW) / wOrange).toFixed(1)}%</Num>
          </div>
          {/* fees leaking out of the bar */}
          {new Array(N_FEES).fill(0).map((_, i) => {
            const spawn = race + ((i + 0.5) / N_FEES) * (stop - race);
            if (f < spawn) return null;
            const s = sample(tracks[i], f - spawn);
            const x0 = 40 + wOrange * ((i + 0.5) / N_FEES);
            return (
              <div key={i} style={{position: 'absolute', left: x0 + s.x - 18, top: 176 + s.y - 18, transform: `rotate(${s.a}rad)`}}>
                <Coin r={18} face="blank" />
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 40, top: 236, opacity: ramp(f, race - 8, race)}}>
            <Display size={56}>The market</Display>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 300,
              height: 80,
              width: blueW,
              background: C.blue,
              border: `${HAIR}px solid ${C.ink}`,
              borderRadius: 18,
              boxShadow: LIFT,
              boxSizing: 'border-box',
            }}
          />
          <div style={{position: 'absolute', left: 40 + blueW + 24, top: 304, opacity: f >= race ? 1 : 0}}>
            <Num size={72} color={C.blue}>
              {((17.9 * blueW) / BAR_W).toFixed(1)}%
            </Num>
          </div>
        </Card>
      </Pop>
      <Sticker at={stop + 4} x={1060} y={690} rot={-4} bg={C.gold} color={C.ink} size={34} f={f}>
        fees: trading isn’t free
      </Sticker>
      <Annotate at={stop + 8} d="M840 700 Q780 720 700 700" color={C.ink} width={7} head w={10} h={10} f={f} />
      <Annotate at={finalAt + 4} d="M1330 650 Q1460 664 1590 646" color={C.blue} width={9} w={10} h={10} f={f} />
      <Pop at={race - 6} x={1770} y={720} from="right" f={f}>
        <div style={stickerCut(5)}>
          <Lucky size={200} expr={f >= finalAt ? 'proud' : 'confident'} sunglasses={1} arms={f >= finalAt ? 'up' : 'down'} jolts={[finalAt]} f={f} look={[-1, -0.2]} seed={3} />
        </div>
      </Pop>
    </AbsoluteFill>
  );
};
