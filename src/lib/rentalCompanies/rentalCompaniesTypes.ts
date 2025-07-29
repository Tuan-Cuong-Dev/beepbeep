import { Timestamp, FieldValue } from 'firebase/firestore';
import type { BusinessType } from '../my-business/businessTypes';
import type { VehicleType } from '../vehicle-models/vehicleModelTypes';
import type { SupportedServiceType } from '../vehicle-services/serviceTypes';

// 🏢 Giao diện thông tin công ty / tổ chức có loại hình cho thuê
export interface RentalCompany {
  id: string;
  name: string;
  email: string;
  phone: string;

  displayAddress: string;
  mapAddress: string;
  location: string; // "16.0471° N, 108.2062° E" – tọa độ dưới dạng chuỗi

  businessType: BusinessType;

  supportedVehicleTypes: VehicleType[];
  supportedServiceTypes: SupportedServiceType[];

  ownerId: string;

  logoUrl?: string;
  description?: string;
  website?: string;

  isActive?: boolean;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
