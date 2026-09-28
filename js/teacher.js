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

  // ----- Children (profiles) on this device -----
  var AVATARS = ["lion", "tiger", "bear", "panda", "koala", "rabbit", "fox", "frog", "monkey", "penguin", "owl", "turtle",
    "octopus", "unicorn", "dolphin", "whale", "giraffe", "elephant", "ladybug", "butterfly", "bee", "cat", "dog", "cow",
    "chick", "parrot", "fish", "dinosaur", "hedgehog", "snail"];
  var shown;   // whose progress the table shows (profile id, or null for a single-child device)
  function img(id) { return el("img", { src: "img/avatars/" + id + ".svg", alt: "" }); }
  function drawKids() {
    var list = Progress.profiles(), kids = document.getElementById("kids"), pick = document.getElementById("avatar-pick");
    kids.innerHTML = ""; pick.innerHTML = "";
    if (!list.length) kids.appendChild(el("p", { class: "muted", text: "لا توجد صور بعد: الجهاز لطفل واحد." }));
    list.forEach(function (p) {
      var card = el("div", { class: "kid" }, [img(p.avatar), el("span", { text: "⭐ " + Progress.totalStars(p.id) })]);
      var del = el("button", { type: "button", class: "btn kid-del", "aria-label": "حذف", text: "حذف" });
      del.addEventListener("click", function () {
        card.innerHTML = "";
        card.appendChild(img(p.avatar));
        card.appendChild(el("span", { class: "confirm", text: "حذف هذا الطفل ونجومه؟" }));
        var yes = el("button", { type: "button", class: "btn coral", text: "نعم" });
        var no = el("button", { type: "button", class: "btn", text: "لا" });
        yes.addEventListener("click", function () { Progress.removeProfile(p.id); if (shown === p.id) shown = undefined; refreshAll(); });
        no.addEventListener("click", drawKids);
        card.appendChild(yes); card.appendChild(no);
      });
      card.appendChild(del);
      kids.appendChild(card);
    });
    AVATARS.filter(function (a) { return !list.some(function (p) { return p.id === a; }); }).forEach(function (a) {
      var b = el("button", { type: "button", class: "avatar-add", "aria-label": "إضافة " + a }, [img(a)]);
      b.addEventListener("click", function () { Progress.addProfile(a); shown = a; refreshAll(); });
      pick.appendChild(b);
    });
  }
  function drawKidTabs() {
    var list = Progress.profiles(), tabs = document.getElementById("kid-tabs");
    tabs.innerHTML = "";
    if (!list.length) { shown = null; return; }
    if (shown === undefined || shown === null || !list.some(function (p) { return p.id === shown; })) shown = list[0].id;
    list.forEach(function (p) {
      var b = el("button", { type: "button", class: "kid-tab" + (p.id === shown ? " on" : ""), "aria-pressed": String(p.id === shown) }, [img(p.avatar)]);
      b.addEventListener("click", function () { shown = p.id; drawKidTabs(); drawTable(); });
      tabs.appendChild(b);
    });
  }
  function refreshAll() { drawKids(); drawKidTabs(); drawTable(); }

  // ----- Progress table -----
  var EX = [["listen", "اسمع واختر"], ["trace", "اكتب الحرف"], ["match", "صِل الحرف"], ["find", "ابحث عن الحرف"]];
  function drawTable() {
    var t = document.getElementById("progress");
    var pid = Progress.profiles().length ? shown : null;
    t.innerHTML = "";
    var head = el("tr", {}, [el("th", { text: "الحرف" })].concat(EX.map(function (e) { return el("th", { text: e[1] }); })));
    t.appendChild(el("thead", {}, [head]));
    var body = el("tbody");
    H.LETTERS.forEach(function (l) {
      var row = el("tr", {}, [el("th", { class: "ar", text: l.label, scope: "row" })]);
      EX.forEach(function (e) {
        var n = Progress.exerciseStars(l.id, e[0], pid);
        row.appendChild(el("td", { "aria-label": n + " نجوم", text: n ? "⭐".repeat(n) : "–" }));
      });
      body.appendChild(row);
    });
    t.appendChild(body);
  }
  refreshAll();

  // ----- Reset, with a confirm step -----
  var resetRow = document.getElementById("reset-row");
  document.getElementById("reset").addEventListener("click", function () {
    resetRow.innerHTML = "";
    var yes = el("button", { type: "button", class: "btn coral", text: "نعم، امسحي كل النجوم" });
    var no = el("button", { type: "button", class: "btn", text: "إلغاء" });
    resetRow.appendChild(el("p", { class: "confirm", text: "هل أنتِ متأكدة؟ ستُمسح نجوم كل الأطفال على هذا الجهاز ولا يمكن استرجاعها. (صور الأطفال تبقى.)" }));
    resetRow.appendChild(yes); resetRow.appendChild(no);
    yes.focus();
    yes.addEventListener("click", function () {
      Progress.reset(); refreshAll();
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

  // ----- Offline status (sw.js) -----
  (function () {
    var out = document.getElementById("offline-status");
    if (location.protocol === "file:") { out.textContent = "العمل بدون إنترنت: ✓ الموقع مفتوح من ملف على الجهاز."; return; }
    if (!("serviceWorker" in navigator)) { out.textContent = "العمل بدون إنترنت: هذا المتصفح لا يدعمه."; return; }
    navigator.serviceWorker.addEventListener("message", function (e) {
      var d = e.data || {};
      out.textContent = d.saved >= d.total
        ? "العمل بدون إنترنت: ✓ الموقع كله محفوظ على هذا الجهاز."
        : "العمل بدون إنترنت: جارٍ الحفظ… (" + d.saved + " من " + d.total + ")";
      if (d.saved < d.total) setTimeout(ask, 3000);
    });
    function ask() {
      if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage("status");
      else { out.textContent = "العمل بدون إنترنت: جارٍ التجهيز… (افتحي الصفحة مرة أخرى بعد قليل)"; setTimeout(ask, 3000); }
    }
    navigator.serviceWorker.ready.then(ask);
  })();
})();
