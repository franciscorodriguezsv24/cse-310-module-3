import { findProduct, isAvailableAt } from '@/lib/catalog';
import { lineTotal } from '@/lib/pricing';
import type { Catalog, Cents, Product, Selections } from '@/types/catalog';

export const MAX_QUANTITY = 20;

export interface CartLine {
  /** Same product + same options = same key, so re-adding merges quantities. */
  key: string;
  productId: string;
  selections: Selections;
  quantity: number;
}

export interface CartState {
  lines: CartLine[];
  branchId: string | null;
  customerName: string;
  notes: string;
}

export const initialCartState: CartState = {
  lines: [],
  branchId: null,
  customerName: '',
  notes: '',
};

export type CartAction =
  | { type: 'hydrate'; state: CartState }
  | { type: 'add'; productId: string; selections: Selections; quantity: number }
  | { type: 'setQuantity'; key: string; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }
  | { type: 'setBranch'; branchId: string; removeKeys?: string[] }
  | { type: 'setCustomer'; customerName?: string; notes?: string };

/** Stable key: product id plus sorted group/choice ids, so selection order doesn't matter. */
export function lineKey(productId: string, selections: Selections): string {
  const parts = Object.keys(selections)
    .sort()
    .filter((groupId) => selections[groupId].length > 0)
    .map((groupId) => `${groupId}=${[...selections[groupId]].sort().join('+')}`);
  return [productId, ...parts].join('|');
}

/** Keeps quantities whole numbers between 0 and MAX_QUANTITY. */
const clampQuantity = (q: number) => Math.min(MAX_QUANTITY, Math.max(0, Math.floor(q)));

/** Pure reducer: returns the next cart state for each action without side effects. */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'add': {
      const quantity = clampQuantity(action.quantity);
      if (quantity === 0) return state;
      const key = lineKey(action.productId, action.selections);
      const existing = state.lines.find((l) => l.key === key);
      const lines = existing
        ? state.lines.map((l) => (l.key === key ? { ...l, quantity: clampQuantity(l.quantity + quantity) } : l))
        : [...state.lines, { key, productId: action.productId, selections: action.selections, quantity }];
      return { ...state, lines };
    }

    case 'setQuantity': {
      const quantity = clampQuantity(action.quantity);
      const lines =
        quantity === 0
          ? state.lines.filter((l) => l.key !== action.key)
          : state.lines.map((l) => (l.key === action.key ? { ...l, quantity } : l));
      return { ...state, lines };
    }

    case 'remove':
      return { ...state, lines: state.lines.filter((l) => l.key !== action.key) };

    case 'clear':
      return { ...state, lines: [], notes: '' };

    case 'setBranch': {
      const remove = new Set(action.removeKeys ?? []);
      return {
        ...state,
        branchId: action.branchId,
        lines: state.lines.filter((l) => !remove.has(l.key)),
      };
    }

    case 'setCustomer':
      return {
        ...state,
        customerName: action.customerName ?? state.customerName,
        notes: action.notes ?? state.notes,
      };
  }
}

export interface ResolvedLine extends CartLine {
  product: Product;
  total: Cents;
  available: boolean;
}

/** Joins cart lines with catalog data. Lines whose product was removed from the catalog are dropped. */
export function resolveLines(state: CartState, source?: Catalog): ResolvedLine[] {
  const resolved: ResolvedLine[] = [];
  for (const line of state.lines) {
    const product = findProduct(line.productId, source);
    if (!product) continue;
    resolved.push({
      ...line,
      product,
      total: lineTotal(product, line.selections, line.quantity),
      available: isAvailableAt(product, state.branchId),
    });
  }
  return resolved;
}

export interface CartTotals {
  itemCount: number;
  subtotal: Cents;
  unavailableCount: number;
}

/** Totals count only lines the current branch can fulfill. */
export function cartTotals(lines: ResolvedLine[]): CartTotals {
  let itemCount = 0;
  let subtotal = 0;
  let unavailableCount = 0;
  for (const line of lines) {
    if (!line.available) {
      unavailableCount += 1;
      continue;
    }
    itemCount += line.quantity;
    subtotal += line.total;
  }
  return { itemCount, subtotal, unavailableCount };
}

/** Keys of lines the given branch does not carry — used to warn before switching branches. */
export function unavailableKeysFor(state: CartState, branchId: string, source?: Catalog): string[] {
  return resolveLines({ ...state, branchId }, source)
    .filter((l) => !l.available)
    .map((l) => l.key);
}
