/* «اسمع واختر» — hear a letter sound, tap the right letter.
 * Level 1: 3 choices, random other letters. Level 2: 4 choices, look-alike letters first. */
(function () {
  "use strict";
  var el = H.el, icon = H.icon;
  // Which sound to play: the syllables and the letter name. [audio suffix, index into Game.syllables or -1 for name]
  var SOUNDS = [["v1", 0], ["v2", 1], ["v3", 2], ["name", -1], ["v5", 4], ["v6", 5], ["v7", 6]];

  Game.register("listen", {
    title: "اسمع واختر",
    icon: "ear",
    levels: true,
    instruction: ["phrases/ex_listen", "اسْمَعْ، ثُمَّ اخْتَرِ الْحَرْفَ الصَّحِيح."],
    make: function (letters, level, ids) {
      var targets = Game.spread(letters, 5);
      var sounds = H.shuffle(SOUNDS).concat(H.shuffle(SOUNDS));
      return targets.map(function (t, i) {
        var s = sounds[i];
        var n = level === 2 ? 4 : 3;
        var text = s[1] < 0 ? t.name : Game.syllables(t)[s[1]];
        return {
          target: t,
          sound: ["letters/" + t.id + "/" + s[0], text],
          choices: H.shuffle([t].concat(Game.distractors(t, n - 1, level === 2, letters.length > 1 ? ids : null))),
        };
      });
    },
    render: function (stage, q, api) {
      var ear = el("button", { type: "button", class: "ear-btn", "aria-label": "استمع مرة أخرى" }, [icon("ear")]);
      function play() { return Sound.play(q.sound[0], q.sound[1], ear); }
      ear.addEventListener("click", play);
      api.setPrompt(play);

      var first = true, finished = false;
      var row = el("div", { class: "choices n" + q.choices.length });
      q.choices.forEach(function (c) {
        var b = el("button", { type: "button", class: "choice ar", "aria-label": "حرف " + c.name, text: Game.glyph(c) });
        b.addEventListener("click", function () {
          if (finished) return;
          if (c === q.target) {
            finished = true;
            b.classList.add("right");
            Game.correct(b).then(function () { api.done(first ? 1 : 0, 1); });
          } else {
            first = false;
            b.classList.add("tried");
            Game.wrong(b).then(function (r) { if (r === true && !finished) play(); });
          }
        });
        row.appendChild(b);
      });
      stage.appendChild(el("div", { class: "ex-center" }, [ear, row]));
    },
  });
})();
