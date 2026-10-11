import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {sp, wobble} from '../anim';
import {FPS} from '../script';
import {C, HEAD, MONO, SHADOW, STROKE} from '../theme';
import {allWords, CaptionWord} from '../timing';

// Kinetic captions, bottom third: words pop in as they are spoken, the active
// word sits in a blue pill, key numbers are set bigger in mono.

type Group = {words: CaptionWord[]; start: number; end: number};

const isNumber = (t: string) => /\d/.test(t);

const buildGroups = (maxWords: number, maxChars: number): Group[] => {
  const words = allWords();
  const raw: CaptionWord[][] = [];
  let cur: CaptionWord[] = [];
  const len = (ws: CaptionWord[]) => ws.reduce((a, w) => a + w.text.length * (isNumber(w.text) ? 1.4 : 1) + 1, 0);
  const flush = () => {
    if (cur.length) raw.push(cur);
    cur = [];
  };
  for (const w of words) {
    if (cur.length && w.scene !== cur[0].scene) flush();
    if (cur.length && (cur.length >= maxWords || len(cur) + w.text.length > maxChars)) {
      let cut = -1;
      cur.forEach((c, i) => {
        if (i < cur.length - 1 && /[,:;]$/.test(c.text)) cut = i;
      });
      if (cut >= 0) {
        const rest = cur.slice(cut + 1);
        cur = cur.slice(0, cut + 1);
        flush();
        cur = rest;
      } else flush();
    }
    cur.push(w);
    if (/[.?!]["”’]?$/.test(w.text)) flush();
  }
  flush();
  return raw.map((ws, i) => {
    const next = raw[i + 1];
    const last = ws[ws.length - 1];
    const start = ws[0].s - 0.06;
    let end = last.e + 0.5;
    if (next && next[0].s - 0.06 - last.e < 0.9) end = next[0].s - 0.06;
    return {words: ws, start, end};
  });
};

export const Captions: React.FC<{fontSize?: number; maxWords?: number; maxChars?: number; bottom?: number; maxWidth?: number; wrap?: boolean; hideAfter?: number}> = ({
  fontSize = 50,
  maxWords = 7,
  maxChars = 36,
  bottom = 74,
  maxWidth = 1600,
  wrap = false,
  hideAfter,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const groups = useMemo(() => buildGroups(maxWords, maxChars), [maxWords, maxChars]);
  if (hideAfter !== undefined && frame > hideAfter) return null;
  const gi = groups.findIndex((g) => t >= g.start && t < g.end);
  if (gi < 0) return null;
  const g = groups[gi];
  const startF = g.start * FPS;
  const endF = g.end * FPS;
  const p = sp(frame, startF, {damping: 12, stiffness: 240, mass: 0.6});
  const next = groups[gi + 1];
  const gapAfter = !next || next.start - g.end > 0.05;
  const fade = gapAfter ? Math.min(1, Math.max(0, (endF - frame) / 5)) : 1;
  let active = g.start <= 0.05 ? 0 : -1;
  g.words.forEach((w, i) => {
    if (t >= w.s - 0.03) active = i;
  });

  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100, opacity: fade}}>
      <div
        style={{
          display: 'flex',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          justifyContent: 'center',
          alignItems: 'center',
          rowGap: fontSize * 0.1,
          maxWidth,
          background: C.paper,
          border: `${STROKE}px solid ${C.ink}`,
          borderRadius: fontSize * 0.55,
          boxShadow: SHADOW,
          padding: `${fontSize * 0.14}px ${fontSize * 0.32}px`,
          transform: `translateY(${(1 - p) * 30}px) scale(${0.92 + 0.08 * p})`,
        }}
      >
        {g.words.map((w, i) => {
          const spoken = t >= w.s - 0.03 || g.start <= 0.05;
          const isActive = i === active;
          const num = isNumber(w.text);
          const wp = sp(frame, w.s * FPS - 2, {damping: 10, stiffness: 300, mass: 0.5});
          const wb = wobble(frame, w.s * FPS + 3, 0.08, 0.9, 0.25);
          return (
            <span
              key={`${w.scene}-${w.i}`}
              style={{
                fontFamily: num ? MONO : HEAD,
                fontWeight: 800,
                fontSize: num ? fontSize * 1.28 : fontSize,
                lineHeight: 1.12,
                letterSpacing: num ? '-0.03em' : '-0.01em',
                whiteSpace: 'nowrap',
                padding: `0 ${fontSize * 0.18}px`,
                margin: `0 ${fontSize * 0.02}px`,
                borderRadius: fontSize * 0.28,
                color: isActive ? C.white : num ? C.blue : C.ink,
                background: isActive ? C.blue : 'transparent',
                border: `4px solid ${isActive ? C.ink : 'transparent'}`,
                opacity: spoken ? 1 : 0.25,
                transform: spoken ? `translateY(${(1 - wp) * 14}px) scale(${(0.86 + 0.14 * wp) * (1 + wb)}, ${(0.86 + 0.14 * wp) * (1 - wb)})` : 'translateY(6px)',
                display: 'inline-block',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
