import { bundledCatalog, productAtBranch } from '@/lib/catalog';
import { combineCatalog, toSorted, type RawDoc } from '@/lib/catalogSource';
import type { Product } from '@/types/catalog';

// The Firebase SDK ships ESM that Jest doesn't transform; the pure functions under test don't need it.
jest.mock('firebase/firestore', () => ({}));
jest.mock('@/lib/firebase', () => ({ db: {} }));

const docs: RawDoc[] = [
  { id: 'b', data: { name: 'Second', sortOrder: 1 } },
  { id: 'c', data: { name: 'No order' } },
  { id: 'a', data: { name: 'First', sortOrder: 0, updatedAt: new Date() } },
];

describe('toSorted', () => {
  it('orders by sortOrder, puts missing values last and strips bookkeeping fields', () => {
    expect(toSorted(docs)).toEqual([
      { id: 'a', name: 'First' },
      { id: 'b', name: 'Second' },
      { id: 'c', name: 'No order' },
    ]);
  });
});

describe('combineCatalog', () => {
  const meta = { restaurantName: 'Kumo', currency: 'USD' };

  it('waits until every listener has delivered', () => {
    expect(combineCatalog({ meta, branches: [], categories: [] })).toBeNull();
    expect(combineCatalog({ branches: [], categories: [], products: [] })).toBeNull();
  });

  it('builds a catalog with defaults for missing product fields', () => {
    const catalog = combineCatalog({
      meta,
      branches: [],
      categories: [{ id: 'rolls', data: { name: 'Rolls', sortOrder: 0 } }],
      products: [{ id: 'p', data: { name: 'Roll', categoryId: 'rolls', basePrice: 100 } }],
    });
    expect(catalog?.restaurantName).toBe('Kumo');
    expect(catalog?.categories).toEqual([{ id: 'rolls', name: 'Rolls' }]);
    expect(catalog?.products[0]).toMatchObject({ id: 'p', availableAt: [], optionGroups: [] });
  });
});

describe('productAtBranch', () => {
  const roll = bundledCatalog.products.find((p) => p.id === 'california-roll')!;
  const withOff: Product = {
    ...roll,
    optionGroups: roll.optionGroups.map((g) => ({
      ...g,
      choices: g.choices.map((c) => (c.id === 'eel-sauce' || g.id === 'size' ? { ...c, unavailableAt: ['provo'] } : c)),
    })),
  };

  it('drops choices switched off at the branch and groups left empty', () => {
    const atProvo = productAtBranch(withOff, 'provo');
    expect(atProvo.optionGroups.map((g) => g.id)).toEqual(['extras']);
    expect(atProvo.optionGroups[0].choices.map((c) => c.id)).not.toContain('eel-sauce');
  });

  it('keeps every choice at other branches', () => {
    expect(productAtBranch(withOff, 'downtown').optionGroups).toHaveLength(2);
    expect(productAtBranch(withOff, null)).toBe(withOff);
  });
});
