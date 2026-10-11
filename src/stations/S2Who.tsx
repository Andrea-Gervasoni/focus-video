import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {clamp01, easeOut, lerp, ramp, sp, wobble} from '../anim';
import {Lucky} from '../components/Lucky';
import {Annotate, At, Card, Coin, Head, Kinetic, Num, Pill, Pop, SourceTag, Sticker, stickerCut} from '../components/ui';
import {feeCoinTracks, sample} from '../sim/physics';
import {C, HEAD, MONO} from '../theme';
import {useScene} from '../timing';

// ---------- a cartoon (not real) trader ----------
const Trader: React.FC<{f: number; panic: number}> = ({f, panic}) => {
  const jx = (random(`tx${Math.floor(f)}`) - 0.5) * 7 * panic;
  const jy = (random(`ty${Math.floor(f)}`) - 0.5) * 7 * panic;
  const drop = (f * 2.4) % 40;
  return (
    <svg viewBox="0 0 260 330" width={270} height={343} style={{overflow: 'visible', display: 'block'}}>
      <g transform={`translate(${jx} ${jy})`} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
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
      <div style={{position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', fontFamily: MONO, fontWeight: 800, fontSize: 22, whiteSpace: 'nowrap'}}>{label}</div>
      <div style={{position: 'absolute', left: 30, top: 40, width: 60, height: H, borderRadius: 30, border: `5px solid ${C.ink}`, background: C.paper, overflow: 'hidden', boxSizing: 'border-box', opacity: burst ? 0 : 1}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${lv * 100}%`, background: color}} />
        {[0.25, 0.5, 0.75].map((m) => (
          <div key={m} style={{position: 'absolute', left: 0, width: 18, top: `${(1 - m) * 100}%`, height: 4, background: C.ink}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 10, top: 40 + H - 20, width: 100, height: 100, borderRadius: 99, background: color, border: `5px solid ${C.ink}`, boxSizing: 'border-box'}} />
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
        const v = 34 + random(`cv${i}`) * 40;
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

// the papers behind the article (from its reference list)
const SOURCES = ['Barber & Odean, 2000', 'Bailey & López de Prado, 2014', 'IMF, 2022', 'McLean & Pontiff, 2016', 'Harvey, Liu & Zhu, 2016', 'Gu, Kelly & Xiu, 2020'];

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
      {/* the papers read for this research fan out behind the name */}
      {SOURCES.map((src, i) => {
        const at = first + 2 + i * 2;
        const out = sp(f, logic - 4, {damping: 16, stiffness: 120});
        const ang = (i - 2.5) * 12;
        const rad = 520 + (i % 2) * 60;
        const x = 960 + Math.sin((ang * Math.PI) / 180) * rad * 1.5;
        const y = 1000 - Math.cos((ang * Math.PI) / 180) * rad * 0.55 + out * 900;
        return (
          <Pop key={src} at={at} x={x} y={y} rot={ang * 0.6} f={f}>
            <div style={{width: 250, height: 150, background: C.paper, border: `4px solid ${C.ink}`, borderRadius: 12, boxShadow: `5px 5px 0 ${C.ink}`, padding: 14, boxSizing: 'border-box'}}>
              <div style={{height: 10, width: '80%', background: C.ink, borderRadius: 5, marginBottom: 10}} />
              {[0, 1, 2].map((l) => (
                <div key={l} style={{height: 7, width: `${88 - l * 17}%`, background: C.greyLight, borderRadius: 4, marginBottom: 8}} />
              ))}
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.blue, whiteSpace: 'nowrap'}}>{src}</div>
            </div>
          </Pop>
        );
      })}

      {/* name card */}
      <At x={960} y={lerp(400, 205, nameUp)} transform={`scale(${lerp(1, 0.7, nameUp)})`}>
        <Pop at={name - 12} x={0} y={0} f={f} from="scale">
          <Card style={{padding: '26px 56px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
            <Kinetic text="Andrea Gervasoni" at={name} size={104} f={f} />
            <Pill bg={C.blue} color={C.white} size={38} style={{transform: `scale(${sp(f, tks - 6)})`}}>
              TKS Focus: Blockchain
            </Pill>
          </Card>
        </Pop>
      </At>
      <Sticker at={first} x={lerp(1450, 1340, nameUp)} y={lerp(270, 150, nameUp)} rot={8} bg={C.gold} color={C.ink} size={40} f={f}>
        my first research
      </Sticker>

      {/* the logic, as a formula */}
      <Pop at={logic} x={960} y={330} f={f}>
        <Card style={{display: 'flex', alignItems: 'center', gap: 22, padding: '14px 34px'}} radius={24}>
          <Head size={50}>emotions</Head>
          <svg width={80} height={40} viewBox="0 0 80 40">
            <path d="M4 20 L70 20 M50 6 L72 20 L50 34" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Head size={50} color={C.orange}>
            losses
          </Head>
        </Card>
      </Pop>
      <Annotate at={logic + 8} d="M780 372 Q960 392 1140 368" color={C.orange} width={7} w={10} h={10} f={f} />

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
        <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 90, color: C.paper, WebkitTextStroke: `4px ${C.ink}`, transform: `rotate(-8deg)`}}>VS</div>
      </Pop>
      {/* Lucky says hi next to the name card, then takes its place in the duel */}
      <At
        x={lerp(1560, 1380, sp(f, duel, {damping: 15, stiffness: 120}))}
        y={lerp(560, 680, sp(f, duel, {damping: 15, stiffness: 120}))}
        transform={`scale(${sp(f, name - 4, {damping: 9, stiffness: 180})})`}
      >
        <div style={stickerCut(6)}>
          <Lucky size={330} expr={f >= none ? 'confident' : f >= lucky ? 'calm' : 'happy'} sunglasses={sp(f, none, {damping: 10, stiffness: 200})} arms={f >= none ? 'point' : f >= lucky ? 'up' : f < duel ? 'wave' : 'down'} jolts={[name - 4, duel, lucky, none]} f={f} look={f >= lucky ? [-0.6, 0] : [-1, 0.2]} />
        </div>
      </At>
      <Pop at={duel + 8} x={1640} y={640} from="down" f={f}>
        <Thermo level={0} f={f} label="EMOTIONS" color={C.blue} />
      </Pop>
      <Pop at={none} x={1640} y={300} f={f}>
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
      <Pop at={data + 4} x={960} y={420} rot={-2} f={f} out={households - 10} outTo="up">
        <Card style={{width: 1000, padding: '34px 46px', display: 'flex', flexDirection: 'column', gap: 14}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, color: C.grey}}>Journal of Finance · 2000</div>
          <Head size={66} style={{whiteSpace: 'normal'}}>Trading Is Hazardous to Your Wealth</Head>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 32}}>Brad Barber &amp; Terrance Odean</div>
          {[0, 1, 2].map((l) => (
            <div key={l} style={{height: 12, width: `${92 - l * 14}%`, background: C.greyLight, borderRadius: 6}} />
          ))}
        </Card>
      </Pop>
      <Pop at={households + 12} x={1370} y={790} rot={-2} f={f}>
        <Pill bg={C.gold} size={28}>
          U.S. broker accounts, 1991–1996
        </Pill>
      </Pop>
      <Pop at={households - 8} x={960} y={130} from="up" f={f}>
        <Card style={{display: 'flex', alignItems: 'baseline', gap: 24, padding: '18px 44px'}}>
          <Head size={44} color={C.grey}>
            a study of
          </Head>
          <Num size={96} color={C.blue}>
            {house.toLocaleString('en-US')}
          </Num>
          <Head size={60}>households</Head>
        </Card>
      </Pop>

      <Pop at={households - 4} x={960} y={490} f={f}>
        <Card style={{width: 1560, height: 470, position: 'relative'}} pad={0}>
          <div style={{position: 'absolute', right: 36, top: 26, fontFamily: HEAD, fontWeight: 700, fontSize: 30, color: C.grey}}>return per year</div>
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
                  <path d="M6 26 L28 6 L50 26 L50 50 L6 50 Z" fill={i % 5 === 0 ? C.blueSoft : C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
                  <rect x={22} y={32} width={12} height={18} fill={C.ink} />
                </svg>
              );
            })}
          <div style={{position: 'absolute', left: 40, top: 30, opacity: ramp(f, race - 10, race - 2)}}>
            <Head size={46}>Most active 20% of traders</Head>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 96,
              height: 80,
              width: orangeW,
              background: C.orange,
              border: `5px solid ${C.ink}`,
              borderRadius: 18,
              boxShadow: `6px 6px 0 ${C.ink}`,
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
            <Head size={46}>Market</Head>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 300,
              height: 80,
              width: blueW,
              background: C.blue,
              border: `5px solid ${C.ink}`,
              borderRadius: 18,
              boxShadow: `6px 6px 0 ${C.ink}`,
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
      <SourceTag at={race + 10} x={420} y={790} f={f}>
        Barber &amp; Odean, 2000
      </SourceTag>
      <Pop at={race - 6} x={1770} y={720} from="right" f={f}>
        <div style={stickerCut(5)}>
          <Lucky size={200} expr={f >= finalAt ? 'proud' : 'confident'} sunglasses={1} arms={f >= finalAt ? 'up' : 'down'} jolts={[finalAt]} f={f} look={[-1, -0.2]} seed={3} />
        </div>
      </Pop>
    </AbsoluteFill>
  );
};
