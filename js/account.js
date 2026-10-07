/* Parent account page (account.html): sign in, add children, join the teacher's class, delete. */
import * as Cloud from "./cloud.js";

const $ = (id) => document.getElementById(id);
const el = H.el;
const show = (id) => ["off", "loading", "signed-out", "signed-in"].forEach((x) => { $(x).hidden = x !== id; });

let picked = null;

function avatar(id) { return el("img", { src: "img/avatars/" + id + ".svg", alt: "" }); }

function status(k) {
  if (k.classId === Cloud.CLASS && k.approved) return el("span", { class: "tag ok", text: "في صف المعلمة ✓" });
  if (k.classId === Cloud.CLASS) return el("span", { class: "tag wait", text: "بانتظار موافقة المعلمة" });
  return el("span", { class: "tag", text: "غير مضاف إلى صف" });
}

function drawKids() {
  const box = $("kids"), kids = Progress.account().children || [], invite = Cloud.pendingInvite();
  box.innerHTML = "";
  $("invite-note").hidden = !invite;
  if (!kids.length) box.appendChild(el("p", { class: "muted", text: "لم تُضيفوا طفلًا بعد. أضيفوا طفلكم في الأسفل." }));
  $("kids-help").hidden = !kids.length;
  kids.forEach((k) => {
    const card = el("div", { class: "acct-kid" }, [
      avatar(k.avatar),
      el("div", { class: "acct-kid-info" }, [
        el("b", { text: k.name }),
        el("span", { text: "⭐ " + Progress.totalStars("c_" + k.id) + " · الحروف: " + visitedCount(k.id) + " من ٢٨" }),
        status(k),
      ]),
    ]);
    const actions = el("div", { class: "acct-kid-actions" });
    if (k.classId !== Cloud.CLASS) {
      const join = el("button", { type: "button", class: "btn teal", text: invite ? "إضافة إلى صف المعلمة" : "إضافة إلى صف" });
      join.addEventListener("click", () => askCode(card, k, invite));
      actions.appendChild(join);
    }
    const del = el("button", { type: "button", class: "btn kid-del", text: "حذف" });
    del.addEventListener("click", () => confirmDelete(card, k));
    actions.appendChild(del);
    card.appendChild(actions);
    box.appendChild(card);
  });
}

function visitedCount(id) {
  const ls = Progress.raw("c_" + id).letters || {};
  return Object.keys(ls).filter((x) => ls[x].visited).length;
}

function askCode(card, k, invite) {
  const input = el("input", { maxlength: "20", dir: "ltr", placeholder: "رمز الصف", value: invite || "", "aria-label": "رمز الصف" });
  const msg = el("span", { class: "confirm", role: "status" });
  const ok = el("button", { type: "button", class: "btn teal", text: "إضافة" });
  const no = el("button", { type: "button", class: "btn", text: "إلغاء" });
  const row = el("div", { class: "acct-join" }, [input, ok, no, msg]);
  card.appendChild(row);
  ok.addEventListener("click", async () => {
    const code = cleanCode(input.value);
    if (!code) { msg.textContent = "اكتبوا رمز الصف."; return; }
    ok.disabled = true; msg.textContent = "…";
    try { await Cloud.joinClass(k.id, code); drawKids(); }
    catch (e) { ok.disabled = false; msg.textContent = codeError(e); }
  });
  no.addEventListener("click", drawKids);
  if (!invite) input.focus();
}

function confirmDelete(card, k) {
  card.innerHTML = "";
  card.appendChild(avatar(k.avatar));
  card.appendChild(el("span", { class: "confirm", text: "حذف «" + k.name + "» ونجومه من الحساب نهائيًا؟" }));
  const yes = el("button", { type: "button", class: "btn coral", text: "نعم، احذف" });
  const no = el("button", { type: "button", class: "btn", text: "لا" });
  yes.addEventListener("click", async () => {
    yes.disabled = true;
    try { await Cloud.deleteChild(k.id); } catch (e) { alert("تعذّر الحذف. تأكدوا من الاتصال بالإنترنت."); }
    drawKids();
  });
  no.addEventListener("click", drawKids);
  card.appendChild(yes); card.appendChild(no);
}

function cleanCode(s) {
  // Accept a pasted invite link as well as the code itself.
  const m = /[?&]join=([A-Za-z0-9]+)/.exec(s || "");
  return ((m ? m[1] : s) || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function codeError(e) {
  if (e && e.code === "permission-denied") return "رمز الصف غير صحيح، أو تغيّر. اطلبوا الرابط الجديد من المعلمة.";
  return "تعذّر الحفظ. تأكدوا من الاتصال بالإنترنت ثم حاولوا مرة أخرى.";
}

function drawPicker() {
  const pick = $("pick");
  pick.innerHTML = "";
  const used = (Progress.account().children || []).map((k) => k.avatar);
  H.AVATARS.forEach((a) => {
    const b = el("button", { type: "button", class: "avatar-add" + (a === picked ? " on" : ""), role: "radio",
      "aria-checked": String(a === picked), "aria-label": a, disabled: used.includes(a) ? "disabled" : null }, [avatar(a)]);
    b.addEventListener("click", () => { picked = a; drawPicker(); });
    pick.appendChild(b);
  });
}

function signedIn(u) {
  Cloud.becomeParent(u);
  $("email").textContent = u.email || "";
  $("code").value = Cloud.pendingInvite();
  show("signed-in");
  drawKids(); drawPicker();
  Cloud.sync().then(() => { drawKids(); drawPicker(); });
}

$("sign-in").addEventListener("click", async () => {
  const msg = $("sign-in-msg");
  msg.textContent = "جارٍ فتح نافذة Google…";
  try { signedIn(await Cloud.signIn()); msg.textContent = ""; }
  catch (e) { msg.textContent = Cloud.signInError(e); }
});

$("sign-out").addEventListener("click", async () => {
  await Cloud.signOut();
  location.href = "index.html";
});

$("delete-account").addEventListener("click", () => {
  const row = $("delete-row");
  row.innerHTML = "";
  const yes = el("button", { type: "button", class: "btn coral", text: "نعم، احذف كل شيء" });
  const no = el("button", { type: "button", class: "btn", text: "إلغاء" });
  const msg = el("p", { class: "confirm", role: "status" });
  row.appendChild(el("p", { class: "confirm", text: "سيُحذف كل أطفالكم ونجومهم وحسابكم في الموقع نهائيًا، ولا يمكن استرجاعها. متأكدون؟" }));
  row.appendChild(yes); row.appendChild(no); row.appendChild(msg);
  no.addEventListener("click", () => location.reload());
  yes.addEventListener("click", async () => {
    yes.disabled = true; msg.textContent = "جارٍ الحذف…";
    try { await Cloud.deleteAccount(); location.href = "index.html"; }
    catch (e) { yes.disabled = false; msg.textContent = "تعذّر الحذف. تأكدوا من الاتصال بالإنترنت ثم حاولوا مرة أخرى."; }
  });
});

$("add").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const msg = $("add-msg"), btn = $("add-btn");
  const name = $("name").value.replace(/\s+/g, " ").trim();
  if (!name) { msg.textContent = "اكتبوا الاسم الأول للطفل."; $("name").focus(); return; }
  if (!picked) { msg.textContent = "اختاروا صورة للطفل."; return; }
  btn.disabled = true; msg.textContent = "جارٍ الحفظ…";
  try {
    await Cloud.addChild(name.slice(0, 30), picked, cleanCode($("code").value) || null);
    $("name").value = ""; $("code").value = ""; picked = null;
    msg.textContent = "تمت إضافة الطفل ✓";
    drawKids(); drawPicker();
  } catch (e) {
    msg.textContent = codeError(e);
  }
  btn.disabled = false;
});

(async function start() {
  if (!Cloud.enabled) { show("off"); return; }
  show("loading");
  const ok = await Cloud.init();
  if (!ok) { show("off"); $("off").querySelector("p").textContent = "تعذّر الاتصال بالحسابات الآن. تأكدوا من الاتصال بالإنترنت ثم أعيدوا فتح الصفحة."; return; }
  const u = Cloud.user();
  if (u) signedIn(u); else show("signed-out");
})();
