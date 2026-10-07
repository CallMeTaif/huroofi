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

  // A small round button with the child's animal (home page header): tap to switch child.
  function badge() {
    var id = Progress.current();
    if (Progress.profiles().length < 2 || !id || Progress.setting("classroom")) return null;
    // A parent's child has an id like "c_…"; their picture is in .avatar (device profiles: id = animal).
    var p = Progress.profiles().find(function (x) { return x.id === id; });
    var b = el("button", { type: "button", class: "who-badge", "aria-label": "تغيير الطفل" }, [avatarImg((p && p.avatar) || id)]);
    b.addEventListener("click", function () { showPicker(true); });
    return b;
  }

  window.Profiles = { showPicker: showPicker, badge: badge };
  if (Progress.needsChoice()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { showPicker(false); });
    else showPicker(false);
  }
})();
