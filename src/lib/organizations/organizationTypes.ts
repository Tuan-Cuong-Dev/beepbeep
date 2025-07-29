// 📁 lib/organizations/organizationTypes.ts

// Các loại hình doanh nghiệp / tổ chức trong hệ thống
export type OrganizationType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner' // ✅ Đã gộp
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  rental_company: 'Rental Company',
  private_provider: 'Private Vehicle Provider',
  agent: 'Agent',
  technician_partner: 'Technician Partner',
  intercity_bus: 'Intercity Bus Company',
  vehicle_transport: 'Vehicle Transporter',
  tour_guide: 'Tour Guide',
};

export const ORGANIZATION_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = Object.entries(
  ORGANIZATION_TYPE_LABELS
).map(([value, label]) => ({
  value: value as OrganizationType,
  label,
}));
