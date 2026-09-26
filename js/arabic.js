/* Arabic text helpers for Huroofi.
 * The key job: highlight one letter inside a word WITHOUT breaking the joins.
 * Wrapping a letter in <span> makes Safari (and some others) draw it unjoined,
 * so we add ZERO WIDTH JOINER (U+200D) on both sides of every split point
 * where the two neighbouring letters really connect.
 * Works in the browser (window.Arabic) and in Node (module.exports) for tools/check_data.js.
 */
(function (root) {
  "use strict";
  var ZWJ = "‍";
  var TATWEEL = "ـ";
  // Harakat, shadda, sukun, superscript alef, etc. They sit on the letter before them.
  var MARKS = /[ً-ٰٟۖ-ۭ]/;
  // Letters that connect ONLY to the letter before them (never to the one after).
  var RIGHT_JOINING = "اأإآٱدذرزوؤة";
  var NON_JOINING = "ء";
  // Letters we treat as "the same letter" when a child is looking for it.
  var FAMILIES = { "أ": "اأإآ", "ا": "اأإآ", "ه": "ه" };

  function isMark(ch) { return MARKS.test(ch); }
  function stripMarks(s) { return Array.from(s).filter(function (c) { return !isMark(c); }).join(""); }

  // Split a word into clusters: one base letter + its marks.
  function clusters(word) {
    var out = [];
    Array.from(word).forEach(function (ch) {
      if (isMark(ch) && out.length) out[out.length - 1].text += ch;
      else out.push({ base: ch, text: ch });
    });
    return out;
  }

  function joinType(ch) {
    if (ch === TATWEEL) return "C";
    if (NON_JOINING.indexOf(ch) >= 0) return "U";
    if (RIGHT_JOINING.indexOf(ch) >= 0) return "R";
    if (/[ؠ-يٮ-ۓۺ-ۿ]/.test(ch)) return "D";
    return "U";
  }
  function connectsForward(ch) { var t = joinType(ch); return t === "D" || t === "C"; }
  function acceptsFromBehind(ch) { var t = joinType(ch); return t === "D" || t === "R" || t === "C"; }

  // Does the letter at cluster i join to the letter at cluster i+1?
  function joinsNext(cl, i) {
    return i + 1 < cl.length && connectsForward(cl[i].base) && acceptsFromBehind(cl[i + 1].base);
  }

  // Shape of the cluster at index i: isolated | initial | medial | final.
  function shapeAt(cl, i) {
    var prev = i > 0 && joinsNext(cl, i - 1);
    var next = joinsNext(cl, i);
    if (prev && next) return "medial";
    if (prev) return "final";
    if (next) return "initial";
    return "isolated";
  }

  function sameLetter(a, b) {
    if (a === b) return true;
    var fam = FAMILIES[a] || FAMILIES[b];
    return !!fam && fam.indexOf(a) >= 0 && fam.indexOf(b) >= 0;
  }

  function occurrences(word, letter) {
    var cl = clusters(word), idx = [];
    cl.forEach(function (c, i) { if (sameLetter(c.base, letter)) idx.push(i); });
    return idx;
  }

  /* Which cluster to highlight for a word listed under a POSITION
   * (initial = first letter, final = last letter, medial = anywhere in between). */
  function indexForPosition(word, letter, position) {
    var cl = clusters(word), occ = occurrences(word, letter);
    if (!occ.length) return -1;
    var last = cl.length - 1;
    if (position === "initial" && occ[0] === 0) return 0;
    if (position === "final" && occ[occ.length - 1] === last) return last;
    if (position === "medial") {
      for (var k = 0; k < occ.length; k++) if (occ[k] > 0 && occ[k] < last) return occ[k];
    }
    return -1;
  }

  // Which cluster to highlight for a word shown as an example of a letter SHAPE.
  function indexForShape(word, letter, shape) {
    var cl = clusters(word), occ = occurrences(word, letter);
    for (var k = 0; k < occ.length; k++) if (shapeAt(cl, occ[k]) === shape) return occ[k];
    return -1;
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* Split a word into pieces at the given cluster indexes, adding ZWJ at joins.
   * Returns [{text, hl}] where hl=true for the highlighted pieces. */
  function pieces(word, hlIndexes) {
    var cl = clusters(word), set = {}, out = [];
    (hlIndexes || []).forEach(function (i) { if (i >= 0) set[i] = true; });
    cl.forEach(function (c, i) {
      var hl = !!set[i];
      var cur = out[out.length - 1];
      if (cur && cur.hl === hl) { cur.clusters.push(i); return; }
      out.push({ hl: hl, clusters: [i] });
    });
    return out.map(function (p) {
      var first = p.clusters[0], last = p.clusters[p.clusters.length - 1];
      var text = p.clusters.map(function (i) { return cl[i].text; }).join("");
      if (first > 0 && joinsNext(cl, first - 1)) text = ZWJ + text;
      if (joinsNext(cl, last)) text = text + ZWJ;
      return { text: text, hl: p.hl, from: first, to: last };
    });
  }

  // HTML for a word with some letters coloured. cls = CSS class for the highlight.
  function highlightHTML(word, hlIndexes, cls) {
    return pieces(word, hlIndexes).map(function (p) {
      return p.hl ? '<span class="' + (cls || "hl") + '">' + esc(p.text) + "</span>" : esc(p.text);
    }).join("");
  }

  // The canonical shape of a letter drawn on its own (with tatweel to show the joins).
  function shapeGlyph(letter, shape) {
    if (shape === "initial") return letter + TATWEEL;
    if (shape === "medial") return TATWEEL + letter + TATWEEL;
    if (shape === "final") return TATWEEL + letter;
    return letter;
  }

  var api = {
    ZWJ: ZWJ, TATWEEL: TATWEEL, clusters: clusters, stripMarks: stripMarks, joinType: joinType,
    joinsNext: joinsNext, shapeAt: shapeAt, sameLetter: sameLetter, occurrences: occurrences,
    indexForPosition: indexForPosition, indexForShape: indexForShape, pieces: pieces,
    highlightHTML: highlightHTML, shapeGlyph: shapeGlyph, esc: esc
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Arabic = api;
})(this);
