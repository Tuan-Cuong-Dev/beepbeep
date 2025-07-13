// Gói bảo hiểm dành riêng cho từng xe va từng khách hàng
import { Timestamp } from 'firebase/firestore';

export interface InsurancePackage {
  id: string;
  userId: string;
  productId: string;
  vehicleId?: string; // chỉ có sau khi kích hoạt
  packageCode: string; // ví dụ: BIP365-DE01-9023-X7F2
  frameNumber?: string;
  engineNumber?: string;
  plateNumber?: string;
  isActive: boolean;
  activationMethod: 'manual' | 'auto';
  activatedAt?: Timestamp;
  expiredAt?: Timestamp;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  imageUrl?: string; // ảnh PNG cá nhân hoá
  createdAt: Timestamp;
  updatedAt: Timestamp;
  note?: string;
}

