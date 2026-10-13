// Every Firestore read and write the panel makes lives in this file.
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../firebase';
import type { Branch, Category, Product } from '../types';
import type { BranchFields } from './branchForm';
import type { ProductFields } from './productForm';

export interface LiveResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/** Sorts by the `sortOrder` field, then name. */
function bySortOrder<T extends { sortOrder: number; name: string }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

type Filter = [field: string, op: '==' | 'array-contains', value: string];

/**
 * Subscribes to a collection with onSnapshot so the list updates as soon as anyone changes the data.
 * Filters are serialized into a string key so the effect re-subscribes only when they really change.
 */
function useLiveQuery<T extends { id: string; sortOrder: number; name: string }>(
  collectionName: string,
  filters: Filter[] = [],
): LiveResult<T> {
  const key = JSON.stringify([collectionName, filters]);
  const [result, setResult] = useState<LiveResult<T> & { key: string }>({
    key: '',
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const [name, filterList] = JSON.parse(key) as [string, Filter[]];
    const constraints: QueryConstraint[] = filterList.map(([field, op, value]) => where(field, op, value));
    return onSnapshot(
      query(collection(db, name), ...constraints),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T).sort(bySortOrder);
        setResult({ key, data, loading: false, error: null });
      },
      (error) => setResult({ key, data: [], loading: false, error }),
    );
  }, [key]);

  // Until the first snapshot for the current filters arrives, keep showing the old rows as "loading".
  return { data: result.data, error: result.error, loading: result.key !== key || result.loading };
}

export function useCategories() {
  return useLiveQuery<Category>('categories');
}

export function useBranches() {
  return useLiveQuery<Branch>('branches');
}

/** Products, optionally filtered by category and/or by the branches that carry them. */
export function useProducts({ categoryId, branchId }: { categoryId?: string; branchId?: string }) {
  const filters: Filter[] = [];
  if (categoryId) filters.push(['categoryId', '==', categoryId]);
  if (branchId) filters.push(['availableAt', 'array-contains', branchId]);
  return useLiveQuery<Product>('products', filters);
}

/** Reads one product once (forms load once so live updates don't overwrite what staff is typing). */
export async function getProduct(id: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, 'products', id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Product) : null;
}

/** Next sortOrder for a new document: one past the current highest. */
async function nextSortOrder(collectionName: string): Promise<number> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.reduce((max, d) => Math.max(max, (d.get('sortOrder') as number) ?? 0), -1) + 1;
}

/** Inserts a product under the given id; fails if that id is already taken. */
export async function createProduct(id: string, fields: ProductFields): Promise<void> {
  const sortOrder = await nextSortOrder('products');
  const ref = doc(db, 'products', id);
  // A transaction makes the "does it exist?" check and the write atomic.
  await runTransaction(db, async (transaction) => {
    if ((await transaction.get(ref)).exists()) {
      throw new Error(`A product with the id "${id}" already exists. Use a different name.`);
    }
    transaction.set(ref, { ...fields, sortOrder, updatedAt: serverTimestamp() });
  });
}

/** Replaces the editable fields of an existing product. */
export async function updateProduct(id: string, fields: ProductFields): Promise<void> {
  await updateDoc(doc(db, 'products', id), { ...fields, updatedAt: serverTimestamp() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

/** Turns a product on or off for one branch without rewriting the rest of the document. */
export async function setProductAvailability(productId: string, branchId: string, available: boolean) {
  await updateDoc(doc(db, 'products', productId), {
    availableAt: available ? arrayUnion(branchId) : arrayRemove(branchId),
    updatedAt: serverTimestamp(),
  });
}

/** Inserts a new branch (id is derived from its name) or updates an existing one. */
export async function saveBranch(id: string, fields: BranchFields, isNew: boolean): Promise<void> {
  const ref = doc(db, 'branches', id);
  if (isNew) {
    if ((await getDoc(ref)).exists()) throw new Error(`A branch with the id "${id}" already exists.`);
    await setDoc(ref, { ...fields, sortOrder: await nextSortOrder('branches') });
  } else {
    await updateDoc(ref, { ...fields });
  }
}

/** Deletes a branch and removes it from every product that listed it, in one atomic batch. */
export async function deleteBranch(id: string): Promise<number> {
  const products = await getDocs(query(collection(db, 'products'), where('availableAt', 'array-contains', id)));
  const batch = writeBatch(db);
  products.forEach((product) => batch.update(product.ref, { availableAt: arrayRemove(id) }));
  batch.delete(doc(db, 'branches', id));
  await batch.commit();
  return products.size;
}
