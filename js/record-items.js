/* The list of everything that has a sound, as recording items (used by tools/record.html and the recording list).
 * One item per different text: a word used by several letters is recorded once and saved under all its sound files.
 * Needs window.LETTERS and window.AUDIO_REVIEW (tools/audio-review-data.js). */
(function (root) {
  "use strict";
  var FATHA = "َ", DAMMA = "ُ", KASRA = "ِ", SUKUN = "ْ";
  var VOWEL = ["فتحة", "ضمّة", "كسرة", "سكون", "مدّ بالألف", "مدّ بالواو", "مدّ بالياء"];
  var SHAPE = { isolated: "وحده", initial: "في البداية", medial: "في الوسط", final: "في النهاية" };
  var PHRASE_HINT = {
    home: "الصفحة الرئيسية", great1: "مدح بعد الإجابة الصحيحة", great2: "مدح بعد الإجابة الصحيحة", great3: "مدح بعد الإجابة الصحيحة",
    try_again: "بعد الإجابة الخاطئة (بلطف)", round_done: "نهاية الجولة", review: "عنوان صفحة المراجعة",
    ex_listen: "تعليمات «اسمع واختر»", ex_trace: "تعليمات «اكتب الحرف»", ex_match: "تعليمات «صِل الحرف بالصورة»",
    ex_find: "تعليمات «ابحث عن الحرف» (يأتي بعدها اسم الحرف)", ex_where: "سؤال (يأتي بعده اسم الحرف)",
    pos_initial: "مكان الحرف", pos_medial: "مكان الحرف", pos_final: "مكان الحرف",
  };

  function build(LETTERS, clips) {
    var items = [], byText = {};
    function add(text, key, kind, hint, letter, say) {
      if (!clips[key]) return;
      var id = text;
      if (byText[id]) { if (byText[id].keys.indexOf(key) < 0) byText[id].keys.push(key); return; }
      var it = { id: id, text: text, say: say || "", keys: [key], kind: kind, hint: hint, letter: letter || null };
      byText[id] = it; items.push(it);
    }
    LETTERS.forEach(function (L) {
      var base = "letters/" + L.id + "/", c = L.letter;
      add(clips[base + "name"] ? clips[base + "name"].spoken : L.name, base + "name", "name", "اسم الحرف", L);
      var shown = L.vowels || [c + FATHA, c + DAMMA, c + KASRA, c + SUKUN, c + FATHA + "ا", c + DAMMA + "و", c + KASRA + "ي"];
      shown.forEach(function (s, i) {
        var say = i === 3 && clips[base + "v4"] ? clips[base + "v4"].spoken : "";   // sukun: said with a carrier, e.g. «أَبْ»
        add(s, base + "v" + (i + 1), "syllable", VOWEL[i], L, say);
      });
      L.words.forEach(function (w) {
        add(w.word, "words/" + w.image.replace(/^.*\//, "").replace(/\.svg$/, ""), "word", "كلمة (" + SHAPE[w.position] + ")", L);
      });
      Object.keys(L.formExamples || {}).forEach(function (s) {
        var w = L.formExamples[s];
        if (w) add(w, base + "form-" + s, "word", "كلمة في بطاقة الأشكال", L);
      });
      add(L.description, base + "desc", "desc", "وصف الحرف", L);
    });
    Object.keys(clips).filter(function (k) { return k.indexOf("phrases/") === 0; }).forEach(function (k) {
      add(clips[k].spoken, k, "phrase", PHRASE_HINT[k.slice(8)] || "عبارة", null);
    });
    return items;
  }

  var api = { build: build };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RecordItems = api;
})(this);
