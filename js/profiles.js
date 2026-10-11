/* «مَنْ يَلْعَبُ الْآنَ؟» — who is playing?
 * Shown on the children's pages when 2 or more children share this device (profiles are added
 * on the teacher page) and nobody has been chosen in this browser tab yet.
 * The child taps their animal; their stars are then saved separately. Device profiles have no names;
 * the children of a signed-in parent (js/cloud.js) show the first name the parent typed.
 * Also exposes Profiles.badge(): a small button with the current child's animal, to switch child. */
(function () {
  "use strict";
  var el = H.el;

  function avatarImg(id, cls) { return el("img", { src: "img/avatars/" + id + ".svg", alt: "", class: cls || "", draggable: "false" }); }

  function showPicker(canClose) {
    if (document.querySelector(".who-overlay")) return;
    var list = Progress.profiles();
    var speak = H.speakBtn("phrases/who", "مَنْ يَلْعَبُ الْآنَ؟");
    var grid = el("div", { class: "who-grid" });
    list.forEach(function (p) {
      // Children of a signed-in parent also have a first name under their picture.
      var b = el("button", { type: "button", class: "who-btn" + (p.name ? " named" : ""), "aria-label": p.name || p.avatar },
        [avatarImg(p.avatar), p.name ? el("span", { class: "who-name", text: p.name }) : null]);
      b.addEventListener("click", function () {
        Progress.choose(p.id);
        b.classList.add("win");
        setTimeout(function () { location.reload(); }, 250);   // redraw the page with this child's stars
      });
      grid.appendChild(b);
    });
    var box = el("div", { class: "who-overlay", role: "dialog", "aria-modal": "true", "aria-label": "من يلعب الآن؟" }, [
      el("div", { class: "who-card" }, [
        el("div", { class: "who-title" }, [speak, el("span", { text: "من يلعب الآن؟" })]),
        grid,
        canClose ? el("button", { type: "button", class: "btn", text: "رجوع", onclick: function () { box.remove(); } }) : null,
      ]),
    ]);
    document.body.appendChild(box);
    Sound.play("phrases/who", "مَنْ يَلْعَبُ الْآنَ؟", speak);
  }

  // The profile (child) playing now, or null.
  function who() {
    var id = Progress.current();
    return (id && Progress.profiles().find(function (x) { return x.id === id; })) || null;
  }

  // «سارة 🐰»: the picture and first name of a signed-in parent's child, so it is clear who is playing
  // and whose stars are being saved. With more than one child it is a button that switches child.
  function chip(small) {
    var p = who();
    if (!p || !p.name || Progress.setting("classroom")) return null;
    var many = Progress.profiles().length > 1;
    var c = el(many ? "button" : "div", { class: "who-chip" + (small ? " small" : ""), type: many ? "button" : null,
      "aria-label": (many ? "تغيير الطفل. يلعب الآن: " : "يلعب الآن: ") + p.name }, [avatarImg(p.avatar), el("span", { text: p.name })]);
    if (many) c.addEventListener("click", function () { showPicker(true); });
    return c;
  }

  // Home page header: the name chip for a parent's child; for device profiles (no names, 2 or more
  // children sharing the device) a small round button with the child's animal, to switch child.
  function badge() {
    var named = chip(false);
    if (named) return named;
    var p = who();
    if (Progress.profiles().length < 2 || !p || Progress.setting("classroom")) return null;
    var b = el("button", { type: "button", class: "who-badge", "aria-label": "تغيير الطفل" }, [avatarImg(p.avatar)]);
    b.addEventListener("click", function () { showPicker(true); });
    return b;
  }

  // Letter, exercise and review pages: a small name chip in a thin strip at the very top.
  function strip() {
    if (document.body.dataset.page === "home" || document.querySelector(".who-strip")) return;
    var c = chip(true);
    if (c) document.body.insertBefore(el("div", { class: "who-strip" }, [c]), document.body.firstChild);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", strip); else strip();

  window.Profiles = { showPicker: showPicker, badge: badge, chip: chip };
  if (Progress.needsChoice()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { showPicker(false); });
    else showPicker(false);
  }
})();
