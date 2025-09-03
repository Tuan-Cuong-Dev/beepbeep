// 📁 lib/organizations/organizationTypes.ts

// Các loại hình doanh nghiệp / tổ chức trong hệ thống
export type OrganizationType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner'
  | 'city_driver'
  | 'intercity_driver'
  | 'delivery_partner'
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

// Nhãn hiển thị (English mặc định)
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  rental_company: 'Rental Company',
  private_provider: 'Private Vehicle Provider',
  agent: 'Agent',
  technician_partner: 'Technician Partner',
  city_driver: 'City Driver',
  intercity_driver: 'Intercity Driver',
  delivery_partner: 'Delivery Partner',
  intercity_bus: 'Intercity Bus Company',
  vehicle_transport: 'Vehicle Transporter',
  tour_guide: 'Tour Guide',
};

// Options cho UI select / dropdown
export const ORGANIZATION_TYPE_OPTIONS: { value: OrganizationType; label: string }[] =
  (Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][])
    .map(([value, label]) => ({
      value,
      label,
    }));
