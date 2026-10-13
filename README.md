# Overview

As a software engineer I want to learn how to use a cloud database as the live backend for real apps: how to model
data without joins, query it, keep clients in sync in real time, and lock it down with security rules.

In Module 2 I built **Sushi Order**, a React Native app whose menu was a JSON file bundled with the app. Any price or
availability change meant publishing a new version. In this module the catalog moves to **Google Firebase Cloud
Firestore**, and I built a staff web panel to manage it:

- **Staff panel** (`panel/`, React + Vite + TypeScript): staff sign in, then add, edit and delete products and
  their options, add and edit branches, and turn products and individual options on or off for each branch.
- **Mobile app** (`mobile/`, Expo): reads the catalog from Firestore with real-time listeners, so the Menu and Cart
  change as soon as staff save. The last catalog received is saved on the phone, and the bundled JSON is still the
  offline fallback.

Orders still go through WhatsApp. Firestore holds only catalog and branch data, never orders or customer
information. This repository uses a sample catalog and a demo Firebase project, not the business's real data or
keys.

[Software Demo Video](https://youtu.be/REPLACE_ME)

# Cloud Database

**Google Firebase Cloud Firestore**, a NoSQL document database. Clients connect directly with the Firebase SDK, and
`firestore.rules` decides who can read and write. **Firebase Authentication** (email and password) signs staff in.
Local development and tests use the **Firebase Emulator Suite**, so no real project or credentials are needed.

## Data model

```
meta/restaurant          { restaurantName, currency }
branches/{branchId}      { name, address, whatsapp, latitude, longitude, hours, sortOrder }
categories/{categoryId}  { name, sortOrder }
products/{productId}     { categoryId, name, description, emoji, basePrice, sortOrder, updatedAt,
                           availableAt: [branchId, ...],
                           optionGroups: [{ id, name, type, max?, choices: [
                             { id, name, priceDelta, default?, unavailableAt?: [branchId, ...] } ] }] }
staff/{uid}              { email }   ← existence of this doc is what makes a user staff
```

Design decisions:

- **Options are embedded in the product.** The mobile product screen always needs a product and all its options
  together, so one document read gets everything. A product's options never come close to Firestore's 1 MB document
  limit.
- **Per-branch availability is an array of branch ids on the product** (`availableAt`). The panel can filter with
  `where('availableAt', 'array-contains', branchId)` and switch one branch on or off with
  `arrayUnion` / `arrayRemove`, without rewriting the document. Option availability uses the opposite list,
  `unavailableAt`, because nearly every option is available everywhere.
- **Money is stored as integer cents.** The rules reject anything else (`basePrice is int`).
- **Document ids are readable slugs** (`products/california-roll`), so ids in carts saved on phones stay meaningful.

## How each module requirement is met

| Requirement | Where |
| --- | --- |
| Connect to a cloud database | `panel/src/firebase.ts`, `mobile/src/lib/firebase.ts` |
| Insert | `seed/seed.mjs` (batch write); `createProduct` (transaction) and `saveBranch` in `panel/src/lib/catalog.ts` |
| Modify | `updateProduct`, `setProductAvailability` (`arrayUnion`/`arrayRemove`) and `saveBranch` |
| Delete | `deleteProduct`; `deleteBranch`, which also removes the branch from every product in one `writeBatch` |
| Retrieve | `useProducts` (`where` on category and branch); `getProduct`; `subscribeToCatalog` in the mobile app |
| Real-time notifications | `onSnapshot` in `panel/src/lib/catalog.ts` and `mobile/src/lib/catalogSource.ts` |
| Authentication | `panel/src/auth/AuthContext.tsx` (Firebase Auth plus a `/staff/{uid}` check) |
| Security | `firestore.rules` (public read, staff-only validated writes), tested in `tests/rules.test.ts` |

# Development Environment

- **Tools:** VS Code, Claude Code, Git and GitHub, Firebase CLI and Emulator Suite, Expo Go
- **Language:** TypeScript (panel, mobile app, tests), JavaScript (seed script)
- **Libraries:** Firebase JS SDK 13 (`firebase/firestore`, `firebase/auth`), Firebase Admin SDK (seeding),
  React 19, Vite, React Router, Expo SDK 57, Vitest and `@firebase/rules-unit-testing`, Jest

## Project layout

```
firebase.json, .firebaserc   Firebase CLI config (emulator ports, demo project id)
firestore.rules              security rules
firestore.indexes.json       composite index for category + branch filtering
seed/                        seed.mjs + sample catalog.json
tests/rules.test.ts          security rule tests (run against the emulator)
panel/                       staff web panel (React + Vite)
mobile/                      Sushi Order mobile app (Expo), see mobile/README.md
```

## Running it locally (emulators, no Firebase account needed)

Requires Node 22 and **Java 21+** for the emulators (`brew install openjdk`, then put
`/opt/homebrew/opt/openjdk/bin` on your `PATH`).

```bash
npm install                     # Firebase CLI, Admin SDK, test tools
npm run emulators               # terminal 1: Firestore :8080, Auth :9099, Emulator UI http://localhost:4000
npm run seed                    # terminal 2: sample catalog + staff@example.com / sushi-staff-123
                                #   (a "MetadataLookupWarning" here is harmless)

cd panel && npm install && npm run dev        # http://localhost:5173, sign in as the staff user

cd mobile && npm install
echo "EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=<your computer's LAN IP>" > .env   # 127.0.0.1 for the iOS Simulator
npx expo start
```

Change a price or untick a branch in the panel, and the phone's Menu updates without reloading.

`npm run emulators` saves emulator data to `.emulator-data/` on exit. `npm run seed -- --reset` starts the catalog over.

## Tests and checks

```bash
npm run test:rules                                           # 7 security rule tests (starts its own emulator)
cd panel  && npm test && npm run typecheck && npm run lint   # form validation tests
cd mobile && npm test && npm run typecheck && npm run lint   # catalog, pricing and cart tests
```

## Using a real Firebase project

1. Create a project in the [Firebase console](https://console.firebase.google.com/). Enable **Firestore** and
   **Authentication → Email/Password**, then register a **Web app**.
2. Put the web app config in `panel/.env.local` and `mobile/.env`, following the `.env.example` files, and leave the
   emulator host empty.
3. `npx firebase use --add` and choose the project, then `npm run deploy:rules` to deploy the rules and indexes.
4. Seed with a service account key (Project settings → Service accounts). Git ignores the key and `.env` files.
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json FIREBASE_PROJECT_ID=<id> \
   STAFF_EMAIL=you@example.com STAFF_PASSWORD='<strong password>' npm run seed
   ```

# Useful Websites

- [Cloud Firestore documentation](https://firebase.google.com/docs/firestore)
- [Firestore data model](https://firebase.google.com/docs/firestore/data-model)
- [Get real-time updates with `onSnapshot`](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Test security rules with the emulator](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Authentication for web](https://firebase.google.com/docs/auth/web/start)
- [Using Firebase with Expo](https://docs.expo.dev/guides/using-firebase/)
- [Vite guide](https://vite.dev/guide/)

# Future Work

- If staff switch off an option that's already in a customer's cart, the cart keeps it at its old price until it
  is removed. The product screen already hides it.
- Image uploads (Firebase Storage) instead of emoji
- Roles beyond "staff can edit" (for example, managers limited to their own branch)
- Drag-and-drop reordering of products and categories (`sortOrder`)
- Editing categories from the panel
- Audit log of who changed what
