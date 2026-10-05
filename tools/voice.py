"""Shared processing for human recordings (used by import_numbered.py and import_recordings.py).

decode(path)  -> mono 16-bit samples at 24 kHz (any common format; afconvert on macOS, ffmpeg if installed)
process(s)    -> (samples, report): silence trimmed using the background-noise level (so soft endings such as
                 ف س ش ث ح are kept), loudness matched to the computer voice, 10 ms fades, problems listed
encode(s, mp3)-> MP3 file (needs lame: brew install lame)
"""
import array, math, pathlib, shutil, subprocess, tempfile, wave

RATE = 24000
TARGET_DB = -18.7      # speech loudness of the computer voice (measured), so mixed voices sound equally loud
PEAK_DB = -1.0         # never louder than this
LEAD, TAIL = 0.08, 0.25


def _db(v):
    return 20 * math.log10(max(v, 1e-9) / 32768)


def decode(path):
    path = pathlib.Path(path)
    with tempfile.TemporaryDirectory() as d:
        wav = pathlib.Path(d) / "x.wav"
        ok = False
        if shutil.which("afconvert"):
            ok = subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{RATE}", "-c", "1", str(path), str(wav)],
                                capture_output=True).returncode == 0
        if not ok and shutil.which("ffmpeg"):
            ok = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(RATE),
                                 "-sample_fmt", "s16", str(wav)], capture_output=True).returncode == 0
        if not ok:
            raise RuntimeError(f"cannot read {path.name} (for WhatsApp .opus/.ogg files: brew install ffmpeg)")
        with wave.open(str(wav)) as w:
            return array.array("h", w.readframes(w.getnframes()))


def process(s):
    report = []
    fr = RATE // 100
    rms = [math.sqrt(sum(x * x for x in s[i:i + fr]) / fr) for i in range(0, max(len(s) - fr, 1), fr)]
    if not rms or max(rms) < 30:
        raise RuntimeError("no voice found (silent file)")
    peak_rms = max(rms)
    noise = sorted(rms)[max(0, len(rms) // 10)]
    th = max(noise * 3.2, peak_rms * 0.01)             # 10 dB above the room noise, at most 40 dB below the voice
    on = [i for i, v in enumerate(rms) if v > th]
    first, last = on[0], on[-1]
    if sum(1 for x in s if abs(x) >= 32700) > 10:
        report.append("clipping (too loud / distorted)")
    if _db(noise) > -45:
        report.append(f"background noise is high ({_db(noise):.0f} dB)")
    # A cut-off word is LOUD at the very edge of the file (within 20 dB of the voice);
    # a natural start or ending is quiet there, even when it begins early.
    edge = peak_rms * 0.1
    if max(rms[:2]) > edge:
        report.append("loud at the very first moment: the first sound may be cut")
    if max(rms[-3:]) > edge:
        report.append("loud at the very last moment: the last sound may be cut")
    start = max(0, int((first * 0.01 - LEAD) * RATE))
    end = min(len(s), int(((last + 1) * 0.01 + TAIL) * RATE))
    seg = s[start:end]
    speech = [v for v in rms[first:last + 1] if v > peak_rms * 0.1]
    level = math.sqrt(sum(v * v for v in speech) / len(speech))
    gain = 10 ** ((TARGET_DB - _db(level)) / 20)
    peak = max(abs(x) for x in seg) or 1
    gain = min(gain, (10 ** (PEAK_DB / 20)) * 32767 / peak)
    n, fade = len(seg), int(RATE * 0.01)
    out = array.array("h", (max(-32768, min(32767, int(seg[k] * gain * min(1, k / fade, (n - 1 - k) / fade)))) for k in range(n)))
    report_info = {"seconds": round(n / RATE, 2), "spoken": round((last - first + 1) * 0.01, 2),
                   "noise_db": round(_db(noise)), "gain_db": round(20 * math.log10(gain), 1)}
    return out, report, report_info


def encode(samples, mp3):
    if not shutil.which("lame"):
        raise RuntimeError("lame is not installed: brew install lame")
    with tempfile.TemporaryDirectory() as d:
        wav = pathlib.Path(d) / "x.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(samples.tobytes())
        subprocess.run(["lame", "--quiet", "-m", "m", "-V", "5", str(wav), str(mp3)], check=True)


def to_mp3_unchanged(src, mp3):
    """Change only the file format to MP3: same sample rate and channels, no trimming, no volume change."""
    src = pathlib.Path(src)
    with tempfile.TemporaryDirectory() as d:
        wav = pathlib.Path(d) / "x.wav"
        ok = shutil.which("afconvert") and subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16", str(src), str(wav)], capture_output=True).returncode == 0
        if not ok and shutil.which("ffmpeg"):
            ok = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-sample_fmt", "s16", str(wav)],
                                capture_output=True).returncode == 0
        if not ok:
            raise RuntimeError(f"cannot read {src.name} (for WhatsApp .opus/.ogg files: brew install ffmpeg)")
        subprocess.run(["lame", "--quiet", "-V", "2", str(wav), str(mp3)], check=True)   # high quality
