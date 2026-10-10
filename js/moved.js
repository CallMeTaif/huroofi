/* The site moved from https://callmetaif.github.io/huroofi/ to https://www.myhuroofi.com/ (October 2026).
 * Loaded first in <head> on every page, on both addresses (they serve the same files).
 *
 * On the old address: go to the same page on the new one. Stars and settings saved on this device
 * belong to the old address, so they travel along in the link's "#carry=" part (which is never
 * sent to any server).
 * On the new address: take what was carried, keep the best stars, and tidy the link. */
(function () {
  "use strict";
  var OLD = "callmetaif.github.io", NEW = "https://www.myhuroofi.com";

  function encode(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  function decode(s) { return JSON.parse(decodeURIComponent(escape(atob(s)))); }

  if (location.hostname === OLD) {
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^huroofi\./.test(k) && k !== "huroofi.emu") data[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    var hash = location.hash;
    try { if (Object.keys(data).length) hash = "#carry=" + encodeURIComponent(encode(data)); } catch (e) {}
    location.replace(NEW + location.pathname.replace(/^\/huroofi(\/|$)/, "/") + location.search + hash);
    return;
  }

  if (location.hash.indexOf("#carry=") !== 0) return;
  try {
    var carried = decode(decodeURIComponent(location.hash.slice(7)));
    Object.keys(carried).forEach(function (k) {
      if (!/^huroofi\./.test(k) || typeof carried[k] !== "string") return;
      var here = localStorage.getItem(k);
      if (here === null) { localStorage.setItem(k, carried[k]); return; }
      // Both addresses have stars for the same child: keep the best of each letter and exercise.
      if (/^huroofi\.progress(\.|$)/.test(k)) localStorage.setItem(k, JSON.stringify(best(JSON.parse(here), JSON.parse(carried[k]))));
    });
  } catch (e) {}
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}

  function best(a, b) {
    a = a || {}; b = b || {};
    var out = { letters: {} }, la = a.letters || {}, lb = b.letters || {};
    Object.keys(la).concat(Object.keys(lb)).forEach(function (id) {
      var x = la[id] || {}, y = lb[id] || {}, stars = {}, sx = x.stars || {}, sy = y.stars || {};
      Object.keys(sx).concat(Object.keys(sy)).forEach(function (ex) { stars[ex] = Math.max(sx[ex] || 0, sy[ex] || 0); });
      out.letters[id] = { visited: !!(x.visited || y.visited), stars: stars };
    });
    if (a.reviewLetters || b.reviewLetters) out.reviewLetters = a.reviewLetters || b.reviewLetters;
    return out;
  }
})();
