/* Parent and teacher accounts (Firebase: Google sign-in + Firestore database).
 *
 * Off until js/firebase-config.js has the project settings: the site then works exactly as
 * before. Loaded as a module, so it never runs from a folder (file://) either.
 *
 * Data (one document per child, collection "children"):
 *   { parent: uid, parentEmail, name, avatar, classId: "main" | null, invite, approved,
 *     progress: { letters: { <id>: { visited, stars: { listen, trace, match, find } } } },
 *     created, lastPlayed }
 * and one document for the teacher's class: classes/main = { invite }.
 * Who may read or write what is enforced by firebase/firestore.rules.template.
 *
 * Stars are always saved on the device first (js/progress.js) and copied to the account here,
 * so the site keeps working with no internet; copies are merged by keeping the best result. */
const V = "12.16.0";
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;

// Tests on this computer use the Firebase emulators: open http://localhost:<port>/?emu=1
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const EMU = LOCAL && (() => {
  try {
    if (new URLSearchParams(location.search).has("emu")) localStorage.setItem("huroofi.emu", "1");
    return localStorage.getItem("huroofi.emu") === "1";
  } catch (e) { return false; }
})();
const CONFIG = EMU
  ? { apiKey: "demo-key", authDomain: "demo-huroofi.firebaseapp.com", projectId: "demo-huroofi", appId: "demo" }
  : window.HUROOFI_FIREBASE;

export const enabled = !!(CONFIG && CONFIG.apiKey && CONFIG.projectId) && /^https?:$/.test(location.protocol);
export const CLASS = "main";
const JOIN = "huroofi.join";

let fb = null, auth = null, db = null, ready = null;

// Loads the Firebase libraries (from Google's CDN) once. Resolves to null when accounts are off
// or the libraries cannot be loaded (for example with no internet on a first visit).
export function init() {
  if (!enabled) return Promise.resolve(null);
  if (ready) return ready;
  ready = (async () => {
    try {
      const [app, au, fs] = await Promise.all([
        import(CDN + "firebase-app.js"), import(CDN + "firebase-auth.js"), import(CDN + "firebase-firestore.js"),
      ]);
      const a = app.initializeApp(CONFIG);
      auth = au.getAuth(a);
      auth.languageCode = "ar";
      try {
        // Keeps a copy of the account's data on the device, and queues changes made offline.
        db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
      } catch (e) { db = fs.getFirestore(a); }
      if (EMU) {
        au.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        fs.connectFirestoreEmulator(db, "127.0.0.1", 8080);
      }
      fb = Object.assign({}, au, fs);
      await auth.authStateReady();
      return { auth, db };
    } catch (e) {
      console.warn("Accounts are not available right now:", e);
      return null;
    }
  })();
  return ready;
}

export function user() { return auth && auth.currentUser; }

export async function signIn() {
  if (!(await init())) throw new Error("offline");
  const provider = new fb.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });   // a family may have more than one Gmail
  const res = await fb.signInWithPopup(auth, provider);
  return res.user;
}

// Signing out also removes the children's stars from this device (it may be a shared phone).
export async function signOut() {
  if (await init()) await fb.signOut(auth);
  forgetParent();
}

function forgetParent() {
  const a = Progress.account();
  (a.children || []).forEach((c) => Progress.removeRaw("c_" + c.id));
  Progress.setAccount({ mode: "practice" });
  try { sessionStorage.removeItem("huroofi.child"); } catch (e) {}
}

// The device now belongs to this signed-in parent. A different parent than before starts clean.
export function becomeParent(u) {
  const a = Progress.account();
  if (a.uid && a.uid !== u.uid) forgetParent();
  const b = Progress.account();
  Progress.setAccount({ mode: "parent", uid: u.uid, email: u.email || "", children: b.uid === u.uid ? b.children || [] : [] });
}

// ----- Invite link: index.html?join=CODE (the teacher shares it with parents) -----
export function pendingInvite() { try { return localStorage.getItem(JOIN) || ""; } catch (e) { return ""; } }
export function setPendingInvite(code) { try { code ? localStorage.setItem(JOIN, code) : localStorage.removeItem(JOIN); } catch (e) {} }
(function () {
  const code = new URLSearchParams(location.search).get("join");
  if (code && /^[A-Za-z0-9]{4,20}$/.test(code)) setPendingInvite(code.toUpperCase());
})();

// ----- Merging stars: keep the best of both copies -----
export function merge(a, b) {
  a = a || {}; b = b || {};
  const out = { letters: {} };
  const ids = Array.from(new Set(Object.keys(a.letters || {}).concat(Object.keys(b.letters || {})))).sort();
  ids.forEach((id) => {
    const x = (a.letters || {})[id] || {}, y = (b.letters || {})[id] || {};
    const stars = {};
    Progress.EXERCISES.forEach((ex) => {
      const n = Math.max((x.stars || {})[ex] || 0, (y.stars || {})[ex] || 0);
      if (n) stars[ex] = n;
    });
    out.letters[id] = { visited: !!(x.visited || y.visited), stars };
  });
  const review = a.reviewLetters || b.reviewLetters;
  if (Array.isArray(review)) out.reviewLetters = review;
  return out;
}
function same(a, b) { return JSON.stringify(merge(a, {})) === JSON.stringify(merge(b, {})); }

// ----- Children of the signed-in parent -----
function childRef(id) { return fb.doc(db, "children", id); }

export async function myChildren() {
  const u = user();
  if (!u) return [];
  const snap = await fb.getDocs(fb.query(fb.collection(db, "children"), fb.where("parent", "==", u.uid)));
  // In the order they were added (siblings added a moment apart keep their order).
  const t = (k) => (k.created ? k.created.seconds * 1e9 + k.created.nanoseconds : Infinity);
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((x, y) => t(x) - t(y));
}

function remember(kids) {
  const a = Progress.account();
  a.children = kids.map((k) => ({ id: k.id, name: k.name, avatar: k.avatar, classId: k.classId || null, approved: !!k.approved }));
  Progress.setAccount(a);
}

// Downloads the parent's children, merges their stars with this device, and uploads what is new.
// Returns true when the stars on this device changed (the page may want to redraw).
export async function sync() {
  if (!(await init()) || !Progress.parentMode()) return false;
  const u = user();
  if (!u || u.uid !== Progress.account().uid) return false;
  let kids;
  try { kids = await myChildren(); } catch (e) { return false; }   // offline with nothing cached yet
  remember(kids);
  let changed = false;
  kids.forEach((k) => {
    const pid = "c_" + k.id, local = Progress.raw(pid), both = merge(local, k.progress);
    if (!same(both, local)) { Progress.setRaw(pid, both); changed = true; }
    if (!same(both, k.progress)) upload(k.id, both);
  });
  return changed;
}

function upload(id, progress) {
  // Not awaited: with no internet the change waits in the queue and is sent later.
  fb.updateDoc(childRef(id), { progress: merge(progress, {}), lastPlayed: fb.serverTimestamp() })
    .catch((e) => console.warn("Could not save stars to the account:", e));
}

// After every star or visit: upload that child's stars (a moment later, so a round sends once).
const timers = {};
window.addEventListener("huroofi:progress", (ev) => {
  const m = /^huroofi\.progress\.c_(.+)$/.exec(ev.detail || "");
  if (!m || !enabled || !Progress.parentMode()) return;
  const id = m[1];
  clearTimeout(timers[id]);
  timers[id] = setTimeout(async () => {
    if ((await init()) && user()) upload(id, Progress.raw("c_" + id));
  }, 1200);
});

export async function addChild(name, avatar, invite) {
  if (!(await init()) || !user()) throw new Error("signed-out");
  const u = user(), a = Progress.account();
  // The first child added on this device keeps the stars already earned here without an account.
  let start = { letters: {} };
  if (!(a.children || []).length) {
    const local = Progress.raw(null);
    if (local.letters) start = merge(local, {});
  }
  const ref = fb.doc(fb.collection(db, "children"));
  await fb.setDoc(ref, {
    parent: u.uid, parentEmail: u.email || "", name, avatar,
    classId: invite ? CLASS : null, invite: invite || null, approved: false,
    progress: start, created: fb.serverTimestamp(), lastPlayed: null,
  });
  if (invite) setPendingInvite("");
  Progress.setRaw("c_" + ref.id, start);
  await sync();
  return ref.id;
}

export async function joinClass(id, invite) {
  await fb.updateDoc(childRef(id), { classId: CLASS, invite, approved: false });
  setPendingInvite("");
  await sync();
}

export async function deleteChild(id) {
  await fb.deleteDoc(childRef(id));
  Progress.removeRaw("c_" + id);
  await sync();
}

// Deletes every child of this parent, then the parent's sign-in record itself.
export async function deleteAccount() {
  if (!(await init()) || !user()) throw new Error("signed-out");
  const kids = await myChildren();
  for (const k of kids) await fb.deleteDoc(childRef(k.id));
  try { await fb.deleteUser(auth.currentUser); }
  catch (e) {
    if (!e || e.code !== "auth/requires-recent-login") throw e;
    // Google asks the parent to confirm with a fresh sign-in before an account is deleted.
    await fb.reauthenticateWithPopup(auth.currentUser, new fb.GoogleAuthProvider());
    await fb.deleteUser(auth.currentUser);
  }
  forgetParent();
}

// ----- Teacher -----
// Only the teacher's account may read the class document (security rules), so this is how
// the site knows who the teacher is, without her email appearing anywhere in the site.
export async function teacherClass() {
  if (!(await init()) || !user()) return null;
  try {
    const ref = fb.doc(db, "classes", CLASS), snap = await fb.getDoc(ref);
    if (snap.exists()) return snap.data();
    const data = { invite: newCode(), created: fb.serverTimestamp() };
    await fb.setDoc(ref, data);
    return data;
  } catch (e) {
    if (e && e.code === "permission-denied") return null;
    throw e;
  }
}

export async function newInvite() {
  const invite = newCode();
  await fb.updateDoc(fb.doc(db, "classes", CLASS), { invite });
  return invite;
}

function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no 0/O or 1/I, easy to read aloud
  const r = crypto.getRandomValues(new Uint32Array(8));
  return Array.from(r, (n) => A[n % A.length]).join("");
}

// Calls back with the class's children (approved and waiting) whenever anything changes.
export function watchClass(cb, onError) {
  const q = fb.query(fb.collection(db, "children"), fb.where("classId", "==", CLASS));
  return fb.onSnapshot(q, (snap) => cb(snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))), onError);
}

export function approve(id, yes) {
  return yes ? fb.updateDoc(childRef(id), { approved: true })
             : fb.updateDoc(childRef(id), { approved: false, classId: null, invite: null });
}

// ----- Home page: first-visit choice, and the parent button in the header -----
function homePage() {
  if (!enabled || document.body.dataset.page !== "home") return;
  if (Progress.setting("classroom")) return;          // the smartboard: no accounts, no questions
  const el = H.el, a = Progress.account();

  const btn = el("a", { class: "btn round acct-btn", href: "account.html", "aria-label": "حساب ولي الأمر" }, [H.icon("family")]);
  document.querySelector(".home-actions").appendChild(btn);

  const invited = !!pendingInvite();
  if (Progress.parentMode()) {
    if (invited) { location.href = "account.html"; return; }   // a parent opened the teacher's link: add the child to the class
    init().then(() => sync()).then((changed) => {
      if (user() && !Progress.profiles().length) location.href = "account.html";   // signed in, but no child added yet
      else if (changed && window.Home) Home.draw();
    });
    return;
  }
  if (a.mode === "practice" && !invited) return;

  const msg = el("p", { class: "welcome-msg", text: "" });
  const parentBtn = el("button", { type: "button", class: "btn big teal wchoice" }, [H.icon("family"),
    el("span", {}, [el("b", { text: "وليّ الأمر" }), el("small", { text: "الدخول بحساب Google لحفظ تقدّم طفلك ومتابعته" })])]);
  const practiceBtn = el("button", { type: "button", class: "btn big wchoice" }, [H.icon("pencil"),
    el("span", {}, [el("b", { text: "تمرّن فقط" }), el("small", { text: "بدون حساب، والنجوم تُحفظ على هذا الجهاز" })])]);
  const box = el("div", { class: "who-overlay welcome", role: "dialog", "aria-modal": "true", "aria-label": "مرحبًا بكم في حروفي" }, [
    el("div", { class: "who-card welcome-card" }, [
      el("img", { src: "img/ui/book.svg", alt: "", class: "welcome-logo" }),
      el("h2", { text: "مرحبًا بكم في حروفي" }),
      invited ? el("p", { class: "note", text: "وصلتكم دعوة من المعلمة. سجّلوا الدخول لإضافة طفلكم إلى الصف." }) : null,
      el("div", { class: "welcome-choices" }, [parentBtn, practiceBtn]),
      msg,
      el("p", { class: "muted" }, [el("a", { href: "privacy.html", text: "الخصوصية: ماذا نحفظ؟" })]),
    ]),
  ]);
  practiceBtn.addEventListener("click", () => {
    Progress.setAccount({ mode: "practice" });
    setPendingInvite("");
    box.remove();
  });
  parentBtn.addEventListener("click", async () => {
    parentBtn.disabled = true; msg.textContent = "جارٍ فتح نافذة Google…";
    try {
      const u = await signIn();
      becomeParent(u);
      try { sessionStorage.setItem("huroofi.teacher", "1"); } catch (e) {}   // an adult just signed in: skip the grown-up question
      const changed = await sync();
      if (!Progress.profiles().length || pendingInvite()) { location.href = "account.html"; return; }
      box.remove();
      if (Progress.needsChoice()) Profiles.showPicker(false);
      else if (changed && window.Home) Home.draw();
    } catch (e) {
      parentBtn.disabled = false;
      msg.textContent = signInError(e);
    }
  });
  document.body.appendChild(box);
}

export function signInError(e) {
  const c = (e && e.code) || (e && e.message) || "";
  if (/popup-closed|cancelled-popup/.test(c)) return "أُغلقت نافذة الدخول. حاولوا مرة أخرى.";
  if (/popup-blocked/.test(c)) return "المتصفح منع نافذة الدخول. اسمحوا بالنوافذ المنبثقة لهذا الموقع ثم حاولوا مرة أخرى.";
  if (/network|offline/.test(c)) return "لا يوجد اتصال بالإنترنت. حاولوا مرة أخرى عند الاتصال.";
  if (/unauthorized-domain/.test(c)) return "هذا العنوان غير مسموح به للدخول بعد (إعدادات Firebase).";
  return "تعذّر الدخول. حاولوا مرة أخرى.";
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", homePage);
else homePage();
