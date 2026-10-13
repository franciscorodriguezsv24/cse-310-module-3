import type { DocData, OptionGroup, Product } from '../types';
import { centsToInput, parseDollars } from './money';

// The form keeps prices as the text the user typed; `validateProductForm` turns it into
// Firestore data (integer cents) or a list of errors keyed by field path.

export interface ChoiceForm {
  /** Local React key; stable while editing even if the name changes. */
  key: string;
  id: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
  unavailableAt: string[];
}

export interface GroupForm {
  key: string;
  id: string;
  name: string;
  type: 'single' | 'multiple';
  max: string;
  choices: ChoiceForm[];
}

export interface ProductForm {
  name: string;
  description: string;
  emoji: string;
  categoryId: string;
  basePrice: string;
  availableAt: string[];
  optionGroups: GroupForm[];
}

export type ProductFields = Omit<DocData<Product>, 'sortOrder'>;
export type FormErrors = Record<string, string>;

let keyCounter = 0;
/** Unique key for list items created in this browser session. */
export const newKey = () => `k${++keyCounter}`;

/** "Spicy Tuna Roll!" -> "spicy-tuna-roll". Used as the document id for new products. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Blank form for a new product, available at every branch. */
export function emptyProductForm(categoryId: string, branchIds: string[]): ProductForm {
  return {
    name: '',
    description: '',
    emoji: '🍣',
    categoryId,
    basePrice: '',
    availableAt: branchIds,
    optionGroups: [],
  };
}

export function emptyGroup(): GroupForm {
  return { key: newKey(), id: '', name: '', type: 'single', max: '', choices: [emptyChoice()] };
}

export function emptyChoice(): ChoiceForm {
  return { key: newKey(), id: '', name: '', priceDelta: '0.00', isDefault: false, unavailableAt: [] };
}

/** Prefills the form from a stored product. */
export function productToForm(product: Product): ProductForm {
  return {
    name: product.name,
    description: product.description,
    emoji: product.emoji,
    categoryId: product.categoryId,
    basePrice: centsToInput(product.basePrice),
    availableAt: product.availableAt,
    optionGroups: product.optionGroups.map((group) => ({
      key: newKey(),
      id: group.id,
      name: group.name,
      type: group.type,
      max: group.max?.toString() ?? '',
      choices: group.choices.map((choice) => ({
        key: newKey(),
        id: choice.id,
        name: choice.name,
        priceDelta: centsToInput(choice.priceDelta),
        isDefault: Boolean(choice.default),
        unavailableAt: choice.unavailableAt ?? [],
      })),
    })),
  };
}

/** Checks the form and converts it to Firestore fields. `fields` is set only when there are no errors. */
export function validateProductForm(form: ProductForm): { errors: FormErrors; fields?: ProductFields } {
  const errors: FormErrors = {};

  const name = form.name.trim();
  if (!name) errors.name = 'Name is required.';
  if (!form.categoryId) errors.categoryId = 'Pick a category.';
  const basePrice = parseDollars(form.basePrice);
  if (basePrice === null) errors.basePrice = 'Enter a price like 12.50.';

  const groupIds = new Set<string>();
  const optionGroups: OptionGroup[] = form.optionGroups.map((group, g) => {
    const groupName = group.name.trim();
    const groupId = group.id || slugify(groupName);
    if (!groupName) errors[`groups.${g}.name`] = 'Option group name is required.';
    else if (groupIds.has(groupId)) errors[`groups.${g}.name`] = 'Two option groups have the same name.';
    groupIds.add(groupId);

    if (group.choices.length === 0) errors[`groups.${g}`] = 'Add at least one choice.';

    let max: number | undefined;
    if (group.type === 'multiple') {
      max = Number(group.max);
      if (!Number.isInteger(max) || max < 1) errors[`groups.${g}.max`] = 'Max must be a whole number of 1 or more.';
    }

    const defaults = group.choices.filter((c) => c.isDefault).length;
    if (group.type === 'single' && defaults > 1) errors[`groups.${g}`] = 'A single-choice group can have only one default.';

    const choiceIds = new Set<string>();
    const choices = group.choices.map((choice, c) => {
      const choiceName = choice.name.trim();
      const choiceId = choice.id || slugify(choiceName);
      if (!choiceName) errors[`groups.${g}.choices.${c}.name`] = 'Choice name is required.';
      else if (choiceIds.has(choiceId)) errors[`groups.${g}.choices.${c}.name`] = 'Duplicate choice in this group.';
      choiceIds.add(choiceId);

      const priceDelta = parseDollars(choice.priceDelta, { allowNegative: true });
      if (priceDelta === null) errors[`groups.${g}.choices.${c}.priceDelta`] = 'Enter an amount like 1.50 or -1.00.';

      return {
        id: choiceId,
        name: choiceName,
        priceDelta: priceDelta ?? 0,
        ...(choice.isDefault ? { default: true } : {}),
        ...(choice.unavailableAt.length > 0 ? { unavailableAt: choice.unavailableAt } : {}),
      };
    });

    return { id: groupId, name: groupName, type: group.type, ...(max !== undefined ? { max } : {}), choices };
  });

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    fields: {
      name,
      description: form.description.trim(),
      emoji: form.emoji.trim() || '🍣',
      categoryId: form.categoryId,
      basePrice: basePrice!,
      availableAt: form.availableAt,
      optionGroups,
    },
  };
}
