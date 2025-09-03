// organizationOptions.tsx
import {
  FaUserCog,
  FaTools,
  FaBuilding,
  FaUserTie,
  FaBus,
  FaTruck,
  FaRoute,
  FaCarSide,
  FaShippingFast,
} from 'react-icons/fa';
import { GiElectric } from 'react-icons/gi';
import type { JSX, ReactNode } from 'react';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

// Nhóm cho UI section (optional)
export type OrgCategory =
  | 'technical_services'
  | 'rental_supply'
  | 'transport_delivery'
  | 'support_tourism';

export const ORG_CATEGORY_LABELS: Record<OrgCategory, string> = {
  technical_services: 'Technical Services & Repair',
  rental_supply: 'Vehicle Rental & Supply',
  transport_delivery: 'Transport & Delivery',
  support_tourism: 'Support & Tourism',
};

export interface OrgOption {
  key: string;
  type: BusinessType;
  subtype?: 'mobile' | 'shop';
  icon: () => JSX.Element | ReactNode;
  path: string;
  category: OrgCategory;
}

// Helper để build path chuẩn
const buildPath = (type: BusinessType, subtype?: 'mobile' | 'shop') =>
  `/my-business/create?type=${type}${subtype ? `&subtype=${subtype}` : ''}`;

const brand = 'text-2xl text-[#00d289]';

// Danh sách đầy đủ, đã thêm 3 loại mới
export const ORG_OPTIONS: OrgOption[] = [
  // Technical Services
  {
    key: 'technician_partner_mobile',
    type: 'technician_partner',
    subtype: 'mobile',
    icon: () => <FaUserCog className={brand} />,
    path: buildPath('technician_partner', 'mobile'),
    category: 'technical_services',
  },
  {
    key: 'technician_partner_shop',
    type: 'technician_partner',
    subtype: 'shop',
    icon: () => <FaTools className={brand} />,
    path: buildPath('technician_partner', 'shop'),
    category: 'technical_services',
  },

  // Rental & Supply
  {
    key: 'rental_company',
    type: 'rental_company',
    icon: () => <FaBuilding className={brand} />,
    path: buildPath('rental_company'),
    category: 'rental_supply',
  },
  {
    key: 'private_provider',
    type: 'private_provider',
    icon: () => <GiElectric className={brand} />,
    path: buildPath('private_provider'),
    category: 'rental_supply',
  },

  // Transport & Delivery (đã thêm 3 loại mới)
  {
    key: 'city_driver',
    type: 'city_driver',
    icon: () => <FaCarSide className={brand} />,
    path: buildPath('city_driver'),
    category: 'transport_delivery',
  },
  {
    key: 'intercity_driver',
    type: 'intercity_driver',
    icon: () => <FaRoute className={brand} />,
    path: buildPath('intercity_driver'),
    category: 'transport_delivery',
  },
  {
    key: 'delivery_partner',
    type: 'delivery_partner',
    icon: () => <FaShippingFast className={brand} />,
    path: buildPath('delivery_partner'),
    category: 'transport_delivery',
  },
  {
    key: 'intercity_bus',
    type: 'intercity_bus',
    icon: () => <FaBus className={brand} />,
    path: buildPath('intercity_bus'),
    category: 'transport_delivery',
  },
  {
    key: 'vehicle_transport',
    type: 'vehicle_transport',
    icon: () => <FaTruck className={brand} />,
    path: buildPath('vehicle_transport'),
    category: 'transport_delivery',
  },

  // Support & Tourism
  {
    key: 'agent',
    type: 'agent',
    icon: () => <FaUserTie className={brand} />,
    path: buildPath('agent'),
    category: 'support_tourism',
  },
  {
    key: 'tour_guide',
    type: 'tour_guide',
    icon: () => <FaRoute className={brand} />,
    path: buildPath('tour_guide'),
    category: 'support_tourism',
  },
];

// (Optional) Nhóm theo category để render theo section như mockup
export const ORG_OPTIONS_BY_CATEGORY: Record<OrgCategory, OrgOption[]> = {
  technical_services: ORG_OPTIONS.filter((o) => o.category === 'technical_services'),
  rental_supply: ORG_OPTIONS.filter((o) => o.category === 'rental_supply'),
  transport_delivery: ORG_OPTIONS.filter((o) => o.category === 'transport_delivery'),
  support_tourism: ORG_OPTIONS.filter((o) => o.category === 'support_tourism'),
};
