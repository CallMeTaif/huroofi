/* Progress, settings and child profiles, saved only on this device (localStorage).
 * Every access is wrapped in try/catch: private mode or blocked storage must never break the site.
 *
 * Profiles: a shared device (siblings, class tablets) can have one animal picture per child.
 * No names are stored. With 0 or 1 profile the site behaves as a single-child device.
 * With 2 or more, each child taps their picture when the site opens (js/profiles.js);
 * the choice lasts for the browser tab (sessionStorage), so the next child is asked again. */
(function () {
  "use strict";
  var KEY = "huroofi.progress", SETTINGS = "huroofi.settings", PROFILES = "huroofi.profiles", CHILD = "huroofi.child";
  var EXERCISES = ["listen", "trace", "match", "find"];

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) {} }

  // ----- Profiles -----
  function profileList() { var p = load(PROFILES); return Array.isArray(p.list) ? p.list : []; }
  function current() {
    var list = profileList();
    if (!list.length) return null;
    if (list.length === 1) return list[0].id;
    var id = null;
    try { id = sessionStorage.getItem(CHILD); } catch (e) {}
    return list.some(function (p) { return p.id === id; }) ? id : null;
  }
  function keyFor(pid) { return pid ? KEY + "." + pid : KEY; }
  // Which progress to read/write: an explicit profile, else the child playing now, else the device's own.
  function pkey(pid) { return keyFor(pid !== undefined ? pid : current()); }

  // Nothing is saved in classroom mode (many children share one screen),
  // nor on a shared device before a child has picked their picture.
  function saving() { return !load(SETTINGS).classroom && !(profileList().length > 1 && !current()); }
  function entry(data, id) {
    data.letters = data.letters || {};
    data.letters[id] = data.letters[id] || { visited: false, stars: {} };
    return data.letters[id];
  }
  function starsOf(l) {
    if (!l || !l.stars) return 0;
    return EXERCISES.reduce(function (m, ex) { return Math.max(m, l.stars[ex] || 0); }, 0);
  }

  window.Progress = {
    EXERCISES: EXERCISES,
    // Best star count (0–3) across all exercises for a letter.
    stars: function (id, pid) { return starsOf((load(pkey(pid)).letters || {})[id]); },
    exerciseStars: function (id, ex, pid) {
      var l = (load(pkey(pid)).letters || {})[id];
      return (l && l.stars && l.stars[ex]) || 0;
    },
    totalStars: function (pid) {
      var ls = load(pkey(pid)).letters || {};
      return Object.keys(ls).reduce(function (n, k) { return n + starsOf(ls[k]); }, 0);
    },
    // Keeps the best result: a worse round never takes stars away.
    setStars: function (id, ex, n) {
      if (!saving()) return;
      var k = pkey(), data = load(k), e = entry(data, id);
      e.stars[ex] = Math.max(e.stars[ex] || 0, Math.max(0, Math.min(3, n)));
      save(k, data);
    },
    markVisited: function (id) {
      if (!saving()) return;
      var k = pkey(), data = load(k), e = entry(data, id);
      if (!e.visited) { e.visited = true; save(k, data); }
    },
    visited: function (id) { var l = (load(pkey()).letters || {})[id]; return !!(l && l.visited); },
    visitedIds: function () {
      var ls = load(pkey()).letters || {};
      return Object.keys(ls).filter(function (k) { return ls[k].visited; });
    },
    // Clear stars: one profile (pid), or everyone on this device (no argument).
    reset: function (pid) {
      if (pid !== undefined) { remove(keyFor(pid)); return; }
      remove(KEY);
      profileList().forEach(function (p) { remove(keyFor(p.id)); });
    },

    // ----- Profiles -----
    profiles: profileList,
    current: current,
    needsChoice: function () { return profileList().length > 1 && !current() && !load(SETTINGS).classroom; },
    choose: function (pid) { try { sessionStorage.setItem(CHILD, pid); } catch (e) {} },
    addProfile: function (avatar) {
      var p = load(PROFILES), list = profileList();
      if (list.some(function (x) { return x.id === avatar; })) return avatar;
      // The first child added keeps the stars already saved on this device.
      if (!list.length) {
        var old = load(KEY);
        if (old.letters) { save(keyFor(avatar), old); remove(KEY); }
      }
      list.push({ id: avatar, avatar: avatar });
      p.list = list; save(PROFILES, p);
      return avatar;
    },
    removeProfile: function (pid) {
      var p = load(PROFILES);
      p.list = profileList().filter(function (x) { return x.id !== pid; });
      save(PROFILES, p);
      remove(keyFor(pid));
      try { if (sessionStorage.getItem(CHILD) === pid) sessionStorage.removeItem(CHILD); } catch (e) {}
    },

    // ----- Settings (per device; reviewLetters is per child) -----
    setting: function (name) {
      if (name === "reviewLetters") return load(pkey()).reviewLetters;
      return load(SETTINGS)[name];
    },
    setSetting: function (name, value) {
      if (name === "reviewLetters") { var k = pkey(), d = load(k); d.reviewLetters = value; save(k, d); return; }
      var s = load(SETTINGS); s[name] = value; save(SETTINGS, s);
    },
  };

  // Classroom mode (bigger text, no stars) is applied as early as possible on every page.
  if (window.Progress.setting("classroom")) document.documentElement.classList.add("classroom");
})();
