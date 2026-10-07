#!/usr/bin/env python3
"""Download the fonts and OpenMoji pictures used by the site (run once).

Usage:  python3 tools/fetch_assets.py
Needs:  pip install fonttools brotli certifi  (to convert fonts to small .woff2 files)

Reads data/letters.js, finds every {emoji, image} pair, and saves the matching
OpenMoji SVG to that image path. Existing files are kept (delete to re-fetch).
"""
import io, pathlib, re, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OPENMOJI = "https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/{}.svg"
FONTS = {
    # file name -> source URL (all SIL Open Font License)
    "NotoNaskhArabic-Regular": "https://github.com/google/fonts/raw/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
    "Tajawal-Medium": "https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Medium.ttf",
    "Tajawal-Bold": "https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf",
    "Tajawal-ExtraBold": "https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-ExtraBold.ttf",
}
# Emoji used by the interface itself (not tied to a word).
UI_EMOJI = {
    "home": "🏠", "speaker": "🔊", "star": "⭐", "play": "▶️", "next": "⬅️", "prev": "➡️",
    "teacher": "🧑‍🏫", "review": "🔁", "eraser": "🧽", "check": "✅", "pencil": "✏️",
    "ear": "👂", "search": "🔍", "link": "🔗", "book": "📖", "film": "🎬", "abc": "🔤",
    "party": "🎉", "sparkles": "✨", "trophy": "🏆", "flower": "🌼", "sun": "🌞", "family": "👪",
}


def _ssl_context():
    # python.org builds on macOS ship without root certificates; use certifi if present.
    import ssl
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


_CTX = _ssl_context()

# Child profile pictures (no names are ever stored; each child picks an animal).
AVATARS = {
    "lion": "🦁", "tiger": "🐯", "bear": "🐻", "panda": "🐼", "koala": "🐨", "rabbit": "🐰", "fox": "🦊",
    "frog": "🐸", "monkey": "🐵", "penguin": "🐧", "owl": "🦉", "turtle": "🐢", "octopus": "🐙", "unicorn": "🦄",
    "dolphin": "🐬", "whale": "🐳", "giraffe": "🦒", "elephant": "🐘", "ladybug": "🐞", "butterfly": "🦋",
    "bee": "🐝", "cat": "🐱", "dog": "🐶", "cow": "🐮", "chick": "🐤", "parrot": "🦜", "fish": "🐠",
    "dinosaur": "🦖", "hedgehog": "🦔", "snail": "🐌",
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "huroofi-asset-fetch"})
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as r:
        return r.read()


def openmoji_candidates(emoji):
    cps = [f"{ord(c):04X}" for c in emoji]
    yield "-".join(cps)
    no_fe0f = [c for c in cps if c != "FE0F"]
    if no_fe0f != cps:
        yield "-".join(no_fe0f)


def fetch_emoji(emoji, dest):
    if dest.exists():
        return "kept"
    for name in openmoji_candidates(emoji):
        try:
            data = get(OPENMOJI.format(name))
        except Exception:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return "ok"
    return "MISSING"


def fetch_fonts():
    from fontTools.ttLib import TTFont
    from fontTools import subset
    out = ROOT / "fonts"
    out.mkdir(exist_ok=True)
    for name, url in FONTS.items():
        dest = out / f"{name}.woff2"
        if dest.exists():
            print(f"  font {name}: kept")
            continue
        font = TTFont(io.BytesIO(get(url)))
        if "fvar" in font:  # variable font -> pin to a static weight
            from fontTools.varLib import instancer
            font = instancer.instantiateVariableFont(font, {"wght": 500})
        # Keep Arabic, basic Latin, digits and punctuation; drop everything else.
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0x0600, 0x0700))
                     + list(range(0x0750, 0x0780)) + list(range(0xFB50, 0xFE00))
                     + list(range(0xFE70, 0xFF00)) + [0x200C, 0x200D, 0x25CC, 0x00A0, 0x2013])
        sub.subset(font)
        font.flavor = "woff2"
        font.save(dest)
        print(f"  font {name}: {dest.stat().st_size // 1024} KB")


def main():
    print("Fonts")
    fetch_fonts()
    text = (ROOT / "data" / "letters.js").read_text(encoding="utf-8")
    pairs = dict((img, emo) for emo, img in re.findall(r'emoji:\s*"([^"]+)",\s*image:\s*"([^"]+)"', text))
    for key, emo in UI_EMOJI.items():
        pairs[f"img/ui/{key}.svg"] = emo
    for key, emo in AVATARS.items():
        pairs[f"img/avatars/{key}.svg"] = emo
    print(f"Pictures ({len(pairs)})")
    missing = []
    for img, emo in sorted(pairs.items()):
        status = fetch_emoji(emo, ROOT / img)
        if status == "MISSING":
            missing.append((img, emo))
    if missing:
        print("\nNo OpenMoji picture found for:")
        for img, emo in missing:
            print(f"  {emo}  {img}")
        sys.exit(1)
    print("All pictures present.")
    subprocess.run(["node", str(ROOT / "tools" / "build_sw.js")], check=False)


if __name__ == "__main__":
    main()
