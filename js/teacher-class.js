/* «صفّي»: the teacher's class on teacher.html — invite link, join requests, and each child's stars.
 * Only the teacher's Google account can read this data (security rules); anyone else who signs in
 * here is told the section is for the teacher. */
import * as Cloud from "./cloud.js";

const $ = (id) => document.getElementById(id);
const el = H.el;
const EX = [["listen", "اسمع واختر"], ["trace", "اكتب الحرف"], ["match", "صِل الحرف"], ["find", "ابحث عن الحرف"]];
let stop = null, kids = [], open = null, invite = "";

function avatar(id) { return el("img", { src: "img/avatars/" + id + ".svg", alt: "" }); }
function letters(k) { return (k.progress && k.progress.letters) || {}; }
function best(l) { return Math.max(0, ...EX.map((e) => ((l && l.stars) || {})[e[0]] || 0)); }
function total(k) { const ls = letters(k); return Object.keys(ls).reduce((n, id) => n + best(ls[id]), 0); }
function visited(k) { const ls = letters(k); return Object.keys(ls).filter((id) => ls[id].visited).length; }
// Letters the child has practised but only got one star in (best of all exercises).
function weak(k) {
  const ls = letters(k);
  return H.LETTERS.filter((L) => { const l = ls[L.id]; return l && Object.keys(l.stars || {}).length && best(l) <= 1; });
}
const AR = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
function when(ts) {
  if (!ts || !ts.toDate) return "لم يلعب بعد";
  const days = Math.round((startOfDay(new Date()) - startOfDay(ts.toDate())) / 864e5);
  try { return new Intl.RelativeTimeFormat("ar", { numeric: "auto" }).format(-days, "day"); }
  catch (e) { return ts.toDate().toLocaleDateString("ar"); }
}
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function inviteLink(code) { return new URL("index.html?join=" + code, location.href).href; }
function drawInvite() {
  const link = inviteLink(invite);
  $("invite-link").textContent = link;
  const text = "رابط موقع «حروفي» لصفّنا. افتحوه، وسجّلوا الدخول بحساب Google، واكتبوا اسم طفلكم:\n" + link;
  $("invite-wa").href = "https://wa.me/?text=" + encodeURIComponent(text);
}

function drawPending() {
  const box = $("pending"), list = kids.filter((k) => !k.approved);
  box.innerHTML = "";
  if (!list.length) { box.appendChild(el("p", { class: "muted", text: "لا توجد طلبات جديدة." })); return; }
  list.forEach((k) => {
    const yes = el("button", { type: "button", class: "btn teal", text: "موافقة" });
    const no = el("button", { type: "button", class: "btn", text: "رفض" });
    yes.addEventListener("click", () => { yes.disabled = no.disabled = true; Cloud.approve(k.id, true).catch(failed); });
    no.addEventListener("click", () => { yes.disabled = no.disabled = true; Cloud.approve(k.id, false).catch(failed); });
    box.appendChild(el("div", { class: "acct-kid" }, [
      avatar(k.avatar),
      el("div", { class: "acct-kid-info" }, [el("b", { text: k.name }), el("span", { class: "muted", dir: "ltr", text: k.parentEmail || "" })]),
      el("div", { class: "acct-kid-actions" }, [yes, no]),
    ]));
  });
}

function drawTable() {
  const t = $("class-table"), list = kids.filter((k) => k.approved).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  t.innerHTML = "";
  if (!list.length) {
    t.appendChild(el("tbody", {}, [el("tr", {}, [el("td", { text: "لا يوجد أطفال في الصف بعد. أرسلي رابط الدعوة لأولياء الأمور." })])]));
    return;
  }
  t.appendChild(el("thead", {}, [el("tr", {}, ["الطفل", "النجوم", "الحروف", "يحتاج تدريبًا", "آخر لعب"].map((h) => el("th", { text: h })))]));
  const body = el("tbody");
  list.forEach((k) => {
    const name = el("button", { type: "button", class: "kid-name" + (open === k.id ? " on" : ""), "aria-expanded": String(open === k.id) },
      [avatar(k.avatar), el("span", { text: k.name })]);
    name.addEventListener("click", () => { open = open === k.id ? null : k.id; drawTable(); drawDetail(); });
    const w = weak(k);
    body.appendChild(el("tr", {}, [
      el("th", { scope: "row" }, [name]),
      el("td", { text: "⭐ " + AR(total(k)) }),
      el("td", { text: AR(visited(k)) + " من ٢٨" }),
      el("td", { class: "ar", text: w.length ? w.map((L) => L.label).join(" ") : "–" }),
      el("td", { text: when(k.lastPlayed) }),
    ]));
  });
  t.appendChild(body);
}

function drawDetail() {
  const box = $("child-detail"), k = kids.find((x) => x.id === open && x.approved);
  box.innerHTML = "";
  if (!k) return;
  const ls = letters(k);
  const head = el("tr", {}, [el("th", { text: "الحرف" })].concat(EX.map((e) => el("th", { text: e[1] }))));
  const body = el("tbody");
  H.LETTERS.forEach((L) => {
    const l = ls[L.id];
    body.appendChild(el("tr", {}, [el("th", { class: "ar", scope: "row", text: L.label + (l && l.visited ? "" : " ·") })]
      .concat(EX.map((e) => { const n = ((l && l.stars) || {})[e[0]] || 0; return el("td", { text: n ? "⭐".repeat(n) : "–" }); }))));
  });
  const remove = el("button", { type: "button", class: "btn coral", text: "إزالة «" + k.name + "» من الصف" });
  remove.addEventListener("click", () => {
    remove.replaceWith(el("p", { class: "confirm" }, [
      "إزالة الطفل من الصف؟ تبقى نجومه في حساب وليّ أمره، ويمكنه الانضمام مرة أخرى برابط الدعوة. ",
      el("button", { type: "button", class: "btn coral", text: "نعم", onclick: () => { open = null; Cloud.approve(k.id, false).catch(failed); } }),
      el("button", { type: "button", class: "btn", text: "لا", onclick: drawDetail }),
    ]));
  });
  box.appendChild(el("div", { class: "block-inner" }, [
    el("h3", {}, [avatar(k.avatar), " " + k.name]),
    el("p", { class: "muted", text: "· بجانب الحرف = لم يفتح صفحة الحرف بعد. وليّ الأمر: " + (k.parentEmail || "") }),
    el("div", { class: "table-wrap" }, [el("table", { class: "progress-table" }, [el("thead", {}, [head]), body])]),
    el("p", {}, [remove]),
  ]));
}

function failed() { alert("تعذّر الحفظ. تأكدي من الاتصال بالإنترنت ثم حاولي مرة أخرى."); }

async function showClass() {
  const u = Cloud.user();
  if (!u) { $("class-out").hidden = false; $("class-in").hidden = true; return; }
  let data;
  try { data = await Cloud.teacherClass(); }
  catch (e) { $("t-msg").textContent = "تعذّر الاتصال. تأكدي من الاتصال بالإنترنت ثم أعيدي فتح الصفحة."; return; }
  if (!data) {
    $("class-out").hidden = false; $("class-in").hidden = true;
    $("t-msg").textContent = "هذا الحساب (" + (u.email || "") + ") ليس حساب المعلمة، فلا يمكنه رؤية الصف.";
    $("t-sign-in").textContent = "الدخول بحساب آخر";
    return;
  }
  invite = data.invite;
  $("t-email").textContent = u.email || "";
  $("class-out").hidden = true; $("class-in").hidden = false;
  drawInvite();
  if (stop) stop();
  stop = Cloud.watchClass((list) => { kids = list; drawPending(); drawTable(); drawDetail(); },
    () => { $("pending").textContent = "تعذّر تحميل الصف."; });
}

$("t-sign-in").addEventListener("click", async () => {
  $("t-msg").textContent = "جارٍ فتح نافذة Google…";
  try {
    if (Cloud.user()) await Cloud.signOut();      // "sign in with another account"
    await Cloud.signIn();
    $("t-msg").textContent = "";
    showClass();
  } catch (e) { $("t-msg").textContent = Cloud.signInError(e); }
});
$("t-sign-out").addEventListener("click", async () => { if (stop) stop(); await Cloud.signOut(); location.reload(); });
$("invite-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(inviteLink(invite)); $("invite-msg").textContent = "تم نسخ الرابط ✓"; }
  catch (e) { $("invite-msg").textContent = "انسخي الرابط من الأعلى."; }
});
$("invite-new").addEventListener("click", () => {
  const msg = $("invite-msg");
  msg.innerHTML = "";
  msg.appendChild(el("span", { text: "رمز جديد يوقف الرابط القديم للانضمام الجديد فقط، ويبقى الأطفال الموجودون. متأكدة؟ " }));
  msg.appendChild(el("button", { type: "button", class: "btn coral", text: "نعم", onclick: async () => {
    try { invite = await Cloud.newInvite(); drawInvite(); msg.textContent = "تم إنشاء رابط جديد ✓"; } catch (e) { failed(); }
  } }));
  msg.appendChild(el("button", { type: "button", class: "btn", text: "لا", onclick: () => { msg.textContent = ""; } }));
});

(async function start() {
  if (!Cloud.enabled) return;
  $("class").hidden = false;
  if (await Cloud.init()) showClass();
  else $("t-msg").textContent = "تعذّر الاتصال بالحسابات الآن. تأكدي من الاتصال بالإنترنت ثم أعيدي فتح الصفحة.";
})();
