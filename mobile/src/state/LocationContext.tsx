import * as Location from 'expo-location';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { nearestBranch, type Coordinates } from '@/lib/distance';
import { useCatalog } from '@/state/CatalogContext';
import { useCart } from '@/state/CartContext';

export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'error';

interface LocationContextValue {
  status: LocationStatus;
  coords: Coordinates | null;
  /** Asks for permission (if needed), reads the position and selects the nearest branch. */
  locateNearest: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

/** Reads the device position, preferring a recent cached fix for speed. */
async function readPosition(): Promise<Coordinates> {
  // A recent cached fix is instant; fall back to a fresh reading.
  const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
  const position = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

/** Tracks location permission/coordinates and auto-selects the nearest branch on first launch. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, hydrated } = useCart();
  const { catalog } = useCatalog();
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const autoLocated = useRef(false);

  const locateNearest = useCallback(async () => {
    setStatus('locating');
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setStatus('denied');
        return;
      }
      const here = await readPosition();
      setCoords(here);
      setStatus('granted');
      const nearest = nearestBranch(here, catalog.branches);
      if (nearest) dispatch({ type: 'setBranch', branchId: nearest.id });
    } catch (error) {
      console.warn('Location failed', error);
      setStatus('error');
    }
  }, [dispatch, catalog.branches]);

  // First launch only: once the saved cart is loaded, auto-pick a branch if none was saved.
  useEffect(() => {
    if (!hydrated || autoLocated.current || state.branchId) return;
    autoLocated.current = true;
    locateNearest();
  }, [hydrated, state.branchId, locateNearest]);

  const value = useMemo(() => ({ status, coords, locateNearest }), [status, coords, locateNearest]);
  return <LocationContext value={value}>{children}</LocationContext>;
}

/** Access location status and the locate action from any component. */
export function useLocation(): LocationContextValue {
  const context = use(LocationContext);
  if (!context) throw new Error('useLocation must be used inside <LocationProvider>');
  return context;
}
