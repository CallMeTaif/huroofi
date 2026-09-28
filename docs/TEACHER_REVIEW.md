# قائمة المراجعة للمعلمة — Teacher review list

Things the teacher should check. Updated after each build phase.

## Phase 1 (content and pictures)

### 1. Extra example words on the «أشكال الحرف» card
Some letter shapes do not appear in any of the 6 fixed words, so the forms card uses one extra word.
These words appear **only** on the forms card (no picture, not in exercises):

| الحرف | الشكل | الكلمة |
|---|---|---|
| ح | ـح (متصل في النهاية) | مِلْح |
| ش | ش (وحده) | قُمَاش |
| ص | ص (وحده) | رَصَاص |
| ط | ط (وحده) | خُطُوط |
| ظ | ظ (وحده) | مَحْفُوظ |
| ظ | ـظ (في النهاية) | حَظّ |
| ه | ه (وحده) | مِيَاه |

Change any of them in `data/letters.js` under `formExamples`.

### 2. Pictures that may be unclear to a child
Every word from the spec has an OpenMoji picture, but some pictures are weak matches. Please look at them on the letter pages:

| الكلمة | الصورة | الملاحظة |
|---|---|---|
| صَمْغ | 🧴 | OpenMoji shows a lotion bottle, not glue. |
| فَوَاكِه | 🍓 | One strawberry, not "fruits". |
| وَجْه | 🙂 | A smiley, which works but is not a real face. |
| ثَلَاث | 3️⃣ | A number key. |
| تِلْمِيذ | 🧒 | A child, with nothing showing "student". |
| غَزَال / ظَبْي | 🦌 | Same deer picture for two words. |
| نَافِذَة / شُبَّاك | 🪟 | Same window picture for two words. |

The exercises will never show two words with the same picture in one round.

### 3. The letter أ
- The letter is shown as «أ». Its words use أ and also plain ا (بَاب، مَامَا). In the site these count as the same letter.
- Its vowels are shown as أَ أُ إِ أْ and the long vowels آ أُو إِي.

### 4. Descriptions
Each description was written from the same pattern, for example:
> حَرْفُ الْبَاءِ لَهُ نُقْطَةٌ وَاحِدَةٌ تَحْتَهُ. يَتَّصِلُ بِالْحَرْفِ الَّذِي بَعْدَهُ. نَقُولُ: بَ، بَطَّة.

Please check the dot counts and wording for all 28 letters.

### 5. Videos
- All video IDs are exactly as in the spec. Please watch each video before the children do.
- Short titles of the extra videos were written in the same style for every letter, for example «جيم جمل». Only the titles changed.
- When the site is opened by double-clicking `index.html`, YouTube does not allow videos to play inside the page. In that case, tapping a video opens it on YouTube in a new tab. When the site is on GitHub Pages, videos play inside the page.

## Phase 2 (sounds)

### 6. Choose the voice
Listen to `docs/voice-samples/zariyah.mp3` (female) and `docs/voice-samples/hamed.mp3` (male).
The site uses **Zariyah (female)** for now. To switch every sound to Hamed, the developer runs:
```bash
python3 tools/generate_audio.py --voice hamed
```

### 7. Listen to the sounds
Open `tools/audio-review.html` (or https://callmetaif.github.io/huroofi/tools/audio-review.html).
Tap any card to hear it, or use «تشغيل الكل» to play them in order. Orange cards are the ones to check first.

These were made by a computer voice, so single syllables are the weakest part. How they were made:
- **فتحة، ضمّة، كسرة:** the syllable followed by a full stop (for example «بَ.»), which stops the voice cutting the vowel short.
- **سكون:** a sukun cannot be said alone, so it is said with a short «أَ» before it: «أَبْ». For hamza: «يَأْ».
- **المدّ (بَا بُو بِي):** said more slowly, so the long vowel sounds long.

Sounds that came out shorter than usual (check these first):

| الرمز | النص |
|---|---|
| `letters/fa/v4` | أَفْ |
| `letters/fa/v7` | فِي |
| `letters/kaf/v4` | أَكْ |
| `letters/kaf/v5` | كَا |
| `letters/qaf/name` | قَاف |
| `letters/ta/v5` | تَا |
| `letters/tha/name` | ثَاء |

### 8. Wording to check
- «حَاوِلْ مَرَّةً أُخْرَى» and «اكْتُبِ الْحَرْفَ بِإِصْبَعِك» speak to a boy. If the class is girls, they can become «حَاوِلِي» and «بِإِصْبَعِكِ». All other phrases work for both.
- «أَحْسَنْت» is said without a final vowel, so it fits boys and girls.

To fix any single sound, write what it should say in `tools/audio_overrides.json` and run `python3 tools/generate_audio.py`.

## Phase 3 (exercises)

Open any letter page and scroll to «تمرّن». Things to try with a child, and to decide on:

| التمرين | ما يحدث | عدد الأسئلة |
|---|---|---|
| اسمع واختر | A sound of the letter plays (a vowel sound or the letter name); the child taps the right letter out of 3. | 5 |
| اكتب الحرف | The child traces the letter with a finger: the letter alone, then its beginning shape (or end shape for ا د ذ ر ز و), then alone again. | 3 |
| صِل الحرف بالصورة | 3 letters and 3 pictures; drag a letter to the picture whose word starts with it, or tap the letter then the picture. Tapping a picture alone says its word. | 2 boards × 3 |
| ابحث عن الحرف | Questions 1–2: tap the 2 words that have the letter. Questions 3–5: tap the letter inside a big word, then choose «في البداية / في الوسط / في النهاية». | 5 |

- **Stars:** all right on the first try = ⭐⭐⭐, most right = ⭐⭐, finishing = ⭐. A worse round never takes stars away.
- **Harder level:** after ⭐⭐⭐ in «اسمع واختر», a 🏆 button offers 4 choices with look-alike letters (ب ت ث …).
- **Tracing strictness:** tested with simulated tracing of all 56 letter shapes. Careful and wobbly tracing always passes; half a letter, scribbles and circles fail. After 2 failed tries a «next» arrow appears so a child never gets stuck. Please watch a few children try it and say if it feels too strict or too easy.
- **On iPad/iPhone:** Safari does not allow sound until the first tap, so the first exercise screen may show one big ▶ button. One tap starts the spoken instructions.

## Phase 4 (review page and teacher page)

- **تمارين المراجعة** (from the home page): the child's visited letters are chosen already; tap letters to add or remove them.
  The tab «الحروف المتشابهة» has the 9 look-alike groups (ب ت ث، ج ح خ، د ذ، ر ز، س ش، ص ض، ط ظ، ع غ، ف ق); every question there includes the look-alike letters as choices.
  Review rounds do not change the stars of single letters.
- **صفحة المعلمة** has no visible link on the children's pages. To open it, press and hold the «حروفي» title on the home page for 3 seconds (or bookmark https://callmetaif.github.io/huroofi/teacher.html). It then asks a multiplication question such as «٧ × ٨». This keeps children out; it is not a password. The answer is remembered until the browser tab is closed.
- **وضع الفصل** is switched on the device it is used on (for example the smartboard computer). It makes text bigger, hides the stars, and saves no progress.
- **صفحة المحتوى** (from the teacher page) shows all letters on one page and can be printed.

## Children on one device, and offline use

- **الأطفال على هذا الجهاز** (teacher page): add one animal picture per child who shares the device. The site then asks «مَنْ يَلْعَبُ الْآنَ؟» when it opens, and each child's stars are kept separately. No names are saved. One child per device: add nothing.
- Stars stay on each device. There is no class-wide view, because that would need an online database of children's data.
- **Offline:** after the site is opened once with internet, it works without internet (except videos). The teacher page shows «✓ الموقع كله محفوظ على هذا الجهاز» when a device is ready.

## Final checklist (before sharing with the children)

- [ ] Choose the voice (section 6) and listen to the flagged sounds (section 7).
- [ ] Decide the wording for boys/girls (section 8).
- [ ] Watch every video (section 5).
- [ ] Check the pictures (section 2) and the extra form words (section 1).
- [ ] Try the four exercises on a real iPad or tablet with a finger.
- [ ] Try classroom mode on the smartboard.
- [ ] On each shared class tablet, add the children's animal pictures (teacher page).
- [ ] Open the site once on each tablet with internet, and check the offline line on the teacher page.
