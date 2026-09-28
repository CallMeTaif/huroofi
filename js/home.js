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
})();
