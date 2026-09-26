/* Sound for Huroofi.
 * 1) Pre-recorded MP3 in audio/<key>.mp3, if listed in window.AUDIO_FILES (data/audio-manifest.js).
 * 2) Otherwise the browser's own Arabic voice (Web Speech API), if the device has one.
 * 3) Otherwise nothing is played; the button still gives visual feedback.
 * Plain <audio> works on file:// and on GitHub Pages, so no server is needed. */
(function () {
  "use strict";
  var current = null, currentBtn = null, arVoice = null;
  var files = window.AUDIO_FILES || {};

  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    var vs = speechSynthesis.getVoices() || [];
    arVoice = vs.find(function (v) { return /^ar[-_]SA/i.test(v.lang); }) ||
              vs.find(function (v) { return /^ar/i.test(v.lang); }) || null;
  }
  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  function markBtn(btn) {
    if (currentBtn) currentBtn.classList.remove("playing");
    currentBtn = btn || null;
    if (currentBtn) currentBtn.classList.add("playing");
  }
  function done() { markBtn(null); }

  function stop() {
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch (e) {} }
    done();
  }

  function speak(text, onEnd) {
    if (!text || !("speechSynthesis" in window)) { setTimeout(onEnd, 400); return; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = arVoice ? arVoice.lang : "ar-SA";
    if (arVoice) u.voice = arVoice;
    u.rate = 0.8;
    u.onend = u.onerror = onEnd;
    speechSynthesis.speak(u);
  }

  /* play("letters/ba/name", "بَاء", button) — returns a Promise that resolves when finished. */
  function play(key, text, btn) {
    stop();
    markBtn(btn);
    return new Promise(function (resolve) {
      function finish() { if (btn === currentBtn) done(); resolve(); }
      if (key && files[key]) {
        var a = new Audio("audio/" + key + ".mp3");
        current = a;
        a.onended = finish;
        a.onerror = function () { current = null; speak(text, finish); };
        var p = a.play();
        if (p && p.catch) p.catch(function () { current = null; speak(text, finish); });
      } else {
        speak(text, finish);
      }
    });
  }

  window.Sound = { play: play, stop: stop, has: function (key) { return !!files[key]; } };
})();
