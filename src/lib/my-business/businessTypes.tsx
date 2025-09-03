// Các loại hình doanh nghiệp / tổ chức trong hệ thống
// Cập nhật ngày 03/09
// ===============================

// 1) Business types
export type BusinessType =
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

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
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

// Optional: English descriptions for cards/list items (ngắn gọn)
export const BUSINESS_TYPE_DESCRIPTIONS: Record<BusinessType, string> = {
  rental_company: 'Manage fleet, stations, bookings & staff.',
  private_provider: 'Rent out your personal vehicles or services.',
  agent: 'Refer customers and earn commission.',
  technician_partner: 'Mobile technician or repair shop services.',
  city_driver: 'Carry passengers within city area.',
  intercity_driver: 'Passenger trips between cities.',
  delivery_partner: 'Small parcel delivery (≤20kg).',
  intercity_bus: 'Scheduled intercity bus operator.',
  vehicle_transport: 'Cargo/vehicle logistics company.',
  tour_guide: 'Operate tours or self-drive itineraries.',
};

// 2) Categories (for section headers)
export type BusinessCategory =
  | 'technical_services'
  | 'rental_supply'
  | 'transport_delivery'
  | 'support_tourism';

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  technical_services: 'Technical Services & Repair',
  rental_supply: 'Vehicle Rental & Supply',
  transport_delivery: 'Transport & Delivery',
  support_tourism: 'Support & Tourism',
};

// UI order of sections
export const CATEGORY_ORDER: BusinessCategory[] = [
  'technical_services',
  'rental_supply',
  'transport_delivery',
  'support_tourism',
];

// 3) Map each type → category
export const BUSINESS_CATEGORY_BY_TYPE: Record<BusinessType, BusinessCategory> = {
  technician_partner: 'technical_services',
  rental_company: 'rental_supply',
  private_provider: 'rental_supply',
  city_driver: 'transport_delivery',
  intercity_driver: 'transport_delivery',
  delivery_partner: 'transport_delivery',
  intercity_bus: 'transport_delivery',
  vehicle_transport: 'transport_delivery',
  agent: 'support_tourism',
  tour_guide: 'support_tourism',
};

// 4) (Optional) Icon suggestions (lucide-react)
export const BUSINESS_TYPE_ICONS: Record<BusinessType, string> = {
  technician_partner: 'Wrench',          // import { Wrench } from "lucide-react"
  rental_company: 'Building2',
  private_provider: 'CarFront',
  city_driver: 'Car',
  intercity_driver: 'Route',
  delivery_partner: 'Truck',
  intercity_bus: 'Bus',
  vehicle_transport: 'PackageSearch',
  agent: 'Handshake',
  tour_guide: 'MapPin',
};

// 5) Flat options (for <Select/>)
export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] =
  Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => ({
    value: value as BusinessType,
    label,
  }));

// 6) Grouped options for sectioned UI
export type GroupedBusinessOptions = {
  category: BusinessCategory;
  categoryLabel: string;
  items: {
    value: BusinessType;
    label: string;
    description?: string;
    icon?: string; // lucide icon name
  }[];
}[];

export const GROUPED_BUSINESS_OPTIONS: GroupedBusinessOptions = CATEGORY_ORDER.map(
  (cat) => ({
    category: cat,
    categoryLabel: CATEGORY_LABELS[cat],
    items: (Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[])
      .filter((t) => BUSINESS_CATEGORY_BY_TYPE[t] === cat)
      .map((t) => ({
        value: t,
        label: BUSINESS_TYPE_LABELS[t],
        description: BUSINESS_TYPE_DESCRIPTIONS[t],
        icon: BUSINESS_TYPE_ICONS[t],
      })),
  })
);

// 7) Helper: get items by category
export const getBusinessByCategory = (cat: BusinessCategory) =>
  GROUPED_BUSINESS_OPTIONS.find((g) => g.category === cat)?.items ?? [];
