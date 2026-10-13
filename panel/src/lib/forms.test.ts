import { describe, expect, it } from 'vitest';

import { validateBranchForm } from './branchForm';
import { parseDollars } from './money';
import { emptyChoice, emptyGroup, emptyProductForm, slugify, validateProductForm, type ProductForm } from './productForm';

const validForm = (): ProductForm => ({
  ...emptyProductForm('rolls', ['downtown']),
  name: 'Volcano Roll',
  basePrice: '12.5',
});

describe('parseDollars', () => {
  it('converts dollars to integer cents', () => {
    expect(parseDollars('12.5')).toBe(1250);
    expect(parseDollars('0.10')).toBe(10);
    expect(parseDollars('3')).toBe(300);
  });

  it('rejects bad input and negatives unless allowed', () => {
    expect(parseDollars('abc')).toBeNull();
    expect(parseDollars('1.234')).toBeNull();
    expect(parseDollars('-1')).toBeNull();
    expect(parseDollars('-1', { allowNegative: true })).toBe(-100);
  });
});

describe('slugify', () => {
  it('makes a URL-safe document id', () => {
    expect(slugify('Spicy Tuna Roll!')).toBe('spicy-tuna-roll');
    expect(slugify('  Jalapeño  ')).toBe('jalapeno');
  });
});

describe('validateProductForm', () => {
  it('returns Firestore fields for a valid form', () => {
    const { errors, fields } = validateProductForm(validForm());
    expect(errors).toEqual({});
    expect(fields).toMatchObject({ name: 'Volcano Roll', basePrice: 1250, categoryId: 'rolls', optionGroups: [] });
  });

  it('requires a name and a valid price', () => {
    const { errors, fields } = validateProductForm({ ...validForm(), name: ' ', basePrice: '12,50' });
    expect(fields).toBeUndefined();
    expect(Object.keys(errors).sort()).toEqual(['basePrice', 'name']);
  });

  it('builds option groups with ids, cents and per-branch availability', () => {
    const group = {
      ...emptyGroup(),
      name: 'Extras',
      type: 'multiple' as const,
      max: '2',
      choices: [{ ...emptyChoice(), name: 'Spicy Mayo', priceDelta: '0.75', unavailableAt: ['provo'] }],
    };
    const { fields } = validateProductForm({ ...validForm(), optionGroups: [group] });
    expect(fields?.optionGroups).toEqual([
      {
        id: 'extras',
        name: 'Extras',
        type: 'multiple',
        max: 2,
        choices: [{ id: 'spicy-mayo', name: 'Spicy Mayo', priceDelta: 75, unavailableAt: ['provo'] }],
      },
    ]);
  });

  it('rejects two defaults in a single-choice group and a missing max', () => {
    const single = {
      ...emptyGroup(),
      name: 'Size',
      choices: [
        { ...emptyChoice(), name: 'Small', isDefault: true },
        { ...emptyChoice(), name: 'Large', isDefault: true },
      ],
    };
    const multiple = { ...emptyGroup(), name: 'Toppings', type: 'multiple' as const, max: '' };
    multiple.choices[0].name = 'Mango';
    const { errors } = validateProductForm({ ...validForm(), optionGroups: [single, multiple] });
    expect(errors['groups.0']).toMatch(/only one default/);
    expect(errors['groups.1.max']).toBeDefined();
  });
});

describe('validateBranchForm', () => {
  it('stores the WhatsApp number as digits only', () => {
    const { fields } = validateBranchForm({
      name: 'Orem',
      address: '1 Main St',
      whatsapp: '+1 (555) 555-0104',
      latitude: '40.29',
      longitude: '-111.69',
      hours: '11:00 – 21:00',
    });
    expect(fields).toMatchObject({ whatsapp: '15555550104', latitude: 40.29, longitude: -111.69 });
  });

  it('rejects coordinates out of range', () => {
    const { errors } = validateBranchForm({
      name: 'Nowhere',
      address: '',
      whatsapp: '15555550104',
      latitude: '91',
      longitude: 'abc',
      hours: '',
    });
    expect(Object.keys(errors).sort()).toEqual(['latitude', 'longitude']);
  });
});
