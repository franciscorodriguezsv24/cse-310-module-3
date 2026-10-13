import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import {
  cartReducer,
  cartTotals,
  initialCartState,
  resolveLines,
  type CartAction,
  type CartState,
  type CartTotals,
  type ResolvedLine,
} from '@/state/cartReducer';
import { useCatalog } from '@/state/CatalogContext';

const STORAGE_KEY = 'sushi-order/cart/v1';

interface CartContextValue {
  state: CartState;
  dispatch: (action: CartAction) => void;
  lines: ResolvedLine[];
  totals: CartTotals;
  /** False until the saved cart has been read from storage. */
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Guards against corrupted or outdated data read from storage. */
function isCartState(value: unknown): value is CartState {
  const v = value as CartState;
  return Boolean(v) && Array.isArray(v.lines) && typeof v.customerName === 'string';
}

/** Holds cart state in a reducer and saves it to AsyncStorage on every change. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [hydrated, setHydrated] = useState(false);
  const { catalog } = useCatalog();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved: unknown = raw ? JSON.parse(raw) : null;
        if (isCartState(saved)) dispatch({ type: 'hydrate', state: { ...initialCartState, ...saved } });
      })
      .catch((error) => console.warn('Could not restore cart', error))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    // Skip until hydrated so the empty initial state never overwrites the saved cart.
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
      console.warn('Could not save cart', error),
    );
  }, [state, hydrated]);

  const value = useMemo(() => {
    // Re-resolved on every catalog snapshot, so price and availability changes show up in the cart live.
    const lines = resolveLines(state, catalog);
    return { state, dispatch, lines, totals: cartTotals(lines), hydrated };
  }, [state, hydrated, catalog]);

  return <CartContext value={value}>{children}</CartContext>;
}

/** Access the cart from any screen or component. */
export function useCart(): CartContextValue {
  const context = use(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
