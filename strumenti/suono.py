"""Genera il suono delle due animazioni (sintesi pura, nessun campione esterno).
Uso: python3 strumenti/suono.py   ->  rete/assets/audio/rete.wav, orbita/assets/audio/orbita.wav
I tempi qui sotto seguono quelli scritti nei due index.html."""
import wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def buf(sec):
    return np.zeros((int(sec * SR), 2))


def add(out, t0, sig, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    n = min(len(sig), len(out) - i)
    if n <= 0:
        return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i:i + n, 0] += sig[:n] * l * gain
    out[i:i + n, 1] += sig[:n] * r * gain


def tt(d):
    return np.arange(int(d * SR)) / SR


def bell(f, d=1.4, bright=1.0):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)
    s += 0.18 * bright * np.sin(2 * np.pi * f * 3.02 * t) * np.exp(-t * 10)
    return s * np.exp(-t * 4.2 / d * 1.4) * np.minimum(1, t / 0.004)


def tick(f, d=0.12):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 45) * np.minimum(1, t / 0.002)


def lowpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / fc) ** 4), len(x))


def highpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (f / fc) ** 4 / (1 + (f / fc) ** 4), len(x))


def whoosh(d, f0, f1, shape=2.0):
    """Rumore filtrato che cresce: il vento di un oggetto che passa o di una salita."""
    n = int(d * SR)
    t = np.arange(n) / n
    x = rng.standard_normal(n)
    lo = lowpass(x, f0)
    hi = lowpass(x, f1)
    mix = t ** 1.5
    return (lo * (1 - mix) + hi * mix) * np.sin(np.pi * t ** (1 / shape)) ** 2


def riser(d, f0, f1):
    t = tt(d)
    u = t / d
    f = f0 * (f1 / f0) ** (u ** 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.4 * np.sin(2 * ph)) * u ** 2.2


def impact(d=2.6):
    t = tt(d)
    f = 38 + 60 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.1)
    thud = lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t * 16) * 1.4
    return sub * 1.1 + thud


def chord(freqs, d=3.6):
    t = tt(d)
    s = np.zeros(len(t))
    for i, f in enumerate(freqs):
        for det in (-0.35, 0.3):
            ff = f * (1 + det / 100)
            for h, a in ((1, 1), (2, 0.42), (3, 0.2), (4, 0.1), (5, 0.05)):
                s += a * np.sin(2 * np.pi * ff * h * t + i + h) / len(freqs)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 1.15)
    return lowpass(s, 2600) * env


def reverb(x, d=2.4, wet=0.3):
    n = int(d * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 3.4)
        ir = lowpass(ir, 5200)
        ir[: int(0.012 * SR)] = 0
        m = len(x) + n
        y = np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir, m), m)[: len(x)]
        out[:, c] = y
    out /= np.max(np.abs(out)) + 1e-9
    return x + out * wet * np.max(np.abs(x))


def finish(out, fade_in, fade_out0, path):
    out = reverb(out)
    n = len(out)
    t = np.arange(n) / SR
    env = np.minimum(1, t / fade_in) * np.clip((n / SR - 0.02 - t) / (n / SR - 0.02 - fade_out0), 0, 1) ** 1.5
    out = out * env[:, None]
    out = np.tanh(out / (np.max(np.abs(out)) + 1e-9) * 1.25) * 0.89
    with wave.open(path, "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((out * 32767).astype("<i2").tobytes())
    print(path, round(n / SR, 2), "s")


D2, A2, D3, FS3, A3, D4, E4, FS4, A4, B4, D5, E5, FS5, A5, D6 = (
    73.42, 110.0, 146.83, 185.0, 220.0, 293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0, 1174.66)

# ---------------- RETE ----------------
o = buf(8)
t = tt(8)
drone = (np.sin(2 * np.pi * D2 * t) + 0.6 * np.sin(2 * np.pi * D2 * 1.006 * t) + 0.35 * np.sin(2 * np.pi * A2 * t))
drone *= np.clip(t / 4.6, 0, 1) ** 1.6 * np.where(t < 4.6, 1, np.exp(-(t - 4.6) * 5))
add(o, 0, drone, 0, 0.22)
# i sei nodi che si accendono
for tn, f, pan in ((0.3, D5, 0), (1.0, A4, -0.5), (1.25, FS5, 0.3), (1.8, E5, 0.1), (2.1, B4, -0.4), (2.35, A5, 0.5)):
    add(o, tn, bell(f, 1.6), pan, 0.3)
    add(o, tn, bell(f / 2, 1.2, 0.3), pan, 0.12)
# la rete intorno: tanti piccoli segnali, sempre più fitti
for k in range(70):
    tk = 0.6 + 3.6 * (k / 70) ** 0.75 + rng.uniform(-0.03, 0.03)
    add(o, tk, tick(rng.choice([D6, A5 * 2, FS5 * 2, E5 * 2, B4 * 2]) * rng.choice([1, 1, 2])), rng.uniform(-0.9, 0.9), 0.035 + 0.03 * k / 70)
# pallini delle linee tratteggiate
for line, t0 in enumerate((2.35, 2.5, 2.65, 2.85)):
    for k in range((13, 14, 21, 10)[line]):
        add(o, t0 + k * 0.036, tick(2400 + 60 * k, 0.06), -0.3 + 0.2 * line, 0.03)
# l'anello che si chiude
add(o, 3.6, highpass(whoosh(1.02, 300, 7000), 180), 0, 0.5)
add(o, 3.7, riser(0.9, 110, 880), 0, 0.2)
# impatto
add(o, 4.6, impact(), 0, 1.0)
add(o, 4.6, chord([D2, A2, D3, A3, D4, FS4, A4, E5]), 0, 0.85)
add(o, 4.6, highpass(lowpass(rng.standard_normal(SR), 6000), 1500) * np.exp(-tt(1) * 9), 0, 0.35)
for i, f in enumerate((D5, A5, E5 * 2, D6)):
    add(o, 5.0 + i * 0.09, bell(f, 2.2, 0.5), (-0.6, 0.6, -0.2, 0.3)[i], 0.1)
finish(o, 0.05, 7.1, "rete/assets/audio/rete.wav")

# ---------------- ORBITA ----------------
o = buf(8.5)
t = tt(8.5)
pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((D3, A3, D4, FS4))) / 4
pad *= np.clip(t / 3.5, 0, 1) ** 1.3 * np.where(t < 4.65, 1, np.exp(-(t - 4.65) * 4))
add(o, 0, pad, 0, 0.16)
scale = [D4, E4, FS4, A4, B4, D5, E5, FS5, A5, B4 * 2, D6, E5 * 2]
FLY = 1.45
for k in range(24):  # pallini dell'anello: passaggio e atterraggio, una scala che sale
    t0 = 0.4 + k * 0.085
    add(o, t0 + 0.25, highpass(whoosh(0.85, 500, 5000, 1.4), 300), -0.8 + 1.6 * (k % 5) / 4, 0.085)
    add(o, t0 + FLY, bell(scale[k % 12] * (1 if k < 12 else 2), 0.9, 0.6), np.cos(k / 24 * 2 * np.pi + 1.7) * 0.7, 0.085)
for j in range(6):  # i sei nodi
    t0 = 2.5 + j * 0.13
    add(o, t0 + 0.2, highpass(whoosh(1.0, 300, 3500, 1.4), 200), 0.3, 0.16)
    add(o, t0 + FLY, bell((D4, A4, FS4, D5, A4, FS5)[j], 1.6), (-0.5, -0.4, 0, 0.2, 0.1, 0.5)[j], 0.2)
add(o, 3.8, highpass(whoosh(0.87, 300, 8000), 200), 0, 0.42)
add(o, 3.85, riser(0.8, 147, 1174), 0, 0.17)
add(o, 4.65, impact(), 0, 1.0)
add(o, 4.65, chord([D2, A2, D3, A3, D4, FS4, A4, E5]), 0, 0.85)
add(o, 4.65, highpass(lowpass(rng.standard_normal(SR), 6000), 1500) * np.exp(-tt(1) * 9), 0, 0.35)
for a, b, t0, d in ((2, 0, 4.78, .3), (2, 1, 4.86, .3), (1, 5, 4.96, .38), (5, 4, 5.08, .3), (5, 3, 5.16, .32)):
    add(o, t0, highpass(whoosh(d, 800, 6000, 1.2), 500), 0, 0.1)
for line, t0 in enumerate((5.0, 5.1, 5.2, 5.32)):
    for k in range((13, 14, 21, 10)[line]):
        add(o, t0 + k * 0.03, tick(2400 + 60 * k, 0.06), -0.3 + 0.2 * line, 0.028)
for i, f in enumerate((D5, A5, E5 * 2, D6)):
    add(o, 5.35 + i * 0.09, bell(f, 2.2, 0.5), (-0.6, 0.6, -0.2, 0.3)[i], 0.1)
finish(o, 0.3, 7.6, "orbita/assets/audio/orbita.wav")

# ---------------- IDENT (versione chiara, sul brand system) ----------------
# Suono leggero: un tocco morbido per ogni nodo, niente colpi da cinema.
def pluck(f, d=0.9):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 14)
    return s * np.exp(-t * 7) * np.minimum(1, t / 0.006)


o = buf(5)
for tn, f, pan in ((0.22, D4, 0), (0.74, A4, -0.4), (0.82, FS4, 0.3), (1.16, B4, 0.1), (1.42, D5, -0.4), (1.5, E5, 0.4)):
    add(o, tn, pluck(f), pan, 0.3)
for a, b, t0, d in ((2, 0, .46, .34), (2, 1, .54, .34), (1, 5, .86, .38), (5, 4, 1.18, .3), (5, 3, 1.24, .32)):
    add(o, t0, highpass(whoosh(d, 900, 5000, 1.2), 700), 0, 0.05)
for line, t0 in enumerate((1.46, 1.54, 1.6, 1.7)):
    for k in range((13, 14, 21, 10)[line]):
        add(o, t0 + k * 0.02, tick(1800 + 50 * k, 0.05), -0.3 + 0.2 * line, 0.022)
# il disco che si apre: un soffio e un accordo caldo e corto
t = tt(0.7)
thump = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t * 18)) / SR) * np.exp(-t * 7)
add(o, 2.08, thump, 0, 0.5)
t = tt(2.6)
warm = sum(np.sin(2 * np.pi * f * t + i) + 0.3 * np.sin(4 * np.pi * f * t) for i, f in enumerate((D3, A3, D4, FS4, A4))) / 5
add(o, 2.08, warm * np.minimum(1, t / 0.03) * np.exp(-t * 1.6), 0, 0.5)
add(o, 2.3, pluck(D5, 1.2), 0, 0.14)
# il logo che rotola, il nome che esce
add(o, 2.78, highpass(whoosh(0.9, 400, 3500, 1.0), 300), -0.2, 0.16)
for i, f in enumerate((A4, D5, FS5)):
    add(o, 3.45 + i * 0.07, pluck(f, 1.4), (-0.3, 0, 0.3)[i], 0.14)
finish(o, 0.02, 4.4, "ident/assets/audio/ident.wav")
