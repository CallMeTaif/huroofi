#!/usr/bin/env node
/* Makes firebase/firestore.rules from firebase/firestore.rules.template.
 * The teacher's Gmail comes from firebase/teacher-email.txt (kept off GitHub by .gitignore),
 * or from TEACHER_EMAIL=... for tests. The result is pasted into the Firebase console
 * (Firestore Database → Rules), or deployed with the Firebase CLI. See docs/ACCOUNTS_SETUP.md.
 *
 * Usage:  node tools/make_rules.js            (prints where the file was written)
 *         TEACHER_EMAIL=t@example.com node tools/make_rules.js
 */
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "firebase");
let email = (process.env.TEACHER_EMAIL || "").trim();
if (!email) {
  try { email = fs.readFileSync(path.join(dir, "teacher-email.txt"), "utf8").trim(); }
  catch (e) { console.error("Write the teacher's Gmail in firebase/teacher-email.txt first."); process.exit(1); }
}
if (!/^[^\s@"\\]+@[^\s@"\\]+\.[a-z]{2,}$/i.test(email)) { console.error("Not an email address: " + email); process.exit(1); }
const rules = fs.readFileSync(path.join(dir, "firestore.rules.template"), "utf8")
  .replace(/__TEACHER_EMAIL__/g, email.toLowerCase());
fs.writeFileSync(path.join(dir, "firestore.rules"), rules);
console.log("firebase/firestore.rules written for the teacher " + email.toLowerCase());
