/* «اكتب الحرف» — trace the letter with a finger, stylus or mouse.
 * The letter is drawn from the Naskh font in light grey with a dotted outline.
 * Checking compares the child's strokes with the letter's pixels (see Trace.score):
 *   coverage = how much of the letter the strokes cover (need ≥ PASS_COVER)
 *   outside  = how much of the ink is far from the letter (must be ≤ PASS_OUTSIDE)
 * The thresholds are generous on purpose: 6-year-olds are not precise. */
(function () {
  "use strict";
  var el = H.el, icon = H.icon;
  // Tuned with simulated tracing of all 56 letter shapes (tools/trace-tuning.html):
  // a full trace scores ≥ 0.92 coverage even when very wobbly; tracing only half the letter scores 0.50–0.83.
  // The spec's "about 60%" is lower because this check counts a wide band around each stroke.
  var PASS_COVER = 0.8, PASS_OUTSIDE = 0.45;
  var N = 160;                 // resolution used for checking
  var INK = 0.06;              // width of the child's line, as a share of the canvas size
  var REACH = 0.14;            // how wide a line "covers" the letter when checking
  var SLACK = 0.08;            // how far outside the letter ink may go and still count as inside

  function layout(ctx, glyph, S) {
    // Scale the letter so its drawn shape fills about 3/4 of the box (width or height, whichever is larger).
    var px = S * 0.62, m;
    for (var k = 0; k < 4; k++) {
      ctx.font = px + "px Naskh";
      m = ctx.measureText(glyph);
      var w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      var h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      var f = Math.min((S * 0.74) / w, (S * 0.74) / h);
      if (Math.abs(f - 1) < 0.02) break;
      px *= f;
    }
    return {
      font: px + "px Naskh",
      x: (S - (m.actualBoundingBoxLeft + m.actualBoundingBoxRight)) / 2 + m.actualBoundingBoxLeft,
      y: (S - (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)) / 2 + m.actualBoundingBoxAscent,
    };
  }

  function drawText(ctx, glyph, S, fill, strokeWidth) {
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    var p = layout(ctx, glyph, S);
    ctx.font = p.font;
    if (fill) ctx.fillText(glyph, p.x, p.y);
    if (strokeWidth) { ctx.lineWidth = strokeWidth; ctx.lineJoin = "round"; ctx.strokeText(glyph, p.x, p.y); }
  }

  function drawStrokes(ctx, strokes, scale, width) {
    ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    strokes.forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(s[0][0] * scale, s[0][1] * scale);
      if (s.length === 1) ctx.lineTo(s[0][0] * scale + 0.01, s[0][1] * scale);
      for (var i = 1; i < s.length; i++) ctx.lineTo(s[i][0] * scale, s[i][1] * scale);
      ctx.stroke();
    });
  }

  function raster(draw) {
    var c = document.createElement("canvas"); c.width = c.height = N;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = x.strokeStyle = "#000";
    draw(x);
    var d = x.getImageData(0, 0, N, N).data, out = new Uint8Array(N * N);
    for (var i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    return out;
  }

  /* Score strokes (arrays of [x, y] in a canvas of size S css px) against a glyph. */
  function score(glyph, strokes, S) {
    var sc = N / S;
    var mask = raster(function (x) { drawText(x, glyph, N, true, 0); });
    var maskWide = raster(function (x) { drawText(x, glyph, N, true, N * SLACK); });
    var ink = raster(function (x) { drawStrokes(x, strokes, sc, N * INK); });
    var reach = raster(function (x) { drawStrokes(x, strokes, sc, N * REACH); });
    var m = 0, covered = 0, inkN = 0, out = 0;
    for (var i = 0; i < mask.length; i++) {
      if (mask[i]) { m++; if (reach[i]) covered++; }
      if (ink[i]) { inkN++; if (!maskWide[i]) out++; }
    }
    var coverage = m ? covered / m : 0, outside = inkN ? out / inkN : 1;
    return { coverage: coverage, outside: outside, pass: inkN > 0 && coverage >= PASS_COVER && outside <= PASS_OUTSIDE };
  }

  window.Trace = { score: score, layout: layout, drawText: drawText, N: N, PASS_COVER: PASS_COVER, PASS_OUTSIDE: PASS_OUTSIDE };

  Game.register("trace", {
    title: "اكتب الحرف",
    icon: "pencil",
    instruction: ["phrases/ex_trace", "اكْتُبِ الْحَرْفَ بِإِصْبَعِك."],
    make: function (letters) {
      if (letters.length === 1) {
        var L = letters[0], second = L.forms.initial ? "initial" : "final";
        // Isolated form first, then the beginning form (or the end form for letters that never join forward).
        return [
          { letter: L, glyph: L.letter },
          { letter: L, glyph: L.forms[second] },
          { letter: L, glyph: L.letter },
        ];
      }
      return Game.spread(letters, Math.min(5, Math.max(3, letters.length))).map(function (l) { return { letter: l, glyph: l.letter }; });
    },
    render: function (stage, q, api) {
      var L = q.letter;
      var S = Math.floor(Math.max(220, Math.min(stage.clientWidth || 360, window.innerHeight - 300, 560)));
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var canvas = el("canvas", { class: "trace-canvas", width: S * dpr, height: S * dpr, "aria-label": "لوحة الكتابة" });
      canvas.style.width = canvas.style.height = S + "px";
      var ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      var strokes = [], drawing = null, tries = 0, finished = false;
      var inkColor = "hsl(" + H.hue(L) + " 70% 42%)";

      function paint(reveal) {
        ctx.clearRect(0, 0, S, S);
        ctx.fillStyle = reveal ? "hsl(" + H.hue(L) + " 80% 85%)" : "#ece5da";
        drawText(ctx, q.glyph, S, true, 0);
        ctx.setLineDash([S * 0.018, S * 0.016]);
        ctx.strokeStyle = "#a8998a";
        drawText(ctx, q.glyph, S, false, Math.max(1.5, S * 0.006));
        ctx.setLineDash([]);
        ctx.strokeStyle = inkColor;
        drawStrokes(ctx, strokes, 1, S * INK);
      }

      function pt(e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (S / r.width), (e.clientY - r.top) * (S / r.height)]; }
      canvas.addEventListener("pointerdown", function (e) {
        if (finished) return;
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        drawing = [pt(e)];
        strokes.push(drawing);
        paint();
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!drawing) return;
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        (evs.length ? evs : [e]).forEach(function (ev) { drawing.push(pt(ev)); });
        paint();
      });
      function end() { drawing = null; }
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);

      var hear = H.speakBtn("letters/" + L.id + "/name", L.name);
      var clearBtn = el("button", { type: "button", class: "btn round", "aria-label": "امسح" }, [icon("eraser")]);
      var checkBtn = el("button", { type: "button", class: "btn teal round big", "aria-label": "تحقّق" }, [icon("check")]);
      var skipBtn = el("button", { type: "button", class: "btn round", "aria-label": "التالي", hidden: true }, [icon("next")]);
      clearBtn.addEventListener("click", function () { if (!finished) { strokes = []; paint(); } });
      skipBtn.addEventListener("click", function () { if (!finished) { finished = true; api.done(0, 1); } });
      checkBtn.addEventListener("click", function () {
        if (finished) return;
        if (!strokes.length) { Game.animate(canvas, "shake"); Game.Fx.buzz(); return; }
        var r = score(q.glyph, strokes, S);
        canvas.setAttribute("data-score", r.coverage.toFixed(2) + "/" + r.outside.toFixed(2));
        if (r.pass) {
          finished = true;
          paint(true);
          Game.correct(canvas).then(function () { api.done(tries === 0 ? 1 : 0, 1); });
        } else {
          tries++;
          Game.wrong(canvas).then(function () { strokes = []; paint(); });
          if (tries >= 2) skipBtn.hidden = false;   // never get stuck: after 2 tries the child may move on
        }
      });

      api.setPrompt(function () { return Game.letterName(L, hear); });
      stage.appendChild(el("div", { class: "ex-center" }, [
        el("div", { class: "trace-wrap" }, [canvas]),
        el("div", { class: "tool-row" }, [clearBtn, checkBtn, hear, skipBtn]),
      ]));
      var fontReady = document.fonts && document.fonts.load ? document.fonts.load("100px Naskh", q.glyph) : Promise.resolve();
      paint();
      fontReady.then(function () { paint(); });
    },
  });
})();
