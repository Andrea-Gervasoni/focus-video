// Remotion normally downloads "Chrome Headless Shell". If a local Google Chrome
// exists we use it instead, so rendering works offline / behind restrictive networks.
import fs from 'node:fs';

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
];
export const browserExecutable = process.env.REMOTION_CHROME ?? CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
