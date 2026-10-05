#!/usr/bin/env python3
"""Put recorded voices (from tools/record.html) into the site.

    python3 tools/import_recordings.py ~/Downloads/huroofi-recordings-245.zip

For each recording in the zip: converts the WAV to MP3 (needs `lame`: brew install lame)
and saves it under every sound file it covers. Those files are marked "recorded" in
tools/audio_state.json, so tools/generate_audio.py will not replace them with the computer voice,
unless the text in data/letters.js changes later (then the old recording no longer matches).
Recordings whose text no longer exists are skipped and listed.
"""
import json, pathlib, shutil, subprocess, sys, tempfile, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import generate_audio as g  # noqa: E402  (reuse the item list, manifest and review-data writers)
import voice                # noqa: E402  (same trimming and loudness as tools/import_numbered.py)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    if not shutil.which("lame"):
        sys.exit("lame is not installed: brew install lame")
    zpath = pathlib.Path(sys.argv[1]).expanduser()
    items = g.build_items(g.load_letters())          # key -> (text, rate)
    state = json.loads(g.STATE.read_text(encoding="utf-8")) if g.STATE.exists() else {}

    with zipfile.ZipFile(zpath) as z, tempfile.TemporaryDirectory() as tmp:
        entries = json.loads(z.read("list.json").decode("utf-8"))
        added, stale = 0, []
        for e in entries:
            keys = [k for k in e["keys"] if k in items]
            if not keys:
                stale.append(e["text"]); continue
            wav = pathlib.Path(tmp) / "in.wav"
            wav.write_bytes(z.read(e["file"]))
            mp3 = pathlib.Path(tmp) / "out.mp3"
            samples, problems, info = voice.process(voice.decode(wav))
            voice.encode(samples, mp3)
            if problems:
                print(f"⚠ «{e['text']}»: " + "; ".join(problems))
            for k in keys:
                dest = ROOT / "audio" / f"{k}.mp3"
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(mp3, dest)
                state[k] = {"text": items[k][0], "recorded": True, "recorded_text": e["text"],
                            "seconds": info["spoken"]}
                added += 1
    g.STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    g.write_outputs(items, state, "recorded voice + " + g.VOICES[g.VOICE])
    print(f"{len(entries)} recordings -> {added} sound files updated")
    subprocess.run(["node", str(ROOT / "tools" / "build_sw.js")], check=False)  # offline copy must include the new sounds
    if stale:
        print("Skipped (text no longer in the site):", "، ".join(stale))


if __name__ == "__main__":
    main()
