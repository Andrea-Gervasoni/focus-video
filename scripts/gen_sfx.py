"""Procedurally generate the video's sound effects (no downloaded audio).

    python3 scripts/gen_sfx.py      # needs numpy; writes public/sfx/*.wav

Every effect is normalised to -1 dBFS peak; the video plays them at about
-18 dB (SFX_GAIN in src/components/ui.tsx) so they sit under the voice.
"""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, attack=0.004, decay=0.1):
    x = np.arange(n) / SR
    a = np.clip(x / max(attack, 1e-4), 0, 1)
    return a * np.exp(-x / decay)


def sweep(f0, f1, sec, curve="exp"):
    x = t(sec)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (x / sec)
    else:
        f = f0 + (f1 - f0) * x / sec
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def lowpass(x, cutoff):
    """one-pole low-pass; cutoff may be an array (time-varying)"""
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def bandpass(x, lo, hi):
    return lowpass(x, hi) - lowpass(x, lo)


def fade(x, ms=6):
    n = int(SR * ms / 1000)
    x = x.copy()
    x[-n:] *= np.linspace(1, 0, n)
    return x


def write(name, x):
    x = fade(np.asarray(x, dtype=np.float64))
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 10 ** (-1 / 20)
    pcm = (x * 32767).astype("<i2")
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"  {name}.wav  {len(x) / SR:.2f}s")


def pop(f0=900, f1=320, sec=0.09):
    s = sweep(f0, f1, sec) * env(int(SR * sec), 0.002, 0.035)
    click = rng.standard_normal(int(SR * 0.004)) * np.linspace(1, 0, int(SR * 0.004)) * 0.3
    s[: len(click)] += click
    return s


def whoosh(sec=0.45):
    n = int(SR * sec)
    noise = rng.standard_normal(n)
    x = np.arange(n) / n
    cutoff = 300 + 3800 * np.sin(np.pi * x) ** 2
    shaped = bandpass(noise, cutoff * 0.25, cutoff)
    return shaped * np.sin(np.pi * x) ** 1.5


def coin(sec=0.7):
    x = t(sec)
    s = np.zeros_like(x)
    for f, a, d in [(2093, 1.0, 0.22), (2637, 0.7, 0.3), (3951, 0.45, 0.12), (5274, 0.3, 0.08)]:
        s += a * np.sin(2 * np.pi * f * x) * np.exp(-x / d)
    # second ting, a little later
    off = int(SR * 0.075)
    s2 = np.zeros_like(s)
    s2[off:] = 0.6 * s[: len(s) - off]
    return (s + s2) * np.clip(x / 0.002, 0, 1)


def tick():
    sec = 0.05
    n = int(SR * sec)
    s = bandpass(rng.standard_normal(n), 1500, 6000) * env(n, 0.0005, 0.008)
    s += 0.5 * np.sin(2 * np.pi * 1800 * t(sec)) * env(n, 0.0005, 0.012)
    return s


def typing(sec=1.8):
    n = int(SR * sec)
    out = np.zeros(n)
    pos = 0
    while pos < n - 3000:
        k = int(SR * 0.012)
        click = bandpass(rng.standard_normal(k), 900, 5000) * env(k, 0.0003, 0.004)
        thump = np.sin(2 * np.pi * 180 * np.arange(k) / SR) * env(k, 0.0005, 0.006) * 0.4
        out[pos : pos + k] += (click + thump) * (0.6 + 0.4 * rng.random())
        pos += int(SR * (0.055 + 0.06 * rng.random()))
    return out


def pfff(sec=1.25):
    """a balloon deflating: falling buzzy tone + airy hiss with flutter"""
    n = int(SR * sec)
    x = np.arange(n) / SR
    f = 330 * (95 / 330) ** (x / sec)
    phase = np.cumsum(f) / SR
    buzz = 2 * (phase % 1) - 1  # sawtooth
    buzz = lowpass(buzz, 1400)
    flutter = 0.55 + 0.45 * np.sin(2 * np.pi * (26 - 10 * x / sec) * x)
    hiss = bandpass(rng.standard_normal(n), 500 + 600 * (1 - x / sec), 4000)
    amp = np.clip(x / 0.03, 0, 1) * (1 - x / sec) ** 0.8
    return (0.7 * buzz * flutter + 0.6 * hiss) * amp


def stamp():
    sec = 0.32
    n = int(SR * sec)
    body = sweep(140, 42, sec) * env(n, 0.001, 0.09)
    hit = lowpass(rng.standard_normal(n), 1800) * env(n, 0.0005, 0.02)
    return body + 0.8 * hit


def glitch(sec=0.5):
    n = int(SR * sec)
    out = np.zeros(n)
    pos = 0
    while pos < n:
        k = int(SR * (0.015 + 0.05 * rng.random()))
        k = min(k, n - pos)
        f = rng.choice([110, 220, 440, 880, 1760, 3520])
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(k) / SR))
        if rng.random() < 0.4:
            seg = rng.standard_normal(k)
        seg = np.round(seg * 4) / 4  # bit crush
        out[pos : pos + k] = seg * (0.4 + 0.6 * rng.random())
        pos += k
    return out * np.clip(np.arange(n) / (SR * 0.01), 0, 1)


def ding(sec=1.0):
    x = t(sec)
    s = np.zeros_like(x)
    for f, a, d in [(1318.5, 1.0, 0.45), (2637, 0.35, 0.25), (3955.5, 0.15, 0.12), (1975.5, 0.4, 0.35)]:
        s += a * np.sin(2 * np.pi * f * x) * np.exp(-x / d)
    return s * np.clip(x / 0.003, 0, 1)


def sparkle(sec=0.9):
    n = int(SR * sec)
    out = np.zeros(n)
    for _ in range(14):
        start = int(rng.random() * (n - SR * 0.25))
        f = 2200 + rng.random() * 3200
        k = int(SR * 0.2)
        out[start : start + k] += np.sin(2 * np.pi * f * np.arange(k) / SR) * env(k, 0.001, 0.05) * (0.4 + 0.6 * rng.random())
    return out


def boing(sec=0.55):
    x = t(sec)
    f = 190 + 120 * np.exp(-x / 0.12) * np.sin(2 * np.pi * 9 * x) + 80 * x / sec
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return s * env(len(x), 0.004, 0.18)


def slide(sec=0.35):
    n = int(SR * sec)
    s = sweep(320, 820, sec)
    s = lowpass(np.sign(s) * 0.5 + s * 0.5, 2500)
    return s * np.sin(np.pi * np.arange(n) / n)


if __name__ == "__main__":
    print("Generating SFX ->", os.path.normpath(OUT))
    write("pop", pop())
    write("pop_hi", pop(1500, 650, 0.07))
    write("whoosh", whoosh())
    write("coin", coin())
    write("tick", tick())
    write("type", typing())
    write("pfff", pfff())
    write("stamp", stamp())
    write("glitch", glitch())
    write("ding", ding())
    write("sparkle", sparkle())
    write("boing", boing())
    write("slide", slide())


# ---------- v2 additions ----------

def whip(sec=0.32):
    n = int(SR * sec)
    x = np.arange(n) / n
    cutoff = 600 + 7000 * np.sin(np.pi * x) ** 3
    s = bandpass(rng.standard_normal(n), cutoff * 0.3, cutoff)
    return s * np.sin(np.pi * x) ** 2.5


def impact(sec=0.55):
    n = int(SR * sec)
    sub = sweep(95, 32, sec) * env(n, 0.001, 0.16)
    burst = lowpass(rng.standard_normal(n), 2600) * env(n, 0.0005, 0.035)
    return sub * 1.0 + burst * 0.7


def riser(sec=1.6):
    n = int(SR * sec)
    x = np.arange(n) / n
    noise = bandpass(rng.standard_normal(n), 300 + 3000 * x, 1500 + 7000 * x)
    tone = np.sin(2 * np.pi * np.cumsum(220 * (4 ** x)) / SR) * 0.25
    return (noise + tone) * x ** 2


def clink(sec=0.6, fc=2600.0):
    x = t(sec)
    idx = 3.5 * np.exp(-x / 0.05)
    mod = np.sin(2 * np.pi * fc * 1.414 * x)
    s = np.sin(2 * np.pi * fc * x + idx * mod) * np.exp(-x / 0.18)
    s += 0.4 * np.sin(2 * np.pi * fc * 2.76 * x) * np.exp(-x / 0.07)
    return s * np.clip(x / 0.0015, 0, 1)


def rustle(sec=0.5):
    n = int(SR * sec)
    out = np.zeros(n)
    for _ in range(45):
        st = int(rng.random() * (n - 800))
        k = int(SR * (0.004 + rng.random() * 0.012))
        out[st:st + k] += bandpass(rng.standard_normal(k), 1200, 7000) * (0.3 + rng.random())
    return out * np.sin(np.pi * np.arange(n) / n) ** 0.6


def scratch(sec=0.55):
    x = t(sec)
    # record scratch: back-and-forth pitch, gritty
    rate = 1 + 0.9 * np.sin(2 * np.pi * 3.2 * x) * np.exp(-x / 0.35)
    ph = np.cumsum(rate) / SR
    s = np.sign(np.sin(2 * np.pi * 180 * ph)) * 0.5 + bandpass(rng.standard_normal(len(x)), 800, 5000) * 0.8
    s = lowpass(s, 3500)
    return s * np.clip(x / 0.01, 0, 1) * np.exp(-x / 0.3)


def deflate(sec=1.3):
    n = int(SR * sec)
    x = np.arange(n) / SR
    f0 = 520 * (70 / 520) ** (x / sec)
    ph = np.cumsum(f0) / SR
    buzz = lowpass(2 * (ph % 1) - 1, 1600)
    flutter = 0.5 + 0.5 * np.sin(2 * np.pi * (30 - 14 * x / sec) * x)
    hiss = bandpass(rng.standard_normal(n), 600, 4500) * (1 - x / sec)
    return (0.8 * buzz * flutter + 0.5 * hiss) * np.clip(x / 0.02, 0, 1) * (1 - x / sec) ** 0.7


def lever(sec=0.45):
    n = int(SR * sec)
    clunk = sweep(260, 90, 0.2) * env(int(SR * 0.2), 0.001, 0.05)
    out = np.zeros(n)
    out[: len(clunk)] += clunk
    for k in range(6):
        st = int(SR * (0.04 + k * 0.035))
        c = bandpass(rng.standard_normal(400), 1500, 6000) * np.linspace(1, 0, 400)
        out[st:st + 400] += c * 0.5
    return out


def reel(sec=0.6):
    n = int(SR * sec)
    out = np.zeros(n)
    pos = 0.0
    k = 0
    while True:
        st = int(SR * pos)
        if st + 600 >= n:
            break
        out[st:st + 600] += bandpass(rng.standard_normal(600), 2000, 7000) * np.linspace(1, 0, 600) * 0.7
        k += 1
        pos += 0.022 + 0.0025 * k
    return out


def steam(sec=0.9):
    n = int(SR * sec)
    x = np.arange(n) / n
    s = bandpass(rng.standard_normal(n), 1800, 9000)
    return s * np.clip(x / 0.05, 0, 1) * (1 - x) ** 1.5


def beep(sec=0.3):
    x = t(sec)
    g = ((x > 0.0) & (x < 0.09)) | ((x > 0.14) & (x < 0.23))
    return np.sign(np.sin(2 * np.pi * 1850 * x)) * 0.5 * g * 1.0


def shatter(sec=0.8):
    n = int(SR * sec)
    out = np.zeros(n)
    for _ in range(30):
        st = int(rng.random() * n * 0.5)
        f0 = 2500 + rng.random() * 5000
        k = int(SR * (0.05 + rng.random() * 0.2))
        k = min(k, n - st)
        tt = np.arange(k) / SR
        out[st:st + k] += np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / 0.04) * (0.3 + rng.random() * 0.7)
    out += bandpass(rng.standard_normal(n), 2000, 9000) * env(n, 0.001, 0.08)
    return out


def beat_loop(bars=4, bpm=100):
    beat = 60 / bpm
    n = int(SR * beat * 4 * bars)
    out = np.zeros(n)

    def put(sig, at):
        st = int(SR * at)
        k = min(len(sig), n - st)
        out[st:st + k] += sig[:k]

    kick = sweep(140, 42, 0.32) * env(int(SR * 0.32), 0.001, 0.11)
    clap = np.zeros(int(SR * 0.2))
    for d in (0, 0.012, 0.024):
        k = int(SR * 0.16)
        st = int(SR * d)
        clap[st:st + k] += bandpass(rng.standard_normal(k), 900, 4200) * env(k, 0.0005, 0.03)[:k]
    hat = bandpass(rng.standard_normal(int(SR * 0.04)), 6000, 14000) * env(int(SR * 0.04), 0.0003, 0.012)
    notes = [55.0, 43.65, 65.41, 49.0]
    for b in range(bars):
        for q in range(4):
            at = (b * 4 + q) * beat
            if q in (0, 2):
                put(kick, at)
            if q == 3 and b % 2 == 1:
                put(kick * 0.6, at + beat * 0.5)
            if q in (1, 3):
                put(clap * 0.55, at)
            put(hat * 0.35, at + beat * 0.5)
            put(hat * 0.18, at)
        # bass pluck per bar, on 1 and the "and" of 2
        for off in (0, 1.5):
            k = int(SR * beat * 1.2)
            tt = np.arange(k) / SR
            f0 = notes[b % 4]
            bass = (np.sin(2 * np.pi * f0 * tt) + 0.3 * np.sin(2 * np.pi * f0 * 2 * tt)) * np.exp(-tt / 0.28)
            put(bass * 0.6, b * 4 * beat + off * beat)
    # soft pad
    x = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * fr * x) for fr in (220.0, 261.63, 329.63)) / 3
    pad = lowpass(pad, 900) * (0.12 + 0.04 * np.sin(2 * np.pi * x / (beat * 8)))
    return out + pad


if __name__ == "__main__":
    write("whip", whip())
    write("impact", impact())
    write("riser", riser())
    write("clink", clink())
    write("clink_lo", clink(fc=1700.0))
    write("rustle", rustle())
    write("scratch", scratch())
    write("deflate", deflate())
    write("lever", lever())
    write("reel", reel())
    write("steam", steam())
    write("beep", beep())
    write("shatter", shatter())
    write("beat", beat_loop())
