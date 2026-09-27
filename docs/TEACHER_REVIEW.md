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
