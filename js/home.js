(function () {
  "use strict";
  var grid = document.getElementById("grid");
  H.LETTERS.forEach(function (l) {
    var a = H.el("a", { class: "letter-card", href: "letter.html?id=" + l.id, "aria-label": "حرف " + l.name }, [
      H.el("span", { class: "glyph", text: l.label }),
      H.starsEl(Progress.stars(l.id)),
    ]);
    a.style.setProperty("--h", H.hue(l));
    grid.appendChild(H.el("li", {}, [a]));
  });
  var badge = window.Profiles && Profiles.badge();
  if (badge) document.querySelector(".home-actions").insertBefore(badge, document.getElementById("hello"));
  document.getElementById("hello").addEventListener("click", function () {
    Sound.play("phrases/home", "مَرْحَبًا! اخْتَرْ حَرْفًا.", this);
  });

  // Hidden teacher entrance: press and hold the «حروفي» title for 3 seconds (finger or mouse).
  // No visible link, so children do not find it; the teacher page still asks the grown-up question.
  (function () {
    var logo = document.getElementById("logo"), timer = null;
    function cancel() { clearTimeout(timer); timer = null; }
    logo.addEventListener("pointerdown", function () { cancel(); timer = setTimeout(function () { location.href = "teacher.html"; }, 3000); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { logo.addEventListener(ev, cancel); });
    logo.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // long-press menu on phones
  })();
})();
