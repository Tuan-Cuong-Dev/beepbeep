import { Timestamp, FieldValue } from 'firebase/firestore';
import { VehicleType } from '../vehicleModels/vehicleModelTypes_new';

export interface PersonalVehicle_new {
  id: string;
  userId: string;

  name: string;                 // Tên gọi thân thuộc (VD: "Xe của bố")
  brand?: string;              // Hãng sản xuất
  model?: string;              // Mẫu xe
  licensePlate?: string;       // Biển số
  vehicleType: VehicleType;    // bike, motorbike, car, ...

  color?: string;
  yearOfManufacture?: number;
  odo?: number;                // Số km đã đi
  photoUrl?: string;

  isPrimary?: boolean;         // Xe chính
  isActive?: boolean;

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
