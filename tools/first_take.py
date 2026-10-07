#!/usr/bin/env python3
"""Keep only the FIRST try of a recording that contains several tries of the same text.

    python3 tools/first_take.py ~/Downloads/002.mp3 [more files...]   → writes <name>.first.mp3 next to each file
    python3 tools/first_take.py --check ~/Downloads/002.mp3            → only shows the tries found

The audio of the first try is NOT re-encoded: the MP3 is cut at its own frame boundaries (~26 ms each),
so the kept part is byte-for-byte what was recorded. The cut is placed in the silence after the first
try: as late as possible (so soft endings like ف س ش are kept) but never including sound from the second try.
Only MP3 input is supported (other formats would need re-encoding).
"""
import array, math, pathlib, subprocess, sys, tempfile, wave

BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]          # MPEG-1 Layer III
BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]              # MPEG-2/2.5 Layer III
SR = {3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000]}


def split_mp3(data):
    i = 0
    if data[:3] == b"ID3":
        i = 10 + ((data[6] << 21) | (data[7] << 14) | (data[8] << 7) | data[9])
    head, frames = data[:i], []
    while i + 4 <= len(data):
        h = data[i:i + 4]
        if h[0] != 0xFF or (h[1] & 0xE0) != 0xE0:
            break
        ver = (h[1] >> 3) & 3
        rate = SR[ver][(h[2] >> 2) & 3]
        if ver == 3:
            size = 144000 * BR1[h[2] >> 4] // rate + ((h[2] >> 1) & 1)
        else:
            size = 72000 * BR2[h[2] >> 4] // rate + ((h[2] >> 1) & 1)
        frames.append(data[i:i + size])
        i += size
    return head, frames, data[i:]


def levels(mp3_bytes):
    """Loudness in dB for every 10 ms of decoded audio."""
    with tempfile.TemporaryDirectory() as d:
        src, wav = pathlib.Path(d) / "x.mp3", pathlib.Path(d) / "x.wav"
        src.write_bytes(mp3_bytes)
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@44100", "-c", "1", str(src), str(wav)],
                       check=True, capture_output=True)
        with wave.open(str(wav)) as w:
            a = array.array("h", w.readframes(w.getnframes()))
    fr = 441
    return [20 * math.log10(max(math.sqrt(sum(x * x for x in a[k:k + fr]) / fr), 1) / 32768)
            for k in range(0, len(a) - fr, fr)]


def tries(db, n=None):
    """The tries, found by their LOUD parts (within 30 dB of the loudest moment), in 10 ms steps.
    Soft trailing sounds between tries are ignored here; the cut itself is placed later, as late as possible
    before the next try, so those soft endings stay with the first try. Gaps under 200 ms are joined."""
    peak, noise = max(db), sorted(db)[len(db) // 10]
    th = max(noise + 10, peak - 30)
    segs, i = [], 0
    while i < len(db):
        if db[i] > th:
            j = i
            while j < len(db) and db[j] > th:
                j += 1
            if segs and i - segs[-1][1] < (4 if n else 20):
                segs[-1][1] = j
            else:
                segs.append([i, j])
            i = j
        else:
            i += 1
    if n and len(segs) > n:
        # Expected n tries: keep the n-1 clearest gaps (longest and deepest), join the rest.
        def gap_score(k):
            a, b = segs[k][1], segs[k + 1][0]
            return (b - a) * (peak - min(db[a:b] or [peak]))
        while len(segs) > n:
            k = min(range(len(segs) - 1), key=gap_score)
            segs[k] = [segs[k][0], segs[k + 1][1]]
            del segs[k + 1]
    return segs, noise


def first_take(path, n=None):
    data = pathlib.Path(path).read_bytes()
    head, frames, tail = split_mp3(data)
    if not frames:
        raise RuntimeError("not an MP3 file")
    if any(t in frames[0][:200] for t in (b"Xing", b"Info")):
        raise RuntimeError("MP3 has a Xing/Info header; not supported yet")
    db = levels(data)
    segs, noise = tries(db, n)
    if len(segs) < 2:
        return None, segs
    h = frames[0]
    ver = (h[1] >> 3) & 3
    dur = (1152 if ver == 3 else 576) / SR[ver][(h[2] >> 2) & 3]   # seconds per MP3 frame
    # Exact start of the 2nd try: walk back from its loud part down the steep rise to the foot.
    a, b = segs[0][1], segs[1][0]
    k = b
    while k - 1 > a and db[k - 1] < db[k] - 2:
        k -= 1
    onset = k + 1 if k < b else b                         # first 10 ms step of the rise
    quiet = min(db[a:onset] or [db[b]])
    before = max(db[max(a, onset - 6):onset] or [quiet])     # how loud the original is just before the 2nd try
    best = None
    # The latest frame boundary that ends before the 2nd try starts (5 ms safety), checked by decoding:
    # the end of the cut must be no louder than the original just before the 2nd try (+3 dB).
    for n in range(len(frames), 0, -1):
        if n * dur > onset / 100 - 0.005:
            continue
        cut = head + b"".join(frames[:n])
        d2 = levels(cut)
        if len(d2) * 0.01 < segs[0][1] / 100:          # must keep all of try 1
            break
        if max(d2[-2:]) <= before + 3:
            best = cut
            break
    if best is None:
        raise RuntimeError("could not find a clean cut between the first and second try")
    return best, segs


def main():
    check = "--check" in sys.argv
    n = None
    args = [x for x in sys.argv[1:] if x != "--check"]
    if "--tries" in args:          # e.g. --tries 3 when every file has three tries
        k = args.index("--tries"); n = int(args[k + 1]); del args[k:k + 2]
    for a in args:
        p = pathlib.Path(a).expanduser()
        try:
            out, segs = first_take(p, n)
        except Exception as e:
            print(f"✗ {p.name}: {e}"); continue
        found = ", ".join(f"{s/100:.2f}–{e/100:.2f}s" for s, e in segs)
        if out is None:
            print(f"• {p.name}: only one try found ({found}); nothing to cut"); continue
        dest = p.with_name(p.stem + ".first.mp3")
        print(f"✓ {p.name}: {len(segs)} tries ({found}) → keep the first, {len(levels(out))/100:.2f}s")
        if not check:
            dest.write_bytes(out)
            print(f"   saved {dest}")


if __name__ == "__main__":
    main()
