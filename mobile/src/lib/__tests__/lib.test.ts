import {
  bundledCatalog as catalog,
  defaultSelections,
  describeSelections,
  findProduct,
  menuForBranch,
} from '@/lib/catalog';
import { distanceKm, formatDistance, nearestBranch } from '@/lib/distance';
import { formatMoney, unitPrice } from '@/lib/pricing';
import { buildOrderMessage, whatsappUrl } from '@/lib/whatsapp';
import { cartReducer, cartTotals, initialCartState, resolveLines, type CartState } from '@/state/cartReducer';

const product = (id: string) => {
  const p = findProduct(id);
  if (!p) throw new Error(`missing ${id}`);
  return p;
};

describe('pricing', () => {
  it('adds option deltas to the base price', () => {
    expect(unitPrice(product('poke-bowl'), { protein: ['tuna'], toppings: ['mango', 'masago'] })).toBe(
      1400 + 150 + 100 + 150,
    );
  });

  it('supports negative deltas', () => {
    expect(unitPrice(product('poke-bowl'), { protein: ['tofu'] })).toBe(1300);
  });

  it('ignores unknown choice ids', () => {
    expect(unitPrice(product('miso-soup'), { size: ['huge'] })).toBe(350);
  });

  it('formats cents', () => {
    expect(formatMoney(1325)).toBe('$13.25');
    expect(formatMoney(-100)).toBe('-$1.00');
  });
});

describe('catalog', () => {
  it('preselects defaults and falls back to the first single choice', () => {
    expect(defaultSelections(product('california-roll'))).toEqual({ size: ['8pc'], extras: [] });
  });

  it('filters the menu by branch and drops empty categories', () => {
    const ids = menuForBranch('provo').flatMap((s) => s.data.map((p) => p.id));
    expect(ids).not.toContain('dragon-roll');
    expect(ids).toContain('gyoza');
    expect(menuForBranch(null)).toEqual([]);
  });

  it('describes selections in group order', () => {
    expect(
      describeSelections(product('california-roll'), { extras: ['spicy-mayo', 'eel-sauce'], size: ['12pc'] }),
    ).toEqual(['Size: 12 pieces', 'Extras: Spicy mayo, Eel sauce']);
  });
});

describe('distance', () => {
  const downtown = catalog.branches.find((b) => b.id === 'downtown')!;
  const provo = catalog.branches.find((b) => b.id === 'provo')!;

  it('measures roughly 60 km between Salt Lake City and Provo', () => {
    expect(distanceKm(downtown, provo)).toBeGreaterThan(55);
    expect(distanceKm(downtown, provo)).toBeLessThan(65);
  });

  it('picks the nearest branch', () => {
    expect(nearestBranch({ latitude: 40.25, longitude: -111.65 }, catalog.branches)?.id).toBe('provo');
    expect(nearestBranch({ latitude: 40.77, longitude: -111.89 }, catalog.branches)?.id).toBe('downtown');
  });

  it('formats short and long distances', () => {
    expect(formatDistance(0.42)).toBe('420 m');
    expect(formatDistance(12.345)).toBe('12.3 km');
  });
});

describe('whatsapp', () => {
  it('builds a readable order message with only available items', () => {
    let state: CartState = { ...initialCartState, branchId: 'provo' };
    state = cartReducer(state, {
      type: 'add',
      productId: 'california-roll',
      selections: { size: ['12pc'] },
      quantity: 2,
    });
    state = cartReducer(state, { type: 'add', productId: 'dragon-roll', selections: {}, quantity: 1 });
    const lines = resolveLines(state);
    const message = buildOrderMessage({
      restaurantName: 'Kumo',
      branch: catalog.branches.find((b) => b.id === 'provo')!,
      customerName: '  Ana ',
      notes: 'No wasabi',
      lines,
      subtotal: cartTotals(lines).subtotal,
      currency: 'USD',
    });
    expect(message).toBe(
      [
        "Hi Kumo Provo! I'd like to place an order.",
        '',
        '*Name:* Ana',
        '',
        '*Order:*',
        '2 × California Roll — $25.00',
        '   • Size: 12 pieces',
        '',
        '*Total:* $25.00',
        '',
        '*Notes:* No wasabi',
      ].join('\n'),
    );
  });

  it('encodes the message into a wa.me link', () => {
    expect(whatsappUrl('+1 (555) 555-0101', 'Hi & bye')).toBe('https://wa.me/15555550101?text=Hi%20%26%20bye');
  });
});
