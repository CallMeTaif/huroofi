# حروفي — Huroofi

موقع لتعلّم حروف الهجاء العربية لطلاب الصف الأول.
A website for first graders to learn the 28 Arabic letters.

> **الحالة / Status:** Phases 1–2 of 4 are done (letter pages, pictures, progress, all sounds).
> Exercises, review and teacher pages come in phases 3–4. The full guide will be written in phase 4.
>
> **للمعلمة / For the teacher:** please read [docs/TEACHER_REVIEW.md](docs/TEACHER_REVIEW.md). It lists the words, pictures and sounds to check, and how to choose the voice.

## فتح الموقع — Open the site
- انقري مرتين على `index.html`. لا يحتاج الموقع إلى إنترنت، ما عدا الفيديوهات.
- Double-click `index.html`. Everything works offline except YouTube videos.

## تعديل المحتوى — Editing content
كل المحتوى في ملف واحد: `data/letters.js`. افتحيه بأي محرر نصوص.
All content lives in `data/letters.js`.

**لإضافة فيديو / To add a video:** copy the ID from the YouTube link (the part after `v=` or after `youtu.be/`) and add one line inside `videos`:
```js
{ title: "حرف الباء – الحلقة ٢", youtubeId: "ix5p4xQ78q0" },
```

## للمطوّر — For developers
```bash
python3 tools/fetch_assets.py   # download fonts + OpenMoji pictures (already done, files are committed)
node tools/check_data.js        # check data/letters.js for mistakes
python3 tools/generate_audio.py # make the sounds (pip install edge-tts certifi); only new/changed texts are re-made
python3 -m http.server 8000     # optional: serve at http://localhost:8000
```
`tools/joining-test.html` shows every word with its letter highlighted, to check the letters stay joined.
`tools/audio-review.html` plays every sound, with doubtful ones marked.

Sounds are made with Microsoft Edge neural text-to-speech (`edge-tts`, voice ar-SA-ZariyahNeural) and stored in `audio/`.
If a sound file is missing, the site falls back to the device's own Arabic voice.

See `docs/SPEC.md` for the full plan, `docs/TEACHER_REVIEW.md` for what the teacher should check, and `CREDITS.md` for licences.
