// Chuẩn hóa các collections về dữ liệu người dùng

import { ServiceCategoryKey, SupportedServiceType } from './serviceTypes';

export type ServiceStatus = 'active' | 'pending' | 'inactive';

export interface UserService {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategoryKey;
  serviceType: SupportedServiceType;
  technicianType?: 'mobile' | 'shop';
  vehicleTypes: string[];
  location?: string;
  status: ServiceStatus;
  creatorName?: string;
  creatorPhotoURL?: string;
  [key: string]: any;
}
