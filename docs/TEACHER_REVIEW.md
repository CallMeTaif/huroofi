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
