# Parent and teacher accounts: setup

**Status:** built and tested (Chromium and WebKit/Safari, with the Firebase emulators).
It is **switched off** until `js/firebase-config.js` has the project settings. While it is off, the site
works exactly as before: no sign-in, stars saved on the device only.

## What it does

- **Home page, first visit:** two choices.
  - «وليّ الأمر»: sign in with Google.
  - «تمرّن فقط»: no account, stars stay on the device, like before.
  - The choice is remembered. The smartboard in classroom mode is never asked.
- **Parent** (`account.html`, behind the grown-up question):
  - Types the child's first name and picks an animal. More than one child is fine; each child taps their picture when the site opens.
  - Joins the teacher's class with her invite link or code.
  - Sees each child's stars and class status, can delete a child or the whole account, and can sign out.
  - The first child added keeps the stars already earned on that device.
- **Teacher** (teacher page → «صفّي», signed in with her Google account):
  - Copies or sends the invite link (WhatsApp), and can make a new code.
  - Approves or rejects join requests (child's name, picture, parent's email).
  - Sees a table of the class: stars, letters opened, letters that need practice (best result 1 star), and when each child last played. Tapping a child shows their stars per letter and per exercise.
  - Can remove a child from the class; the stars stay in the parent's account.
- **Offline:** stars are always saved on the device first and copied to the account when there is internet. Copies are merged by keeping the best result.
- **Privacy page:** `privacy.html`.

## Setup (the owner does steps 1–3; the developer does 4–5)

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** → name `huroofi`. Google Analytics can be off.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   - Set the public-facing name to «حروفي» (parents see this name in the Google window).
   - Choose the support email, then **Save**.
3. **Build → Firestore Database → Create database.** Choose the location nearest you, then **production mode**.
4. **⚙️ Project settings → Your apps → `</>` (Web)** → name `huroofi` → **Register app**.
   - Copy the `firebaseConfig = { … }` block and send it to the developer. It is not secret.

### 2. Allow the site's address for Google sign-in
**Authentication → Settings → Authorized domains → Add domain:**
- `callmetaif.github.io`
- the new domain too, if one is bought (for example `huroofi.org`)

### 3. (Optional) The domain
1. Buy the name (for example `huroofi.org`).
2. In the domain seller's DNS settings add:
   - 4 **A** records for the bare domain (`@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - a **CNAME** record `www` → `callmetaif.github.io`
3. Tell the developer the name. They add it in GitHub → Settings → Pages → Custom domain and turn on **Enforce HTTPS**.

Do this **before** sending the invite link to parents. Stars saved with «تمرّن فقط» belong to the old address.
Stars in parents' accounts are not affected.

### 4. Developer: switch it on
1. Paste the config into `js/firebase-config.js` (`window.HUROOFI_FIREBASE = { … };`).
2. Run `node tools/build_sw.js && node tools/check_data.js`, then commit and push.

### 5. Developer: security rules
The rules decide who can read what.
- Template: `firebase/firestore.rules.template`.
- The teacher's Gmail is in `firebase/teacher-email.txt`. It is kept off GitHub; see `.gitignore`.

```bash
node tools/make_rules.js
```

Then put the rules live in one of two ways:
- Paste `firebase/firestore.rules` into **Firestore Database → Rules → Publish**.
- Or use the CLI: `firebase deploy --only firestore:rules --project <project-id>`, run from the `firebase/` folder after `firebase login`.

The rules allow:
- **A parent:** only their own children. They can never approve their own child, and joining needs the current invite code.
- **The teacher:** only her class. She can approve, reject or remove a child, and cannot change stars or delete.
- **Anyone else:** nothing.

## Testing on this computer

Needs Java (`brew install openjdk`) and the Firebase CLI (`npm i -g firebase-tools`).

```bash
TEACHER_EMAIL=teacher@example.com node tools/make_rules.js
```

```bash
cd firebase && firebase emulators:start --project demo-huroofi --only auth,firestore
```

Serve the site (`python3 -m http.server 8765`) and open `http://127.0.0.1:8765/index.html?emu=1`.
The `emu` switch only works on localhost and is remembered on that browser.
The emulator's Google window lets you make test accounts; `teacher@example.com` is the teacher.

## Data

One document per child in `children`:
`{ parent, parentEmail, name, avatar, classId: "main" | null, invite, approved, progress, created, lastPlayed }`.
`progress` has the same shape as on the device: `{ letters: { <id>: { visited, stars: { listen, trace, match, find } } } }`.

The class is `classes/main` = `{ invite }`, and only the teacher can read it.
That is how the site recognises the teacher without her email appearing anywhere in the site.
