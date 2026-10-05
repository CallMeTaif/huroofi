# حروفي — Huroofi

موقع لتعلّم حروف الهجاء العربية لطلاب الصف الأول: صور وأصوات وأزرار كبيرة، بلا حسابات ولا تتبّع.
A website for first graders to learn the 28 Arabic letters, through pictures, sound and big buttons. No accounts, no tracking.

**الموقع / Live site:** https://callmetaif.github.io/huroofi/

---

## بالعربية

### فتح الموقع
- **على الإنترنت:** افتحي الرابط أعلاه على الجهاز اللوحي أو الحاسوب أو السبورة الذكية.
- **بدون إنترنت:** نزّلي المجلد، ثم انقري مرتين على `index.html`. كل شيء يعمل بلا إنترنت ما عدا فيديوهات يوتيوب.
  عند فتح الموقع من الملف مباشرة، يفتح الفيديو في صفحة يوتيوب جديدة لأن يوتيوب لا يسمح بتشغيله داخل ملف محلي.

### الصفحات
| الصفحة | لمن | ماذا فيها |
|---|---|---|
| الرئيسية | الطفل | الحروف الـ٢٨ ونجوم كل حرف. |
| صفحة الحرف | الطفل | الحرف، أشكاله، الحركات، ٦ كلمات بالصور، الفيديوهات، ٤ تمارين. |
| تمارين المراجعة | الطفل والمعلمة | تمارين على حروف مختارة، أو على الحروف المتشابهة (ب ت ث، ج ح خ، …). |
| للمعلمة | المعلمة | (ضغط مطوّل ٣ ثوانٍ على عنوان «حروفي») وضع الفصل، الأطفال، التقدّم، مراجعة المحتوى، إضافة فيديو، دليل التعديل. |

### صفحة المعلمة وحمايتها
لا يوجد رابط ظاهر لصفحة المعلمة في صفحات الأطفال. للدخول: **اضغطي مطوّلًا على عنوان «حروفي» في الصفحة الرئيسية ٣ ثوانٍ**، أو احفظي رابط الصفحة في المفضلة: https://callmetaif.github.io/huroofi/teacher.html
ثم تُفتح الصفحة بعد الإجابة عن سؤال ضرب (مثل ٧ × ٨) لا يعرفه طفل الصف الأول. وللعودة إلى صفحات الأطفال زر 🏠 في أعلى صفحة المعلمة.
هذا **ليس** كلمة مرور: الموقع بلا خادم، ولا يوجد في صفحة المعلمة شيء سرّي. الغرض فقط ألّا يدخلها طفل بالخطأ فيمسح النجوم.

- **وضع الفصل** يكبّر الخط ويُخفي النجوم ولا يحفظ التقدّم، ويعمل على الجهاز الذي فُعِّل عليه فقط.
- **النجوم** محفوظة في متصفح كل جهاز على حدة، ولا تُرسَل إلى أي مكان.

### أكثر من طفل على جهاز واحد
إذا كان الجهاز يستخدمه أكثر من طفل (إخوة في البيت، أو أجهزة الفصل)، أضيفي من صفحة المعلمة صورة حيوان لكل طفل.
عند فتح الموقع يسأل «مَنْ يَلْعَبُ الْآنَ؟»، فيضغط كل طفل على صورته، وتُحفظ نجومه وحده. لا تُحفظ أي أسماء.
إذا كان للجهاز طفل واحد فلا يظهر هذا السؤال أبدًا. أول طفل يُضاف يأخذ النجوم المحفوظة سابقًا على الجهاز.
التقدّم يبقى على الجهاز نفسه: لا تستطيع المعلمة رؤية نجوم الأجهزة الأخرى، لأن الموقع بلا خادم (حفاظًا على خصوصية الأطفال).

### العمل بدون إنترنت
بعد أول زيارة للموقع يُحفظ كله على الجهاز (نحو ١٢ ميغابايت)، فيعمل بعدها بدون إنترنت، ما عدا الفيديوهات.
في صفحة المعلمة سطر يبيّن إن كان الجهاز جاهزًا للعمل بدون إنترنت. عند تعديل المحتوى يتحدّث على الأجهزة عند اتصالها بالإنترنت.

### تعديل المحتوى
كل المحتوى في ملف واحد: `data/letters.js`. أسهل طريقة للتعديل من المتصفح:
1. افتحي https://github.com/CallMeTaif/huroofi/edit/main/data/letters.js (تحتاجين إلى حساب في GitHub وصلاحية تعديل من صاحبة المستودع).
2. عدّلي، ثم اضغطي **Commit changes**. يتحدّث الموقع خلال دقيقة تقريبًا.

**إضافة فيديو:** في صفحة المعلمة أداة تستخرج رمز الفيديو من رابط يوتيوب وتكتب السطر جاهزًا. الرمز هو الجزء بعد `v=` أو بعد `youtu.be/`. أضيفي سطرًا واحدًا داخل `videos`:
```js
{ title: "حرف الباء – الحلقة ٢", youtubeId: "ix5p4xQ78q0" },
```
لحذف فيديو احذفي سطره. إذا أصبحت `videos: []` فارغة يختفي قسم الفيديو.

**تعديل كلمة:**
```js
{ word: "بَطَّة", emoji: "🦆", image: "img/words/batta.svg", position: "initial" },
```
`position` هو مكان الحرف: `initial` البداية، `medial` الوسط، `final` النهاية. بعد تعديل كلمة أو وصف يعيد المطوّر إنشاء الصوت؛ حتى ذلك الحين يقرأ الجهاز الكلمة بصوته.

### ما يحتاج إلى مراجعة المعلمة
التفاصيل الكاملة في [docs/TEACHER_REVIEW.md](docs/TEACHER_REVIEW.md). باختصار:

1. **اختيار الصوت:** زارية (نسائي، المستخدم الآن) أو حامد (رجالي). العيّنتان في صفحة المعلمة.
2. **أصوات قصيرة أكثر من المعتاد** (استمعي إليها في [صفحة مراجعة الأصوات](tools/audio-review.html)):

| الرمز | النص |
|---|---|
| `letters/fa/v4` | أَفْ |
| `letters/fa/v7` | فِي |
| `letters/kaf/v4` | أَكْ |
| `letters/kaf/v5` | كَا |
| `letters/qaf/name` | قَاف |
| `letters/ta/v5` | تَا |
| `letters/tha/name` | ثَاء |

3. **المقاطع المفردة** (بَ بُ بِ بْ بَا بُو بِي) كلها من صوت حاسوبي، فهي أضعف جزء؛ تستحق استماعًا سريعًا.
4. **صيغة المخاطَب:** «حَاوِلْ مَرَّةً أُخْرَى» و«اكْتُبِ الْحَرْفَ بِإِصْبَعِك» للمذكّر. إن كان الفصل بنات تصبح «حَاوِلِي» و«بِإِصْبَعِكِ».
5. **صور قد تكون غير واضحة:** صَمْغ (قارورة)، فَوَاكِه (فراولة واحدة)، وَجْه (وجه مبتسم)، ثَلَاث (رقم ٣)، تِلْمِيذ (طفل). وصورة واحدة لكلمتَي غَزَال وظَبْي، وصورة واحدة لنَافِذَة وشُبَّاك.
6. **كلمات إضافية في بطاقة «أشكال الحرف» فقط:** مِلْح، قُمَاش، رَصَاص، خُطُوط، مَحْفُوظ، حَظّ، مِيَاه.
7. **الفيديوهات:** شاهديها قبل الطلاب؛ بعضها فيه موسيقى.

### تسجيل الأصوات بصوت حقيقي
الأصوات الحالية من صوت حاسوبي. لاستبدالها بصوت حقيقي، القائمة الكاملة المرقّمة في [docs/RECORDING_LIST.md](docs/RECORDING_LIST.md) (٤٠١ نص)، وفيها طرق الإرسال:
1. ملف صوتي لكل نص باسم رقمه (مثل `012.m4a`)، أو ملف لكل حرف تُقرأ فيه نصوصه بالترتيب مع سكتة قصيرة بينها.
2. أو صفحة التسجيل https://callmetaif.github.io/huroofi/tools/record.html: نص واحد في كل مرة، ثم «تنزيل التسجيلات» في ملف واحد.
يمكن الإرسال على دفعات؛ الأصوات غير المسجَّلة تبقى بالصوت الحاسوبي.

### الخصوصية
لا حسابات، ولا ملفات تعريف ارتباط، ولا تحليلات، ولا تتبّع. التقدّم في متصفح الجهاز فقط. الاتصال الوحيد بالخارج هو يوتيوب (صور الفيديوهات، والفيديو عند الضغط عليه).

---

## In English

### Open the site
- **Online:** https://callmetaif.github.io/huroofi/
- **Offline:** double-click `index.html`. Everything works without internet except YouTube.
  From a local file, YouTube refuses to play inside the page (error 153), so tapping a video opens it on youtube.com in a new tab. On GitHub Pages videos play inside the page.

### Publish on GitHub Pages
1. Push this folder to a GitHub repository. On a free account the repository must be **public** for Pages to work.
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. The site appears at `https://<user>.github.io/<repo>/` about a minute after each push. (`.nojekyll` makes GitHub serve the files as they are.)
4. If the repository moves, update `REPO` at the top of `js/teacher.js`.

### Pages
| File | Purpose |
|---|---|
| `index.html` | 28 letter cards with stars. |
| `letter.html?id=ba` | One letter: meet, forms, vowels, words, videos, practice. |
| `exercise.html?type=listen&id=ba` | An exercise for one letter (`listen`, `trace`, `match`, `find`). `&ids=ba,ta` mixes letters, `&similar=1` uses look-alike choices. |
| `review.html` | Mixed review; look-alike letter groups. |
| `teacher.html` | Hidden entrance (hold the home title 3 s), behind a grown-up gate: classroom mode, progress, reset, video helper, editing guide. |
| `content.html` | Behind the gate: every letter's content on one printable page. |

**Child profiles:** a shared device can have one animal picture per child (added on the teacher page; no names). With 2+ profiles, children's pages ask «مَنْ يَلْعَبُ الْآنَ؟» once per browser tab and keep each child's stars under `huroofi.progress.<animal>` in `localStorage`. With 0–1 profiles nothing changes. Progress never leaves the device.

**Offline:** `sw.js` (generated by `node tools/build_sw.js`) caches every page, picture, sound and font after the first visit. Pages, scripts and `data/letters.js` are network-first (edits appear when online); pictures, sounds and fonts are served from the cache and refreshed in the background (so re-recorded sounds replace old ones). Sounds are answered with proper 206 range responses for Safari. `tools/check_data.js` fails if `sw.js` is out of date; the audio, import and asset scripts rebuild it automatically.

**Teacher entrance:** there is no visible link on the children's pages. Press and hold the «حروفي» title on the home page for 3 seconds (finger or mouse), or bookmark `teacher.html`. The teacher page's 🏠 button leads back to the children's pages.

**About the teacher gate:** the site has no server or login (by design), so the teacher pages cannot be truly protected. They sit behind a multiplication question a first grader cannot answer (`js/gate.js`), remembered for the browser tab. Nothing on them is secret; the gate only prevents a child from resetting progress by accident.

### Editing content
Everything is in `data/letters.js` (`window.LETTERS = [...]`, a script rather than JSON so it loads from `file://`). Each letter has `description`, `forms`, `formExamples`, 6 `words` (4 for ظ) and `videos`. Adding a video is one line (see the Arabic section). After editing, run `node tools/check_data.js`.

### For developers
```bash
node tools/check_data.js          # validate data/letters.js (words contain their letter at the stated position, pictures exist, sw.js current, ...)
node tools/build_sw.js            # rebuild the offline service worker after changing any site file
node tools/recording_list.js      # rebuild docs/RECORDING_LIST.md (numbered texts for whoever records)
python3 tools/fetch_assets.py     # fonts + OpenMoji pictures (already committed)
python3 tools/generate_audio.py   # sounds with edge-tts; only new/changed texts are re-made
python3 tools/generate_audio.py --voice hamed   # switch every sound to the male voice
python3 tools/import_numbered.py ~/Downloads/recordings/   # install recordings named by list number (001.mp3, 012.m4a …); --check = report only
python3 tools/import_recordings.py ~/Downloads/huroofi-recordings-N.zip   # install recordings from tools/record.html (needs: brew install lame)
```
Requirements: Node.js, Python 3 with `pip install edge-tts certifi fonttools brotli`. The audio script uses macOS `afconvert` to trim silence and flag doubtful clips; elsewhere it still works but skips those two steps.

Developer pages (serve the folder, e.g. `python3 -m http.server`, then open them):
| Page | Checks |
|---|---|
| `tools/joining-test.html` | Every word with its letter coloured: letters must stay joined (U+200D joiners). |
| `tools/audio-review.html` | Plays every sound; doubtful ones in orange. |
| `tools/trace-tuning.html` | Simulated tracing of all 56 letter shapes against the tracing thresholds. |
| `tools/exercise-check.html` | Generates thousands of exercise rounds and checks the spec's rules. |
| `tools/record.html` | Record a real voice for all 400 texts, one at a time; downloads a zip for `tools/import_recordings.py`. Recorded files are never overwritten by `generate_audio.py` unless their text changes. |

Add `?silent=1` to any page address to turn all sound off (for automated tests).

### Folder structure
```
index.html  letter.html  exercise.html  review.html  teacher.html  content.html  sw.js (generated)
css/style.css
js/  arabic.js (joining-safe highlighting)  audio.js  progress.js (+ child profiles)  profiles.js  common.js  gate.js
     home.js  letter.js  review.js  teacher.js
     exercises/ engine.js  listen.js  trace.js  match.js  find.js
data/letters.js  data/audio-manifest.js
audio/  img/words  img/ui  img/avatars  fonts/
tools/  docs/ (SPEC.md, TEACHER_REVIEW.md, voice-samples/)
```

### Privacy
No accounts, cookies, analytics or tracking scripts. Progress is stored only in `localStorage` on the device (every access is wrapped in try/catch, so the site works without it). The only external requests go to YouTube: video thumbnails, and the video when tapped.

### Credits
Pictures: OpenMoji (CC BY-SA 4.0). Fonts: Noto Naskh Arabic and Tajawal (SIL OFL). Sounds: Microsoft Edge neural TTS via `edge-tts`. Videos: «تعلم مع زكريا – Learn with Zakaria» on YouTube. Details in [CREDITS.md](CREDITS.md).
