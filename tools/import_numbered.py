#!/usr/bin/env python3
"""Install recordings named by their number in docs/RECORDING_LIST.md (e.g. 001.mp3, 012.m4a, "12.ogg").

    python3 tools/import_numbered.py ~/Desktop/001.mp3 ~/Downloads/recordings/      (files and/or folders)
    python3 tools/import_numbered.py --check ~/Downloads/recordings/               (report only, change nothing)

Each recording is trimmed, matched in loudness to the computer voice, converted to MP3 and saved under every
sound file its text is used for. Those files are marked "recorded", so tools/generate_audio.py never replaces
them (unless the text changes). Numbers come from tools/recording_numbers.json, written together with the list
that was sent out, so they stay valid even if the list is regenerated later.
"""
import json, pathlib, re, shutil, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import generate_audio as g   # noqa: E402
import voice                 # noqa: E402

AUDIO_EXT = {".mp3", ".m4a", ".aac", ".wav", ".caf", ".aiff", ".aif", ".flac", ".ogg", ".opus", ".oga", ".amr", ".3gp", ".mp4", ".webm"}


def gather(args):
    out = []
    for a in args:
        p = pathlib.Path(a).expanduser()
        if p.is_dir():
            out += sorted(f for f in p.rglob("*") if f.suffix.lower() in AUDIO_EXT)
        elif p.exists():
            out.append(p)
        else:
            print(f"not found: {a}")
    return out


def main():
    args = [a for a in sys.argv[1:] if a != "--check"]
    check = "--check" in sys.argv
    if not args:
        sys.exit(__doc__)
    numbers = json.loads((ROOT / "tools" / "recording_numbers.json").read_text(encoding="utf-8"))
    items = g.build_items(g.load_letters())
    state = json.loads(g.STATE.read_text(encoding="utf-8")) if g.STATE.exists() else {}
    done = 0
    for f in gather(args):
        m = re.search(r"\d+", f.stem)
        entry = numbers.get(str(int(m.group()))) if m else None
        if not entry:
            print(f"✗ {f.name}: no number from the list in the file name"); continue
        n = int(m.group())
        keys = [k for k, t in entry["keys"].items() if k in items and items[k][0] == t]
        stale = [k for k in entry["keys"] if k not in keys]
        if stale:
            print(f"⚠ {n:03d}: the site text changed since the list was sent; skipped {', '.join(stale)}")
        if not keys:
            continue
        try:
            samples, problems, info = voice.process(voice.decode(f))
        except Exception as e:
            print(f"✗ {n:03d} «{entry['text']}»: {e}"); continue
        mark = "⚠" if problems else "✓"
        print(f"{mark} {n:03d} «{entry['text']}» {info['spoken']}s spoken, noise {info['noise_db']} dB, "
              f"volume {info['gain_db']:+} dB → {len(keys)} file(s)" + ("".join("\n      - " + p for p in problems)))
        if check:
            continue
        with tempfile.TemporaryDirectory() as d:
            mp3 = pathlib.Path(d) / "out.mp3"
            voice.encode(samples, mp3)
            for k in keys:
                dest = ROOT / "audio" / f"{k}.mp3"
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(mp3, dest)
                state[k] = {"text": items[k][0], "recorded": True, "recorded_text": entry["text"],
                            "source": f.name, "number": n, "seconds": info["spoken"]}
        done += 1
    if check:
        print("\n(check only: nothing was changed)"); return
    g.STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    g.write_outputs(items, state, "recorded voice + " + g.VOICES[g.VOICE])
    print(f"\n{done} recording(s) installed")


if __name__ == "__main__":
    main()
