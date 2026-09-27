/* Shared engine for the four exercises.
 * An exercise registers itself with Game.register(type, def) where def has:
 *   title, icon          – shown in the header
 *   make(letters, level) – returns the list of questions for one round
 *   render(stage, q, api)– draws one question; calls api.done(firstTryRight, items) when finished
 *   instruction          – optional [audioKey, text] said once at the start of the round
 * The engine handles the round, progress dots, feedback, stars and the end screen.
 * Rules from the spec: no red X, no lost points, no timers; stars count answers right on the first try. */
(function () {
  "use strict";
  var el = H.el, icon = H.icon;
  var registry = {};
  var ORDER = ["listen", "trace", "match", "find"];

  // ---------- Gentle sound effects made with the Web Audio API (no files needed) ----------
  var ctx = null;
  function audioCtx() {
    try {
      if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, type, vol, freqEnd) {
    var c = audioCtx(); if (!c) return;
    var t = c.currentTime + start, o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  var Fx = {
    ding: function () { tone(660, 0, 0.22, "sine", 0.2, 880); tone(990, 0.1, 0.35, "sine", 0.16, 1320); },
    buzz: function () { tone(210, 0, 0.26, "triangle", 0.1, 150); },          // soft, not scary
    pop: function () { tone(880, 0, 0.12, "sine", 0.12, 1200); },
    fanfare: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.3, "sine", 0.16); }); },
  };
  // Browsers only allow sound after the first tap; wake the audio system then.
  document.addEventListener("pointerdown", function () { audioCtx(); }, { capture: true, once: true });

  function animate(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;  // restart the animation
    node.classList.add(cls);
    node.addEventListener("animationend", function f() { node.classList.remove(cls); node.removeEventListener("animationend", f); });
  }

  var PRAISE = [["phrases/great1", "أَحْسَنْت!"], ["phrases/great2", "مُمْتَاز!"], ["phrases/great3", "رَائِع!"]];
  var FATHA = "َ", DAMMA = "ُ", KASRA = "ِ", SUKUN = "ْ";

  var Game = {
    Fx: Fx,
    register: function (type, def) { def.type = type; registry[type] = def; },
    animate: animate,
    // Right answer: ding + happy bounce + spoken praise. Resolves when the praise has finished.
    correct: function (node) {
      Fx.ding();
      animate(node, "win");
      var p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      return H.wait(250).then(function () { return Sound.play(p[0], p[1]); });
    },
    // Wrong answer: soft buzz + gentle shake + «حاول مرة أخرى». No red X, no lost points.
    wrong: function (node) {
      Fx.buzz();
      animate(node, "shake");
      return H.wait(200).then(function () { return Sound.play("phrases/try_again", "حَاوِلْ مَرَّةً أُخْرَى."); });
    },
    letterName: function (L, btn) { return Sound.play("letters/" + L.id + "/name", L.name, btn); },
    // The 7 syllables of a letter, as shown: [fatha, damma, kasra, sukun, long a, long u, long i]
    syllables: function (L) {
      var c = L.letter;
      return L.vowels || [c + FATHA, c + DAMMA, c + KASRA, c + SUKUN, c + FATHA + "ا", c + DAMMA + "و", c + KASRA + "ي"];
    },
    // A letter tile's text (هـ is written with its tail, like in the textbooks).
    glyph: function (L) { return L.label; },
    // Other letters to use as wrong choices. similar=true prefers look-alike letters (harder).
    distractors: function (target, n, similar, fromIds) {
      var sim = (target.similarLetters || []).map(H.byLetter).filter(Boolean);
      var others = H.LETTERS.filter(function (l) { return l !== target && sim.indexOf(l) < 0; });
      if (fromIds && fromIds.length) {  // review mode: prefer the letters the teacher chose
        var chosen = others.filter(function (l) { return fromIds.indexOf(l.id) >= 0; });
        others = H.shuffle(chosen).concat(H.shuffle(others.filter(function (l) { return chosen.indexOf(l) < 0; })));
      } else {
        others = H.shuffle(others);
      }
      var pool = similar ? H.shuffle(sim).concat(others) : others;
      return pool.slice(0, n);
    },
    // Words from every letter, each once, with the letter that owns them.
    allWords: function () {
      var seen = {}, out = [];
      H.LETTERS.forEach(function (l) {
        l.words.forEach(function (w) { if (!seen[w.word]) { seen[w.word] = 1; out.push({ w: w, owner: l }); } });
      });
      return out;
    },
    // Round-robin the chosen letters across n questions, in random order.
    spread: function (letters, n) {
      var out = [], bag = [];
      for (var i = 0; i < n; i++) { if (!bag.length) bag = H.shuffle(letters); out.push(bag.pop()); }
      return out;
    },
  };
  window.Game = Game;

  // ---------------- The page ----------------
  function start() {
    var type = H.param("type"), def = registry[type];
    var idsParam = H.param("ids");
    var ids = (idsParam || H.param("id") || "").split(",").filter(Boolean);
    var letters = ids.map(H.byId).filter(Boolean);
    if (!def || !letters.length) { location.replace("index.html"); return; }
    var single = !idsParam && letters.length === 1;
    var L = letters[0];
    var levelParam = parseInt(H.param("level"), 10);
    // similar=1 (review page, look-alike letters): always the harder level with look-alike choices.
    var similar = H.param("similar") === "1";
    var level = similar ? 2 : levelParam || (def.levels && single && Progress.exerciseStars(L.id, type) === 3 ? 2 : 1);
    if (single) document.body.style.setProperty("--h", H.hue(L));

    document.title = def.title + " – حروفي";
    var backHref = single ? "letter.html?id=" + L.id : "review.html" + (similar ? "#similar" : "");
    var header = document.getElementById("ex-header");
    var replayBtn = el("button", { type: "button", class: "speak", "aria-label": "أعد التعليمات" }, [icon("speaker")]);
    header.appendChild(el("a", { class: "btn round", href: backHref, "aria-label": "رجوع" }, [
      single ? el("span", { class: "back-letter ar", text: L.label }) : icon("review")]));
    header.appendChild(el("span", { class: "ex-title" }, [icon(def.icon), def.title]));
    header.appendChild(replayBtn);

    var dots = document.getElementById("ex-dots");
    var stage = document.getElementById("ex-stage");
    var questions, idx, right, items, promptFn;

    var api = {
      level: level, letters: letters, single: single,
      // The spoken prompt for this question (replayed by the 🔊 button in the header).
      setPrompt: function (fn) { promptFn = fn; },
      done: function (firstTryRight, count) {
        right += firstTryRight; items += count;
        var d = dots.children[idx]; if (d) d.classList.add("done");
        idx++;
        H.wait(500).then(idx < questions.length ? ask : finish);
      },
    };

    function sayInstruction() {
      return def.instruction ? Sound.play(def.instruction[0], def.instruction[1], replayBtn) : Promise.resolve(true);
    }
    function sayPrompt() { return promptFn ? promptFn() : Promise.resolve(true); }

    replayBtn.addEventListener("click", function () {
      sayInstruction().then(function (r) { if (r === true) sayPrompt(); });
    });

    function ask() {
      stage.innerHTML = "";
      promptFn = null;
      def.render(stage, questions[idx], api);
      if (idx === 0) {
        sayInstruction().then(function (r) {
          if (r === false) showStartOverlay();   // sound blocked until the first tap
          else if (r === true) sayPrompt();
        });
      } else {
        H.wait(250).then(sayPrompt);
      }
    }

    // Some browsers (Safari, iPad) block sound until the child taps once. Show one big play button.
    function showStartOverlay() {
      if (document.querySelector(".start-overlay")) return;
      var b = el("button", { type: "button", class: "start-btn", "aria-label": "ابدأ" }, [icon("play")]);
      var ov = el("div", { class: "start-overlay" }, [b]);
      b.addEventListener("click", function () {
        ov.remove();
        sayInstruction().then(function (r) { if (r === true) sayPrompt(); });
      });
      document.body.appendChild(ov);
    }

    function begin() {
      questions = def.make(letters, level, ids);
      idx = 0; right = 0; items = 0;
      dots.innerHTML = "";
      questions.forEach(function () { dots.appendChild(el("i")); });
      document.getElementById("ex-end").hidden = true;
      stage.hidden = false;
      ask();
    }

    function finish() {
      var ratio = items ? right / items : 0;
      var stars = ratio >= 0.99 ? 3 : ratio >= 0.6 ? 2 : 1;   // finishing always earns at least one star
      if (single) Progress.setStars(L.id, type, stars);
      stage.hidden = true;
      var end = document.getElementById("ex-end");
      end.innerHTML = "";
      var starRow = H.starsEl(0, true);
      end.appendChild(el("img", { class: "party", src: "img/ui/party.svg", alt: "" }));
      end.appendChild(starRow);
      var actions = el("div", { class: "end-actions" });
      actions.appendChild(el("button", { type: "button", class: "btn teal big", "aria-label": "مرة أخرى", onclick: begin }, [icon("review")]));
      if (def.levels && level === 1 && stars === 3) {
        var harder = new URLSearchParams(location.search); harder.set("level", "2");
        actions.appendChild(el("a", { class: "btn coral big", href: "exercise.html?" + harder.toString(), "aria-label": "أصعب" }, [icon("trophy")]));
      }
      var next = ORDER[ORDER.indexOf(type) + 1];
      if (single && next) {
        actions.appendChild(el("a", { class: "btn big", href: "exercise.html?type=" + next + "&id=" + L.id, "aria-label": "التمرين التالي" },
          [icon(registry[next].icon), icon("next")]));
      }
      actions.appendChild(el("a", { class: "btn big", href: backHref, "aria-label": "رجوع" },
        [single ? el("span", { class: "back-letter ar", text: L.label }) : icon("home")]));
      end.appendChild(actions);
      end.hidden = false;
      Fx.fanfare();
      // Light the stars one by one.
      [].forEach.call(starRow.children, function (s, i) {
        if (i < stars) setTimeout(function () { s.classList.add("on"); animate(s, "pop"); Fx.pop(); }, 500 + i * 350);
      });
      H.wait(500 + stars * 350).then(function () { Sound.play("phrases/round_done", "رَائِع! انْتَهَتِ الْجَوْلَة."); });
    }

    begin();
  }

  Game.start = start;
  Game.defs = registry;   // used by tools/exercise-check.html
})();
