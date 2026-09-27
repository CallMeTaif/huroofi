# Project Spec: Arabic Alphabet Practice Website for First Graders
# موقع «حروفي» لتعلّم حروف الهجاء العربية

> **For Claude Code:** Read this whole file first. Then reply with a short build plan and the folder structure **before writing code**. Build in the phases listed at the end, and stop after each phase so we can test it.

---

## 1. Background

- **Who it's for:** First-grade students (6–7 years old) learning the 28 Arabic letters. Most of them **cannot read sentences yet**, so the site must work through **pictures, sound, and big buttons**, not text.
- **Who asked for it:** A first-grade Arabic language teacher. She will choose the YouTube videos and review all content.
- **Where it's used:** Both **at home** (tablets and phones, sometimes with parents) and **in class** (classroom smartboard / projector).
- **Language:** The whole interface is **Arabic only**, right-to-left.

## 2. Tech requirements

- **Static website:** plain HTML + CSS + vanilla JavaScript. No framework, no backend, no build step, no login.
- Must work by **double-clicking `index.html`** (no local server needed) and when hosted on **GitHub Pages**.
  - Because `fetch()` of JSON fails on `file://`, store content in **`data/letters.js`** as `window.LETTERS = [...]`, not a `.json` file.
- `<html lang="ar" dir="rtl">` on every page. Use CSS logical properties (`margin-inline-start`, etc.).
- **Fonts:** bundle font files locally (they're open-licensed under OFL). Don't load them from the internet, since school networks may block Google Fonts.
  - Letters and words: **Noto Naskh Arabic** (clear Naskh shapes, as in the textbooks).
  - Interface: **Tajawal** or **Cairo**.
- **Responsive:** phone (360px wide), tablet, laptop, and large smartboard (1920px). No horizontal scrolling.
- **Touch-first:** use Pointer Events so drag and drawing work with finger, stylus, and mouse. Tap targets **at least 64px**.
- **Privacy (children's site):** no analytics, no cookies, no accounts, no tracking scripts. Progress is saved only in `localStorage` on the device (wrap it in try/catch so the site still works without it).
- Include a short `README.md` (in Arabic and English) explaining how to open the site, how to publish it on GitHub Pages, and **how the teacher can edit `data/letters.js`**.

## 3. Pages and structure

### 3.1 Home page — `index.html`
- Friendly title: **«حروفي»** plus a simple illustration.
- A grid of all **28 letters in alphabetical order**, each a big colorful card.
- Each card shows the stars earned for that letter (0–3 ⭐).
- Buttons: **«تمارين المراجعة»** (mixed review) and a small, low-key **«للمعلمة»** link.

### 3.2 Letter page — `letter.html?id=ba`
One page per letter with large, clear sections (tabs or scrolling sections with icons):

1. **تعرّف على الحرف (Meet the letter)**
   - The letter very large, its name (e.g. «باء»), and a 🔊 button that says the letter name.
   - A short **child-friendly description** (2–3 short sentences), e.g.: «حرف الباء له نقطة واحدة تحته. نقول: بَ». Include:
     - number of dots and where they are (above / below / none)
     - whether it connects to the next letter (ا د ذ ر ز و do NOT connect to the letter after them)
   - A 🔊 button reads the description aloud.

2. **أشكال الحرف (Letter forms)**
   - The letter in its forms: isolated, beginning, middle, end, each with an example word and the letter **highlighted in color** inside the word.
   - For non-connecting letters (ا د ذ ر ز و), show only the forms that actually exist and explain simply.

3. **الحركات (Short and long vowels)**
   - Buttons for: بَ بُ بِ (fatha, damma, kasra), بْ (sukun), and long vowels بَا بُو بِي.
   - Each plays its sound.

4. **كلمات وصور (Words and pictures)**
   - The 6 words from section 7, each with a picture and a 🔊 button, grouped under «في البداية / في الوسط / في النهاية» with the letter highlighted in color.

5. **شاهد وتعلّم (Watch and learn)**
   - The YouTube videos the teacher chose for this letter (see section 6).
   - Use the videos listed in section 6. If a letter has no videos, hide this section completely.

6. **تمرّن (Practice)**
   - Buttons that open the four exercises (section 4) for this letter.

- Navigation: big «الحرف السابق / الحرف التالي» arrows and a home button 🏠.

### 3.3 Review page — `review.html`
- Mixed exercises across letters the child has already studied, or any letters the teacher selects.
- Mode for **similar-looking letters**: ب ت ث / ج ح خ / د ذ / ر ز / س ش / ص ض / ط ظ / ع غ / ف ق.

### 3.4 Teacher page — `teacher.html`
- A simple guide explaining how to add or replace a YouTube video and how to edit words.
- A **content review page** that shows every letter's description, words, and pictures on one printable page, so the teacher can check everything quickly.
- A "reset progress on this device" button (with a confirm step).
- **Classroom mode** toggle: bigger text and hides the stars (for use on the smartboard).

## 4. Interactive exercises

General rules for all exercises:
- Instructions are **spoken aloud** (🔊 plays automatically on first load, with a replay button), plus a small icon. Don't rely on reading.
- Short rounds: **5 questions** per round.
- Correct answer: happy animation + short sound + spoken «أحسنت!» / «ممتاز!».
- Wrong answer: gentle shake + «حاول مرة أخرى». **No red X, no losing points, no timers.**
- End of round: stars (1–3) based on how many were right on the first try; save to progress.
- Gentle feedback sounds (ding / soft buzz) can be generated with the Web Audio API, so no audio files are needed for them.

### 4.1 Listen and choose — «اسمع واختر»
- Plays a letter sound (e.g. «بَ»); the child taps the correct letter from **3 big choices** (4 in harder mode).
- Distractors: random letters at first; **similar-looking letters** in the harder level.

### 4.2 Tracing — «اكتب الحرف»
- A large canvas shows the letter in light gray with a dotted outline (drawn from the Naskh font).
- The child traces it with finger or mouse.
- Checking: compare the child's strokes with the letter's pixel mask. Pass if enough of the letter is covered (about 60%) and not too much drawing is outside it. Tune the thresholds so kids aren't frustrated.
- Buttons: 🧽 clear, ✅ check, 🔊 hear the letter.
- Practice the isolated form first; optionally the beginning form as a second step.
- (Stroke-order arrows are **not** required in phase 1.)

### 4.3 Picture matching — «صِل الحرف بالصورة»
- Show 3 letters and 3 pictures; the child drags each letter to the picture whose word starts with it (tap-letter-then-tap-picture should also work, for kids who find dragging hard).
- The word appears under the picture after a correct match, with the first letter highlighted.

### 4.4 Find the letter — «ابحث عن الحرف»
- **Level 1:** Show 3–4 words with pictures; tap the words that contain the target letter.
- **Level 2:** Show one word; tap the part of the word where the letter is. Also: «أين الحرف؟ في البداية / الوسط / النهاية».
- ⚠️ **Technical note:** wrapping each Arabic letter in its own `<span>` breaks letter joining. Use the zero-width joiner (U+200D) on both sides of the split, or another method that **keeps the word correctly connected**, and test it visually.

## 5. Audio

The teacher will **not** record her own voice, so:

1. **Main source:** generate MP3 files **once, during development**, with the free **`edge-tts` Python package** (`pip install edge-tts`) using a Saudi Arabic neural voice such as `ar-SA-ZariyahNeural` (female) or `ar-SA-HamedNeural` (male). Let the teacher hear a sample of both and pick one. Save them in `audio/` and commit them, so the site plays them offline with no internet.
   - Files needed per letter: letter name, the six vowel syllables (بَ بُ بِ بْ بَا بُو بِي — sukun may need a short carrier like «أَبْ»), each example word, and the description.
   - Common phrases: «أحسنت!»، «ممتاز!»، «حاول مرة أخرى»، and each exercise's instructions.
   - Write the generator as a script (`tools/generate_audio.py`) so audio can be re-made after text edits.
   - Text-to-speech often mispronounces **single letters and syllables**. Try different inputs (e.g. the letter name «باء» vs «بَ») and **list any sounds that seem wrong** so the teacher can check them.
2. **Openly-licensed recordings** (e.g. Wikimedia Commons, CC licenses) may be used if found, with the credit written in `CREDITS.md`.
3. **Do not** copy audio from other websites, apps, or YouTube videos (copyright).
4. **Fallback:** if an audio file is missing, use the browser's Web Speech API with an Arabic voice (`ar-SA`), if the device has one.

## 6. YouTube videos

- **Use exactly the video IDs in the table below. Do not invent, guess, or change any IDs.**
- All videos come from the **«تعلم مع زكريا – Learn with Zakaria»** channel (youtube.com/learnWithZakaria), so every letter has the same style and characters.
  - **Main video:** the numbered episode series «برنامج الحروف العربية للأطفال (الحلقة 1–28)».
  - **Extra video:** a short video from the same channel. For most letters it's the «حرف … للأطفال (ب بطة)» series; for ك ل م ن هـ و it's the «تعليم كتابة الحرف بالحركات» writing series (marked ✍️).
- Format in `data/letters.js`: `videos: [{ title: "حرف الباء – الحلقة ٢", youtubeId: "ix5p4xQ78q0" }, ...]`.
- Display: show a **thumbnail with a play button** (`https://i.ytimg.com/vi/<ID>/hqdefault.jpg`), and only load the video when tapped. Use `youtube-nocookie.com` with `rel=0` so fewer unrelated videos appear.
- If a video fails to load (deleted or made private), hide it quietly instead of showing an error.
- In the teacher guide, explain how to copy the ID from a YouTube link (the part after `v=` or after `youtu.be/`) so she can replace any video.
- ⚠️ **Teacher review:** these were found by search. The teacher should watch them before the kids do (some may contain background music; if she prefers no music, she can swap them).

| الحرف | الفيديو الرئيسي (الحلقة) | Main ID | فيديو إضافي | Extra ID |
|---|---|---|---|---|
| أ | الحلقة ١ | `ZioWHsqIykY` | ألف أرنب | `aFTRBS4fjDM` |
| ب | الحلقة ٢ | `ix5p4xQ78q0` | باء بطّة | `kRinqElV_SM` |
| ت | الحلقة ٣ | `WKQWMOaAZLs` | تاء تمساح | `oSeMJhEAbDI` |
| ث | الحلقة ٤ | `FOCaDyiRoHA` | ثاء ثعبان | `8hKC6rGMaP8` |
| ج | الحلقة ٥ | `R32S59TLbjQ` | ج جمل | `w_1uqf0d8uA` |
| ح | الحلقة ٦ | `Hih5GeRoLI4` | ح حصان | `dRdPgBteHhY` |
| خ | الحلقة ٧ | `Smn_m36Vyxg` | خ خروف | `co5yzmpAMDw` |
| د | الحلقة ٨ | `tEwpEr0oD7o` | د درّاجة | `90emzw8DD1k` |
| ذ | الحلقة ٩ | `zx1BDckRnho` | ذ ذرة | `IEjthpiyBuw` |
| ر | الحلقة ١٠ | `40Cleu7kvcs` | حرف الراء | `k9TEDLWq-nM` |
| ز | الحلقة ١١ | `L3f4-8Cc9-Q` | ز زرافة | `eUNBKxHr-is` |
| س | الحلقة ١٢ | `KrqDaLtRZd0` | س سمكة | `q9zUfhZ0Fpw` |
| ش | الحلقة ١٣ | `wWSeE87oQnI` | ش شمعة | `mYxJgqvJe9A` |
| ص | الحلقة ١٤ | `E5NOU6CIQBY` | ص صاروخ | `7gpcxpoyaY0` |
| ض | الحلقة ١٥ | `8N7tkxQY3Mo` | ض ضوء | `fl68EjP-jzY` |
| ط | الحلقة ١٦ | `Tv0JMia7bl0` | ط طائرة | `IACqrhsOkdo` |
| ظ | الحلقة ١٧ | `8JbO9F3IB8s` | ظ ظرف | `me2SSJlJ0H0` |
| ع | الحلقة ١٨ | `o6GwbR6QSzk` | ع عنب | `0-ua496VyHw` |
| غ | الحلقة ١٩ | `0wdxnrwbrBE` | غ غاضب | `1GPpYnPeyoc` |
| ف | الحلقة ٢٠ | `NQiM7cps9Ps` | حرف الفاء | `6HScj4ipV3k` |
| ق | الحلقة ٢١ | `gCfpfFcdDBI` | حرف القاف | `LXGXptsHGKc` |
| ك | الحلقة ٢٢ | `VNbQqN49duY` | ✍️ كتابة الكاف بالحركات | `qjOuy3NjPak` |
| ل | الحلقة ٢٣ | `DwspSODRREE` | ✍️ كتابة اللام بالحركات | `Apu6sear1tQ` |
| م | الحلقة ٢٤ | `55yuDuEn7sw` | ✍️ كتابة الميم بالحركات | `y_iUypGcqDc` |
| ن | الحلقة ٢٥ | `2RqUkWKr4N0` | ✍️ كتابة النون بالحركات | `DE08koGZwuc` |
| هـ | الحلقة ٢٦ | `nl4fmttRH5Y` | ✍️ كتابة الهاء بالحركات | `7Gond2CQ6lY` |
| و | الحلقة ٢٧ | `PVdZ5efDOx4` | ✍️ كتابة الواو بالحركات | `plgUm__c34o` |
| ي | الحلقة ٢٨ | `nP0ftHMBlWk` | — | — |

## 7. Content: `data/letters.js`

One object per letter. Suggested shape:

```js
{
  id: "ba",
  letter: "ب",
  name: "باء",
  order: 2,
  dots: { count: 1, position: "below" },
  connectsToNext: true,
  description: "حرف الباء له نقطة واحدة تحته. نقول: بَ",
  forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
  formExamples: { initial: "بطة", medial: "حبل", final: "كتاب" },
  words: [ { word: "بَطَّة", image: "img/words/batta.svg", position: "initial" }, ... ], // 6 words, see table below
  similarLetters: ["ت", "ث"],
  videos: [ { title: "حرف الباء – الحلقة ٢", youtubeId: "ix5p4xQ78q0" }, { title: "باء بطّة", youtubeId: "kRinqElV_SM" } ]
}
```

Images: use one consistent, openly-licensed emoji/illustration set bundled locally as SVG, such as **OpenMoji** or **Twemoji** (credit them in `CREDITS.md`). Don't rely on the device's own emoji, because they look different on every device.

### Word list: 6 words per letter

Use **exactly these words**: 2 with the letter at the **beginning**, 2 in the **middle**, 2 at the **end**. The **first beginning word is the letter's main word** (shown large on the letter page and used in «باء بطة» style phrases). The emoji show what picture to use (draw it from OpenMoji / Twemoji, not the device's emoji).

Rules for Claude Code:
- Add full vowel marks (تشكيل) to every word in the data, e.g. «بَطَّة», for correct audio and display.
- **Taa marbuta (ة) is not ت or هـ.** Words ending in ة (بطة، نحلة) must never count as "ت at the end" or "هـ at the end" in exercises.
- In «ابحث عن الحرف», only count the letter at the position listed here. If a word contains the letter twice (e.g. خوخ، مثلث), accept either one.
- If no clear picture exists in the icon set for a word, tell me, and don't replace the word yourself.

| الحرف | الاسم | في البداية | في الوسط | في النهاية |
|---|---|---|---|---|
| أ | ألف | أرنب 🐰 · أسد 🦁 | باب 🚪 · فأر 🐭 | ماما 👩 · بابا 👨 |
| ب | باء | بطة 🦆 · بيت 🏠 | حبل 🪢 · زبدة 🧈 | كتاب 📖 · عنب 🍇 |
| ت | تاء | تفاحة 🍎 · تاج 👑 | كتاب 📖 · فستان 👗 | بيت 🏠 · حوت 🐋 |
| ث | ثاء | ثعلب 🦊 · ثلج ❄️ | كمثرى 🍐 · مثلجات 🍦 | مثلث 🔺 · ثلاث 3️⃣ |
| ج | جيم | جمل 🐪 · جزر 🥕 | دجاجة 🐔 · نجمة ⭐ | ثلج ❄️ · تاج 👑 |
| ح | حاء | حصان 🐴 · حليب 🥛 | نحلة 🐝 · بحر 🌊 | تفاح 🍎 · مفتاح 🔑 |
| خ | خاء | خروف 🐑 · خبز 🍞 | نخلة 🌴 · صخرة 🪨 | بطيخ 🍉 · خوخ 🍑 |
| د | دال | دب 🐻 · دجاجة 🐔 | وردة 🌹 · هدية 🎁 | يد ✋ · أسد 🦁 |
| ذ | ذال | ذرة 🌽 · ذئب 🐺 | حذاء 👟 · نافذة 🪟 | قنفذ 🦔 · تلميذ 🧒 |
| ر | راء | ريشة 🪶 · رسّام 🧑‍🎨 | وردة 🌹 · فراشة 🦋 | قمر 🌙 · نمر 🐯 |
| ز | زاي | زرافة 🦒 · زهرة 🌸 | جزر 🥕 · غزال 🦌 | موز 🍌 · خبز 🍞 |
| س | سين | سمكة 🐟 · ساعة ⌚ | مسجد 🕌 · كرسي 🪑 | شمس ☀️ · فانوس 🏮 |
| ش | شين | شمس ☀️ · شجرة 🌳 | فراشة 🦋 · مشط 🪮 | عش 🪺 · كبش 🐏 |
| ص | صاد | صاروخ 🚀 · صقر 🦅 | عصفور 🐦 · بصل 🧅 | قميص 👕 · مقص ✂️ |
| ض | ضاد | ضفدع 🐸 · ضوء 💡 | خضار 🥦 · مضرب 🏸 | بيض 🥚 · أرض 🌍 |
| ط | طاء | طائرة ✈️ · طماطم 🍅 | بطة 🦆 · قطار 🚂 | قط 🐱 · مشط 🪮 |
| ظ | ظاء | ظرف ✉️ · ظبي 🦌 | نظارة 👓 · مظلة ☂️ | — (see note) |
| ع | عين | عنب 🍇 · عين 👁️ | ملعقة 🥄 · شمعة 🕯️ | ضفدع 🐸 · إصبع ☝️ |
| غ | غين | غيمة ☁️ · غزال 🦌 | ببغاء 🦜 · مغناطيس 🧲 | دماغ 🧠 · صمغ 🧴 |
| ف | فاء | فيل 🐘 · فراشة 🦋 | تفاحة 🍎 · سفينة 🚢 | خروف 🐑 · ظرف ✉️ |
| ق | قاف | قطة 🐱 · قمر 🌙 | بقرة 🐄 · ملعقة 🥄 | صندوق 📦 · طبق 🍽️ |
| ك | كاف | كتاب 📖 · كرة ⚽ | سمكة 🐟 · مكنسة 🧹 | ديك 🐓 · شبّاك 🪟 |
| ل | لام | ليمون 🍋 · لعبة 🧸 | قلم ✏️ · نحلة 🐝 | فيل 🐘 · جمل 🐪 |
| م | ميم | موز 🍌 · مفتاح 🔑 | شمس ☀️ · سمكة 🐟 | قلم ✏️ · فم 👄 |
| ن | نون | نحلة 🐝 · نمر 🐯 | عنب 🍇 · أنف 👃 | عين 👁️ · بالون 🎈 |
| هـ | هاء | هدية 🎁 · هاتف 📱 | نهر 🏞️ · زهرة 🌸 | وجه 🙂 · فواكه 🍓 |
| و | واو | وردة 🌹 · ولد 👦 | حوت 🐋 · خوخ 🍑 | دلو 🪣 · جرو 🐶 |
| ي | ياء | يد ✋ · يمامة 🕊️ | فيل 🐘 · بيت 🏠 | كرسي 🪑 · شاي 🍵 |

**Note on ظ:** there's no simple, picturable word ending in ظ for first graders. Use only the 4 beginning/middle words, and skip "end" questions for ظ in the exercises.

## 8. Design

- Bright, warm, friendly colors, but not cluttered. A different soft color for each letter card.
- Very large letters (the main letter on the letter page should be at least 200px on tablets).
- Minimal text; icons + sound for every action.
- Simple, smooth animations (stars, gentle bounce). Respect `prefers-reduced-motion`.
- Everything must be usable by a child with **no adult help** after the first time.

## 9. Build phases

1. **Phase 1:** Folder structure, `data/letters.js` with all 28 letters (descriptions, forms, words), home page, letter page (all sections except exercises), images, progress saving.
2. **Phase 2:** Audio generation script + all audio files + play buttons everywhere.
3. **Phase 3:** The four exercises, stars, and rewards.
4. **Phase 4:** Review page (including similar-letters mode), teacher page, content review page, classroom mode, README, CREDITS.

## 10. Acceptance checklist

- [ ] Opens by double-clicking `index.html`, and works on GitHub Pages.
- [ ] Works offline after loading (except YouTube videos).
- [ ] All 28 letters have: description, forms, vowels, 6 words with pictures (4 for ظ), 2 videos (1 for ي), and audio.
- [ ] Arabic words are always **correctly joined**, including in "Find the letter".
- [ ] All four exercises work with finger on a tablet and with a mouse.
- [ ] No page scrolls sideways on a 360px phone.
- [ ] No tracking, cookies, or external requests (apart from YouTube when a video is tapped).
- [ ] The teacher can add a YouTube video by editing one line in `data/letters.js`.
- [ ] A list of any sounds or words that need the teacher's review is included in the README.

---

## 11. Build notes and proposed amendments (Claude, 2026-09-26)

These are suggestions from the first read of the spec. Nothing above was changed; accept or reject each one.

### 11.1 Things to be aware of
- **Letter أ vs ا:** the letter is listed as «أ», but its words use bare alif (باب، ماما، بابا) and other letters' words use «إ» (إصبع). Exercises for this letter should treat أ / إ / آ / ا as the same letter. Word «إصبع» stays under ع only.
- **Same picture for two words:** ظبي and غزال both use 🦌. Fine, but they should never appear together in one matching round.
- **TTS on syllables:** `edge-tts` reads «بَ» unreliably. Plan: generate each syllable 2–3 ways (e.g. «بَ», «بَ.», «بَـ»), listen, keep the best, and list doubtful ones in the README for the teacher.
- **Word highlighting:** wrapping a letter in a `<span>` breaks joining. Plan: split the word into *before / target / after* strings and insert U+200D only where the neighbouring letter actually connects; tashkeel marks stay attached to their letter. A visual test page will be included in phase 1.
- **GitHub Pages on a free account needs a public repo.** This site has nothing private, so that is fine.
- **Emoji set:** a few words use Emoji 13–15 glyphs (🪮 🪺 🪣 🪨 🪟 🪢 🪶). OpenMoji covers them; Twemoji does not fully. Default to **OpenMoji** (CC BY-SA 4.0).

### 11.2 Proposed additions
- `tools/fetch_assets.py`: downloads the two fonts and the ~130 OpenMoji SVGs once, so the asset step is reproducible and the licences are recorded automatically in `CREDITS.md`.
- `tools/check_data.py`: validates `data/letters.js` — 28 letters, 6 words each (4 for ظ), every image and audio file exists, every word really contains the letter at the declared position, no ة counted as ت/هـ. Runs before every phase hand-off.
- A hidden `test.html` page (dev only) that renders every word with its letter highlighted, so joining can be checked in one scroll.
- Progress format: `{ "<letterId>": { "listen": 0-3, "trace": 0-3, "match": 0-3, "find": 0-3 } }`; the card shows the best star count across exercises. Stored under one key `huroofi.progress`.

### 11.3 Folder structure
```
huroofi/
├── index.html · letter.html · review.html · teacher.html
├── css/style.css
├── js/
│   ├── data-utils.js   (lookup, ordering, similar groups)
│   ├── arabic.js       (joining-safe highlighting, tashkeel helpers)
│   ├── audio.js        (mp3 player + Web Speech fallback + Web Audio dings)
│   ├── progress.js     (localStorage with try/catch)
│   ├── home.js · letter.js · review.js · teacher.js
│   └── exercises/ listen.js · trace.js · match.js · find.js · round.js (shared round/stars logic)
├── data/letters.js · data/phrases.js
├── audio/letters/<id>/ · audio/words/ · audio/phrases/
├── img/words/*.svg · img/ui/*.svg
├── fonts/*.woff2
├── tools/fetch_assets.py · generate_audio.py · check_data.py
├── docs/SPEC.md (this file)
└── README.md · CREDITS.md
```

### 11.4 Decisions made while building (Phase 2–3)
- **Audio:** short-vowel syllables are spoken with a full stop after them («بَ.») because the voice otherwise clips the vowel; long vowels use a slower rate; sukun uses the carrier «أَ». Silence is trimmed by dropping whole MP3 frames (no re-encoding).
- **Tracing threshold:** coverage ≥ 80% (not 60%) and ink outside ≤ 45%. This check counts a wide band around every stroke, so a full trace scores ≥ 92% even when wobbly, while half a letter scores 50–83%. Tuned with `tools/trace-tuning.html`.
- **Tracing round** is 3 traces (alone, beginning/end shape, alone), and **matching** is 2 boards of 3 (6 matches), instead of exactly 5 questions; «اسمع واختر» and «ابحث عن الحرف» have 5.
- **Stars:** 100% right on the first try = 3, ≥ 60% = 2, otherwise 1 (finishing always earns a star).
- **Lam-alef:** «لا» is never split when colouring or tapping letters, because the ligature must stay one shape.
- **Autoplay:** browsers that block sound before the first tap (Safari/iPad) get a single big ▶ button; everywhere else instructions play automatically.
