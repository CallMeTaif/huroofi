/* Review page: exercises that mix several letters.
 * «حروفي»: the letters this child has visited (the teacher can change the choice).
 * «الحروف المتشابهة»: the look-alike groups from the spec, with look-alike wrong answers. */
(function () {
  "use strict";
  var el = H.el, icon = H.icon;
  var GROUPS = ["ب ت ث", "ج ح خ", "د ذ", "ر ز", "س ش", "ص ض", "ط ظ", "ع غ", "ف ق"].map(function (g) {
    return g.split(" ").map(H.byLetter);
  });
  var EXERCISES = [
    { ex: "listen", icon: "ear", title: "اسمع واختر" },
    { ex: "trace", icon: "pencil", title: "اكتب الحرف" },
    { ex: "match", icon: "link", title: "صِل الحرف بالصورة" },
    { ex: "find", icon: "search", title: "ابحث عن الحرف" },
  ];

  var saved = Progress.setting("reviewLetters");
  var mine = (Array.isArray(saved) && saved.length ? saved : Progress.visitedIds())
    .filter(function (id) { return H.byId(id); });
  var group = null;              // the chosen look-alike group (array of letters)
  var mode = location.hash === "#similar" ? "similar" : "mine";

  // ----- Letter picker -----
  var pick = document.getElementById("pick");
  H.LETTERS.forEach(function (l) {
    var b = el("button", { type: "button", class: "pick", "aria-pressed": "false", "aria-label": "حرف " + l.name, text: l.label });
    b.style.setProperty("--h", H.hue(l));
    b.addEventListener("click", function () {
      var i = mine.indexOf(l.id);
      if (i >= 0) mine.splice(i, 1); else mine.push(l.id);
      Sound.play("letters/" + l.id + "/name", l.name);
      save(); refresh();
    });
    b._id = l.id;
    pick.appendChild(el("li", {}, [b]));
  });
  document.getElementById("all").addEventListener("click", function () { mine = H.LETTERS.map(function (l) { return l.id; }); save(); refresh(); });
  document.getElementById("none").addEventListener("click", function () { mine = []; save(); refresh(); });
  function save() { Progress.setSetting("reviewLetters", mine.slice()); }

  // ----- Look-alike groups -----
  var groupsEl = document.getElementById("groups");
  GROUPS.forEach(function (g) {
    var b = el("button", { type: "button", class: "group-card ar", "aria-pressed": "false",
      "aria-label": g.map(function (l) { return l.name; }).join(" و "), text: g.map(function (l) { return l.label; }).join(" ") });
    b.addEventListener("click", function () {
      group = g;
      Sound.sequence(g.map(function (l) { return ["letters/" + l.id + "/name", l.name]; }));
      refresh();
    });
    b._group = g;
    groupsEl.appendChild(b);
  });

  // ----- Tabs -----
  var tabs = { mine: document.getElementById("tab-mine"), similar: document.getElementById("tab-similar") };
  function setMode(m) {
    mode = m;
    history.replaceState(null, "", m === "similar" ? "#similar" : location.pathname + location.search);
    refresh();
  }
  tabs.mine.addEventListener("click", function () { setMode("mine"); });
  tabs.similar.addEventListener("click", function () { setMode("similar"); });

  // ----- Launch buttons -----
  var launch = document.getElementById("launch");
  var tiles = EXERCISES.map(function (it) {
    var a = el("a", { class: "practice-tile", href: "#" }, [icon(it.icon), el("span", { text: it.title })]);
    launch.appendChild(a);
    a._ex = it.ex;
    return a;
  });

  function chosenLetters() {
    if (mode === "similar") return group || [];
    return H.LETTERS.filter(function (l) { return mine.indexOf(l.id) >= 0; });
  }

  function refresh() {
    ["mine", "similar"].forEach(function (m) {
      tabs[m].setAttribute("aria-selected", String(mode === m));
      tabs[m].classList.toggle("active", mode === m);
      document.getElementById("panel-" + m).hidden = mode !== m;
    });
    pick.querySelectorAll(".pick").forEach(function (b) {
      var on = mine.indexOf(b._id) >= 0;
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
    });
    groupsEl.querySelectorAll(".group-card").forEach(function (b) {
      var on = b._group === group;
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
    });
    var letters = chosenLetters();
    document.getElementById("chosen").textContent = letters.map(function (l) { return l.label; }).join("  ");
    var ids = letters.map(function (l) { return l.id; }).join(",");
    tiles.forEach(function (a) {
      var ok = letters.length > 0;
      a.setAttribute("aria-disabled", ok ? "false" : "true");
      a.href = ok ? "exercise.html?type=" + a._ex + "&ids=" + ids + (mode === "similar" ? "&similar=1" : "") : "#";
    });
  }
  tiles.forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (a.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        Game_hint();
      }
    });
  });
  // Nothing chosen yet: shake the picker so the child knows to tap letters first.
  function Game_hint() {
    var target = document.getElementById(mode === "similar" ? "groups" : "pick");
    target.classList.remove("shake"); void target.offsetWidth; target.classList.add("shake");
  }

  document.getElementById("say").addEventListener("click", function () {
    Sound.play("phrases/review", "تَمَارِينُ الْمُرَاجَعَة.", this);
  });
  refresh();
})();
