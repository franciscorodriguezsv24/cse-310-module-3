import {
  MAX_QUANTITY,
  cartReducer,
  cartTotals,
  initialCartState,
  lineKey,
  resolveLines,
  unavailableKeysFor,
  type CartState,
} from '@/state/cartReducer';

const withBranch = (branchId: string): CartState => ({ ...initialCartState, branchId });

const add = (state: CartState, productId: string, selections = {}, quantity = 1) =>
  cartReducer(state, { type: 'add', productId, selections, quantity });

describe('lineKey', () => {
  it('ignores the order of groups and choices', () => {
    expect(lineKey('p', { b: ['2', '1'], a: ['x'] })).toBe(lineKey('p', { a: ['x'], b: ['1', '2'] }));
  });

  it('ignores empty groups', () => {
    expect(lineKey('p', { extras: [] })).toBe(lineKey('p', {}));
  });
});

describe('cartReducer', () => {
  it('merges identical lines instead of duplicating them', () => {
    let state = add(withBranch('downtown'), 'miso-soup', {}, 2);
    state = add(state, 'miso-soup', {}, 3);
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(5);
  });

  it('keeps lines with different options separate', () => {
    let state = add(withBranch('downtown'), 'california-roll', { size: ['8pc'] });
    state = add(state, 'california-roll', { size: ['12pc'] });
    expect(state.lines).toHaveLength(2);
  });

  it('clamps quantity to the maximum', () => {
    const state = add(withBranch('downtown'), 'miso-soup', {}, 50);
    expect(state.lines[0].quantity).toBe(MAX_QUANTITY);
  });

  it('removes a line when its quantity is set to 0', () => {
    let state = add(withBranch('downtown'), 'miso-soup');
    state = cartReducer(state, { type: 'setQuantity', key: state.lines[0].key, quantity: 0 });
    expect(state.lines).toHaveLength(0);
  });

  it('clear empties lines and notes but keeps branch and name', () => {
    let state = add({ ...withBranch('provo'), customerName: 'Ana', notes: 'no wasabi' }, 'miso-soup');
    state = cartReducer(state, { type: 'clear' });
    expect(state).toEqual({ ...initialCartState, branchId: 'provo', customerName: 'Ana' });
  });

  it('setBranch drops the given keys', () => {
    let state = add(withBranch('downtown'), 'dragon-roll');
    state = add(state, 'miso-soup');
    const removeKeys = unavailableKeysFor(state, 'provo');
    state = cartReducer(state, { type: 'setBranch', branchId: 'provo', removeKeys });
    expect(state.branchId).toBe('provo');
    expect(state.lines.map((l) => l.productId)).toEqual(['miso-soup']);
  });
});

describe('cartTotals', () => {
  it('sums quantities and option prices', () => {
    let state = add(withBranch('downtown'), 'california-roll', { size: ['12pc'], extras: ['spicy-mayo'] }, 2);
    state = add(state, 'miso-soup', {}, 1);
    // (850 + 400 + 75) * 2 + 350
    expect(cartTotals(resolveLines(state))).toEqual({ itemCount: 3, subtotal: 3000, unavailableCount: 0 });
  });

  it('excludes lines the branch does not carry', () => {
    let state = add(withBranch('downtown'), 'dragon-roll', {}, 1);
    state = add(state, 'miso-soup', {}, 2);
    const totals = cartTotals(resolveLines({ ...state, branchId: 'provo' }));
    expect(totals).toEqual({ itemCount: 2, subtotal: 700, unavailableCount: 1 });
  });

  it('drops lines whose product no longer exists in the catalog', () => {
    const state = add(withBranch('downtown'), 'discontinued-roll');
    expect(resolveLines(state)).toHaveLength(0);
  });
});
