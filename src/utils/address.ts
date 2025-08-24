// utils/address.ts
// Helper: map Google Geocoding → AddressCore

import type { AddressCore } from '@/src/lib/locations/addressTypes';

type GAddrComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

const pick = (comps: GAddrComponent[], type: string, short = false) =>
  comps.find(c => c.types.includes(type))?.[short ? 'short_name' : 'long_name'] || '';

/**
 * Map Google Geocoding address_components về AddressCore.
 * Ưu tiên short_name cho countryCode (ISO-2), adminArea (US states...).
 */
export const mapGeocodeToAddressCore = (
  components: GAddrComponent[],
  formatted: string
): AddressCore => {
  const line1 = [
    pick(components, 'street_number'),
    pick(components, 'route'),
  ].filter(Boolean).join(' ').trim();

  // line2: subpremise hoặc neighborhood (tuỳ khẩu vị)
  const line2 = pick(components, 'subpremise') || pick(components, 'neighborhood');

  const locality    = pick(components, 'locality') || pick(components, 'sublocality') || pick(components, 'postal_town');
  const adminArea   = pick(components, 'administrative_area_level_1', true) || pick(components, 'administrative_area_level_1');
  const postalCode  = pick(components, 'postal_code');
  const countryCode = pick(components, 'country', true).toUpperCase();

  return {
    line1: line1 || undefined,
    line2: line2 || undefined,
    locality: locality || undefined,
    adminArea: adminArea || undefined,
    postalCode: postalCode || undefined,
    countryCode: countryCode || undefined,
    formatted: formatted || undefined,
  };
};

/** Fallback tự ghép khi thiếu formatted */
export const composeFromAddressCore = (a?: Partial<AddressCore>) => {
  if (!a) return '';
  return [
    a.line1, a.line2, a.locality, a.adminArea, a.postalCode, a.countryCode,
  ].filter(Boolean).join(', ');
};
