#!/usr/bin/env node
/* Writes docs/RECORDING_LIST.md: every text that has a sound, numbered, in the same order as tools/record.html.
 * Whoever records can name each file with its number (e.g. 012.m4a). Run after changing texts or phrases. */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
global.window = {};
require(path.join(ROOT, "data/letters.js"));
require(path.join(ROOT, "tools/audio-review-data.js"));
const items = require(path.join(ROOT, "js/record-items.js")).build(window.LETTERS, window.AUDIO_REVIEW.clips);
const files = items.reduce((n, i) => n + i.keys.length, 0);
const ar = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
let md = "# قائمة النصوص للتسجيل — Recording list\n\n";
md += `${ar(items.length)} نصًا تغطي كل أصوات الموقع (${ar(files)} ملفًا؛ الكلمة المكرّرة في أكثر من حرف تُسجَّل مرة واحدة).\n\n`;
md += "## طريقة الإرسال\n\n";
md += "- **الأفضل:** ملف صوتي لكل نص، واسمه رقم النص في هذه القائمة، مثل `012.m4a` أو `012.mp3`. أي صيغة شائعة مقبولة، ومنها رسائل واتساب الصوتية.\n";
md += "- **أو:** ملف واحد لكل حرف، تُقرأ فيه نصوص الحرف بالترتيب مع سكتة قصيرة (ثانية تقريبًا) بين كل نص والذي بعده. يُقسَّم الملف تلقائيًا.\n";
md += "- **أو:** صفحة التسجيل https://callmetaif.github.io/huroofi/tools/record.html (تعرض نصًا واحدًا في كل مرة، ثم تنزّل كل التسجيلات في ملف واحد).\n\n";
md += "## نصائح\n\n";
md += "- غرفة هادئة، والمسافة نفسها من الميكروفون في كل مرة، وبصوت واضح وبطء قليل.\n";
md += "- **السكون:** قولي النص المكتوب بين القوسين، مثل «أَبْ»، لأن السكون لا يُنطَق وحده.\n";
md += "- **الأولوية:** أسماء الحروف والحركات والعبارات أولًا، ثم الكلمات والأوصاف.\n";
md += "- العبارات التي تخاطب الطفل مكتوبة للمذكّر (حَاوِلْ، إِصْبَعِكَ). إذا كان الفصل بنات فأخبري المطوّر قبل التسجيل.\n";
let n = 0, cur = null;
for (const i of items) {
  const head = i.letter ? "حرف " + i.letter.label + " — " + i.letter.name : "العبارات";
  if (head !== cur) { cur = head; md += "\n## " + head + "\n\n| # | النص | ما هو |\n|---|---|---|\n"; }
  n++;
  md += "| " + String(n).padStart(3, "0") + " | " + i.text + (i.say ? " (قولي: " + i.say + ")" : "") + " | " + i.hint + " |\n";
}
fs.writeFileSync(path.join(ROOT, "docs/RECORDING_LIST.md"), md);
// The numbers in the list, frozen with the exact site text of every sound file (used by tools/import_numbered.py).
const clips = window.AUDIO_REVIEW.clips, state = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/audio_state.json"), "utf8"));
const numbers = {};
items.forEach((it, i) => {
  const keys = {};
  it.keys.forEach((k) => { keys[k] = state[k] ? state[k].text : (clips[k] && clips[k].spoken); });
  numbers[i + 1] = { text: it.text, say: it.say || undefined, keys };
});
fs.writeFileSync(path.join(ROOT, "tools/recording_numbers.json"), JSON.stringify(numbers, null, 1));
console.log(`docs/RECORDING_LIST.md: ${n} texts, ${files} sound files`);
