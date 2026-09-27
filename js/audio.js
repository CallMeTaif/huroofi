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

  var pending = null;  // resolve function of the sound that is playing now

  function stop() {
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch (e) {} }
    done();
    // A sound that is cut off still resolves, so nothing waiting on it gets stuck.
    if (pending) { var r = pending; pending = null; r("stopped"); }
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

  /* play("letters/ba/name", "بَاء", button) returns a Promise that resolves with:
   *   true      – finished playing
   *   "stopped" – cut off by another sound
   *   false     – the browser blocked sound until the user taps (autoplay rule) */
  // ?silent=1 in the address: no sound at all (used by the developer test pages).
  var SILENT = /[?&]silent=1\b/.test(location.search);

  function play(key, text, btn) {
    if (SILENT) return new Promise(function (r) { setTimeout(function () { r(true); }, 30); });
    stop();
    markBtn(btn);
    return new Promise(function (resolve) {
      var settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        if (pending === resolver) pending = null;
        if (btn === currentBtn) done();
        resolve(value === undefined ? true : value);
      }
      var resolver = function (v) { finish(v); };
      pending = resolver;
      function fallback() { current = null; speak(text, function () { finish(true); }); }
      if (key && files[key]) {
        var a = new Audio("audio/" + key + ".mp3");
        current = a;
        a.onended = function () { finish(true); };
        a.onerror = fallback;
        var p = a.play();
        if (p && p.catch) p.catch(function (err) {
          if (err && err.name === "NotAllowedError") { window.Sound.blocked = true; current = null; finish(false); }
          else if (!settled) fallback();
        });
      } else {
        speak(text, function () { finish(true); });
      }
    });
  }

  // Play several sounds one after another; stops early if interrupted or blocked.
  function sequence(list) {
    return list.reduce(function (p, item) {
      return p.then(function (r) { return r === true ? play(item[0], item[1], item[2]) : r; });
    }, Promise.resolve(true));
  }

  window.Sound = { play: play, stop: stop, sequence: sequence, blocked: false, has: function (key) { return !!files[key]; } };
})();
