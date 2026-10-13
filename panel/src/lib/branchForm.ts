import type { Branch, DocData } from '../types';
import type { FormErrors } from './productForm';

export interface BranchForm {
  name: string;
  address: string;
  whatsapp: string;
  latitude: string;
  longitude: string;
  hours: string;
}

export type BranchFields = Omit<DocData<Branch>, 'sortOrder'>;

export const emptyBranchForm: BranchForm = {
  name: '',
  address: '',
  whatsapp: '',
  latitude: '',
  longitude: '',
  hours: '',
};

/** Prefills the form from a stored branch. */
export function branchToForm(branch: Branch): BranchForm {
  return {
    name: branch.name,
    address: branch.address,
    whatsapp: branch.whatsapp,
    latitude: String(branch.latitude),
    longitude: String(branch.longitude),
    hours: branch.hours,
  };
}

/** Parses a coordinate within ±limit, or null. */
function parseCoordinate(input: string, limit: number): number | null {
  const value = Number(input.trim());
  return input.trim() !== '' && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

/** Checks the form and converts it to Firestore fields. `fields` is set only when there are no errors. */
export function validateBranchForm(form: BranchForm): { errors: FormErrors; fields?: BranchFields } {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Name is required.';
  // Accept "+1 (555) 555-0101" and store digits only, the format wa.me links need.
  const whatsapp = form.whatsapp.replace(/\D/g, '');
  if (whatsapp.length < 8 || whatsapp.length > 15) errors.whatsapp = 'Enter a phone number with country code.';
  const latitude = parseCoordinate(form.latitude, 90);
  if (latitude === null) errors.latitude = 'Latitude must be between -90 and 90.';
  const longitude = parseCoordinate(form.longitude, 180);
  if (longitude === null) errors.longitude = 'Longitude must be between -180 and 180.';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    fields: {
      name,
      address: form.address.trim(),
      whatsapp,
      latitude: latitude!,
      longitude: longitude!,
      hours: form.hours.trim(),
    },
  };
}
