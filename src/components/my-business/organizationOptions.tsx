// organizationOptions.tsx
import {
  FaUserCog,
  FaTools,
  FaBuilding,
  FaUserTie,
  FaBus,
  FaTruck,
  FaRoute,
} from 'react-icons/fa';
import { GiElectric } from 'react-icons/gi';
import { JSX } from 'react';

export interface OrgOption {
  key: string;
  type: string;
  subtype?: string;
  icon: () => JSX.Element;
  path: string;
}

export const ORG_OPTIONS: OrgOption[] = [
  {
    key: 'technician_partner_mobile',
    type: 'technician_partner',
    subtype: 'mobile',
    icon: () => <FaUserCog className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=technician_partner&subtype=mobile',
  },
  {
    key: 'technician_partner_shop',
    type: 'technician_partner',
    subtype: 'shop',
    icon: () => <FaTools className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=technician_partner&subtype=shop',
  },
  {
    key: 'rental_company',
    type: 'rental_company',
    icon: () => <FaBuilding className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=rental_company',
  },
  {
    key: 'private_owner',
    type: 'private_owner',
    icon: () => <GiElectric className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=private_owner',
  },
  {
    key: 'agent',
    type: 'agent',
    icon: () => <FaUserTie className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=agent',
  },
  {
    key: 'intercity_bus',
    type: 'intercity_bus',
    icon: () => <FaBus className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=intercity_bus',
  },
  {
    key: 'vehicle_transport',
    type: 'vehicle_transport',
    icon: () => <FaTruck className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=vehicle_transport',
  },
  {
    key: 'tour_guide',
    type: 'tour_guide',
    icon: () => <FaRoute className="text-2xl text-[#00d289]" />,
    path: '/my-business/create?type=tour_guide',
  },
];
