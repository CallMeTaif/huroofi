# حروفي — Huroofi

موقع لتعلّم حروف الهجاء العربية لطلاب الصف الأول.
A website for first graders to learn the 28 Arabic letters.

> **الحالة / Status:** Phase 1 of 4 is done (home page, letter pages, pictures, progress).
> Audio, exercises, review and teacher pages come in phases 2–4. The full guide will be written in phase 4.

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
python3 -m http.server 8000     # optional: serve at http://localhost:8000
```
`tools/joining-test.html` shows every word with its letter highlighted, to check the letters stay joined.

See `docs/SPEC.md` for the full plan, `docs/TEACHER_REVIEW.md` for what the teacher should check, and `CREDITS.md` for licences.
