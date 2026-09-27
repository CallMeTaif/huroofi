/* «صِل الحرف بالصورة» — match each letter to the picture whose word starts with it.
 * Drag a letter onto a picture, or tap a letter and then tap a picture.
 * Tapping a picture with no letter selected says its word (a gentle hint).
 * A round is 2 boards of 3 letters; stars count letters matched on the first try. */
(function () {
  "use strict";
  var el = H.el;

  function startWords(L) { return L.words.filter(function (w) { return w.position === "initial"; }); }

  function board(letters) {
    var used = {}, pairs = [];
    letters.forEach(function (L) {
      // Pick a word starting with this letter whose picture is not already on the board.
      var w = H.shuffle(startWords(L)).find(function (w) { return !used[w.image] && !used[w.emoji]; });
      if (!w) return;
      used[w.image] = used[w.emoji] = 1;
      pairs.push({ letter: L, word: w });
    });
    return pairs;
  }

  Game.register("match", {
    title: "صِل الحرف بالصورة",
    icon: "link",
    instruction: ["phrases/ex_match", "صِلِ الْحَرْفَ بِالصُّورَة."],
    make: function (letters) {
      var boards = [];
      var targets = Game.spread(letters, 2);
      for (var b = 0; b < 2; b++) {
        // Always include this board's target letter; fill up to 3 with other letters.
        var set = letters.length >= 3 ? H.shuffle(letters).slice(0, 3) : H.shuffle(letters);
        if (set.indexOf(targets[b]) < 0) set[0] = targets[b];
        if (set.length < 3) {
          set = set.concat(Game.distractors(targets[b], 6, false, null)
            .filter(function (l) { return set.indexOf(l) < 0; }).slice(0, 3 - set.length));
        }
        boards.push({ pairs: board(set) });
      }
      return boards;
    },
    render: function (stage, q, api) {
      var pairs = q.pairs, selected = null, matched = 0, firstRight = 0, busy = false;
      var tilesRow = el("div", { class: "match-letters" });
      var picsRow = el("div", { class: "match-pics" });

      function select(tile) {
        if (selected) selected.classList.remove("selected");
        selected = tile && tile !== selected ? tile : null;
        if (selected) { selected.classList.add("selected"); Game.Fx.pop(); }
      }

      function attempt(tile, card) {
        if (busy || !tile || tile.classList.contains("used") || card.classList.contains("matched")) return;
        var p = tile._pair, target = card._pair;
        select(null);
        if (p === target) {
          busy = true;
          if (!tile._missed) firstRight++;
          tile.classList.add("used");
          card.classList.add("matched");
          var w = target.word;
          var i = Arabic.indexForPosition(w.word, target.letter.letter, "initial");
          card.querySelector(".mword").innerHTML = Arabic.highlightHTML(w.word, [i]);
          Game.correct(card).then(function () {
            return Sound.play("words/" + H.slug(w), w.word);
          }).then(function () {
            busy = false;
            if (++matched === pairs.length) api.done(firstRight, pairs.length);
          });
        } else {
          tile._missed = true;
          Game.wrong(tile);
        }
      }

      H.shuffle(pairs).forEach(function (p) {
        var tile = el("button", { type: "button", class: "match-tile ar", "aria-label": "حرف " + p.letter.name, text: Game.glyph(p.letter) });
        tile._pair = p;
        var start = null, ghost = null;
        tile.addEventListener("pointerdown", function (e) {
          if (tile.classList.contains("used") || busy) return;
          e.preventDefault();
          try { tile.setPointerCapture(e.pointerId); } catch (err) {}
          start = { x: e.clientX, y: e.clientY };
        });
        tile.addEventListener("pointermove", function (e) {
          if (!start) return;
          if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
            ghost = tile.cloneNode(true);
            ghost.classList.add("ghost");
            var r = tile.getBoundingClientRect();
            ghost.style.width = r.width + "px"; ghost.style.height = r.height + "px";
            document.body.appendChild(ghost);
            tile.classList.add("lifted");
          }
          if (ghost) {
            ghost.style.left = e.clientX - ghost.offsetWidth / 2 + "px";
            ghost.style.top = e.clientY - ghost.offsetHeight / 2 + "px";
          }
        });
        function up(e) {
          if (!start) return;
          start = null;
          if (ghost) {
            ghost.remove(); ghost = null;
            tile.classList.remove("lifted");
            var hit = document.elementFromPoint(e.clientX, e.clientY);
            var card = hit && hit.closest(".match-pic");
            if (card) attempt(tile, card);
          } else {
            select(tile);   // a tap: select, then tap a picture
          }
        }
        tile.addEventListener("pointerup", up);
        tile.addEventListener("pointercancel", function () { start = null; if (ghost) { ghost.remove(); ghost = null; tile.classList.remove("lifted"); } });
        // Keyboard users: Enter selects.
        tile.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(tile); } });
        tilesRow.appendChild(tile);
      });

      H.shuffle(pairs).forEach(function (p) {
        var card = el("button", { type: "button", class: "match-pic", "aria-label": Arabic.stripMarks(p.word.word) }, [
          el("img", { src: p.word.image, alt: "", draggable: "false" }),
          el("span", { class: "mword ar" }),
        ]);
        card._pair = p;
        card.addEventListener("click", function () {
          if (selected) attempt(selected, card);
          else if (!card.classList.contains("matched")) Sound.play("words/" + H.slug(p.word), p.word.word);
        });
        picsRow.appendChild(card);
      });

      stage.appendChild(el("div", { class: "ex-center match" }, [tilesRow, picsRow]));
    },
  });
})();
