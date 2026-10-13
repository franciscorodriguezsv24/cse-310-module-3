import type { Cents, Product, Selections } from '@/types/catalog';

/** Price of one unit: base price plus every selected choice's delta. Never negative. */
export function unitPrice(product: Product, selections: Selections): Cents {
  let total = product.basePrice;
  for (const group of product.optionGroups) {
    for (const choiceId of selections[group.id] ?? []) {
      const choice = group.choices.find((c) => c.id === choiceId);
      if (choice) total += choice.priceDelta;
    }
  }
  return Math.max(0, total);
}

/** Unit price times quantity. */
export function lineTotal(product: Product, selections: Selections, quantity: number): Cents {
  return unitPrice(product, selections) * quantity;
}

/** Formats integer cents as a currency string, e.g. 1325 -> "$13.25". */
export function formatMoney(cents: Cents, currency = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  const sign = cents < 0 ? '-' : '';
  return `${sign}${symbol}${(Math.abs(cents) / 100).toFixed(2)}`;
}
