import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(21);
Config.setOverwriteOutput(true);

// Use a local Chrome when there is one (no Chrome Headless Shell download needed):
// macOS Chrome/Chromium, or the Playwright headless shell of a Linux cloud container.
const chrome =
  process.env.REMOTION_CHROME ??
  [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  ].find((p) => fs.existsSync(p));
if (chrome) Config.setBrowserExecutable(chrome);
