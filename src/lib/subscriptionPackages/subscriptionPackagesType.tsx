import { Timestamp } from 'firebase/firestore';

export interface SubscriptionPackage {
  id?: string;
  companyId: string;
  name: string;
  durationType: DurationType;
  kmLimit: number | null;
  chargingMethod: ChargingMethod;
  basePrice: number;
  overageRate: number | null;
  note?: string;
  status: SubscriptionPackageStatus; // ✅ Thêm trạng thái
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DurationType = 'daily' | 'monthly';
export type ChargingMethod = 'swap' | 'self';
export type SubscriptionPackageStatus = 'available' | 'inactive'; // ✅ Trạng thái gói
