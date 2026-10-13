// Loads the sample catalog (seed/catalog.json) into Firestore and creates a staff user.
//
// Emulator (default):   npm run seed
// Real project:         GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//                       FIREBASE_PROJECT_ID=my-project STAFF_EMAIL=... STAFF_PASSWORD=... npm run seed
// Add --reset to delete the existing catalog collections first.
import { readFile } from 'node:fs/promises';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const useEmulator = !process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'demo-sushi';

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}

// Default staff credentials are only allowed against the emulator.
const staffEmail = process.env.STAFF_EMAIL ?? (useEmulator ? 'staff@example.com' : null);
const staffPassword = process.env.STAFF_PASSWORD ?? (useEmulator ? 'sushi-staff-123' : null);
if (!staffEmail || !staffPassword) {
  console.error('Set STAFF_EMAIL and STAFF_PASSWORD when seeding a real Firebase project.');
  process.exit(1);
}

initializeApp(useEmulator ? { projectId } : { projectId, credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));

if (process.argv.includes('--reset')) {
  for (const name of ['products', 'categories', 'branches', 'meta']) {
    await db.recursiveDelete(db.collection(name));
  }
  console.log('Deleted existing catalog collections.');
}

// One batch is enough for the sample catalog (Firestore allows up to 500 writes per batch).
const batch = db.batch();

batch.set(db.doc('meta/restaurant'), {
  restaurantName: catalog.restaurantName,
  currency: catalog.currency,
});

catalog.branches.forEach(({ id, ...branch }, index) => {
  batch.set(db.doc(`branches/${id}`), { ...branch, sortOrder: index });
});

catalog.categories.forEach(({ id, ...category }, index) => {
  batch.set(db.doc(`categories/${id}`), { ...category, sortOrder: index });
});

catalog.products.forEach(({ id, ...product }, index) => {
  batch.set(db.doc(`products/${id}`), { ...product, sortOrder: index, updatedAt: new Date() });
});

await batch.commit();
console.log(
  `Seeded ${catalog.branches.length} branches, ${catalog.categories.length} categories, ` +
    `${catalog.products.length} products into project "${projectId}"${useEmulator ? ' (emulator)' : ''}.`,
);

// Create (or reuse) the staff account and mark it as staff.
let user;
try {
  user = await auth.getUserByEmail(staffEmail);
} catch {
  user = await auth.createUser({ email: staffEmail, password: staffPassword });
}
await db.doc(`staff/${user.uid}`).set({ email: staffEmail });
console.log(`Staff user ready: ${staffEmail}${useEmulator ? ` / ${staffPassword}` : ''}`);
