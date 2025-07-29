// Các loại hình doanh nghiệp / tổ chức trong hệ thống
export type BusinessType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner' // ✅ Đã gộp lại
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  rental_company: 'Rental Company',
  private_provider: 'Private Vehicle Provider',
  agent: 'Agent',
  technician_partner: 'Technician Partner', // ✅ Đã gộp
  intercity_bus: 'Intercity Bus Company',
  vehicle_transport: 'Vehicle Transporter',
  tour_guide: 'Tour Guide',
};

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = Object.entries(
  BUSINESS_TYPE_LABELS
).map(([value, label]) => ({
  value: value as BusinessType,
  label,
}));
