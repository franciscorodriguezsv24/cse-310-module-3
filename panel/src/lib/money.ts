import type { Cents } from '../types';

/** 1350 -> "$13.50". */
export function formatMoney(cents: Cents, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

/** 1350 -> "13.50", for prefilling a price input. */
export function centsToInput(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

/** "13.5" -> 1350. Returns null for anything that isn't a plain amount with up to 2 decimals. */
export function parseDollars(input: string, { allowNegative = false } = {}): Cents | null {
  const pattern = allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/;
  const trimmed = input.trim();
  if (!pattern.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}
