// Security rule tests. Run with `npm run test:rules` (starts the Firestore emulator, runs Vitest, stops it).
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const product = {
  categoryId: 'rolls',
  name: 'Test Roll',
  description: '',
  emoji: '🍣',
  basePrice: 900,
  availableAt: ['downtown'],
  optionGroups: [],
  sortOrder: 0,
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sushi-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'staff/staff-uid'), { email: 'staff@example.com' });
    await setDoc(doc(db, 'categories/rolls'), { name: 'Rolls', sortOrder: 0 });
    await setDoc(doc(db, 'products/california-roll'), { ...product, name: 'California Roll' });
  });
});

const guest = () => env.unauthenticatedContext().firestore();
const customer = () => env.authenticatedContext('customer-uid').firestore();
const staff = () => env.authenticatedContext('staff-uid').firestore();

describe('public read', () => {
  it('lets anyone read the catalog', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'products/california-roll')));
    await assertSucceeds(getDoc(doc(guest(), 'categories/rolls')));
  });

  it('hides the staff list from other users', async () => {
    await assertFails(getDoc(doc(guest(), 'staff/staff-uid')));
    await assertFails(getDoc(doc(customer(), 'staff/staff-uid')));
    await assertSucceeds(getDoc(doc(staff(), 'staff/staff-uid')));
  });
});

describe('staff-only write', () => {
  it('blocks guests and signed-in non-staff', async () => {
    await assertFails(setDoc(doc(guest(), 'products/new-roll'), product));
    await assertFails(setDoc(doc(customer(), 'products/new-roll'), product));
    await assertFails(updateDoc(doc(customer(), 'products/california-roll'), { basePrice: 1 }));
    await assertFails(deleteDoc(doc(customer(), 'products/california-roll')));
  });

  it('lets staff insert, modify and delete products', async () => {
    await assertSucceeds(setDoc(doc(staff(), 'products/new-roll'), product));
    await assertSucceeds(updateDoc(doc(staff(), 'products/new-roll'), { basePrice: 1000 }));
    await assertSucceeds(deleteDoc(doc(staff(), 'products/new-roll')));
  });

  it('stops anyone from making themselves staff', async () => {
    await assertFails(setDoc(doc(customer(), 'staff/customer-uid'), { email: 'me@example.com' }));
  });
});

describe('product validation', () => {
  it('rejects a price in dollars instead of integer cents', async () => {
    await assertFails(setDoc(doc(staff(), 'products/bad'), { ...product, basePrice: 9.5 }));
  });

  it('rejects a negative price, empty name or unknown category', async () => {
    await assertFails(setDoc(doc(staff(), 'products/bad'), { ...product, basePrice: -1 }));
    await assertFails(setDoc(doc(staff(), 'products/bad'), { ...product, name: '' }));
    await assertFails(setDoc(doc(staff(), 'products/bad'), { ...product, categoryId: 'pizza' }));
  });
});
