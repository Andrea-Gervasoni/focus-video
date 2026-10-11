// npm run retime            align public/voiceover.(m4a|mp3|wav) to the script and rewrite src/script.ts
// npm run retime -- --reset go back to the estimated (silent preview) timings
//
// Steps: loudness-normalise the recording -> faster-whisper word timestamps ->
// align them to the verbatim voText -> stretch/shrink every scene to the real voice.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const scriptPath = path.join(root, 'src', 'script.ts');
const work = path.join(root, '.retime');
const FPS = 30;
const START = '// <script-data>';
const END = '// </script-data>';

// ---------- script.ts I/O ----------
const readData = () => {
  const src = fs.readFileSync(scriptPath, 'utf8');
  const a = src.indexOf(START);
  const b = src.indexOf(END);
  if (a < 0 || b < 0) throw new Error('script-data markers not found in src/script.ts');
  const block = src.slice(a + START.length, b);
  const json = block.slice(block.indexOf('=') + 1).trim().replace(/;\s*$/, '');
  return {src, a, b, data: JSON.parse(json)};
};

const writeData = (data) => {
  const {src, a, b} = readData();
  const tokens = {};
  const clone = {
    ...data,
    scenes: data.scenes.map((s, i) => {
      const c = {...s};
      for (const k of ['holds', 'audio', 'words']) {
        if (c[k] !== undefined) {
          const t = `__${k}_${i}__`;
          tokens[t] = JSON.stringify(c[k]);
          c[k] = t;
        }
      }
      if (c.anchors) {
        const t = `__anchors_${i}__`;
        tokens[t] = '[\n' + c.anchors.map((a) => `        ${JSON.stringify(a)}`).join(',\n') + '\n      ]';
        c.anchors = t;
      }
      return c;
    }),
  };
  let json = JSON.stringify(clone, null, 2);
  for (const [t, v] of Object.entries(tokens)) json = json.replace(`"${t}"`, v);
  const out = `${src.slice(0, a)}${START}\nexport const DATA: ScriptData = ${json};\n${src.slice(b)}`;
  fs.writeFileSync(scriptPath, out);
};

// ---------- text helpers (mirror src/timing.ts) ----------
const tokenize = (t) => t.split(/\s+/).filter(Boolean);
const norm = (w) =>
  w
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9$%&]+/, '')
    .replace(/[^a-z0-9%]+$/, '');
const findPhrase = (text, phrase, nth = 0) => {
  const toks = tokenize(text).map(norm);
  const p = tokenize(phrase).map(norm);
  let seen = 0;
  for (let i = 0; i + p.length <= toks.length; i++) {
    if (p.every((w, j) => toks[i + j] === w)) {
      if (seen === nth) return i;
      seen++;
    }
  }
  throw new Error(`anchor phrase "${phrase}" not found`);
};
const key = (w) => w.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]/g, '');
const syllables = (raw) => {
  const w = raw.toLowerCase();
  if (/\d/.test(w)) {
    const digits = w.replace(/[^0-9]/g, '').length;
    let s = Math.max(2, digits * 1.4);
    if (w.includes('.')) s += 1;
    if (w.includes('%')) s += 2;
    if (w.startsWith('$')) s += 1;
    return s;
  }
  const g = w.replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g);
  return Math.max(1, g ? g.length : 1);
};

const lev = (a, b) => {
  const d = Array.from({length: a.length + 1}, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const sim = (a, b) => {
  if (!a || !b) return -1;
  if (a === b) return 2;
  if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return 1;
  const r = 1 - lev(a, b) / Math.max(a.length, b.length);
  return r >= 0.7 ? 1 : -1;
};

// ---------- alignment (Needleman-Wunsch) ----------
const align = (script, heard) => {
  const n = script.length;
  const m = heard.length;
  const GAP = -0.6;
  const S = Array.from({length: n + 1}, () => new Float64Array(m + 1));
  const P = Array.from({length: n + 1}, () => new Uint8Array(m + 1)); // 1 diag, 2 up, 3 left
  for (let i = 1; i <= n; i++) (S[i][0] = i * GAP), (P[i][0] = 2);
  for (let j = 1; j <= m; j++) (S[0][j] = j * GAP), (P[0][j] = 3);
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const d = S[i - 1][j - 1] + sim(script[i - 1].k, heard[j - 1].k);
      const u = S[i - 1][j] + GAP;
      const l = S[i][j - 1] + GAP;
      if (d >= u && d >= l) (S[i][j] = d), (P[i][j] = 1);
      else if (u >= l) (S[i][j] = u), (P[i][j] = 2);
      else (S[i][j] = l), (P[i][j] = 3);
    }
  const match = new Array(n).fill(-1);
  const exact = new Array(n).fill(false);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const p = P[i][j];
    if (p === 1) {
      match[i - 1] = j - 1;
      exact[i - 1] = sim(script[i - 1].k, heard[j - 1].k) > 0;
      i--, j--;
    } else if (p === 2) i--;
    else j--;
  }
  return {match, exact};
};

// ---------- main ----------
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, {stdio: 'inherit', cwd: root, ...opts});
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
};

const reset = () => {
  const est = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'estimate.json'), 'utf8'));
  const {data} = readData();
  data.voiceover = null;
  data.scenes = data.scenes.map((s) => {
    const e = est.find((x) => x.id === s.id);
    const {audio, words, ...rest} = s;
    return {...rest, start: e.start, end: e.end, anchors: s.anchors.map(({at, ...a}) => a)};
  });
  writeData(data);
  console.log('Restored the estimated timings (silent preview).');
};

if (process.argv.includes('--reset')) {
  reset();
  process.exit(0);
}

const EXTS = ['m4a', 'mp3', 'wav', 'aac', 'caf', 'mp4', 'mov'];
const candidates = [
  ...EXTS.map((e) => path.join(root, 'public', `voiceover.${e}`)),
  ...EXTS.map((e) => path.join(root, `voiceover.${e}`)),
];
const voPath = candidates.find((p) => fs.existsSync(p));
if (!voPath) {
  console.error('No voice-over found. Put your recording at public/voiceover.m4a (or .mp3/.wav) and run again.');
  process.exit(1);
}
console.log(`Voice-over: ${path.relative(root, voPath)}`);
fs.mkdirSync(work, {recursive: true});

// 1. normalise loudness (-16 LUFS) with the ffmpeg that ships with Remotion
const track = path.join(root, 'public', 'vo_track.wav');
console.log('1/3 Normalising loudness...');
run('npx', ['remotion', 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', voPath, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '1', track]);

// 2. transcribe with faster-whisper (installed into .venv on first run)
const py = path.join(root, '.venv', 'bin', 'python');
if (!fs.existsSync(py)) {
  console.log('    creating .venv and installing faster-whisper (first run only)...');
  run('python3', ['-m', 'venv', '.venv']);
  run(py, ['-m', 'pip', 'install', '-q', 'faster-whisper']);
}
const wordsJson = path.join(work, 'words.json');
const asr = path.join(work, 'vo16k.wav');
run('npx', ['remotion', 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', track, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', asr]);
const model = process.env.WHISPER_MODEL ?? 'small.en';
const st = fs.statSync(voPath);
const cacheKey = `${voPath}|${st.size}|${st.mtimeMs}|${model}`;
const keyFile = path.join(work, 'words.key');
if (fs.existsSync(wordsJson) && fs.existsSync(keyFile) && fs.readFileSync(keyFile, 'utf8') === cacheKey) {
  console.log('2/3 Transcription cached (same recording).');
} else {
  console.log(`2/3 Transcribing with faster-whisper (${model})...`);
  run(py, [path.join('scripts', 'transcribe.py'), asr, wordsJson, model]);
  fs.writeFileSync(keyFile, cacheKey);
}
const {duration, words: heardRaw} = JSON.parse(fs.readFileSync(wordsJson, 'utf8'));

// 3. align + rebuild the timeline
console.log('3/3 Aligning to the script...');
const {data} = readData();
const script = data.scenes.flatMap((s, si) => tokenize(s.voText).map((raw, ti) => ({raw, k: key(raw), si, ti, syl: syllables(raw)})));
// whisper splits numbers ("2" ".3", "66" ",465"): glue the pieces back together
const merged = [];
for (const w of heardRaw) {
  const prev = merged.at(-1);
  if (prev && /^[.,]\d/.test(w.w) && /\d$/.test(prev.w)) (prev.w += w.w), (prev.e = w.e);
  else merged.push({...w});
}
const heard = merged.map((w) => ({...w, k: key(w.w)})).filter((w) => w.k);
const {match, exact} = align(script, heard);

// raw file times per script token
const times = script.map((_, i) => (match[i] >= 0 ? [heard[match[i]].s, heard[match[i]].e] : null));
// a script word heard as several words ("pitch-deck" -> "pitch", "deck"): extend over unmatched neighbours
const used = new Set(match.filter((j) => j >= 0));
match.forEach((j, i) => {
  if (j < 0) return;
  let k = j + 1;
  while (k < heard.length && !used.has(k) && heard[k].s - times[i][1] < 0.25) {
    times[i][1] = heard[k].e;
    used.add(k);
    k++;
  }
});
// fill words the recogniser missed, proportionally to their length
const matchedSyl = script.reduce((a, t, i) => a + (times[i] ? t.syl : 0), 0);
const matchedDur = script.reduce((a, t, i) => a + (times[i] ? times[i][1] - times[i][0] : 0), 0);
const secPerSyl = matchedSyl ? matchedDur / matchedSyl : 0.2;
for (let i = 0; i < script.length; i++) {
  if (times[i]) continue;
  let j = i;
  while (j < script.length && !times[j]) j++;
  const prevEnd = i > 0 ? times[i - 1][1] : null;
  const nextStart = j < script.length ? times[j][0] : null;
  const gapSyl = script.slice(i, j).reduce((a, t) => a + t.syl, 0);
  // missed words sit right before the next recognised word, at normal speed
  const natural = gapSyl * secPerSyl * 1.15;
  let t0 = nextStart !== null ? Math.max(prevEnd ?? 0, nextStart - natural) : (prevEnd ?? 0);
  let t1 = nextStart ?? t0 + natural;
  if (t1 < t0) t1 = t0;
  const k = (t1 - t0) / gapSyl;
  let t = t0;
  for (let x = i; x < j; x++) {
    times[x] = [t, t + script[x].syl * k];
    t += script[x].syl * k;
  }
  i = j - 1;
}
// keep times monotonic
for (let i = 1; i < times.length; i++) {
  if (times[i][0] < times[i - 1][0]) times[i][0] = times[i - 1][0];
  if (times[i][1] < times[i][0]) times[i][1] = times[i][0];
}

const matchedCount = exact.filter(Boolean).length;
const byScene = data.scenes.map((_, si) => script.map((t, i) => ({...t, time: times[i]})).filter((t) => t.si === si));
let cursor = 0;
const newScenes = data.scenes.map((scene, si) => {
  const toks = byScene[si];
  const first = toks[0].time[0];
  const last = toks[toks.length - 1].time[1];
  const prevLast = si > 0 ? byScene[si - 1].at(-1).time[1] : 0;
  const a = si === 0 ? Math.max(0, first - 0.08) : Math.max(prevLast + 0.05, first - 0.3);
  const nextFirst = si < data.scenes.length - 1 ? byScene[si + 1][0].time[0] : null;
  const nextA = nextFirst !== null ? Math.max(last + 0.05, nextFirst - 0.3) : Math.min(duration, last + 0.8);
  const b = Math.max(a + 0.1, nextA);
  const minLead = si === 0 ? 0 : 0.35;
  const pad = Math.max(0, minLead - (first - a));
  const tail = scene.minTail ?? 0.5;
  const dur = Math.max(pad + (b - a), pad + (last - a) + tail);
  const start = cursor;
  cursor += dur;
  const r = (x) => Math.round(x * 1000) / 1000;
  const words = toks.map((t) => [r(start + pad + (t.time[0] - a)), r(start + pad + (t.time[1] - a))]);
  const anchors = scene.anchors.map(({at, ...an}) => ({...an, at: words[findPhrase(scene.voText, an.word, an.nth ?? 0)][0]}));
  return {...scene, start: r(start), end: r(start + dur), audio: [r(a), r(b), r(pad)], words, anchors};
});

data.voiceover = 'vo_track.wav';
data.scenes = newScenes;
writeData(data);

const total = newScenes.at(-1).end;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
console.log(`\nMatched ${matchedCount}/${script.length} words with the recording.`);
newScenes.forEach((s) => console.log(`  ${s.id.padEnd(7)} ${fmt(s.start)} -> ${fmt(s.end)}  (${(s.end - s.start).toFixed(1)}s)`));
console.log(`Total: ${fmt(total)} (${Math.round(total * FPS)} frames)${Math.abs(total - 120) > 12 ? '  <- outside 2:00 +/- 12s' : ''}`);
if (matchedCount / script.length < 0.75) console.log('Warning: low match rate - check that the recording follows the script.');
console.log('src/script.ts updated. Preview with `npm run preview`, then `npm run render`.');
