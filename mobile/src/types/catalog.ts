/** All money values are integer cents to avoid floating-point rounding. */
export type Cents = number;

export interface Branch {
  id: string;
  name: string;
  address: string;
  /** WhatsApp number in international format, digits only (e.g. "15555550101"). */
  whatsapp: string;
  latitude: number;
  longitude: number;
  hours: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OptionChoice {
  id: string;
  name: string;
  priceDelta: Cents;
  /** Preselected when the product detail screen opens. */
  default?: boolean;
  /** Branch ids where staff switched this option off (e.g. ran out of eel sauce). */
  unavailableAt?: string[];
}

export interface OptionGroup {
  id: string;
  name: string;
  /** "single" = pick exactly one (radio), "multiple" = pick up to `max` (checkboxes). */
  type: 'single' | 'multiple';
  max?: number;
  choices: OptionChoice[];
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  emoji: string;
  basePrice: Cents;
  optionGroups: OptionGroup[];
  /** Branch ids where this product can be ordered. */
  availableAt: string[];
}

export interface Catalog {
  restaurantName: string;
  currency: string;
  branches: Branch[];
  categories: Category[];
  products: Product[];
}

/** Chosen choice ids, keyed by option group id. */
export type Selections = Record<string, string[]>;
