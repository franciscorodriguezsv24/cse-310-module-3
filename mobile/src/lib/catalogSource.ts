import { collection, doc, onSnapshot, type DocumentData } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Branch, Catalog, Category, Product } from '@/types/catalog';

/** A Firestore document reduced to its id and data. */
export interface RawDoc {
  id: string;
  data: DocumentData;
}

/** The four catalog listeners' latest results; undefined until each one first delivers. */
export interface CatalogParts {
  meta?: DocumentData;
  branches?: RawDoc[];
  categories?: RawDoc[];
  products?: RawDoc[];
}

/** Sorts documents by their `sortOrder` field (missing values last) and merges the id into the data. */
export function toSorted<T>(docs: RawDoc[]): T[] {
  return [...docs]
    .sort((a, b) => (a.data.sortOrder ?? Infinity) - (b.data.sortOrder ?? Infinity))
    .map(({ id, data }) => {
      const { sortOrder: _sortOrder, updatedAt: _updatedAt, ...rest } = data;
      return { id, ...rest } as T;
    });
}

/** Builds a Catalog once every part has arrived; returns null while any part is still missing. */
export function combineCatalog(parts: CatalogParts): Catalog | null {
  const { meta, branches, categories, products } = parts;
  if (!meta || !branches || !categories || !products) return null;
  return {
    restaurantName: meta.restaurantName ?? '',
    currency: meta.currency ?? 'USD',
    branches: toSorted<Branch>(branches),
    categories: toSorted<Category>(categories),
    products: toSorted<Product>(products).map((p) => ({
      ...p,
      availableAt: p.availableAt ?? [],
      optionGroups: p.optionGroups ?? [],
    })),
  };
}

/** Listens to the catalog in real time; calls onCatalog on every change. Returns an unsubscribe function. */
export function subscribeToCatalog(onCatalog: (catalog: Catalog) => void, onError: (error: Error) => void) {
  const parts: CatalogParts = {};
  const emit = () => {
    const catalog = combineCatalog(parts);
    if (catalog) onCatalog(catalog);
  };
  const listCollection = (name: 'branches' | 'categories' | 'products') =>
    onSnapshot(
      collection(db, name),
      (snapshot) => {
        parts[name] = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
        emit();
      },
      onError,
    );

  const unsubscribers = [
    onSnapshot(
      doc(db, 'meta', 'restaurant'),
      (snapshot) => {
        parts.meta = snapshot.data() ?? {};
        emit();
      },
      onError,
    ),
    listCollection('branches'),
    listCollection('categories'),
    listCollection('products'),
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
