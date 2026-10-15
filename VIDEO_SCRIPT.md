# Video Script — Sushi Order Cloud Catalog (CSE 310 Cloud Databases)

Target length **5:00**. Each section lists **[DO]** (what to show on screen) and **[SAY]** (narration).

## What the video has to prove

| Module requirement | Where in the video |
| --- | --- |
| Connect to a cloud database | 0:20 Firebase console, 3:35 `firebase.ts` |
| Insert | 1:30 New product |
| Modify | 2:20 Edit price + availability toggles |
| Delete | 2:55 Delete product |
| Retrieve | 1:05 Filtered product list, 4:00 mobile listener |
| Stretch: real-time notifications | 2:20 and 2:55, phone updates without reloading |
| Stretch: authentication + security | 0:50 Sign-in, 4:20 rules + rule tests |

## Before you hit record

### The one that can cost points

Record against a **real Firebase project**, not the emulator. The module is "Cloud Databases", so the Firestore
data should be visible in the Firebase console in the cloud. Follow "Using a real Firebase project" in the README
(about 15 minutes): create the project, fill in `panel/.env.local` and `mobile/.env`, run `npm run deploy:rules`,
and seed with your service account.

If you have to use the emulator, say so in the intro. Show the Emulator UI (http://localhost:4000/firestore) wherever
this script says "Firebase console".

### Data staging (skip these and the demo breaks)

1. Reset the catalog: `npm run seed -- --reset`, with the same environment variables you used to seed.
2. Make sure `products/volcano-roll` doesn't exist. It's created live in the video.
3. Put the phone (or iOS Simulator) on the **Provo** branch. On the Simulator:
   `xcrun simctl location booted set 40.2338,-111.6585`, then tap "Use my location" on the branch picker.
   Or pick Provo by hand.
4. Check that the Menu screen shows **no** "Offline — showing…" note. If it does, the app isn't connected live.
5. Sign out of the panel so the video starts at the sign-in page.

### Windows to have open

1. **Panel:** `cd panel && npm run dev`, http://localhost:5173. Put it on the left half of the screen.
2. **Phone:** the iOS Simulator or your phone mirrored with QuickTime (File → New Movie Recording → pick the
   iPhone). Put it on the right half. **The phone has to be visible beside the panel for the real-time parts.**
3. **Firebase console:** Firestore Database → Data, `products` collection, in a browser tab.
4. **VS Code** with these files in tabs: `panel/src/firebase.ts`, `panel/src/lib/catalog.ts`,
   `mobile/src/lib/catalogSource.ts`, `mobile/src/state/CatalogContext.tsx`, `firestore.rules`.
5. **Terminal** in the repo root, for `npm run test:rules`.

Rehearse once. Real-time updates take about a second, so pause and let the viewer see them.

---

## 0:00 – 0:20 · Introduction

**[DO]** Face cam or the README on GitHub.

**[SAY]**
> "Hi, I'm Alejandro. For my Cloud Databases module I took the sushi ordering app from my last module and moved its
> menu out of a JSON file bundled in the app and into Google Firebase Cloud Firestore. I also built a web panel where
> staff can change the menu, and the app picks up those changes in real time without publishing a new version."

---

## 0:20 – 0:50 · The database

**[DO]** Firebase console → Firestore → Data. Click `products` → `california-roll`. Expand `availableAt` and
`optionGroups`.

**[SAY]**
> "This is the database in Firestore. There are four collections: branches, categories, products, and a staff list.
> Firestore has no joins, so I designed around the screens that read it. A product keeps its options inside the same
> document, because the app always needs them together. `availableAt` is the list of branches that sell it. Prices
> are stored as whole cents, so there are no floating-point rounding errors."

---

## 0:50 – 1:05 · Sign in

**[DO]** Panel sign-in page. Type the staff email and password, then click **Sign in**.

**[SAY]**
> "Staff sign in with Firebase Authentication. Signing in isn't enough on its own: the account also needs a document
> in the staff collection, and the security rules check that on every write. I'll show the rules at the end."

---

## 1:05 – 1:30 · Retrieve

**[DO]** Products page. Point at the full list. Set **Category** to *Rolls* (4 rows), then **Sold at** to *Provo*
(3 rows). Reset both filters to "All".

**[SAY]**
> "Here I'm retrieving data. The list is a Firestore query, and these filters add `where` clauses. One filters
> on category; the other uses `array-contains` on the branch list. Rolls at Provo leaves three products."

---

## 1:30 – 2:20 · Insert

**[DO]**
1. Click **+ New product**, then **Create product** right away so the validation errors show.
2. Name **Volcano Roll**, price **14.25**, category *Rolls*.
3. Click **+ Add option group**. Group name **Heat**. Type `Mild` in the first choice and tick **Default**.
4. Click **+ Add choice**: `Extra hot`, price change **0.50**. **Untick Provo** for Extra hot.
5. Click **Create product**.
6. Switch to the Firebase console and show the new `volcano-roll` document.
7. **Phone:** Volcano Roll has appeared under Rolls. Tap it: the Heat group shows only *Mild*.

**[SAY]**
> "Now inserting. If I save an empty form, validation stops me. I'll add a Volcano Roll at fourteen twenty-five,
> with a Heat option. Extra hot isn't available in Provo, so I switch it off there.
> When I save, the panel uses a transaction to check the id isn't taken, then writes the document. Here it is
> in the console. On the phone, which is set to Provo, the roll is already on the menu, and Extra hot is hidden
> because Provo doesn't offer it."

---

## 2:20 – 2:55 · Modify (real time)

**[DO]**
1. Keep the phone on the Menu, beside the panel.
2. Click **Miso Soup**, change the price to **3.95**, then **Save changes**. Point at the phone: $3.50 changes to $3.95.
3. Back on Products, **untick California Roll under Provo**. Point at the phone: it disappears from the menu.
   Tick it again: it comes back.

**[SAY]**
> "Modifying. I'll change Miso Soup to three ninety-five, and watch the phone: the price changes on its own. The
> app has a real-time listener, so I don't refresh anything.
> These checkboxes switch a product on or off for one branch. They use `arrayUnion` and `arrayRemove`, so only that
> one field changes. I'll switch California Roll off in Provo, and it disappears from the phone. Switch it back on,
> and it returns."

---

## 2:55 – 3:20 · Delete

**[DO]** On Products, click **Delete** on the Volcano Roll row. Show the confirmation and click OK. Point at the
phone: it disappears. Show the console: the document is gone.

**[SAY]**
> "Deleting. There's a confirmation step, because customers stop seeing the item right away. Gone from the panel,
> from the phone and from the database."

---

## 3:20 – 3:35 · Branches (optional, cut if you're over time)

**[DO]** Branches page. Point at the list. Click **Edit** on Provo to show the form, then **Cancel**.

**[SAY]**
> "Staff can also add, edit and delete branches. Deleting a branch also removes it from every product in a single
> batch write, so the data never points at a branch that doesn't exist."

---

## 3:35 – 4:20 · Code walkthrough

**[DO]** VS Code, one file at a time.

1. `panel/src/firebase.ts`: highlight `initializeApp` and `getFirestore`.

   **[SAY]** "This is the connection. The Firebase SDK talks to Firestore directly from the browser, with config from
   an environment file that isn't committed to Git."

2. `panel/src/lib/catalog.ts`: scroll to `useLiveQuery` (`onSnapshot`), then `createProduct` (`runTransaction`),
   `setProductAvailability` (`arrayUnion`/`arrayRemove`) and `deleteBranch` (`writeBatch`).

   **[SAY]** "Every database call the panel makes is in this one file. Lists use `onSnapshot`, so they're always live.
   Inserting uses a transaction, the toggles use array updates, and deleting a branch is one atomic batch."

3. `mobile/src/lib/catalogSource.ts`: highlight `subscribeToCatalog`.

   **[SAY]** "On the phone, four listeners combine into one catalog, and the app only uses it once all four have
   arrived."

4. `mobile/src/state/CatalogContext.tsx`: highlight the AsyncStorage cache and `bundledCatalog`.

   **[SAY]** "If the phone is offline, it shows the last menu it saved. On a first launch with no connection, it falls
   back to the JSON bundled with the app, so the menu is never empty."

---

## 4:20 – 4:45 · Security rules

**[DO]** `firestore.rules`: highlight `isStaff()` and `validProduct`. In the terminal, run `npm run test:rules` and
show **7 passed**.

**[SAY]**
> "Security is the part I was most worried about. Anyone can read the menu, but only staff can write, and the rules
> also reject bad data, like a price in dollars instead of cents or a category that doesn't exist. I test the rules
> against the Firebase emulator: guests and normal users are blocked, staff can write, and nobody can add themselves
> to the staff list."

---

## 4:45 – 5:00 · Wrap-up

**[DO]** Face cam or README.

**[SAY]**
> "What I learned: designing a NoSQL data model around how the data is read, using real-time listeners, and that
> security rules are the real backend when clients talk to the database directly. Next, I'd add image uploads and
> roles for branch managers. Thanks for watching."

---

# Timing safety

- **Over 5:30:** cut the Branches section (3:20) and shorten the walkthrough to `catalog.ts` and `catalogSource.ts`.
- **A real-time update doesn't appear:** keep talking for a second. If the phone shows "Offline — showing…", the app
  lost its connection; reload it in Expo and repeat the step.
- **After recording:** upload to YouTube (Unlisted is fine). Replace `REPLACE_ME` in the README, then commit and push.
