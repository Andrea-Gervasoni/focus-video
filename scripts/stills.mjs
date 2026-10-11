// QA: renders the midpoint of every scene + a contact sheet into out/stills/.
//   npm run stills                 midpoints + contact sheet
//   npm run stills -- 12.5 47 63   extra stills at these seconds
//   npm run stills -- --vertical   also a few frames of the 1080x1920 version
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {browserExecutable} from './browser.mjs';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'out', 'stills');
fs.mkdirSync(outDir, {recursive: true});

const args = process.argv.slice(2);
const vertical = args.includes('--vertical');
const seconds = args.filter((a) => !a.startsWith('--')).map(Number).filter((n) => !Number.isNaN(n));

console.log('Bundling...');
const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'public')});

const sheet = await selectComposition({serveUrl, id: 'ContactSheet', browserExecutable});
const video = await selectComposition({serveUrl, id: 'FocusVideo', browserExecutable});
const fps = video.fps;
console.log(`Duration: ${(video.durationInFrames / fps).toFixed(2)}s (${video.durationInFrames} frames)`);

const jobs = [];
if (seconds.length === 0) {
  sheet.props.frames.forEach((frame, i) => jobs.push({comp: video, frame, file: `scene${i + 1}-mid.png`}));
  jobs.push({comp: sheet, frame: 0, file: 'contact-sheet.png'});
} else {
  seconds.forEach((s) => jobs.push({comp: video, frame: Math.min(video.durationInFrames - 1, Math.round(s * fps)), file: `t${s.toFixed(2)}.png`}));
}
if (vertical) {
  const v = await selectComposition({serveUrl, id: 'FocusVideoVertical', browserExecutable});
  sheet.props.frames.slice(0, 7).forEach((frame, i) => jobs.push({comp: v, frame, file: `vertical-scene${i + 1}.png`}));
}

for (const job of jobs) {
  const output = path.join(outDir, job.file);
  await renderStill({serveUrl, composition: job.comp, frame: job.frame, output, imageFormat: 'png', inputProps: job.comp.props, browserExecutable});
  console.log(`  ${job.file}  (frame ${job.frame}, ${(job.frame / fps).toFixed(2)}s)`);
}
console.log(`Done -> ${path.relative(root, outDir)}`);
