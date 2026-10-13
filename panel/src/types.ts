/** All money values are integer cents to avoid floating-point rounding. */
export type Cents = number;

export interface Branch {
  id: string;
  name: string;
  address: string;
  /** WhatsApp number in international format, digits only. */
  whatsapp: string;
  latitude: number;
  longitude: number;
  hours: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface OptionChoice {
  id: string;
  name: string;
  priceDelta: Cents;
  default?: boolean;
  /** Branch ids where this option is switched off. */
  unavailableAt?: string[];
}

export interface OptionGroup {
  id: string;
  name: string;
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
  sortOrder: number;
}

/** A Firestore document's fields: everything except the id, which is the document key. */
export type DocData<T extends { id: string }> = Omit<T, 'id'>;
