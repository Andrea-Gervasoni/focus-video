// prints scene windows and anchor times (debug helper): npx tsx scripts/cues.ts
import {SCENES} from '../src/script';
import {anchorTime} from '../src/timing';

for (const s of SCENES) {
  console.log(`[${s.id}] ${s.start.toFixed(2)} -> ${s.end.toFixed(2)}  ` + s.anchors.map((a) => `${a.event}@${anchorTime(s.id, a.event).toFixed(2)}`).join(' '));
}
