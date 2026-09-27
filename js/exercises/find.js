/* «ابحث عن الحرف» — find the letter.
 * Questions 1–2 (level 1): 4 words with pictures; tap the words that contain the letter.
 *   Wrong choices never contain the letter at all (ة is a different letter from ت and هـ).
 * Questions 3–5 (level 2): one big word; tap the letter inside it, then say where it is:
 *   at the beginning, in the middle, or at the end. If the word has the letter twice, either counts. */
(function () {
  "use strict";
  var el = H.el;
  var POS = [
    { pos: "initial", label: "في البداية", dots: [1, 0, 0], key: "phrases/pos_initial", text: "فِي الْبِدَايَة." },
    { pos: "medial", label: "في الوسط", dots: [0, 1, 0], key: "phrases/pos_medial", text: "فِي الْوَسَط." },
    { pos: "final", label: "في النهاية", dots: [0, 0, 1], key: "phrases/pos_final", text: "فِي النِّهَايَة." },
  ];

  function posDots(on) {
    var d = el("span", { class: "pos-dots", "aria-hidden": "true" });
    on.forEach(function (x) { d.appendChild(el("i", { class: x ? "on" : "" })); });
    return d;
  }

  function levelOne(T) {
    var own = H.shuffle(T.words).slice(0, 2);
    var used = {};
    own.forEach(function (w) { used[w.image] = used[w.emoji] = used[w.word] = 1; });
    var others = H.shuffle(Game.allWords()).filter(function (x) {
      return x.owner !== T && !used[x.w.image] && !used[x.w.emoji] && !used[x.w.word] &&
             Arabic.occurrences(x.w.word, T.letter).length === 0;
    });
    var wrong = [];
    others.forEach(function (x) {
      if (wrong.length < 2 && !used[x.w.image] && !used[x.w.emoji]) { wrong.push(x.w); used[x.w.image] = used[x.w.emoji] = 1; }
    });
    var cards = own.map(function (w) { return { w: w, right: true }; })
      .concat(wrong.map(function (w) { return { w: w, right: false }; }));
    return { kind: 1, target: T, cards: H.shuffle(cards) };
  }

  Game.register("find", {
    title: "ابحث عن الحرف",
    icon: "search",
    make: function (letters) {
      var targets = Game.spread(letters, 5), qs = [];
      qs.push(levelOne(targets[0]), levelOne(targets[1]));
      // Level 2: different words, spread over beginning / middle / end when possible.
      var usedWords = {};
      for (var i = 2; i < 5; i++) {
        var T = targets[i];
        var byPos = H.shuffle(["initial", "medial", "final"]);
        var w = null;
        for (var k = 0; k < byPos.length && !w; k++) {
          w = H.shuffle(T.words).find(function (x) { return x.position === byPos[k] && !usedWords[x.word]; }) || null;
        }
        w = w || H.shuffle(T.words)[0];
        usedWords[w.word] = 1;
        qs.push({ kind: 2, target: T, w: w });
      }
      return qs;
    },
    render: function (stage, q, api) {
      var T = q.target;
      if (q.kind === 1) {
        api.setPrompt(function () { return Sound.sequence([["phrases/ex_find", "اضْغَطْ عَلَى الْكَلِمَاتِ الَّتِي فِيهَا الْحَرْف."], ["letters/" + T.id + "/name", T.name]]); });
        var first = true, left = q.cards.filter(function (c) { return c.right; }).length, finished = false;
        var grid = el("div", { class: "find-grid" });
        q.cards.forEach(function (c) {
          var wordEl = el("span", { class: "fword ar", text: c.w.word });
          var card = el("button", { type: "button", class: "find-card", "aria-label": Arabic.stripMarks(c.w.word) }, [
            el("img", { src: c.w.image, alt: "", draggable: "false" }), wordEl]);
          card.addEventListener("click", function () {
            if (finished || card.classList.contains("found")) return;
            if (c.right) {
              card.classList.add("found");
              var i = Arabic.indexForPosition(c.w.word, T.letter, c.w.position);
              wordEl.innerHTML = Arabic.highlightHTML(c.w.word, [i]);
              if (--left === 0) {
                finished = true;
                Game.correct(card).then(function () { api.done(first ? 1 : 0, 1); });
              } else {
                Game.Fx.ding(); Game.animate(card, "win");
                Sound.play("words/" + H.slug(c.w), c.w.word);
              }
            } else {
              first = false;
              Game.wrong(card);
            }
          });
          grid.appendChild(card);
        });
        stage.appendChild(el("div", { class: "ex-center" }, [
          el("div", { class: "target-chip ar", text: Game.glyph(T) }), grid]));
        return;
      }

      // ----- Level 2 -----
      var w = q.w, firstTry = true, step = 1, tapped = -1, done = false;
      var occ = Arabic.occurrences(w.word, T.letter);
      var pieces = Arabic.letterPieces(w.word);
      var wordBox = el("div", { class: "tap-word ar", role: "group", "aria-label": Arabic.stripMarks(w.word) });
      var spans = pieces.map(function (p) { var s = el("span", { text: p.text }); wordBox.appendChild(s); return s; });
      var posRow = el("div", { class: "pos-row", hidden: true });
      var posBtns = POS.map(function (p) {
        var b = el("button", { type: "button", class: "pos-btn", "aria-label": p.label }, [posDots(p.dots), el("span", { text: p.label })]);
        b.addEventListener("click", function () {
          if (step !== 2 || done) return;
          if (p.pos === Arabic.positionOf(w.word, tapped)) {
            done = true;
            b.classList.add("right");
            Game.correct(b).then(function () { api.done(firstTry ? 1 : 0, 1); });
          } else {
            firstTry = false;
            Game.wrong(b);
          }
        });
        posRow.appendChild(b);
        return b;
      });
      function askWhere() {
        return Sound.sequence([["phrases/ex_where", "أَيْنَ الْحَرْف؟"]].concat(POS.map(function (p, i) { return [p.key, p.text, posBtns[i]]; })));
      }

      // Tap the letter: use the letter nearest to the finger, so thin letters (like ا) are easy to hit.
      wordBox.addEventListener("click", function (e) {
        if (step !== 1) return;
        var best = -1, bestD = Infinity;
        spans.forEach(function (s, i) {
          [].forEach.call(s.getClientRects(), function (r) {
            var d = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0;
            if (d < bestD) { bestD = d; best = i; }
          });
        });
        if (best < 0) return;
        var hit = pieces[best].indexes.filter(function (k) { return occ.indexOf(k) >= 0; });
        if (hit.length) {
          step = 2; tapped = hit[0];
          spans[best].classList.add("hl");
          Game.Fx.ding(); Game.animate(wordBox, "win");
          posRow.hidden = false;
          posRow.scrollIntoView({ block: "nearest", behavior: "smooth" });   // short screens: bring the answers into view
          api.setPrompt(askWhere);
          H.wait(400).then(askWhere);
        } else {
          firstTry = false;
          Game.wrong(wordBox);
        }
      });

      api.setPrompt(function () { return Sound.sequence([["phrases/ex_where", "أَيْنَ الْحَرْف؟"], ["letters/" + T.id + "/name", T.name]]); });
      stage.appendChild(el("div", { class: "ex-center" }, [
        el("div", { class: "target-chip ar", text: Game.glyph(T) }),
        el("img", { class: "find-pic", src: w.image, alt: "", draggable: "false" }),
        wordBox, posRow]));
    },
  });
})();
