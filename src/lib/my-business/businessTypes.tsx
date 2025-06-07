// Các BUSINESS tạo ra trên hệ thống.
// src/lib/business/businessTypes.ts

export type BusinessType =
  | 'rental_company'
  | 'private_provider'
  | 'agent';

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  rental_company: 'Rental Company',
  private_provider: 'Private Vehicle Provider',
  agent: 'Agent',
};

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'rental_company', label: 'Rental Company' },
  { value: 'private_provider', label: 'Private Vehicle Provider' },
  { value: 'agent', label: 'Agent' },
];
