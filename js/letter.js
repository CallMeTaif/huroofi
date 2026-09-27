(function () {
  "use strict";
  var el = H.el, icon = H.icon;
  var L = H.byId(H.param("id"));
  if (!L) { location.replace("index.html"); return; }

  var idx = H.LETTERS.indexOf(L);
  var prev = H.LETTERS[idx - 1], next = H.LETTERS[idx + 1];
  document.body.style.setProperty("--h", H.hue(L));
  document.title = "حرف " + L.name + " – حروفي";
  document.getElementById("title").textContent = "حرف " + L.name;
  Progress.markVisited(L.id);

  var main = document.getElementById("main");
  var chips = document.getElementById("chips");
  var FATHA = "َ", DAMMA = "ُ", KASRA = "ِ", SUKUN = "ْ";

  function section(id, iconName, title, chipLabel) {
    var s = el("section", { class: "block", id: id, "aria-labelledby": id + "-h" }, [
      el("h2", { id: id + "-h" }, [icon(iconName), title, H.speakBtn("phrases/sec_" + id, title, "small")]),
    ]);
    main.appendChild(s);
    chips.appendChild(el("li", { "data-for": id }, [el("a", { href: "#" + id }, [icon(iconName), chipLabel || title])]));
    return s;
  }

  // ---------- 1. Meet the letter ----------
  (function () {
    var s = section("meet", "abc", "تعرّف على الحرف", "الحرف");
    var bigBtn = el("button", { type: "button", class: "big-letter", "aria-label": "حرف " + L.name, text: L.label });
    bigBtn.addEventListener("click", function () { Sound.play("letters/" + L.id + "/name", L.name, bigBtn); });

    var dotsText = {
      "0-none": "بلا نقاط", "1-above": "نقطة فوقه", "1-below": "نقطة تحته",
      "2-above": "نقطتان فوقه", "2-below": "نقطتان تحته", "3-above": "ثلاث نقاط فوقه",
    }[L.dots.count + "-" + L.dots.position];

    var info = el("div", {}, [
      el("div", { class: "name-row" }, [
        el("span", { class: "name", text: L.name }),
        H.speakBtn("letters/" + L.id + "/name", L.name),
      ]),
      el("div", { class: "desc" }, [
        H.speakBtn("letters/" + L.id + "/desc", L.description),
        el("p", { class: "ar", text: L.description }),
      ]),
      el("div", { class: "facts" }, [
        el("span", { class: "fact" }, [dotsText]),
        el("span", { class: "fact" }, [L.connectsToNext ? "يتصل بما بعده" : "لا يتصل بما بعده"]),
      ]),
    ]);
    s.appendChild(el("div", { class: "meet" }, [bigBtn, info]));
  })();

  // ---------- 2. Letter forms ----------
  (function () {
    var s = section("forms", "pencil", "أشكال الحرف", "الأشكال");
    var labels = { isolated: "وحده", initial: "في البداية", medial: "في الوسط", final: "في النهاية" };
    if (!L.connectsToNext) labels = { isolated: "منفصل", final: "متصل بما قبله" };
    var shapes = Object.keys(labels).filter(function (k) { return L.forms[k]; });
    var grid = el("div", { class: "forms-grid" + (shapes.length === 2 ? " two" : "") });
    shapes.forEach(function (shape) {
      var word = L.formExamples && L.formExamples[shape];
      var card = el("div", { class: "form-card" }, [
        el("span", { class: "label", text: labels[shape] }),
        el("span", { class: "shape", text: L.forms[shape] }),
      ]);
      if (word) {
        var i = Arabic.indexForShape(word, L.letter, shape);
        card.appendChild(el("div", { class: "example" }, [
          el("span", { class: "word", html: Arabic.highlightHTML(word, [i]) }),
          H.speakBtn("letters/" + L.id + "/form-" + shape, word, "small"),
        ]));
      }
      grid.appendChild(card);
    });
    s.appendChild(grid);
    if (!L.connectsToNext) {
      s.appendChild(el("p", { class: "note" }, [icon("sparkles"),
        "حرف " + L.name + " لا يتصل بالحرف الذي بعده، لذلك له شكلان فقط."]));
    }
  })();

  // ---------- 3. Short and long vowels ----------
  (function () {
    var s = section("vowels", "speaker", "الحركات", "الحركات");
    var c = L.letter;
    var sylls = L.vowels || [c + FATHA, c + DAMMA, c + KASRA, c + SUKUN, c + FATHA + "ا", c + DAMMA + "و", c + KASRA + "ي"];
    var names = ["فتحة", "ضمّة", "كسرة", "سكون", "مدّ بالألف", "مدّ بالواو", "مدّ بالياء"];
    var grid = el("div", { class: "vowel-grid" });
    sylls.forEach(function (syl, i) {
      var b = el("button", { type: "button", class: "vowel-btn" + (i >= 4 ? " long" : ""), "aria-label": names[i] }, [
        el("span", { class: "syl", text: syl }),
        el("span", { class: "vname", text: names[i] }),
      ]);
      b.addEventListener("click", function () { Sound.play("letters/" + L.id + "/v" + (i + 1), syl, b); });
      grid.appendChild(b);
    });
    s.appendChild(grid);
  })();

  // ---------- 4. Words and pictures ----------
  (function () {
    var s = section("words", "book", "كلمات وصور", "الكلمات");
    var groups = [
      { pos: "initial", title: "في البداية", dots: [1, 0, 0] },
      { pos: "medial", title: "في الوسط", dots: [0, 1, 0] },
      { pos: "final", title: "في النهاية", dots: [0, 0, 1] },
    ];
    var wrap = el("div", { class: "word-groups" });
    groups.forEach(function (g) {
      var words = L.words.filter(function (w) { return w.position === g.pos; });
      if (!words.length) return;
      var dots = el("span", { class: "pos-dots", "aria-hidden": "true" });
      g.dots.forEach(function (on) { dots.appendChild(el("i", { class: on ? "on" : "" })); });
      var list = el("div", { class: "word-list" });
      words.forEach(function (w) {
        var i = Arabic.indexForPosition(w.word, L.letter, w.position);
        var key = "words/" + H.slug(w);
        var card = el("div", { class: "word-card", role: "button", tabindex: "0", "aria-label": Arabic.stripMarks(w.word) }, [
          el("img", { class: "pic", src: w.image, alt: "", draggable: "false" }),
          el("span", { class: "word", html: Arabic.highlightHTML(w.word, [i]) }),
        ]);
        var btn = H.speakBtn(key, w.word, "small");
        card.appendChild(btn);
        function say() { Sound.play(key, w.word, btn); }
        card.addEventListener("click", say);
        card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); say(); } });
        list.appendChild(card);
      });
      wrap.appendChild(el("div", { class: "word-group" }, [el("h3", {}, [dots, g.title]), list]));
    });
    s.appendChild(wrap);
  })();

  // ---------- 5. Watch and learn ----------
  (function () {
    var videos = L.videos || [];
    if (!videos.length) return;
    var s = section("videos", "film", "شاهد وتعلّم", "فيديو");
    var grid = el("div", { class: "video-grid" });
    var chip = chips.querySelector('[data-for="videos"]');
    var alive = videos.length;

    function drop(card) {
      if (!card.parentNode) return;
      card.remove();
      if (--alive <= 0) { s.remove(); if (chip) chip.remove(); }
    }

    videos.forEach(function (v) {
      var card = el("div", { class: "video-card" });
      var thumb = el("img", { class: "thumb", alt: "", loading: "lazy", referrerpolicy: "no-referrer",
        src: "https://i.ytimg.com/vi/" + encodeURIComponent(v.youtubeId) + "/hqdefault.jpg" });
      // A deleted video returns YouTube's small grey placeholder (120px wide) instead of a real thumbnail.
      thumb.addEventListener("load", function () { if (thumb.naturalWidth && thumb.naturalWidth <= 120) drop(card); });
      thumb.addEventListener("error", function () { drop(card); });
      var btn = el("button", { type: "button", class: "video-thumb", "aria-label": "شغّل: " + v.title }, [
        thumb, el("span", { class: "play" }, [icon("play")]),
      ]);
      btn.addEventListener("click", function () {
        // YouTube refuses to play embeds on pages opened as a local file (file://),
        // so in that case open the video on YouTube in a new tab instead.
        if (location.protocol === "file:") {
          window.open("https://www.youtube.com/watch?v=" + encodeURIComponent(v.youtubeId), "_blank", "noopener");
          return;
        }
        var frame = el("iframe", {
          src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.youtubeId) + "?rel=0&autoplay=1&playsinline=1&modestbranding=1",
          title: v.title, allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
          allowfullscreen: "", referrerpolicy: "strict-origin-when-cross-origin",
        });
        btn.replaceWith(frame);
      });
      card.appendChild(btn);
      card.appendChild(el("span", { class: "vtitle", text: v.title }));
      grid.appendChild(card);
    });
    s.appendChild(grid);
  })();

  // ---------- 6. Practice ----------
  (function () {
    var s = section("practice", "star", "تمرّن", "تمرّن");
    var items = [
      { ex: "listen", icon: "ear", title: "اسمع واختر" },
      { ex: "trace", icon: "pencil", title: "اكتب الحرف" },
      { ex: "match", icon: "link", title: "صِل الحرف بالصورة" },
      { ex: "find", icon: "search", title: "ابحث عن الحرف" },
    ];
    var grid = el("div", { class: "practice-grid" });
    items.forEach(function (it) {
      var tile = el("a", { class: "practice-tile", href: "exercise.html?type=" + it.ex + "&id=" + L.id },
        [icon(it.icon), el("span", { text: it.title }), H.starsEl(Progress.exerciseStars(L.id, it.ex))]);
      grid.appendChild(tile);
    });
    s.appendChild(grid);
  })();

  // ---------- Previous / next letter ----------
  (function () {
    function navBtn(target, dir) {
      if (!target) return el("span", { class: "spacer" });
      var a = el("a", { class: "btn", href: "letter.html?id=" + target.id,
        "aria-label": (dir === "prev" ? "الحرف السابق: " : "الحرف التالي: ") + target.name });
      // In right-to-left, "previous" sits on the right and points right.
      if (dir === "prev") { a.appendChild(icon("prev")); a.appendChild(document.createTextNode(target.label)); }
      else { a.appendChild(document.createTextNode(target.label)); a.appendChild(icon("next")); }
      return a;
    }
    var bottom = document.getElementById("bottom-nav");
    bottom.appendChild(navBtn(prev, "prev"));
    bottom.appendChild(el("a", { class: "btn round teal", href: "index.html", "aria-label": "الصفحة الرئيسية" }, [icon("home")]));
    bottom.appendChild(navBtn(next, "next"));

    var top = document.getElementById("top-nav");
    [[prev, "prev"], [next, "next"]].forEach(function (p) {
      if (!p[0]) return;
      top.appendChild(el("a", { class: "btn round", href: "letter.html?id=" + p[0].id,
        "aria-label": p[1] === "prev" ? "الحرف السابق" : "الحرف التالي" }, [icon(p[1])]));
    });
  })();

  // ---------- Highlight the chip of the section on screen ----------
  if ("IntersectionObserver" in window) {
    var links = {};
    chips.querySelectorAll("li").forEach(function (li) { links[li.getAttribute("data-for")] = li.firstChild; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) {
          var on = k === e.target.id;
          links[k].classList.toggle("active", on);
          // Keep the active chip visible in the horizontal bar on phones (works in RTL too).
          if (on && chips.scrollWidth > chips.clientWidth) links[k].scrollIntoView({ block: "nearest", inline: "center" });
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    main.querySelectorAll("section").forEach(function (s) { io.observe(s); });
  }
})();
