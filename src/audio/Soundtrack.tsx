import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {cameraKeys} from '../camera';
import {DATA, FPS, SCENES, STORY_FRAMES, TOTAL_FRAMES} from '../script';
import {cueAbs, sceneFrames, sceneWords} from '../timing';

// All sound lives here (outside the motion-blurred, culled picture tree).
// SFX sit about 18 dB under the voice; the beat bed sits at -24 dB and ducks
// under the voice like a sidechain.

export const SFX_GAIN = 0.126; // about -18 dB
const BED_GAIN = 0.063; // about -24 dB

type Ev = {at: number; name: string; gain?: number};

const c = cueAbs;
const sfxEvents = (): Ev[] => {
  const e: Ev[] = [];
  const add = (at: number, name: string, gain = 1) => e.push({at: Math.round(at), name, gain});

  // hook: the cover
  add(0, 'slide', 0.6);
  SCENES[0].voText.split(/\s+/).slice(0, 8).forEach((_, i) => add(sceneWords(SCENES[0])[i][0] * FPS - 2, 'tick', 0.45));
  add(sceneWords(SCENES[0])[2][0] * FPS + 2, 'pop_hi', 0.7); // Lucky peeks out of "AI"
  add(sceneWords(SCENES[0])[7][0] * FPS + 2, 'pop', 0.7); // the human peeks out of "human?"
  add(c('hook', 'sure') - 6, 'whoosh', 0.7);
  add(c('hook', 'sure') + 4, 'slide', 0.8);
  add(c('hook', 'yes'), 'stamp', 1);
  add(c('hook', 'yes'), 'ding', 0.6);
  add(c('hook', 'research'), 'rustle', 1);
  add(c('hook', 'research', 0.25), 'rustle', 0.7);
  add(c('hook', 'research') + 4, 'boing', 0.6);
  add(c('hook', 'riser') - 6, 'riser', 0.9);
  add(c('hook', 'scratch'), 'scratch', 1.4);
  add(c('hook', 'scratch') + 6, 'whoosh', 1);
  add(c('hook', 'luckyIn') + 4, 'clink', 0.9);
  add(c('hook', 'luckyIn') + 6, 'sparkle', 0.7);
  add(c('hook', 'title'), 'impact', 0.8);
  add(c('hook', 'title'), 'stamp', 0.7);

  // who
  add(c('who', 'name'), 'pop', 1);
  add(c('who', 'first'), 'pop_hi', 1);
  add(c('who', 'tks'), 'pop', 0.8);
  add(c('who', 'logic'), 'pop', 0.8);
  add(c('who', 'human'), 'riser', 0.6);
  add(c('who', 'burst'), 'shatter', 1.1);
  add(c('who', 'burst'), 'impact', 0.8);
  add(c('who', 'lucky'), 'pop', 0.9);
  add(c('who', 'none'), 'clink', 0.7);
  add(c('who', 'households') - 4, 'pop', 0.9);
  add(c('who', 'race'), 'slide', 0.9);
  for (let i = 0; i < 14; i += 2) {
    const race = c('who', 'race');
    const stop = Math.max(race + 26, c('who', 'stop'));
    add(race + ((i + 0.5) / 14) * (stop - race) + 12, 'clink_lo', 0.45);
  }
  add(Math.max(c('who', 'race') + 26, c('who', 'stop')), 'boing', 0.8);
  add(c('who', 'final'), 'ding', 0.9);

  // problem
  add(c('problem', 'quants'), 'rustle', 1);
  add(c('problem', 'quants', 0.15), 'pop', 0.8);
  add(c('problem', 'model'), 'slide', 0.8);
  add(c('problem', 'versions'), 'whoosh', 1);
  add(c('problem', 'backtest'), 'stamp', 1);
  add(c('problem', 'keep') - 14, 'beep', 1);
  add(c('problem', 'keep') + 2, 'lever', 0.6);
  add(c('problem', 'luckiest'), 'clink', 0.9);
  add(c('problem', 'picture', -0.15), 'whoosh', 1);
  add(c('problem', 'n1024'), 'pop', 0.8);
  {
    const flipping = c('problem', 'flipping');
    const span = Math.max(44, c('problem', 'oneGets') - 4 - flipping);
    for (let r = 1; r <= 10; r++) add(flipping + 2 + ((r - 1) * span) / 10, r % 2 ? 'clink' : 'clink_lo', 0.5);
  }
  add(c('problem', 'tenHeads'), 'ding', 1);
  add(c('problem', 'tenHeads'), 'impact', 0.6);
  add(c('problem', 'genius'), 'pop', 0.8);
  add(c('problem', 'no'), 'scratch', 0.5);
  add(c('problem', 'justLucky'), 'boing', 0.9);

  // sim
  add(c('sim', 'tested'), 'whoosh', 0.8);
  add(c('sim', 'python'), 'type', 0.7);
  add(c('sim', 'python', 1.6), 'type', 0.7);
  add(c('sim', 'random'), 'glitch', 0.5);
  add(c('sim', 'zeroSkill'), 'stamp', 1);
  add(c('sim', 'sharpe'), 'pop', 0.9);
  add(c('sim', 'above2'), 'pop_hi', 0.8);
  add(c('sim', 'b10'), 'pop', 0.9);
  add(c('sim', 'b100'), 'pop', 0.9);
  add(c('sim', 'b1000') - 30, 'riser', 0.7);
  add(c('sim', 'b1000'), 'sparkle', 1);
  add(c('sim', 'b1000'), 'impact', 0.6);
  add(c('sim', 'v23'), 'ding', 0.9);
  add(c('sim', 'unseen'), 'slide', 0.8);
  add(c('sim', 'collapse'), 'deflate', 1.6);
  add(c('sim', 'collapse'), 'impact', 1);
  add(c('sim', 'collapse') + 18, 'clink', 0.7);
  add(c('sim', 'collapse') + 30, 'boing', 0.6);

  // crypto
  add(c('crypto', 'dead14'), 'glitch', 0.6);
  add(c('crypto', 'dead14', 0.3), 'rustle', 0.6);
  add(c('crypto', 'dead'), 'stamp', 0.9);
  add(c('crypto', 'tokens'), 'pop', 0.7);
  add(c('crypto', 'fifteen'), 'pop_hi', 0.9);

  // fix
  add(c('fix', 'fix'), 'pop', 0.9);
  add(c('fix', 'dsr'), 'stamp', 0.9);
  add(c('fix', 'take'), 'pop', 0.8);
  {
    const two = c('fix', 'two');
    const real = c('fix', 'real');
    const thousand = c('fix', 'thousand');
    const land1 = two + 4;
    const land2 = Math.max(land1 + 14, real + 6);
    const land4 = Math.max(land2 + 26, thousand + 6);
    const land3 = Math.round((land2 + land4) / 2);
    [land1, land2, land3, land4].forEach((l, i) => {
      add(l - 14, 'lever', 1);
      add(l - 12, 'reel', 0.8);
      add(l, 'ding', 0.6);
      if (i > 0) add(l, 'steam', 0.9);
    });
  }
  add(c('fix', 'p34'), 'impact', 0.9);

  // close
  add(c('close', 'map', -0.1), 'whoosh', 1.1);
  add(c('close', 'board'), 'whoosh', 0.7);
  for (let i = 0; i < 4; i++) add(c('close', 'board') + i * 3 + 6, 'pop', 0.6);
  add(c('close', 'renaissance'), 'pop_hi', 0.7);
  add(c('close', 'numerai'), 'pop_hi', 0.7);
  add(c('close', 'question'), 'rustle', 0.8);
  add(c('close', 'shrug'), 'boing', 0.7);
  add(c('close', 'flip'), 'clink', 1);
  add(c('close', 'flip'), 'whip', 0.8);
  add(c('close', 'flip') + 16, 'sparkle', 0.8);
  add(c('close', 'end') - 14, 'whoosh', 1);
  add(c('close', 'below'), 'pop', 0.8);
  // the reference page slides in
  add(STORY_FRAMES - 16, 'slide', 0.9);
  add(STORY_FRAMES - 4, 'rustle', 0.8);
  for (let i = 0; i < 8; i += 2) add(STORY_FRAMES - 16 + 8 + i * 2.5, 'pop', 0.35);

  // camera whip pans
  const k = cameraKeys();
  for (let i = 1; i < k.length; i++) if (k[i].ease === 'whip') add(k[i - 1].f + 2, 'whip', 0.9);
  return e;
};

// ---- the beat bed ----
const beatStart = () => cueAbs('hook', 'scratch') + 6;
/** windows where the bed drops out entirely (the freeze before the collapse) */
const mutes = () => {
  const freezeFrom = cueAbs('sim', 'v23') + 14;
  return [
    [freezeFrom, cueAbs('sim', 'unseen')],
    [cueAbs('sim', 'collapse'), cueAbs('sim', 'collapse') + 20],
  ];
};

let voiceEnv: Float32Array | null = null;
/** 0..1 voice activity per frame, smoothed (attack 3 f, release 10 f) */
const voiceActivity = () => {
  if (voiceEnv) return voiceEnv;
  const env = new Float32Array(TOTAL_FRAMES + 2);
  if (DATA.voiceover) {
    const on = new Uint8Array(TOTAL_FRAMES + 2);
    for (const s of SCENES) for (const [a, b] of sceneWords(s)) for (let f = Math.floor(a * FPS); f <= Math.ceil(b * FPS) && f < on.length; f++) on[f] = 1;
    let v = 0;
    for (let f = 0; f < env.length; f++) {
      v = on[f] ? Math.min(1, v + 1 / 3) : Math.max(0, v - 1 / 10);
      env[f] = v;
    }
  }
  voiceEnv = env;
  return env;
};

export const Soundtrack: React.FC = () => {
  const events = sfxEvents();
  const start = beatStart();
  const mw = mutes();
  const env = voiceActivity();
  // the bed keeps playing under the reference slate and fades out with the video
  const endFade = TOTAL_FRAMES - 52;
  return (
    <>
      {DATA.voiceover &&
        SCENES.map((s) => {
          if (!s.audio) return null;
          const {from} = sceneFrames(s);
          return (
            <Sequence key={s.id} from={from + Math.round(s.audio[2] * FPS)} layout="none" name={`voice:${s.id}`}>
              <Html5Audio
                src={staticFile(DATA.voiceover as string)}
                trimBefore={Math.round(s.audio[0] * FPS)}
                durationInFrames={Math.max(1, Math.round((s.audio[1] - s.audio[0]) * FPS))}
              />
            </Sequence>
          );
        })}
      <Sequence from={start} layout="none" name="beat">
        <Html5Audio
          src={staticFile('sfx/beat.wav')}
          loop
          volume={(f) => {
            const g = f + start;
            if (mw.some(([a, b]) => g >= a && g < b)) return 0;
            const fadeIn = Math.min(1, f / 8);
            const fadeOut = Math.max(0, Math.min(1, (endFade + 40 - g) / 40));
            const duck = 1 - 0.6 * (env[Math.min(env.length - 1, Math.max(0, Math.floor(g)))] ?? 0);
            return BED_GAIN * fadeIn * fadeOut * duck;
          }}
        />
      </Sequence>
      {events.map((ev, i) => (
        <Sequence key={i} from={Math.max(0, ev.at)} durationInFrames={90} layout="none" name={`sfx:${ev.name}`}>
          <Html5Audio src={staticFile(`sfx/${ev.name}.wav`)} volume={SFX_GAIN * (ev.gain ?? 1)} />
        </Sequence>
      ))}
    </>
  );
};
