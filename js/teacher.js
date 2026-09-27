(function () {
  "use strict";
  var el = H.el;
  // Where the site's files live on GitHub (change this if the project moves).
  var REPO = "https://github.com/CallMeTaif/huroofi";
  document.getElementById("edit-link").href = REPO + "/edit/main/data/letters.js";
  document.getElementById("review-list").href = REPO + "/blob/main/docs/TEACHER_REVIEW.md";

  // ----- Classroom mode -----
  var sw = document.getElementById("classroom");
  function showSwitch() {
    var on = !!Progress.setting("classroom");
    sw.setAttribute("aria-checked", String(on));
    document.documentElement.classList.toggle("classroom", on);
  }
  sw.addEventListener("click", function () { Progress.setSetting("classroom", !Progress.setting("classroom")); showSwitch(); });
  showSwitch();

  // ----- Progress table -----
  var EX = [["listen", "اسمع واختر"], ["trace", "اكتب الحرف"], ["match", "صِل الحرف"], ["find", "ابحث عن الحرف"]];
  function drawTable() {
    var t = document.getElementById("progress");
    t.innerHTML = "";
    var head = el("tr", {}, [el("th", { text: "الحرف" })].concat(EX.map(function (e) { return el("th", { text: e[1] }); })));
    t.appendChild(el("thead", {}, [head]));
    var body = el("tbody");
    H.LETTERS.forEach(function (l) {
      var row = el("tr", {}, [el("th", { class: "ar", text: l.label, scope: "row" })]);
      EX.forEach(function (e) {
        var n = Progress.exerciseStars(l.id, e[0]);
        row.appendChild(el("td", { "aria-label": n + " نجوم", text: n ? "⭐".repeat(n) : "–" }));
      });
      body.appendChild(row);
    });
    t.appendChild(body);
  }
  drawTable();

  // ----- Reset, with a confirm step -----
  var resetRow = document.getElementById("reset-row");
  document.getElementById("reset").addEventListener("click", function () {
    resetRow.innerHTML = "";
    var yes = el("button", { type: "button", class: "btn coral", text: "نعم، امسحي كل النجوم" });
    var no = el("button", { type: "button", class: "btn", text: "إلغاء" });
    resetRow.appendChild(el("p", { class: "confirm", text: "هل أنتِ متأكدة؟ ستُمسح كل النجوم على هذا الجهاز ولا يمكن استرجاعها." }));
    resetRow.appendChild(yes); resetRow.appendChild(no);
    yes.focus();
    yes.addEventListener("click", function () {
      Progress.reset(); drawTable();
      resetRow.innerHTML = "";
      resetRow.appendChild(el("p", { class: "confirm", text: "تم مسح التقدّم." }));
    });
    no.addEventListener("click", function () { location.reload(); });
  });

  // ----- YouTube helper -----
  var url = document.getElementById("vid-url"), sel = document.getElementById("vid-letter"), title = document.getElementById("vid-title");
  H.LETTERS.forEach(function (l) { sel.appendChild(el("option", { value: l.id, text: l.label + " – " + l.name })); });
  function videoId(s) {
    s = (s || "").trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    var m = s.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function update() {
    var id = videoId(url.value), out = document.getElementById("vid-out"), err = document.getElementById("vid-err");
    out.hidden = !id; err.hidden = !!id || !url.value.trim();
    if (!id) return;
    var L = H.byId(sel.value);
    var t = title.value.trim() || ("حرف " + L.name);
    document.getElementById("vid-id").textContent = id;
    document.getElementById("vid-thumb").src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    document.getElementById("vid-line").textContent = '{ title: ' + JSON.stringify(t) + ', youtubeId: "' + id + '" },';
  }
  [url, sel, title].forEach(function (x) { x.addEventListener("input", update); x.addEventListener("change", update); });
  document.getElementById("vid-copy").addEventListener("click", function () {
    var text = document.getElementById("vid-line").textContent, btn = this;
    function done() { btn.textContent = "تم النسخ ✓"; setTimeout(function () { btn.textContent = "نسخ السطر"; }, 1500); }
    try { navigator.clipboard.writeText(text).then(done, function () {}); } catch (e) {}
  });
})();
