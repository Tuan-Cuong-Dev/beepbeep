import { Timestamp, FieldValue } from 'firebase/firestore';

// 🎯 Loại hình doanh nghiệp cho thuê
export type BusinessType =
  | 'rental_company'    // Công ty cho thuê chuyên nghiệp
  | 'private_provider'  // Cá nhân / hộ kinh doanh
  | 'agent';            // Đại lý / cộng tác viên dịch vụ

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  rental_company: 'Rental Company',
  private_provider: 'Private Provider',
  agent: 'Service Agent',
};

// 🚘 Loại phương tiện mà công ty hỗ trợ (bike, motorbike, car, v.v.)
export type SupportedVehicleType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus';

// 🛠️ Loại dịch vụ mà công ty cung cấp
export type SupportedServiceType =
  | 'repair_basic'
  | 'repair_advanced'
  | 'battery_replacement'
  | 'charging_issue'
  | 'maintenance_routine'
  | 'brake_service'
  | 'rental_self_drive'
  | 'rental_with_driver'
  | 'tour_rental'
  | 'short_term_rental'
  | 'long_term_rental'
  | 'battery_swap'
  | 'mobile_swap'
  | 'battery_health_check'
  | 'towing'
  | 'vehicle_delivery'
  | 'intercity_transport'
  | 'cleaning'
  | 'customization'
  | 'accessory_sale'
  | 'license_support'
  | 'insurance_sale'
  | 'registration_assist';


export interface RentalCompany_new {
  id: string;
  name: string;
  email: string;
  phone: string;

  displayAddress: string;
  mapAddress: string;
  location: string; // "16.0471° N, 108.2062° E"

  businessType: BusinessType;

  supportedVehicleTypes: SupportedVehicleType[];
  supportedServiceTypes: SupportedServiceType[];

  ownerId: string;

  logoUrl?: string;
  description?: string;
  website?: string;

  isActive?: boolean;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
