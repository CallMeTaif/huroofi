/* Grown-up gate for the teacher pages.
 * This is NOT security (the site has no server, and nothing on these pages is secret).
 * It only stops a 6-year-old from wandering in and, for example, resetting progress.
 * An adult answers one multiplication question; the answer is remembered until the tab is closed.
 * Load this in <head> so the page stays hidden until the gate is passed. */
(function () {
  "use strict";
  var KEY = "huroofi.teacher";
  function passed() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  // The account page («حسابي») has nothing to protect until a child has been added, so a parent
  // who has signed in goes straight to "add your child" without the question. Once a child exists
  // (the page then has delete buttons) the question is asked as usual.
  function parentWithoutChildren() {
    if (!/\/account(\.html)?$/.test(location.pathname)) return false;
    try {
      var a = JSON.parse(localStorage.getItem("huroofi.account")) || {};
      return a.mode === "parent" && !!a.uid && !(a.children || []).length;
    } catch (e) { return false; }
  }
  if (passed() || parentWithoutChildren()) return;
  document.documentElement.classList.add("gated");

  var AR = "٠١٢٣٤٥٦٧٨٩";
  function arDigits(n) { return String(n).replace(/\d/g, function (d) { return AR[d]; }); }
  // Accept Arabic-Indic (٠-٩), Persian (۰-۹) and Western digits.
  function toNumber(s) {
    return parseInt(String(s).replace(/[٠-٩]/g, function (c) { return AR.indexOf(c); })
                             .replace(/[۰-۹]/g, function (c) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(c); })
                             .replace(/[^\d]/g, ""), 10);
  }

  function build() {
    var a, b;
    var box = document.createElement("div");
    box.className = "gate";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "gate-q");
    box.innerHTML =
      '<form class="gate-card" novalidate>' +
      '  <p class="gate-title">للكبار فقط</p>' +
      '  <label id="gate-q" for="gate-in" class="gate-q"></label>' +
      '  <input id="gate-in" class="gate-in" inputmode="numeric" autocomplete="off" dir="ltr" aria-describedby="gate-q">' +
      '  <div class="gate-actions">' +
      '    <button type="submit" class="btn teal">دخول</button>' +
      '    <a class="btn" href="index.html">الرئيسية</a>' +
      '  </div>' +
      '  <p class="gate-note">هذه الصفحة للمعلمة ولأولياء الأمور.</p>' +
      '</form>';
    var q = box.querySelector("#gate-q"), input = box.querySelector("#gate-in"), form = box.querySelector("form");
    function newQuestion() {
      a = 6 + Math.floor(Math.random() * 4); b = 6 + Math.floor(Math.random() * 4);
      q.textContent = "كم يساوي " + arDigits(a) + " × " + arDigits(b) + " ؟";
      input.value = "";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (toNumber(input.value) === a * b) {
        try { sessionStorage.setItem(KEY, "1"); } catch (err) {}
        box.remove();
        document.documentElement.classList.remove("gated");
      } else {
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
        newQuestion();
        input.focus();
      }
    });
    newQuestion();
    document.body.appendChild(box);
    input.focus();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
