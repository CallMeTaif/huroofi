#!/usr/bin/env python3
"""Generate every sound file for Huroofi with Microsoft Edge neural voices (edge-tts).

Run once during development; the MP3 files are committed, so the site plays them offline.
Only new or changed texts are generated again, so it is safe to re-run after editing data/letters.js.

    pip install edge-tts certifi
    python3 tools/generate_audio.py                  # default voice (see VOICE below)
    python3 tools/generate_audio.py --voice hamed    # switch the whole site to the male voice
    python3 tools/generate_audio.py --samples        # only make docs/voice-samples/*.mp3
    python3 tools/generate_audio.py --force          # re-make everything

Needs Node.js (to read data/letters.js) and an internet connection while generating.
Outputs: audio/**.mp3, data/audio-manifest.js (list of files for the site), tools/audio_state.json.
"""
import argparse, asyncio, json, pathlib, random, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICES = {"zariyah": "ar-SA-ZariyahNeural", "hamed": "ar-SA-HamedNeural"}
VOICE = "zariyah"          # the voice the teacher chose
RATE = "-10%"              # a little slower than normal, for young children
DESC_RATE = "-15%"         # descriptions and instructions even slower
LONG_RATE = "-40%"         # long-vowel syllables (بَا بُو بِي): slower, so the long vowel is clearly long
OVERRIDES = ROOT / "tools" / "audio_overrides.json"
REVIEW = ROOT / "tools" / "audio-review-data.js"
STATE = ROOT / "tools" / "audio_state.json"

FATHA, DAMMA, KASRA, SUKUN = "َ", "ُ", "ِ", "ْ"

# Letter names with full tashkeel, so the voice reads them correctly.
SPOKEN_NAMES = {
    "alif": "أَلِف", "ba": "بَاء", "ta": "تَاء", "tha": "ثَاء", "jim": "جِيم", "ha": "حَاء", "kha": "خَاء",
    "dal": "دَال", "dhal": "ذَال", "ra": "رَاء", "zay": "زَاي", "sin": "سِين", "shin": "شِين", "sad": "صَاد",
    "dad": "ضَاد", "taa": "طَاء", "dhaa": "ظَاء", "ain": "عَيْن", "ghain": "غَيْن", "fa": "فَاء", "qaf": "قَاف",
    "kaf": "كَاف", "lam": "لَام", "mim": "مِيم", "nun": "نُون", "haa": "هَاء", "waw": "وَاو", "ya": "يَاء",
}

# Fixed phrases used by the pages and exercises. key -> text
PHRASES = {
    "home": "مَرْحَبًا! اخْتَرْ حَرْفًا.",
    "great1": "أَحْسَنْت!",
    "great2": "مُمْتَاز!",
    "great3": "رَائِع!",
    "try_again": "حَاوِلْ مَرَّةً أُخْرَى.",
    "round_done": "رَائِع! انْتَهَتِ الْجَوْلَة.",
    "sec_meet": "تَعَرَّفْ عَلَى الْحَرْف.",
    "sec_forms": "أَشْكَالُ الْحَرْف.",
    "sec_vowels": "الْحَرَكَات.",
    "sec_words": "كَلِمَاتٌ وَصُوَر.",
    "sec_videos": "شَاهِدْ وَتَعَلَّم.",
    "sec_practice": "تَمَرَّن.",
    "ex_listen": "اسْمَعْ، ثُمَّ اخْتَرِ الْحَرْفَ الصَّحِيح.",
    "ex_trace": "اكْتُبِ الْحَرْفَ بِإِصْبَعِك.",
    "ex_match": "صِلِ الْحَرْفَ بِالصُّورَة.",
    "ex_find": "اضْغَطْ عَلَى الْكَلِمَاتِ الَّتِي فِيهَا الْحَرْف.",
    "ex_where": "أَيْنَ الْحَرْف؟",
    "pos_initial": "فِي الْبِدَايَة.",
    "pos_medial": "فِي الْوَسَط.",
    "pos_final": "فِي النِّهَايَة.",
    "review": "تَمَارِينُ الْمُرَاجَعَة.",
    "who": "مَنْ يَلْعَبُ الْآنَ؟",
}

SAMPLE_TEXT = "مَرْحَبًا يَا أَصْدِقَائِي! هَذَا حَرْفُ الْبَاءِ. بَ، بُ، بِ. بَطَّة، بَيْت."


def load_letters():
    js = ("global.window={};require(process.argv[1]);"
          "process.stdout.write(JSON.stringify(window.LETTERS))")
    out = subprocess.run(["node", "-e", js, str(ROOT / "data" / "letters.js")],
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def syllables(letter):
    """The 7 vowel buttons: fatha, damma, kasra, sukun, long a, long u, long i.
    Returns (shown text, spoken text) pairs. Sukun cannot be said alone, so it gets a carrier."""
    c = letter["letter"]
    shown = letter.get("vowels") or [c + FATHA, c + DAMMA, c + KASRA, c + SUKUN,
                                     c + FATHA + "ا", c + DAMMA + "و", c + KASRA + "ي"]
    spoken = [t + "." for t in shown[:3]]                  # a full stop stops the voice clipping the vowel
    spoken.append(("يَ" if c == "أ" else "أَ") + shown[3])  # sukun needs a carrier: «أَبْ», and «يَأْ» for hamza
    spoken += shown[4:]                                     # long vowels are read slower instead (LONG_RATE)
    return list(zip(shown, spoken))


def build_items(letters):
    """Every sound the site needs: key -> (text, rate). The key is the file path under audio/."""
    items = {}
    for l in letters:
        base = f"letters/{l['id']}/"
        items[base + "name"] = (SPOKEN_NAMES.get(l["id"], l["name"]), RATE)
        items[base + "desc"] = (l["description"], DESC_RATE)
        for i, (_, spoken) in enumerate(syllables(l), 1):
            items[base + f"v{i}"] = (spoken, LONG_RATE if i >= 5 else RATE)
        for shape, word in (l.get("formExamples") or {}).items():
            if word:
                items[base + f"form-{shape}"] = (word, RATE)
        for w in l["words"]:
            slug = w["image"].rsplit("/", 1)[-1].rsplit(".", 1)[0]
            items[f"words/{slug}"] = (w["word"], RATE)
    for k, t in PHRASES.items():
        items[f"phrases/{k}"] = (t, DESC_RATE)
    # Hand fixes after listening: {"letters/ka/v5": {"text": "كَاا", "rate": "-30%"}}
    try:
        for key, o in json.loads(OVERRIDES.read_text(encoding="utf-8")).items():
            if key in items and not key.startswith("_"):
                items[key] = (o.get("text", items[key][0]), o.get("rate", items[key][1]))
    except (OSError, ValueError):
        pass
    return items


def voiced_span(mp3):
    """(start, end) in seconds of the spoken part of a clip. Needs macOS afconvert; returns None elsewhere."""
    import array, shutil, tempfile, wave
    if not shutil.which("afconvert"):
        return None
    with tempfile.TemporaryDirectory() as d:
        wav = pathlib.Path(d) / "x.wav"
        r = subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@16000", "-c", "1", str(mp3), str(wav)],
                           capture_output=True)
        if r.returncode:
            return None
        with wave.open(str(wav)) as f:
            a = array.array("h", f.readframes(f.getnframes()))
    fr = 160  # 10 ms frames
    rms = [(sum(x * x for x in a[i:i + fr]) / fr) ** .5 for i in range(0, len(a) - fr, fr)]
    if not rms:
        return None
    th = max(rms) * 0.06
    on = [i for i, v in enumerate(rms) if v > th]
    return (on[0] * 0.01, (on[-1] + 1) * 0.01) if on else None


def voiced_seconds(mp3):
    span = voiced_span(mp3)
    return round(span[1] - span[0], 2) if span else None


def mp3_frames(data):
    """Split an MPEG-2 Layer III stream (what edge-tts produces) into whole frames."""
    rates = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    srs = {0: 22050, 1: 24000, 2: 16000}
    frames, i = [], 0
    while i + 4 <= len(data):
        b1, b2 = data[i + 1], data[i + 2]
        if data[i] != 0xFF or (b1 & 0xFE) != 0xF2 or (b2 >> 4) in (0, 15) or (b2 >> 2 & 3) not in srs:
            return None  # not the format we expect: leave the file alone
        size = 72000 * rates[b2 >> 4] // srs[b2 >> 2 & 3] + (b2 >> 1 & 1)
        frames.append(data[i:i + size])
        i += size
    return frames


FRAME_SEC = 576 / 24000   # one MPEG-2 Layer III frame at 24 kHz = 24 ms
LEAD_KEEP, TAIL_KEEP = 0.07, 0.22


def trim_silence(mp3):
    """Cut the silence edge-tts puts before and after the speech, by dropping whole MP3 frames
    (no re-encoding, so no quality loss). A small margin is kept on both sides."""
    span = voiced_span(mp3)
    frames = mp3_frames(mp3.read_bytes())
    if not span or not frames:
        return False
    first = max(0, int((span[0] - LEAD_KEEP) / FRAME_SEC))
    last = min(len(frames), int((span[1] + TAIL_KEEP) / FRAME_SEC) + 1)
    if first == 0 and last == len(frames):
        return True
    mp3.write_bytes(b"".join(frames[first:last]))
    return True


# Clips shorter than this (spoken part, seconds) are flagged for listening.
MIN_SECONDS = {"short": 0.18, "long": 0.2, "name": 0.2, "word": 0.25}


def kind(key):
    last = key.rsplit("/", 1)[-1]
    if last in ("v1", "v2", "v3", "v4"):
        return "short"
    if last in ("v5", "v6", "v7"):
        return "long"
    if last == "name":
        return "name"
    if key.startswith("words/") or last.startswith("form-"):
        return "word"
    return None


async def synth(text, voice, rate, dest, retries=4):
    import edge_tts
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    for attempt in range(retries):
        try:
            await edge_tts.Communicate(text, voice, rate=rate).save(str(tmp))
            if tmp.stat().st_size < 1000:
                raise RuntimeError("audio too small")
            tmp.replace(dest)
            return
        except Exception as e:  # network hiccups or rate limits: wait and retry
            if attempt == retries - 1:
                raise RuntimeError(f"{dest.name}: {e}") from e
            await asyncio.sleep(2 * (attempt + 1) + random.random())


def _certifi_fix():
    # python.org builds on macOS have no root certificates; point aiohttp/ssl at certifi's.
    try:
        import certifi, os
        os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    except ImportError:
        pass


async def run(args):
    voice_name = args.voice
    voice = VOICES[voice_name]

    if args.samples:
        out = ROOT / "docs" / "voice-samples"
        for name, v in VOICES.items():
            await synth(SAMPLE_TEXT, v, RATE, out / f"{name}.mp3")
            print(f"  sample: docs/voice-samples/{name}.mp3")
        return

    letters = load_letters()
    items = build_items(letters)
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        state = {}

    todo = []
    for key, (text, rate) in items.items():
        dest = ROOT / "audio" / f"{key}.mp3"
        want = {"text": text, "voice": voice, "rate": rate}
        prev = state.get(key, {})
        # A human recording (tools/import_recordings.py) is kept as long as its text has not changed.
        if prev.get("recorded") and prev.get("text") == text and dest.exists():
            continue
        old = {k: v for k, v in prev.items() if k not in ("seconds", "trimmed")}
        if args.force or not dest.exists() or old != want:
            todo.append((key, text, rate, dest, want))
    print(f"{len(items)} sounds, {len(todo)} to generate with {voice}")

    sem = asyncio.Semaphore(6)
    done = 0
    failed = []

    async def work(key, text, rate, dest, want):
        nonlocal done
        async with sem:
            try:
                await synth(text, voice, rate, dest)
                want["trimmed"] = trim_silence(dest)
                want["seconds"] = voiced_seconds(dest)
                state[key] = want
            except Exception as e:
                failed.append((key, str(e)))
            done += 1
            if done % 50 == 0 or done == len(todo):
                print(f"  {done}/{len(todo)}")

    await asyncio.gather(*(work(*t) for t in todo))

    for key in items:
        dest = ROOT / "audio" / f"{key}.mp3"
        if key in state and dest.exists() and not state[key].get("trimmed") and not state[key].get("recorded"):
            state[key]["trimmed"] = trim_silence(dest)
            state[key]["seconds"] = voiced_seconds(dest)

    # Remove sounds that are no longer used (e.g. a word was replaced).
    for mp3 in (ROOT / "audio").rglob("*.mp3"):
        key = mp3.relative_to(ROOT / "audio").with_suffix("").as_posix()
        if key not in items:
            mp3.unlink()
            state.pop(key, None)
            print(f"  removed unused {key}.mp3")

    STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    write_outputs(items, state, voice)
    if failed:
        print("FAILED:")
        for k, e in failed:
            print("  ", k, e)
        sys.exit(1)


def write_outputs(items, state, voice):
    """Write data/audio-manifest.js (files the site may play) and tools/audio-review-data.js."""
    present = sorted(k for k in items if (ROOT / "audio" / f"{k}.mp3").exists())
    manifest = ("// Generated by tools/generate_audio.py — do not edit by hand.\n"
                f"// Voice: {voice}. Lists the MP3 files that exist in audio/.\n"
                "window.AUDIO_FILES = " + json.dumps({k: 1 for k in present}, indent=0) + ";\n")
    (ROOT / "data" / "audio-manifest.js").write_text(manifest, encoding="utf-8")
    print(f"manifest: {len(present)} files")
    subprocess.run(["node", str(ROOT / "tools" / "build_sw.js")], check=False)  # offline copy must include the new sounds
    flagged, review = [], {}
    for k in present:
        st = state.get(k, {})
        secs, kd = st.get("seconds"), kind(k)
        flag = bool(kd and secs is not None and secs < MIN_SECONDS[kd] and not st.get("recorded"))
        if flag:
            flagged.append(k)
        review[k] = {"spoken": st.get("recorded_text") or st.get("text"), "rate": st.get("rate"), "seconds": secs,
                     "flag": flag, "recorded": bool(st.get("recorded"))}
    REVIEW.write_text("// Generated by tools/generate_audio.py\nwindow.AUDIO_REVIEW = "
                      + json.dumps({"voice": voice, "clips": review}, ensure_ascii=False, indent=0) + ";\n",
                      encoding="utf-8")
    recorded = sum(1 for k in present if state.get(k, {}).get("recorded"))
    print(f"recorded by a person: {recorded}; flagged for listening: {len(flagged)}")
    for k in flagged:
        print(f"  {k}  «{state[k]['text']}»  {state[k]['seconds']}s")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voice", choices=VOICES, default=VOICE)
    p.add_argument("--force", action="store_true", help="re-make every file")
    p.add_argument("--samples", action="store_true", help="only make the two voice samples")
    args = p.parse_args()
    _certifi_fix()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
