import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(21);
Config.setOverwriteOutput(true);

// Use the local Google Chrome when there is one (no Chrome Headless Shell download needed).
const chrome =
  process.env.REMOTION_CHROME ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].find((p) =>
    fs.existsSync(p),
  );
if (chrome) Config.setBrowserExecutable(chrome);
