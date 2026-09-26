/* Progress and settings, saved only on this device (localStorage).
 * Every access is wrapped in try/catch: private mode or blocked storage must never break the site. */
(function () {
  "use strict";
  var KEY = "huroofi.progress", SETTINGS = "huroofi.settings";
  var EXERCISES = ["listen", "trace", "match", "find"];

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function entry(data, id) {
    data.letters = data.letters || {};
    data.letters[id] = data.letters[id] || { visited: false, stars: {} };
    return data.letters[id];
  }

  window.Progress = {
    EXERCISES: EXERCISES,
    // Best star count (0–3) across all exercises for a letter.
    stars: function (id) {
      var l = (load(KEY).letters || {})[id];
      if (!l || !l.stars) return 0;
      return EXERCISES.reduce(function (m, ex) { return Math.max(m, l.stars[ex] || 0); }, 0);
    },
    exerciseStars: function (id, ex) {
      var l = (load(KEY).letters || {})[id];
      return (l && l.stars && l.stars[ex]) || 0;
    },
    // Keeps the best result: a worse round never takes stars away.
    setStars: function (id, ex, n) {
      var data = load(KEY), e = entry(data, id);
      e.stars[ex] = Math.max(e.stars[ex] || 0, Math.max(0, Math.min(3, n)));
      save(KEY, data);
    },
    markVisited: function (id) {
      var data = load(KEY), e = entry(data, id);
      if (!e.visited) { e.visited = true; save(KEY, data); }
    },
    visited: function (id) { var l = (load(KEY).letters || {})[id]; return !!(l && l.visited); },
    visitedIds: function () {
      var ls = load(KEY).letters || {};
      return Object.keys(ls).filter(function (k) { return ls[k].visited; });
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },

    setting: function (name) { return load(SETTINGS)[name]; },
    setSetting: function (name, value) { var s = load(SETTINGS); s[name] = value; save(SETTINGS, s); },
  };

  // Classroom mode (bigger text, no stars) is applied as early as possible on every page.
  if (window.Progress.setting("classroom")) document.documentElement.classList.add("classroom");
})();
