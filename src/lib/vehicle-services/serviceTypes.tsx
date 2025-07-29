// lib/vehicle-services/serviceTypes.ts
// Đã Chuẩn hóa lần cuối - Ngày 29/07/2025

import {
  FaWrench,
  FaBolt,
  FaMapMarkerAlt,
  FaCar,
  FaUserTie,
  FaTruck,
  FaBus,
  FaShieldAlt,
  FaFileSignature,
  FaBroom,
  FaShoppingBag,
  FaRoute,
} from 'react-icons/fa';
import type { JSX } from 'react';

// --------------------
// 🔑 Định nghĩa loại dịch vụ & nhóm dịch vụ
// --------------------

export type ServiceCategoryKey =
  | 'repair'
  | 'rental'
  | 'battery'
  | 'transport'
  | 'care'
  | 'legal';

export type SupportedServiceType =
  | 'repair_basic'
  | 'battery_check'
  | 'rental_self_drive'
  | 'rental_with_driver'
  | 'tour_rental'
  | 'battery_swap'
  | 'battery_delivery'
  | 'vehicle_rescue'
  | 'intercity_transport'
  | 'vehicle_cleaning'
  | 'accessory_sale'
  | 'insurance_sale'
  | 'registration_assist';

// --------------------
// 📚 Ánh xạ category → danh sách dịch vụ
// --------------------

export const SERVICE_TYPES_BY_CATEGORY: Record<ServiceCategoryKey, SupportedServiceType[]> = {
  repair: ['repair_basic', 'battery_check'],
  rental: ['rental_self_drive', 'rental_with_driver', 'tour_rental'],
  battery: ['battery_swap', 'battery_delivery'],
  transport: ['vehicle_rescue', 'intercity_transport'],
  care: ['vehicle_cleaning', 'accessory_sale'],
  legal: ['insurance_sale', 'registration_assist'],
};

// --------------------
// 🎨 Icon hiển thị cho từng dịch vụ
// --------------------

const iconStyle = { color: '#00d289' };
const iconClass = 'text-xl';

export const SERVICE_TYPE_ICONS: Record<SupportedServiceType, JSX.Element> = {
  repair_basic: <FaWrench className={iconClass} style={iconStyle} />,
  battery_check: <FaBolt className={iconClass} style={iconStyle} />,
  rental_self_drive: <FaCar className={iconClass} style={iconStyle} />,
  rental_with_driver: <FaUserTie className={iconClass} style={iconStyle} />,
  tour_rental: <FaMapMarkerAlt className={iconClass} style={iconStyle} />,
  battery_swap: <FaBolt className={iconClass} style={iconStyle} />,
  battery_delivery: <FaTruck className={iconClass} style={iconStyle} />,
  vehicle_rescue: <FaBus className={iconClass} style={iconStyle} />,
  intercity_transport: <FaRoute className={iconClass} style={iconStyle} />,
  vehicle_cleaning: <FaBroom className={iconClass} style={iconStyle} />,
  accessory_sale: <FaShoppingBag className={iconClass} style={iconStyle} />,
  insurance_sale: <FaShieldAlt className={iconClass} style={iconStyle} />,
  registration_assist: <FaFileSignature className={iconClass} style={iconStyle} />,
};
