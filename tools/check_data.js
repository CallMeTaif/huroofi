#!/usr/bin/env node
/* Checks data/letters.js for mistakes. Run:  node tools/check_data.js
 * Exits with code 1 if anything is wrong. Warnings do not fail the check. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const A = require(path.join(ROOT, "js/arabic.js"));
global.window = {};
require(path.join(ROOT, "data/letters.js"));
const L = window.LETTERS;
const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

if (!Array.isArray(L) || L.length !== 28) err(`expected 28 letters, found ${L && L.length}`);
const ids = new Set();
L.forEach((l, i) => {
  const tag = `${l.letter} (${l.id})`;
  if (ids.has(l.id)) err(`${tag}: duplicate id`);
  ids.add(l.id);
  if (l.order !== i + 1) err(`${tag}: order should be ${i + 1}`);
  if (!l.name || !l.description) err(`${tag}: missing name or description`);

  const expected = l.letter === "ظ" ? 4 : 6;
  if (l.words.length !== expected) err(`${tag}: expected ${expected} words, found ${l.words.length}`);
  const perPos = { initial: 0, medial: 0, final: 0 };
  l.words.forEach((w) => {
    perPos[w.position] = (perPos[w.position] || 0) + 1;
    if (A.indexForPosition(w.word, l.letter, w.position) < 0)
      err(`${tag}: «${w.word}» does not have the letter in position "${w.position}"`);
    if (!/[ً-ْ]/.test(w.word)) warn(`${tag}: «${w.word}» has no tashkeel`);
    if (!fs.existsSync(path.join(ROOT, w.image))) err(`${tag}: missing picture ${w.image}`);
  });
  const want = l.letter === "ظ" ? { initial: 2, medial: 2, final: 0 } : { initial: 2, medial: 2, final: 2 };
  for (const p in want) if (perPos[p] !== want[p]) err(`${tag}: expected ${want[p]} ${p} words, found ${perPos[p]}`);

  for (const [shape, word] of Object.entries(l.formExamples || {})) {
    if (!l.forms[shape]) err(`${tag}: formExamples.${shape} given but that form does not exist`);
    else if (!word) warn(`${tag}: no example word for the ${shape} shape`);
    else if (A.indexForShape(word, l.letter, shape) < 0) err(`${tag}: «${word}» does not show the ${shape} shape`);
  }
  (l.videos || []).forEach((v) => {
    if (!/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId)) err(`${tag}: bad YouTube id "${v.youtubeId}"`);
    if (!v.title) warn(`${tag}: video ${v.youtubeId} has no title`);
  });
  (l.similarLetters || []).forEach((s) => {
    if (!L.some((o) => o.letter === s)) err(`${tag}: similar letter ${s} is not in the list`);
  });
});

const sw = require("child_process").spawnSync("node", [path.join(ROOT, "tools/build_sw.js"), "--check"], { encoding: "utf8" });
if (sw.status !== 0) err("offline copy: " + sw.stdout.trim());

warnings.forEach((w) => console.log("⚠️  " + w));
errors.forEach((e) => console.log("❌ " + e));
const words = L.reduce((n, l) => n + l.words.length, 0);
console.log(`\n${L.length} letters, ${words} words, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
