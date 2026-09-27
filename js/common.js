/* Small helpers shared by all pages. */
(function () {
  "use strict";
  var LETTERS = window.LETTERS || [];

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "html") e.innerHTML = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  function icon(name, cls) {
    return el("img", { src: "img/ui/" + name + ".svg", alt: "", class: "icon " + (cls || ""), draggable: "false" });
  }

  // A soft colour per letter: hue goes around the colour wheel in alphabet order.
  function hue(letter) { return Math.round(((letter.order - 1) * 360) / 28 + 10) % 360; }

  function starsEl(n, big) {
    var s = el("div", { class: "stars" + (big ? " stars-big" : ""), "aria-label": n + " من ٣ نجوم" });
    for (var i = 1; i <= 3; i++) s.appendChild(el("span", { class: "star" + (i <= n ? " on" : "") }, [icon("star")]));
    return s;
  }

  // A round 🔊 button. key = audio file key, text = what the fallback voice says.
  function speakBtn(key, text, extraClass) {
    var b = el("button", { type: "button", class: "speak " + (extraClass || ""), "aria-label": "استمع" }, [icon("speaker")]);
    b.addEventListener("click", function (ev) { ev.stopPropagation(); window.Sound.play(key, text, b); });
    return b;
  }

  function slug(word) { return word.image.replace(/^.*\//, "").replace(/\.svg$/, ""); }
  function byId(id) { return LETTERS.find(function (l) { return l.id === id; }); }
  function byLetter(ch) { return LETTERS.find(function (l) { return l.letter === ch; }); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function param(name) { return new URLSearchParams(location.search).get(name); }

  window.H = { el: el, icon: icon, hue: hue, starsEl: starsEl, speakBtn: speakBtn, slug: slug, byId: byId, byLetter: byLetter, shuffle: shuffle, wait: wait, param: param, LETTERS: LETTERS };
})();
