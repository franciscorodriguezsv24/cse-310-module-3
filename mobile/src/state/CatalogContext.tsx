import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { bundledCatalog } from '@/lib/catalog';
import { subscribeToCatalog } from '@/lib/catalogSource';
import type { Catalog } from '@/types/catalog';

const STORAGE_KEY = 'sushi-order/catalog/v1';

/** Where the catalog on screen came from: Firestore, the last saved copy, or the JSON bundled with the app. */
export type CatalogSource = 'live' | 'cached' | 'bundled';

interface CatalogContextValue {
  catalog: Catalog;
  source: CatalogSource;
  /** Last Firestore error, cleared when a live snapshot arrives. */
  error: Error | null;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

/** Guards against corrupted or outdated data read from storage. */
function isCatalog(value: unknown): value is Catalog {
  const v = value as Catalog;
  return Boolean(v) && Array.isArray(v.branches) && Array.isArray(v.categories) && Array.isArray(v.products);
}

/** Serves the catalog: bundled or cached copy first, then live Firestore updates as they arrive. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(bundledCatalog);
  const [source, setSource] = useState<CatalogSource>('bundled');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let live = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved: unknown = raw ? JSON.parse(raw) : null;
        // A live snapshot may have beaten storage; never replace it with an older copy.
        if (!live && isCatalog(saved)) {
          setCatalog(saved);
          setSource('cached');
        }
      })
      .catch((e) => console.warn('Could not restore catalog', e));

    return subscribeToCatalog(
      (next) => {
        live = true;
        setCatalog(next);
        setSource('live');
        setError(null);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) => console.warn('Could not save catalog', e));
      },
      (e) => {
        console.warn('Catalog listener failed', e);
        setError(e);
      },
    );
  }, []);

  const value = useMemo(() => ({ catalog, source, error }), [catalog, source, error]);
  return <CatalogContext value={value}>{children}</CatalogContext>;
}

/** Access the current catalog from any screen or component. */
export function useCatalog(): CatalogContextValue {
  const context = use(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return context;
}
