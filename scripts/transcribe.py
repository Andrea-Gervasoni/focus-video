"""Word-level timestamps for the voice-over (called by scripts/retime.mjs).

    .venv/bin/python scripts/transcribe.py <16k-mono.wav> <out.json> [model]
"""
import json
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

audio_path, out = sys.argv[1], sys.argv[2]
model_name = sys.argv[3] if len(sys.argv) > 3 else "small.en"

# 16 kHz mono 16-bit wav prepared by retime.mjs: decode it here so we don't depend on PyAV
with wave.open(audio_path, "rb") as w:
    assert w.getframerate() == 16000 and w.getnchannels() == 1, "expected 16 kHz mono wav"
    audio = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768.0

model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    audio,
    language="en",
    word_timestamps=True,
    beam_size=5,
    vad_filter=False,
    condition_on_previous_text=False,
    initial_prompt="Sharpe ratio, backtest, Deflated Sharpe Ratio, quant papers, Python, Bitcoin, S&P 500.",
)
words = []
shown = 0.0
for seg in segments:
    for w in seg.words or []:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
    if seg.end - shown >= 20:
        shown = seg.end
        print(f"  {seg.end:5.0f}s / {info.duration:.0f}s", flush=True)
# Whisper stretches words over neighbouring silences (the first word after a pause
# starts too early). Snap every word to where the signal actually has speech energy.
hop = 160  # 10 ms
n = len(audio) // hop
frames = audio[: n * hop].reshape(n, hop)
db = 20 * np.log10(np.sqrt((frames**2).mean(axis=1)) + 1e-9)
thr = np.percentile(db, 95) - 28
for w in words:
    i0, i1 = int(w["s"] * 100), max(int(w["s"] * 100) + 1, int(w["e"] * 100))
    voiced = np.nonzero(db[i0:i1] > thr)[0]
    if len(voiced):
        w["s"] = round((i0 + voiced[0]) / 100, 3)
        w["e"] = round(min(w["e"], (i0 + voiced[-1] + 3) / 100), 3)

with open(out, "w") as fh:
    json.dump({"duration": info.duration, "words": words}, fh)
