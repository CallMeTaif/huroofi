/* «مَنْ يَلْعَبُ الْآنَ؟» — who is playing?
 * Shown on the children's pages when 2 or more children share this device (profiles are added
 * on the teacher page) and nobody has been chosen in this browser tab yet.
 * The child taps their animal; their stars are then saved separately. No names are stored.
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
      var b = el("button", { type: "button", class: "who-btn", "aria-label": p.avatar }, [avatarImg(p.avatar)]);
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

  // A small round button with the child's animal (home page header): tap to switch child.
  function badge() {
    var id = Progress.current();
    if (Progress.profiles().length < 2 || !id || Progress.setting("classroom")) return null;
    var b = el("button", { type: "button", class: "who-badge", "aria-label": "تغيير الطفل" }, [avatarImg(id)]);
    b.addEventListener("click", function () { showPicker(true); });
    return b;
  }

  window.Profiles = { showPicker: showPicker, badge: badge };
  if (Progress.needsChoice()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { showPicker(false); });
    else showPicker(false);
  }
})();
